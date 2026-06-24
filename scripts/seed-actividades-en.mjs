/**
 * seed-actividades-en.mjs — crea las fichas EN de las ACTIVIDADES del planificador
 * a partir de las traducciones del workflow (.tmp_research/actividades-en-<cat>.json)
 * clonando la ficha ES (misma estructura/enums) y cambiando solo lang + los 3
 * campos de texto (name, description, planner.highlights). Idempotente.
 *   node scripts/seed-actividades-en.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const STAGING = ".tmp_research";
const LUG = "src/content/lugares";
const CATS = ["nautica", "enoturismo-producto", "bienestar", "aventura-naturaleza", "cultura-patrimonio", "familia-ninos", "atardecer-experiencia"];

let created = 0, missingEs = [], warnings = [];

for (const cat of CATS) {
  let trs;
  try { trs = JSON.parse(readFileSync(join(STAGING, `actividades-en-${cat}.json`), "utf8")); }
  catch { console.log(`(falta traducción EN de ${cat})`); continue; }

  for (const tr of trs) {
    const esPath = join(LUG, `${tr.id}-es.json`);
    if (!existsSync(esPath)) { missingEs.push(`${cat}:${tr.id}`); continue; }
    if (!tr.name || !tr.description) { warnings.push(`${cat}:${tr.id} traducción incompleta`); continue; }

    const es = JSON.parse(readFileSync(esPath, "utf8"));
    const en = structuredClone(es); // misma estructura/enums/coords; el id (translationKey) se conserva
    en.lang = "en";
    en.name = tr.name;
    en.description = tr.description;
    if (en.planner && Array.isArray(tr.highlights)) en.planner.highlights = tr.highlights;

    writeFileSync(join(LUG, `${tr.id}-en.json`), JSON.stringify(en, null, 2) + "\n");
    created++;
  }
}

console.log(`✓ fichas de actividad EN creadas: ${created}`);
if (missingEs.length) console.log(`⚠ sin ficha ES origen (${missingEs.length}): ${missingEs.join(", ")}`);
if (warnings.length) console.log(`⚠ avisos (${warnings.length}): ${warnings.join(", ")}`);
