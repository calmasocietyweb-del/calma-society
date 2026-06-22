/**
 * Compila el dataset del Planificador desde las fichas de contenido.
 *
 * Lee src/content/lugares/*.json, toma las que tienen bloque `planner` y status
 * `published`, y escribe DOS JSON por idioma (es/en) con SOLO los campos que el
 * motor usa (PlannerPlace) — sin descripciones largas (se cargan al enlazar a la
 * ficha). Es lo que el island del planificador importará en build.
 *
 * Riesgo R3 (tamaño): se incluyen solo campos del motor y se sirve un JSON por
 * idioma. Reejecutar cuando cambien las fichas:  node scripts/build-planner-data.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
const OUT = "src/data";

// Defaults espejo de los del schema Zod (los JSON solo guardan lo no-default).
function toPlannerPlace(f) {
  const p = f.planner;
  return {
    id: f.translationKey,
    name: f.name,
    slug: f.translationKey, // TODO: slug real por idioma cuando exista la página /lugar
    coordinates: f.coordinates,
    zone: p.zone,
    cluster: p.cluster,
    plannerType: p.plannerType,
    idealFor: p.idealFor ?? [],
    highlights: p.highlights,
    // Descripción corta (qué ver, fallback cuando no hay highlights): se recorta
    // para no inflar el JSON (riesgo R3); la ficha completa va en /lugar/<slug>.
    blurb: f.description ? f.description.slice(0, 150) : undefined,
    durationMin: p.durationMin,
    carAccess: p.carAccess,
    busServed: p.busServed ?? false,
    carAccessClosedSummer: p.carAccessClosedSummer ?? false,
    shuttleInfo: p.shuttleInfo,
    effortLevel: p.effortLevel,
    effortNote: p.effortNote,
    accessibleService: p.accessibleService,
    isIndoor: p.isIndoor ?? false,
    weatherProof: p.weatherProof,
    indoorAlternativeOf: p.indoorAlternativeOf ?? [],
    openDays: p.openDays,
    seasonalHours: p.seasonalHours,
    needsReservation: p.needsReservation ?? false,
    officialUrl: p.officialUrl,
    dataCertainty: p.dataCertainty ?? "media",
    lastVerified: p.lastVerified,
  };
}

// Quita las claves undefined para no inflar el JSON.
const prune = (o) => JSON.parse(JSON.stringify(o));

const byLang = { es: [], en: [] };
const statusCount = { published: 0, draft: 0, pending: 0 };
// Pre-lanzamiento: el planificador NO es público todavía, así que el dataset de
// desarrollo incluye también borradores (para ver el motor con datos ricos). En
// P3, al publicar la página, gatear a `status === "published"` (visto bueno §6 bis).
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const f = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  if (!f.planner || !byLang[f.lang]) continue;
  statusCount[f.status] = (statusCount[f.status] ?? 0) + 1;
  byLang[f.lang].push(prune(toPlannerPlace(f)));
}
const total = byLang.es.length + byLang.en.length;

for (const lang of Object.keys(byLang)) {
  byLang[lang].sort((a, b) => a.id.localeCompare(b.id)); // orden estable
  const path = join(OUT, `planner-data.${lang}.json`);
  writeFileSync(path, JSON.stringify(byLang[lang], null, 2) + "\n");
  console.log(`✓ ${path} — ${byLang[lang].length} lugares`);
}
console.log(`Hecho: ${total} fichas compiladas (published ${statusCount.published}, draft ${statusCount.draft}, pending ${statusCount.pending}). OJO: incluye borradores (pre-lanzamiento); gatear a published en P3.`);
