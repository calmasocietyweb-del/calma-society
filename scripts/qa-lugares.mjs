/**
 * QA determinista de las fichas de `src/content/lugares` — puerta de calidad
 * previa a publicar (KAN-54) y reutilizable en CI (KAN-52).
 *
 * Comprueba, por ficha: campos obligatorios, coordenadas dentro de Menorca,
 * descripción con sustancia (no placeholder), pareja de idioma por
 * `translationKey`, duplicados de coordenadas y slug, y (si hay bloque
 * `planner`) su completitud mínima. NO publica nada: solo informa (§6 bis:
 * el visto bueno es humano).
 *
 * Uso:  node scripts/qa-lugares.mjs [--solo-draft] [--json]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
// Caja de Menorca con margen (islotes incluidos).
const BBOX = { latMin: 39.75, latMax: 40.15, lngMin: 3.70, lngMax: 4.40 };
// OJO: "TODO"/"FIXME" en MAYÚSCULAS estrictas — "todo" es una palabra española
// normal ("su nombre lo dice todo") y dio un falso positivo.
const PLACEHOLDER = /\b(TODO|TBD|FIXME)\b|lorem ipsum|\?\?\?/;

const soloDraft = process.argv.includes("--solo-draft");
const asJson = process.argv.includes("--json");

const fichas = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  try {
    fichas.push({ file, ...JSON.parse(readFileSync(join(DIR, file), "utf8")) });
  } catch (e) {
    fichas.push({ file, __parseError: e.message });
  }
}

// Índices para chequeos cruzados.
const byKeyLang = new Map(); // `${translationKey}|${lang}` → ficha
const byCoord = new Map(); // "lat,lng" redondeado → [files]
for (const f of fichas) {
  if (f.__parseError) continue;
  byKeyLang.set(`${f.translationKey}|${f.lang}`, f);
  if (f.coordinates) {
    const k = `${f.coordinates.lat?.toFixed(4)},${f.coordinates.lng?.toFixed(4)}`;
    byCoord.set(k, [...(byCoord.get(k) ?? []), f.file]);
  }
}

const informes = [];
for (const f of fichas) {
  const errores = [];
  const avisos = [];

  if (f.__parseError) {
    informes.push({ file: f.file, status: "?", errores: [`JSON inválido: ${f.__parseError}`], avisos: [] });
    continue;
  }
  if (soloDraft && f.status !== "draft") continue;

  // ── Obligatorios ──────────────────────────────────────────────────────────
  if (!f.name?.trim()) errores.push("sin `name`");
  if (!f.translationKey?.trim()) errores.push("sin `translationKey`");
  if (!f.lang) errores.push("sin `lang`");
  if (!f.type) errores.push("sin `type`");
  if (!f.area?.trim()) errores.push("sin `area`");
  if (!f.status) errores.push("sin `status`");

  // ── Coordenadas ───────────────────────────────────────────────────────────
  const c = f.coordinates;
  if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") {
    errores.push("coordenadas ausentes o no numéricas");
  } else if (c.lat < BBOX.latMin || c.lat > BBOX.latMax || c.lng < BBOX.lngMin || c.lng > BBOX.lngMax) {
    errores.push(`coordenadas fuera de Menorca (${c.lat}, ${c.lng})`);
  }

  // ── Descripción con sustancia ─────────────────────────────────────────────
  const d = (f.description ?? "").trim();
  if (!d) errores.push("sin `description`");
  else {
    if (d.length < 80) avisos.push(`descripción corta (${d.length} chars)`);
    if (PLACEHOLDER.test(d)) errores.push("descripción con texto placeholder");
    // Notas internas del proceso editorial coladas en texto público.
    if (/\b(NOTA|NOTE|OJO):/i.test(d)) errores.push("nota interna en la descripción");
    // Truncada a media frase (el seed cortó alguna): debe acabar en puntuación.
    if (!/[.!?…»")]$/.test(d)) avisos.push("descripción sin cierre de frase (¿truncada?)");
  }

  // ── Español sin tildes (el seed llegó en ASCII en parte del lote) ─────────
  // AVISO, no error: un texto corto y correcto puede no llevar ninguna tilde
  // (falso positivo real: faro-favaritx). Sirve para revisar a ojo, no bloquear.
  if (f.lang === "es") {
    const prosa = [d, ...(f.planner?.highlights ?? []), ...Object.values(f.practicalInfo ?? {})]
      .filter((x) => typeof x === "string").join(" ");
    if (prosa.length > 120 && !/[áéíóúñüÁÉÍÓÚÑ]/.test(prosa)) {
      avisos.push("prosa ES sin una sola tilde (revisar a ojo: puede ser correcta)");
    }
  }

  // ── Pareja de idioma (ES↔EN) ──────────────────────────────────────────────
  if (f.lang === "es" && !byKeyLang.has(`${f.translationKey}|en`)) avisos.push("sin versión EN");
  if (f.lang === "en" && !byKeyLang.has(`${f.translationKey}|es`)) errores.push("EN huérfana (sin ES)");

  // ── Duplicados de coordenadas (mismo punto, distinta ficha, mismo idioma) ─
  if (c) {
    const k = `${c.lat?.toFixed(4)},${c.lng?.toFixed(4)}`;
    const others = (byCoord.get(k) ?? []).filter(
      (x) => x !== f.file && x.endsWith(`-${f.lang}.json`),
    );
    if (others.length) avisos.push(`coordenadas idénticas a: ${others.join(", ")}`);
  }

  // ── Bloque planner (si existe) ────────────────────────────────────────────
  if (f.planner) {
    for (const campo of ["zone", "cluster", "plannerType", "effortLevel", "carAccess"]) {
      if (!f.planner[campo]) errores.push(`planner sin \`${campo}\``);
    }
    if (!f.planner.highlights?.length && d.length < 100) {
      avisos.push("sin highlights y descripción corta (el plan mostrará poco)");
    }
    if (f.planner.needsReservation && !f.planner.officialUrl && !f.website) {
      avisos.push("pide reserva pero no hay web oficial adonde mandar");
    }
    if (f.planner.dataCertainty === "baja") avisos.push("dataCertainty BAJA (revisar antes de publicar)");
  }

  informes.push({ file: f.file, status: f.status, lang: f.lang, key: f.translationKey, errores, avisos });
}

const conError = informes.filter((i) => i.errores.length);
const conAviso = informes.filter((i) => !i.errores.length && i.avisos.length);
const limpias = informes.filter((i) => !i.errores.length && !i.avisos.length);

if (asJson) {
  console.log(JSON.stringify({ total: informes.length, conError, conAviso: conAviso.length, limpias: limpias.length, informes }, null, 1));
} else {
  console.log(`QA lugares — ${informes.length} fichas examinadas${soloDraft ? " (solo draft)" : ""}`);
  console.log(`  ✅ limpias: ${limpias.length}   ⚠️ con avisos: ${conAviso.length}   ❌ con errores: ${conError.length}\n`);
  for (const i of conError) console.log(`❌ ${i.file} [${i.status}] — ${i.errores.join(" · ")}`);
  if (conError.length) console.log("");
  for (const i of conAviso) console.log(`⚠️  ${i.file} [${i.status}] — ${i.avisos.join(" · ")}`);
}

// Código de salida para CI: solo los ERRORES bloquean (los avisos informan).
process.exitCode = conError.length ? 1 : 0;
