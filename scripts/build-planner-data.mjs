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
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PHOTO_MAP } from "./planner-photo-map.mjs";

const DIR = "src/content/lugares";
const OUT = "src/data";

/**
 * Foto del lugar (cascada HONESTA, veredicto del council jul-2026):
 * 1) la imagen de la propia ficha; 2) la tabla curada a mano (planner-photo-map);
 * 3) sin foto. Se sirve la variante -480 (ligera) si existe.
 */
function photoOf(f) {
  const fromFicha = f.images && f.images[0];
  if (fromFicha) return { image: lightVariant(fromFicha), imageCredit: undefined };
  const curated = PHOTO_MAP[f.translationKey];
  if (curated) {
    return { image: lightVariant(`/uploads/${curated.img}.webp`), imageCredit: curated.credit };
  }
  return { image: undefined, imageCredit: undefined };
}

/** "/uploads/x.webp" → "/uploads/x-480.webp" si la variante ligera existe. */
function lightVariant(path) {
  const light = path.replace(/\.(webp|jpg|jpeg|png)$/i, "-480.$1");
  return existsSync(join("public", light.replace(/^\//, ""))) ? light : path;
}

// Defaults espejo de los del schema Zod (los JSON solo guardan lo no-default).
// `slugByFile` = nombre de archivo sin extensión = id de la entry en Astro = slug
// real de /lugar/<slug> (SOLO si la ficha está `published`: las draft no generan
// página, así que no se enlaza a un 404).
function toPlannerPlace(f, slugByFile) {
  const p = f.planner;
  const photo = photoOf(f);
  return {
    id: f.translationKey,
    name: f.name,
    slug: f.status === "published" ? slugByFile : undefined,
    image: photo.image,
    imageCredit: photo.imageCredit,
    coordinates: f.coordinates,
    zone: p.zone,
    cluster: p.cluster,
    plannerType: p.plannerType,
    idealFor: p.idealFor ?? [],
    highlights: p.highlights,
    // Descripción corta (qué ver, fallback cuando no hay highlights): se recorta
    // por palabra entera para no inflar el JSON (R3); la ficha completa va en /lugar/<slug>.
    blurb: f.description ? blurbOf(f.description) : undefined,
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

// Recorta a ~150 caracteres por palabra entera (sin cortar a media palabra) + "…".
function blurbOf(s) {
  if (s.length <= 150) return s;
  const cut = s.slice(0, 150);
  const i = cut.lastIndexOf(" ");
  return (i > 100 ? cut.slice(0, i) : cut).replace(/[\s,;:.]+$/, "") + "…";
}

const byLang = { es: [], en: [] };
const statusCount = { published: 0, draft: 0, pending: 0 };
// NOTA (decisión registrada, jul 2026): el dataset del MOTOR incluye fichas en
// draft a propósito. No son contenido editorial publicado: son DATOS verificados
// (dataCertainty/lastVerified) que alimentan el plan, aprobados como MODELO al
// publicar el planificador (analogía §6 bis con el parte del mar). Lo que sí se
// gatea por `published` es el ENLACE a la página /lugar (slug): una ficha draft
// no genera página y no se enlaza.
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const f = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  if (!f.planner || !byLang[f.lang]) continue;
  statusCount[f.status] = (statusCount[f.status] ?? 0) + 1;
  byLang[f.lang].push(prune(toPlannerPlace(f, file.replace(/\.json$/, ""))));
}
const total = byLang.es.length + byLang.en.length;

for (const lang of Object.keys(byLang)) {
  byLang[lang].sort((a, b) => a.id.localeCompare(b.id)); // orden estable
  const path = join(OUT, `planner-data.${lang}.json`);
  writeFileSync(path, JSON.stringify(byLang[lang], null, 2) + "\n");
  console.log(`✓ ${path} — ${byLang[lang].length} lugares`);
}
console.log(`Hecho: ${total} fichas compiladas (published ${statusCount.published}, draft ${statusCount.draft}, pending ${statusCount.pending}). El dataset incluye draft (son datos del motor, no páginas); el slug/enlace a /lugar solo se emite para published.`);
