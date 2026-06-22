/**
 * Compila la agenda de fiestas para el Planificador (PASO 2 del motor).
 *
 * Lee src/content/eventos/*.json y escribe planner-events.{es,en}.json con lo
 * que el motor necesita para el cruce por fecha: {translationKey, title,
 * startDate, endDate, zone, category}. La ZONA de la fiesta se deriva por
 * keyword del `location` (municipio → zona); si toca varias, `varios`.
 *
 * Incluye borradores (pre-lanzamiento, como el dataset de lugares).
 * Reejecutar cuando cambien los eventos:  node scripts/build-planner-events.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/eventos";
const OUT = "src/data";

// Municipio (keyword en el `location`) → zona del planner.
const MUNI_ZONE = [
  ["ciutadella", "oeste"],
  ["es castell", "este"],
  ["mahón", "este"], ["mahon", "este"], ["maó", "este"], ["mao", "este"],
  ["sant lluís", "sur-este"], ["sant lluis", "sur-este"],
  ["ferreries", "sur-centro"],
  ["es migjorn", "sur-centro"],
  ["alaior", "sur-centro"],
  ["es mercadal", "centro"],
  ["fornells", "norte"],
];

function deriveZone(location) {
  const loc = (location || "").toLowerCase();
  const zones = new Set();
  for (const [kw, zone] of MUNI_ZONE) if (loc.includes(kw)) zones.add(zone);
  return zones.size === 1 ? [...zones][0] : "varios";
}

const byLang = { es: [], en: [] };
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const e = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  if (!byLang[e.lang]) continue;
  byLang[e.lang].push({
    translationKey: e.translationKey,
    title: e.title,
    startDate: e.startDate,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    zone: deriveZone(e.location),
    category: e.category,
  });
}

for (const lang of Object.keys(byLang)) {
  byLang[lang].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.translationKey.localeCompare(b.translationKey));
  const path = join(OUT, `planner-events.${lang}.json`);
  writeFileSync(path, JSON.stringify(byLang[lang], null, 2) + "\n");
  const varios = byLang[lang].filter((e) => e.zone === "varios").length;
  console.log(`✓ ${path} — ${byLang[lang].length} fiestas (${varios} de zona "varios")`);
}
