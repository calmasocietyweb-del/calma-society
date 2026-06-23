/**
 * apply-fechas-verificadas.mjs — aplica las fechas 2026 verificadas (workflow de
 * verificación) a los eventos pendientes: fija startDate/endDate y publica
 * (status: published) los que tienen fecha confirmada o aproximada razonable.
 * Guarda la procedencia (fuente, base, confianza) en src/data para trazabilidad.
 *
 * Uso:  node scripts/apply-fechas-verificadas.mjs [.tmp_fechas.json]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/eventos";
const res = JSON.parse(readFileSync(process.argv[2] || ".tmp_fechas.json", "utf8"));
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

// Índice translationKey → { lang: archivo }.
const index = {};
for (const f of readdirSync(DIR)) {
  if (!f.endsWith(".json")) continue;
  const o = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  if (o.translationKey) (index[o.translationKey] ||= {})[o.lang] = f;
}

const provenance = {};
let pub = 0, kept = 0;
for (const r of res) {
  const files = index[r.key];
  if (!files) { console.log(`⚠ sin ficha: ${r.key}`); continue; }
  const publish = r.recommend === "publicar" && isISO(r.startDate);
  for (const lang of Object.keys(files)) {
    const file = join(DIR, files[lang]);
    const o = JSON.parse(readFileSync(file, "utf8"));
    if (isISO(r.startDate)) o.startDate = r.startDate;
    // endDate solo si es un rango real (distinto del inicio); si no, se quita.
    if (isISO(r.endDate) && r.endDate !== r.startDate) o.endDate = r.endDate;
    else delete o.endDate;
    if (publish) o.status = "published";
    writeFileSync(file, JSON.stringify(o, null, 2) + "\n");
  }
  provenance[r.key] = {
    startDate: r.startDate, endDate: r.endDate || undefined,
    dateType: r.dateType, confidence: r.confidence,
    basis: r.basis, sourceName: r.sourceName, sourceUrl: r.sourceUrl,
    verifiedFor: "2026",
  };
  if (publish) { pub++; console.log(`PUB  ${r.confidence.padEnd(11)} ${r.startDate}${r.endDate && r.endDate !== r.startDate ? "→" + r.endDate : ""}  ${r.key}`); }
  else { kept++; console.log(`pen  ${r.key} (sin fecha fiable)`); }
}

writeFileSync("src/data/agenda-fechas-verificadas.json", JSON.stringify(provenance, null, 2) + "\n");
console.log(`\n✓ ${pub} publicados, ${kept} en pendiente. Procedencia → src/data/agenda-fechas-verificadas.json`);
