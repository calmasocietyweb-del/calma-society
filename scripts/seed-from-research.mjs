/**
 * Expansión "a tope": deriva fichas `planner` (ES, draft) de TODA la investigación
 * verificada (.tmp_research/planner-lugares-COMPLETO.json) para que el motor tenga
 * el dataset completo de la isla.
 *
 * - Solo lugares con COORDENADAS (los itinerarios necesitan ubicar el punto).
 * - DEDUPLICA contra las fichas ya en el repo (por nombre normalizado y por clave).
 * - DERIVA cada campo `planner` por heurística sobre los datos verificados
 *   (acceso, esfuerzo, duración, zona/cluster) — NO inventa; nace en `status:draft`
 *   para visto bueno (§6 bis), con `dataCertainty` heredada de la investigación.
 * - Idempotente: no pisa fichas existentes.
 *
 * Uso:  node scripts/seed-from-research.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
const TODAY = "2026-06-22";
const DRY = process.argv.includes("--dry");
const research = JSON.parse(readFileSync(".tmp_research/planner-lugares-COMPLETO.json", "utf8"));

const strip = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const baseName = (s) => (s || "").split("(")[0].trim();
const slug = (s) =>
  strip(baseName(s)).replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
const normName = (s) => strip(baseName(s)).replace(/[^a-z0-9]/g, "");

// ── Dedup: nombres y claves ya en el repo ──
const existingNames = new Set();
const existingKeys = new Set();
for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  existingNames.add(normName(j.name));
  existingKeys.add(j.translationKey);
}

// ── Derivadores ──
function deriveZone(zonaRaw, muni) {
  const z = strip(zonaRaw);
  const m = strip(muni);
  if (z.includes("suroeste") || z === "sur-oeste") return "sur-oeste";
  if (z.includes("sureste") || z === "sur-este") return "sur-este";
  if (z.includes("noroeste")) return "oeste";
  if (z === "sur") {
    if (m.includes("ciutadella")) return "sur-oeste";
    if (m.includes("sant lluis") || m.includes("mao") || m.includes("maho")) return "sur-este";
    return "sur-centro";
  }
  if (z.includes("norte")) return "norte";
  if (z === "este") return "este";
  if (z === "oeste") return "oeste";
  if (z.includes("centro")) return "centro";
  return "centro";
}

function deriveCluster(zone, muni) {
  const m = strip(muni);
  switch (zone) {
    case "oeste": return "ciutadella-ciudad";
    case "sur-oeste": return "calas-virgenes-ciutadella";
    case "sur-centro": return m.includes("alaior") || m.includes("migjorn") ? "son-bou-migjorn" : "galdana-mitjana";
    case "sur-este": return "binibeca-sur-este";
    case "este": return "mao-puerto";
    case "norte":
      if (m.includes("mao") || m.includes("maho")) return "albufera-favaritx";
      if (m.includes("ciutadella")) return "norte-ciutadella";
      return "fornells-cavalleria";
    default: return "interior-cultura";
  }
}

function derivePlannerType(type, name, desc) {
  const nd = strip(name + " " + desc);
  switch (strip(type)) {
    case "cala": return "cala";
    case "playa": return "playa";
    case "faro": return "faro";
    case "nucleo": case "pueblo": return "pueblo";
    case "yacimiento": return "yacimiento";
    case "mirador": return "mirador";
    case "monumento": return "interior-cultural";
    case "gastronomia": case "restaurante": return "cena";
    case "naturaleza": return "excursion";
    case "sunset-spot": return "atardecer";
    case "actividad-acuatica": return "actividad-acuatica";
    case "tramo-cami-cavalls": return "excursion";
    case "experiencia":
      if (/atardecer|sunset|puesta de sol/.test(nd)) return "atardecer";
      if (/museu|museo|queser|queso|destiler|bodega|mercat|mercado|spa|artesan|cata/.test(nd)) return "interior-cultural";
      return "excursion";
    default: return "excursion";
  }
}

const IDEALFOR_MAP = {
  familia: "familias", familias: "familias", ninos: "ninos-pequenos",
  parejas: "parejas", pareja: "parejas",
  cultura: "cultura", gastronomia: "gastronomia",
  naturaleza: "naturaleza", fotografia: "naturaleza", snorkel: "naturaleza", calma: "naturaleza",
  mirador: "naturaleza", aventura: "naturaleza", senderismo: "naturaleza", buceo: "nautica",
  nautica: "nautica", vela: "nautica", kayak: "nautica",
  lujo: "lujo-tranquilo", comodidad: "lujo-tranquilo",
};
function deriveIdealFor(arr, plannerType) {
  const out = new Set();
  for (const raw of arr || []) {
    const k = strip(raw);
    for (const key of Object.keys(IDEALFOR_MAP)) if (k.includes(key)) out.add(IDEALFOR_MAP[key]);
    if (k.includes("primera")) out.add("primera-vez");
    if (k.includes("sin-multitud") || k.includes("sin multitud")) out.add("naturaleza");
  }
  if (out.size === 0) {
    if (plannerType === "cala" || plannerType === "playa") out.add("naturaleza");
    else if (["yacimiento", "interior-cultural", "pueblo", "mirador"].includes(plannerType)) out.add("cultura");
    else if (plannerType === "cena") out.add("gastronomia");
    else out.add("naturaleza");
  }
  return [...out];
}

function deriveCar(carText) {
  const t = strip(carText);
  const busServed = /\bbus\b|lanzadera|linea/.test(t);
  if (/restringido|barrera|prohibid/.test(t) && /verano|temporada|jun|jul|ago|sep/.test(t)) {
    return { carAccess: "solo-bus-lanzadera", busServed: true, carAccessClosedSummer: true };
  }
  if (/a pie en el centro|muy accesible sin coche|peaton|a pie en mao|a pie en mahon/.test(t)) {
    return { carAccess: "sin-coche-ok", busServed, carAccessClosedSummer: false };
  }
  if (/a pie|caminata|sendero|cami de cavalls|min a pie|andando|escaleras|\bbajada\b/.test(t)) {
    return { carAccess: "coche-mas-caminata", busServed, carAccessClosedSummer: false };
  }
  return { carAccess: "coche-directo", busServed, carAccessClosedSummer: false };
}

const A1_NAMES = ["son bou", "cala galdana", "sant tomas", "santo tomas", "punta prima", "cala en porter", "es grau", "arenal d en castell", "arenal den castell", "binibequer", "binibeca", "santandria", "platja gran", "degollador"];
function deriveEffort(name, type, carAccess, carText) {
  const n = strip(name);
  if ((type === "cala" || type === "playa") && A1_NAMES.some((a) => n.includes(a))) return "A1";
  if (["pueblo", "mirador", "interior-cultural", "cena", "atardecer", "faro"].includes(type)) return "A2";
  if (carAccess === "coche-mas-caminata") {
    const t = strip(carText);
    if (/cami de cavalls|4 h|dura|sin servicios|abrupto|2 km|30 min|40 min|45 min/.test(t)) return "D";
    return "C";
  }
  if (carAccess === "solo-bus-lanzadera") return "C";
  return "B";
}

function deriveDuration(hint, plannerType) {
  const h = strip(hint);
  let mm;
  if ((mm = /(\d+)\s*-\s*(\d+)\s*h/.exec(h))) return Math.round(((+mm[1] + +mm[2]) / 2) * 60);
  if ((mm = /(\d+)\s*h/.exec(h))) return +mm[1] * 60;
  if (/dia completo|jornada completa/.test(h)) return 300;
  if (/medio dia|media jornada|media manana|media tarde|medio día/.test(h)) return 180;
  if ((mm = /(\d+)\s*-\s*(\d+)\s*min/.exec(h))) return Math.round((+mm[1] + +mm[2]) / 2);
  if ((mm = /(\d+)\s*min/.exec(h))) return +mm[1];
  if (/\bdia\b|\bdía\b/.test(h)) return 240;
  const def = { cala: 180, playa: 180, faro: 75, mirador: 75, atardecer: 90, yacimiento: 60, pueblo: 150, "interior-cultural": 90, cena: 90, excursion: 180, "actividad-acuatica": 180 };
  return def[plannerType] || 90;
}

function deriveIndoor(plannerType, name, desc) {
  const nd = strip(name + " " + desc);
  if (["interior-cultural", "cena"].includes(plannerType) && /museu|museo|queser|queso|destiler|bodega|mercat|mercado|spa|artesan|catedral|fortaleza|claustro|interior/.test(nd)) {
    return { isIndoor: true, weatherProof: "cubierto" };
  }
  return { isIndoor: false, weatherProof: "exterior" };
}

// ── Generación ──
let created = 0, skipped = 0, noCoord = 0;
const seenThisRun = new Set();
for (const r of research) {
  if (strip(r.type) === "alojamiento") { skipped++; continue; }
  const m = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/.exec(r.coordsApprox || "");
  if (!m) { noCoord++; continue; }
  const key = slug(r.name);
  if (!key || existingKeys.has(key) || existingNames.has(normName(r.name)) || seenThisRun.has(key)) { skipped++; continue; }
  if (existsSync(join(DIR, `${key}-es.json`))) { skipped++; continue; }
  seenThisRun.add(key);

  const zone = deriveZone(r.zona, r.municipio);
  const plannerType = derivePlannerType(r.type, r.name, r.shortDesc);
  const car = deriveCar(r.carAccess);
  const effortLevel = deriveEffort(r.name, plannerType, car.carAccess, r.carAccess);
  const indoor = deriveIndoor(plannerType, r.name, r.shortDesc);
  const needsReservation = /reserva/.test(strip(r.carAccess + " " + r.bestSeasonTime + " " + r.durationHint));

  const planner = {
    zone, cluster: deriveCluster(zone, r.municipio), plannerType,
    idealFor: deriveIdealFor(r.idealFor, plannerType),
    durationMin: deriveDuration(r.durationHint, plannerType),
    carAccess: car.carAccess, busServed: car.busServed, carAccessClosedSummer: car.carAccessClosedSummer,
    effortLevel, isIndoor: indoor.isIndoor, weatherProof: indoor.weatherProof,
    needsReservation, dataCertainty: r.certainty || "media", lastVerified: TODAY,
  };
  if (indoor.isIndoor) planner.indoorAlternativeOf = [planner.cluster, zone];

  const desc = (r.shortDesc || `${baseName(r.name)} (${r.type}).`).trim().slice(0, 220);
  const ficha = {
    name: baseName(r.name),
    lang: "es", translationKey: key, type: mapType(r.type),
    description: desc,
    coordinates: { lat: +m[1], lng: +m[2] },
    area: `${cap(zone)} (${r.municipio})`,
    tags: [zone, strip(r.type), slug(r.municipio)].filter(Boolean),
    status: "draft",
    planner,
  };

  if (DRY) console.log("→", key, "·", plannerType, zone, effortLevel);
  else writeFileSync(join(DIR, `${key}-es.json`), JSON.stringify(ficha, null, 2) + "\n");
  created++;
}

function mapType(t) {
  const x = strip(t);
  if (["cala", "playa"].includes(x)) return "cala";
  if (["restaurante", "gastronomia"].includes(x)) return "restaurante";
  if (["monumento", "faro", "yacimiento", "mirador"].includes(x)) return "monumento";
  return "otro";
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

console.log(`\n${DRY ? "DRY-RUN" : "Hecho"}: ${created} fichas ES (draft) ${DRY ? "a crear" : "creadas"}; ${skipped} omitidas (dup/alojamiento), ${noCoord} sin coordenadas.`);
