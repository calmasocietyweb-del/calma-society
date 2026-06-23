/**
 * apply-lugares-en.mjs — crea las fichas EN de lugar que faltan para el dataset
 * del planificador, a partir de las traducciones del workflow.
 *
 * Para cada lugar traducido: clona la ficha ES (campos NEUTROS: coordenadas,
 * tags, bloque `planner` con zone/cluster/plannerType/etc.) y aplica el texto
 * EN (name, description → blurb, area, planner.highlights). NO sobreescribe
 * fichas EN existentes. Después hay que recompilar:  node scripts/build-planner-data.mjs
 *
 * Uso:  node scripts/apply-lugares-en.mjs [.tmp_translations.json]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
const trans = JSON.parse(readFileSync(process.argv[2] || ".tmp_translations.json", "utf8"));

// Índice de fichas ES por translationKey.
const esByKey = {};
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const o = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  if (o.lang === "es") esByKey[o.translationKey] = { file, o };
}

let created = 0, skipped = 0, missing = 0;
for (const t of trans) {
  const es = esByKey[t.key];
  if (!es) { missing++; console.warn(`  ⚠ sin ficha ES: ${t.key}`); continue; }
  const enFile = /-es\.json$/.test(es.file) ? es.file.replace(/-es\.json$/, "-en.json") : `${t.key}-en.json`;
  const enPath = join(DIR, enFile);
  if (existsSync(enPath)) { skipped++; continue; } // no pisar

  const en = JSON.parse(JSON.stringify(es.o)); // clon profundo (campos neutros)
  en.lang = "en";
  if (t.nameEn) en.name = t.nameEn;
  if (t.descriptionEn) en.description = t.descriptionEn;
  if (t.areaEn) en.area = t.areaEn;
  // highlights solo si la ES los tenía y la traducción los trae.
  if (en.planner?.highlights?.length && Array.isArray(t.highlightsEn) && t.highlightsEn.length) {
    en.planner.highlights = t.highlightsEn;
  }
  writeFileSync(enPath, JSON.stringify(en, null, 2) + "\n");
  created++;
}
console.log(`✓ ${created} fichas EN creadas (${skipped} ya existían, ${missing} sin ES).`);
console.log(`  Siguiente: node scripts/build-planner-data.mjs  (recompila el dataset)`);
