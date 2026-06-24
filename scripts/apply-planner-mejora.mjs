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

const STAGING = ".tmp_research";
const LUG = "src/content/lugares";
const OUT = "src/data/planner-food.es.json";
const ZONES = ["norte", "sur-centro", "sur-oeste", "oeste", "este", "sur-este", "centro"];

// Mapa translationKey(ES) → fichero, para parchear por id de forma robusta.
const esByKey = new Map();
for (const file of readdirSync(LUG).filter((f) => f.endsWith(".json"))) {
  const f = JSON.parse(readFileSync(join(LUG, file), "utf8"));
  if (f.lang === "es" && f.translationKey) esByKey.set(f.translationKey, file);
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
    .replace(/cuarta generaci[oó]n/gi, "negocio familiar")
    .replace(/cuatro generaciones/gi, "varias generaciones")
    .replace(/Ca n'Aguedet \(templo de la cocina autóctona, premio a la mejor cocina local 2016, abre solo a mediodía mar-jue\) o Es Molí des Racó/g, "Es Molí des Racó");
}
function sanitizeDeep(o) {
  if (typeof o === "string") return sanitize(o);
  if (Array.isArray(o)) return o.map(sanitizeDeep);
  if (o && typeof o === "object") { for (const k in o) o[k] = sanitizeDeep(o[k]); return o; }
  return o;
}

const food = { zones: {}, bases: {} };
let patched = 0, missing = [], hlTotal = 0;

for (const zone of ZONES) {
  let st;
  try { st = JSON.parse(readFileSync(join(STAGING, `planner-mejora-${zone}.json`), "utf8")); }
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
    const file = esByKey.get(h.id);
    if (!file) { missing.push(`${zone}:${h.id}`); continue; }
    const path = join(LUG, file);
    const f = JSON.parse(readFileSync(path, "utf8"));
    if (!f.planner) { missing.push(`${zone}:${h.id}(sin bloque planner)`); continue; }
    f.planner.highlights = h.highlights;
    writeFileSync(path, JSON.stringify(f, null, 2) + "\n");
    patched++;
  }
}

writeFileSync(OUT, JSON.stringify(food, null, 2) + "\n");

console.log(`✓ ${OUT}: ${Object.keys(food.zones).length} zonas, ${Object.keys(food.bases).length} bases (${Object.keys(food.bases).join(", ")})`);
console.log(`✓ highlights parcheados: ${patched}/${hlTotal}`);
if (missing.length) console.log(`⚠ ids no encontrados (${missing.length}): ${missing.join(", ")}`);
