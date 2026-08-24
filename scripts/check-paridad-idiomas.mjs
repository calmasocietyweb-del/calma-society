/**
 * Guardián de paridad de idiomas.
 *
 * Regla del dueño (24-ago-2026): «que a partir de ahora todo lo que se cree sea
 * en todos los idiomas». Este script la hace cumplir sin bloquear el proyecto
 * mientras se traduce el fondo de armario:
 *
 *   - Lo que YA existía cuando se puso la regla (la "línea base") se reporta
 *     como pendiente, pero NO rompe la build. Es el trabajo en curso.
 *   - Lo que se cree A PARTIR DE AHORA tiene que nacer en todos los idiomas
 *     activos. Si le falta uno, este script FALLA. Ese es el cortafuegos.
 *
 * Uso:
 *   node scripts/check-paridad-idiomas.mjs            → informe + falla si hay pieza nueva coja
 *   node scripts/check-paridad-idiomas.mjs --base     → regenera la línea base (hazlo solo a propósito)
 *   node scripts/check-paridad-idiomas.mjs --todo     → informe completo, incluida la línea base
 *
 * Los eventos CADUCADOS se ignoran: traducirlos es tirar trabajo (decisión del
 * 24-ago-2026, ver docs/superpowers/specs/2026-08-24-idiomas-europa-completo-design.md).
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const BASE_PATH = path.join(RAIZ, "scripts", "data", "paridad-baseline.json");

const args = process.argv.slice(2);
const REGENERAR = args.includes("--base");
const VER_TODO = args.includes("--todo");

// ── Idiomas activos: única fuente = src/config/site.ts ───────────────────────
function localesActivos() {
  const s = fs.readFileSync(path.join(RAIZ, "src", "config", "site.ts"), "utf8");
  const bloque = s.slice(s.indexOf("locales: ["), s.indexOf("] as LocaleConfig[]"));
  const codigos = [...bloque.matchAll(/\{\s*code:\s*'([a-z]{2})'/g)].map((m) => m[1]);
  if (codigos.length === 0) throw new Error("No se han podido leer los locales de site.ts");
  return codigos;
}

// ── Recorrido de las colecciones ────────────────────────────────────────────
const COLECCIONES = [
  { nombre: "articulos", dir: "src/content/articulos", ext: [".mdx", ".md"] },
  { nombre: "lugares", dir: "src/content/lugares", ext: [".json"] },
  { nombre: "eventos", dir: "src/content/eventos", ext: [".json"] },
];

const HOY = new Date().toISOString().slice(0, 10);

/** Saca lang, translationKey y (si es evento) la fecha de fin de un fichero. */
function leerPieza(file) {
  const txt = fs.readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    try {
      const j = JSON.parse(txt);
      return { lang: j.lang, key: j.translationKey, fin: j.endDate ?? j.startDate ?? null };
    } catch {
      return null;
    }
  }
  // MDX: frontmatter plano, sin dependencias.
  const fm = txt.startsWith("---") ? txt.slice(3, txt.indexOf("\n---", 3)) : "";
  const lang = fm.match(/^lang:\s*"?([a-z]{2})"?/m)?.[1];
  const key = fm.match(/^translationKey:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
  return lang && key ? { lang, key, fin: null } : null;
}

function inventario() {
  const grupos = new Map(); // "coleccion::key" -> Set(langs)
  const caducados = new Set();
  for (const col of COLECCIONES) {
    const dir = path.join(RAIZ, col.dir);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!col.ext.some((e) => f.endsWith(e))) continue;
      const p = leerPieza(path.join(dir, f));
      if (!p) continue;
      const id = `${col.nombre}::${p.key}`;
      // Un evento cuya última fecha ya pasó no se traduce.
      if (col.nombre === "eventos" && p.fin && p.fin < HOY) {
        caducados.add(id);
        continue;
      }
      if (!grupos.has(id)) grupos.set(id, new Set());
      grupos.get(id).add(p.lang);
    }
  }
  for (const id of caducados) grupos.delete(id);
  return grupos;
}

// ── Ejecución ───────────────────────────────────────────────────────────────
const LOCALES = localesActivos();
const grupos = inventario();

if (REGENERAR) {
  fs.mkdirSync(path.dirname(BASE_PATH), { recursive: true });
  const base = {
    creado: HOY,
    nota:
      "Piezas que ya existían al poner la regla de paridad. NO rompen la build mientras se traducen. " +
      "Toda pieza que NO esté en esta lista debe nacer en todos los idiomas activos.",
    locales: LOCALES,
    claves: [...grupos.keys()].sort(),
  };
  fs.writeFileSync(BASE_PATH, JSON.stringify(base, null, 1));
  console.log(`Línea base regenerada: ${base.claves.length} piezas en ${BASE_PATH}`);
  process.exit(0);
}

const base = fs.existsSync(BASE_PATH) ? JSON.parse(fs.readFileSync(BASE_PATH, "utf8")) : { claves: [] };
const enBase = new Set(base.claves);

const nuevasCojas = [];
const pendientes = [];

for (const [id, langs] of [...grupos].sort()) {
  const faltan = LOCALES.filter((l) => !langs.has(l));
  if (faltan.length === 0) continue;
  (enBase.has(id) ? pendientes : nuevasCojas).push({ id, faltan });
}

// ── Informe ─────────────────────────────────────────────────────────────────
const total = grupos.size;
const completas = total - pendientes.length - nuevasCojas.length;
const pct = total ? Math.round((completas / total) * 100) : 100;

console.log(`\nParidad de idiomas — ${LOCALES.join(", ")}`);
console.log(`${completas} de ${total} piezas completas (${pct} %)\n`);

// Cobertura por idioma, que es lo que de verdad se mira durante el despliegue.
for (const l of LOCALES) {
  const n = [...grupos.values()].filter((s) => s.has(l)).length;
  const barra = "█".repeat(Math.round((n / total) * 30)).padEnd(30, "·");
  console.log(`  ${l}  ${barra}  ${String(n).padStart(4)} / ${total}`);
}

if (VER_TODO && pendientes.length) {
  console.log(`\nPendientes de traducir (línea base, no rompen la build): ${pendientes.length}`);
  for (const p of pendientes.slice(0, 40)) console.log(`  · ${p.id} — falta ${p.faltan.join(", ")}`);
  if (pendientes.length > 40) console.log(`  … y ${pendientes.length - 40} más`);
} else if (pendientes.length) {
  console.log(`\n${pendientes.length} piezas de la línea base siguen sin traducir (usa --todo para verlas).`);
}

if (nuevasCojas.length) {
  console.error(`\n⛔ ${nuevasCojas.length} pieza(s) NUEVA(S) sin todos los idiomas.`);
  console.error(`   La regla es: todo lo que se cree nace en todos los idiomas activos.\n`);
  for (const p of nuevasCojas) console.error(`   · ${p.id} — falta ${p.faltan.join(", ")}`);
  console.error(
    `\n   Si una de estas es en realidad contenido viejo que estaba sin registrar,\n` +
      `   regenera la línea base a propósito: node scripts/check-paridad-idiomas.mjs --base\n`,
  );
  process.exit(1);
}

console.log(`\n✓ Ninguna pieza nueva sin traducir.\n`);
