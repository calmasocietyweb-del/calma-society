/**
 * add-eventos.mjs — integra eventos investigados en la Agenda (src/content/eventos).
 * Escribe un JSON por idioma ({translationKey}-es.json y -en.json) con el esquema de
 * la colección `eventos`. Asigna foto existente por ubicación/categoría y el estado
 * según la confianza:
 *   - confidence "alta"  → status "published" (fiestas de santo / mercados estables:
 *     hechos públicos objetivos, como los eventos ya publicados).
 *   - "media" / "baja"   → status "pending" (fecha 2026 sin confirmar → visto bueno).
 * Marca source "auto-agenda". No sobreescribe eventos ya existentes (dedup por slug).
 *
 * Uso:  node scripts/add-eventos.mjs [ruta-json]   (por defecto src/data/_eventos-nuevos.json)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIR = resolve(ROOT, "src/content/eventos");
const INPUT = resolve(ROOT, process.argv[2] || "src/data/_eventos-nuevos.json");

// ───────────────────────────────────────────────────────────────────────────
// ASIGNACIÓN DE FOTOS — variedad real, CERO repeticiones dentro del lote.
// El dueño pidió que NO se repita la misma foto entre eventos. Estrategia:
//   1) Las 7 fiestas llevan foto curada (caballos/jaleo, Reyes, carnaval…),
//      varias nuevas de Adobe Stock licenciadas (jun 2026).
//   2) El resto se reparte desde la biblioteca con pools temáticos por
//      categoría + "greedy first-unused" GLOBAL: cada foto se usa una sola vez.
//      Se procesan PRIMERO los publicados (confianza alta) para que los que
//      salen en vivo lleven foto única; los `pending` (que el dueño revisa)
//      cogen lo que queda y, solo si se agota el banco, podrían repetir (se
//      avisa por consola). Se EXCLUYEN las fotos de Menorca Bus (mb-*), de
//      transporte y las dos de Sant Joan (ya muy usadas por eventos previos).
// ───────────────────────────────────────────────────────────────────────────

// Foto FORZADA por clave (máximo control). Incluye las 7 fiestas (caballos,
// Reyes, carnaval…) y los eventos cuyo SITIO tiene una foto exacta en la
// biblioteca (Lithica, Camí de Cavalls, Cova d'en Xoroi…). Se asignan primero.
const FIESTA_IMG = {
  // Fiestas (varias de Adobe Stock licenciadas, jun 2026).
  "cavalcada-reis-menorca": "cabalgata-reyes",        // Adobe Stock: desfile de Reyes Magos
  "carnaval-darrers-dies-menorca": "carnaval-menorca", // Adobe Stock: disfraces de carnaval
  "mare-de-deu-del-toro": "monte-toro",                // Santuario del Monte Toro
  "sant-pere-pescadors-mao-fornells": "fornells",      // puerto pesquero de Fornells
  "festes-sant-nicolau-es-mercadal": "fiesta-caballos", // Adobe Stock: jinete + caballo + fuego
  "festes-calan-porter-alaior": "caballos-jinetes",     // Adobe Stock: caballos y jinetes
  "festes-es-caixers-alaior": "jinetes-fiesta",         // Adobe Stock: jinetes engalanados (caixers)
  // Eventos con sede de foto exacta (encaje literal).
  "fosquets-de-lithica": "lithica",                     // pedreres de s'Hostal (Lithica)
  "festival-pedra-viva-lithica": "la-mola",             // otra cantera/piedra (Lithica ya usada)
  "cova-den-xoroi-musica-atardecer": "cova-den-xoroi",  // la propia Cova d'en Xoroi al atardecer
  "trail-menorca-cami-de-cavalls-2026": "cami-de-cavalls", // el propio Camí de Cavalls
};

// Preferencia por pueblo (relevancia): primer evento de ese pueblo coge su foto.
const TOWN_IMG = [
  [/ciutadella/i, ["ciutadella-puerto", "ciutadella"]],
  [/ma[oó]n?\b|mahón|port de ma/i, ["mao-puerto", "puerto-mao"]],
  [/alaior/i, ["alaior"]],
  [/fornells/i, ["fornells"]],
  [/castell|cales fonts/i, ["cales-fonts"]],
  [/sant llu[ií]s|binib[eè]/i, ["binibeca-calle", "binibeca"]],
  [/migjorn|binigaus/i, ["binigaus"]],
  [/ferreries|galdana/i, ["cala-galdana"]],
];

// Pools temáticos por categoría (ordenados por mejor encaje). Solo fotos reales
// de la biblioteca; el dedup global evita que dos eventos compartan una.
const CAT_POOLS = {
  concierto: ["cova-den-xoroi", "lithica", "la-mola", "illa-del-rei", "casa-piedra",
    "mao-puerto", "puerto-mao", "ciutadella", "ciutadella-puerto", "cales-fonts",
    "binibeca-calle", "atardecer-menorca", "menorca-hero", "calma-menorca", "binibeca"],
  cultura: ["naveta-tudons", "lithica", "la-mola", "illa-del-rei", "casa-piedra",
    "menorca-punta-nati", "cova-den-xoroi", "faro-artrutx", "ciutadella",
    "binibeca", "alta-cocina-plato"],
  mercado: ["productos-menorca", "ciutadella-puerto", "mao-puerto", "puerto-mao",
    "alaior", "binibeca-calle", "cales-fonts", "ciutadella", "avarcas-menorca",
    "embutidos-menorca", "queso-tabla", "dulces-menorca", "vino-menorca",
    "gin-menorca", "mahonesa", "embutidos-tabla", "dulces-amargos", "binibeca",
    "gin-tonic", "queso-curacion", "vino-bodega"],
  deporte: ["cami-de-cavalls", "navegar-menorca", "crucero-menorca", "son-bou",
    "cala-galdana", "cala-mitjana", "cala-macarella", "cala-turqueta", "binigaus",
    "menorca-punta-nati", "albufera-des-grau", "faro-artrutx", "cala-pregonda"],
  gastronomia: ["caldereta-langosta", "queso-curacion", "queso-tabla", "vino-bodega",
    "fine-dining", "alta-cocina-plato", "gin-tonic", "embutidos-tabla",
    "dulces-amargos", "mahonesa", "vino-menorca", "productos-menorca"],
  otro: ["productos-menorca", "alaior", "calma-menorca", "menorca-hero"],
};

// Comodín final (paisaje genérico de Menorca) por si una categoría se agota.
// Amplio para que el banco no se agote y no haya repeticiones.
const GLOBAL_FALLBACK = ["menorca-hero", "calma-menorca", "atardecer-menorca",
  "cala-macarelleta", "albufera-badia", "navegar-menorca", "faro-artrutx",
  "cala-pregonda", "cala-turqueta", "cala-macarella", "son-bou", "binigaus",
  "cala-mitjana", "cala-galdana", "albufera-des-grau", "menorca-punta-nati"];

// Construye el orden de preferencia de un evento: pueblo → categoría → comodín.
function prefList(ev) {
  const hay = `${ev.location || ""} ${ev.municipio || ""}`;
  const town = [];
  for (const [re, imgs] of TOWN_IMG) if (re.test(hay)) town.push(...imgs);
  return [...town, ...(CAT_POOLS[ev.category] || []), ...GLOBAL_FALLBACK];
}

// Asigna una foto a cada evento garantizando que NO se repita ninguna.
// `events` es solo la lista de eventos NUEVOS (ya filtrados los duplicados).
function assignImages(events) {
  const used = new Set();
  const out = new Map(); // translationKey → "nombre-de-foto"
  // 1) Fiestas con foto curada.
  for (const ev of events) {
    const img = FIESTA_IMG[ev.translationKey];
    if (img) { out.set(ev.translationKey, img); used.add(img); }
  }
  // 2) Resto: publicados primero, luego pendientes; orden estable por clave.
  const rest = events
    .filter((ev) => !out.has(ev.translationKey))
    .sort((a, b) => {
      const pa = a.confidence === "alta" ? 0 : 1, pb = b.confidence === "alta" ? 0 : 1;
      return pa - pb || a.translationKey.localeCompare(b.translationKey);
    });
  for (const ev of rest) {
    const pick = prefList(ev).find((img) => !used.has(img));
    const img = pick || CAT_POOLS[ev.category]?.[0] || "menorca-hero";
    if (!pick) console.warn(`  ⚠ banco agotado para ${ev.translationKey}: reutiliza ${img}`);
    out.set(ev.translationKey, img);
    used.add(img);
  }
  return out;
}

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const CATS = ["fiesta", "concierto", "mercado", "deporte", "cultura", "gastronomia", "otro"];

function entry(ev, lang, image) {
  const o = {
    title: lang === "es" ? ev.titleEs : ev.titleEn,
    lang,
    translationKey: ev.translationKey,
    startDate: ev.startDate,
  };
  if (isDate(ev.endDate)) o.endDate = ev.endDate;
  o.location = ev.location;
  o.category = CATS.includes(ev.category) ? ev.category : "otro";
  o.description = lang === "es" ? ev.descEs : ev.descEn;
  if (Array.isArray(ev.tags) && ev.tags.length) o.tags = ev.tags.slice(0, 6);
  if (isUrl(ev.sourceUrl)) o.sourceUrl = ev.sourceUrl;
  o.status = ev.confidence === "alta" ? "published" : "pending";
  o.source = "auto-agenda";
  o.image = `/uploads/${image}.webp`;
  return o;
}

const isComplete = (ev) =>
  ev.translationKey && ev.titleEs && ev.titleEn && isDate(ev.startDate) && ev.descEs && ev.descEn;

function main() {
  const raw = JSON.parse(readFileSync(INPUT, "utf8"));
  const evs = Array.isArray(raw) ? raw : raw.eventos || raw.events || [];
  const existing = new Set(
    readdirSync(DIR).map((f) => f.replace(/-(es|en)\.json$/, "")),
  );
  // Eventos que realmente se van a añadir (completos y no duplicados).
  const toAdd = evs.filter((ev) => isComplete(ev) && !existing.has(ev.translationKey));
  const skip = evs.length - toAdd.length;
  // Asignación de fotos sin repetición sobre el lote real.
  const imageByKey = assignImages(toAdd);

  let pub = 0, pend = 0;
  const usedImgs = new Map(); // foto → nº de eventos (para verificar variedad)
  for (const ev of toAdd) {
    const img = imageByKey.get(ev.translationKey);
    writeFileSync(join(DIR, `${ev.translationKey}-es.json`), JSON.stringify(entry(ev, "es", img), null, 2) + "\n");
    writeFileSync(join(DIR, `${ev.translationKey}-en.json`), JSON.stringify(entry(ev, "en", img), null, 2) + "\n");
    if (ev.confidence === "alta") pub++; else pend++;
    usedImgs.set(img, (usedImgs.get(img) || 0) + 1);
    console.log(`  + ${ev.translationKey.padEnd(40)} ${ev.category.padEnd(11)} ${img.padEnd(18)} [${ev.confidence === "alta" ? "PUBLICADO" : "pendiente"}]`);
  }
  const repetidas = [...usedImgs.entries()].filter(([, n]) => n > 1);
  console.log(`\n✓ ${toAdd.length} eventos nuevos (${pub} publicados, ${pend} pendientes de revisión); ${skip} omitidos (dup o incompletos).`);
  console.log(`  Fotos distintas: ${usedImgs.size} para ${toAdd.length} eventos.` +
    (repetidas.length ? `  Repetidas: ${repetidas.map(([k, n]) => `${k}×${n}`).join(", ")}` : "  Sin repeticiones ✓"));
  console.log(`  Total archivos en eventos/: ${readdirSync(DIR).length}`);
}

main();
