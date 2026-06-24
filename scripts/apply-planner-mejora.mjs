/**
 * apply-planner-mejora.mjs — aplica el enriquecimiento del planificador investigado
 * por el workflow (staging en .tmp_research/planner-mejora-<zona>.json):
 *   1) Construye src/data/planner-food.es.json (guía de comida + anclas de base por zona).
 *   2) Parchea `planner.highlights` en las fichas ES (src/content/lugares) por translationKey.
 *   3) Sanea claims no verificados (corrección de la verificación adversarial).
 * Idempotente. EN queda pendiente (paso de paridad posterior).
 *   node scripts/apply-planner-mejora.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Idioma: `node scripts/apply-planner-mejora.mjs [es|en]` (default es). Para EN lee
// el staging traducido (planner-mejora-en-<zona>.json) y parchea las fichas EN.
const LANG = process.argv[2] === "en" ? "en" : "es";
const PREFIX = LANG === "en" ? "planner-mejora-en-" : "planner-mejora-";
const STAGING = ".tmp_research";
const LUG = "src/content/lugares";
const OUT = `src/data/planner-food.${LANG}.json`;
const ZONES = ["norte", "sur-centro", "sur-oeste", "oeste", "este", "sur-este", "centro"];

// Mapa translationKey(idioma) → fichero, para parchear por id de forma robusta.
const byKey = new Map();
for (const file of readdirSync(LUG).filter((f) => f.endsWith(".json"))) {
  const f = JSON.parse(readFileSync(join(LUG, file), "utf8"));
  if (f.lang === LANG && f.translationKey) byKey.set(f.translationKey, file);
}

// Neutraliza datos no confirmados (de la verificación adversarial y del contraste
// cruzado entre zonas):
//  - El Diamante: "cuarta generación" no confirmado → "negocio familiar".
//  - Ca n'Aguedet: estado actual como restaurante sin confirmar (un agente lo
//    descartó: pudo pasar a centro de formación) → se retira el anclaje, queda
//    Es Molí des Racó (verificable) como referente de cocina menorquina del centro.
function sanitize(s) {
  if (typeof s !== "string") return s;
  return s
    // El Diamante: "cuarta/4ª generación" no confirmado (ES y EN).
    .replace(/cuarta generaci[oó]n/gi, "negocio familiar")
    .replace(/cuatro generaciones/gi, "varias generaciones")
    .replace(/(?:in its |its )?fourth[- ]generation/gi, "family-run")
    .replace(/four generations/gi, "several generations")
    // Ca n'Aguedet: estado actual sin confirmar → se retira, queda Es Molí des Racó.
    // Tolerante a la redacción ES y EN ("… o/or Es Molí des Racó").
    .replace(/Ca n'Aguedet[^.;]*?\b(?:o|or)\s+Es Molí des Racó/gi, "Es Molí des Racó");
}
function sanitizeDeep(o) {
  if (typeof o === "string") return sanitize(o);
  if (Array.isArray(o)) return o.map(sanitizeDeep);
  if (o && typeof o === "object") { for (const k in o) o[k] = sanitizeDeep(o[k]); return o; }
  return o;
}

const food = { zones: {}, bases: {} };
let patched = 0, missing = [], hlTotal = 0;

// Para dar VARIEDAD al desayuno (mismo cada día = aburrido): recogemos los
// anclajes de desayuno verificados por zona y, por base, rotamos entre la guía
// y esos anclajes. Mapa base → zonas que la alimentan.
const breakfastAnchorsByZone = {};
const BASE_ZONES = {
  ciutadella: ["oeste", "sur-oeste"], mao: ["este", "sur-este"],
  fornells: ["norte"], "son-bou": ["sur-centro"], "es-mercadal": ["centro"],
};

for (const zone of ZONES) {
  let st;
  try { st = JSON.parse(readFileSync(join(STAGING, `${PREFIX}${zone}.json`), "utf8")); }
  catch { console.log(`(falta staging de ${zone})`); continue; }
  sanitizeDeep(st);

  // Guía de comida por zona (lo que el motor usará en desayuno/comida/cena + firma).
  const g = st.foodGuide || {};
  food.zones[st.zone || zone] = {
    whatToEat: g.whatToEat || "",
    breakfast: g.breakfast || "",
    lunch: g.lunch || "",
    dinner: g.dinner || "",
    signature: st.signature ? { title: st.signature.title, desc: st.signature.desc, idealFor: st.signature.idealFor || [] } : null,
  };

  // Anclajes de desayuno verificados de la zona (para la rotación por base).
  breakfastAnchorsByZone[st.zone || zone] = (st.foodAnchors || [])
    .filter((a) => a.type === "desayuno")
    .map((a) => ({
      name: a.name.split(" (")[0], // "El Diamante (Ses Voltes)" → "El Diamante"
      line: `${a.name}${a.name.includes("(") ? "" : ` (${a.area})`}: ${(a.highlights && a.highlights[0]) || a.blurb || ""}`.trim(),
    }));

  // Anclas de base (días de llegada/salida) keyed por base real.
  const ba = st.baseAnchors;
  if (ba && ba.baseName && ba.baseName !== "null") {
    food.bases[ba.baseName] = {
      arrivalDinner: ba.arrivalDinner || "",
      arrivalPaseo: ba.arrivalPaseo || "",
      departureCafe: ba.departureCafe || "",
      departurePaseo: ba.departurePaseo || "",
    };
  }

  // Parchea highlights en las fichas ES.
  for (const h of st.highlights || []) {
    hlTotal++;
    const file = byKey.get(h.id);
    if (!file) { missing.push(`${zone}:${h.id}`); continue; }
    const path = join(LUG, file);
    const f = JSON.parse(readFileSync(path, "utf8"));
    if (!f.planner) { missing.push(`${zone}:${h.id}(sin bloque planner)`); continue; }
    f.planner.highlights = h.highlights;
    writeFileSync(path, JSON.stringify(f, null, 2) + "\n");
    patched++;
  }
}

// Variedad de desayuno por base: guía de la(s) zona(s) + anclajes verificados, sin repetir.
let withVariety = 0;
for (const [base, zones] of Object.entries(BASE_ZONES)) {
  if (!food.bases[base]) continue;
  const opts = [];
  for (const z of zones) if (food.zones[z]?.breakfast) opts.push(food.zones[z].breakfast);
  // Anclaje de desayuno SOLO si su nombre no sale ya en la guía (evita repetir el sitio).
  for (const z of zones) for (const a of breakfastAnchorsByZone[z] || []) {
    if (!opts.some((o) => o.includes(a.name))) opts.push(a.line);
  }
  const uniq = [...new Set(opts.filter(Boolean))].slice(0, 3);
  if (uniq.length > 1) { food.bases[base].breakfasts = uniq; withVariety++; }
}

writeFileSync(OUT, JSON.stringify(food, null, 2) + "\n");

console.log(`✓ ${OUT}: ${Object.keys(food.zones).length} zonas, ${Object.keys(food.bases).length} bases (${Object.keys(food.bases).join(", ")})`);
console.log(`✓ desayuno con variedad (rotación) en ${withVariety} bases`);
console.log(`✓ highlights parcheados: ${patched}/${hlTotal}`);
if (missing.length) console.log(`⚠ ids no encontrados (${missing.length}): ${missing.join(", ")}`);
