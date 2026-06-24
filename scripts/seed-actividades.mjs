/**
 * seed-actividades.mjs — crea fichas de LUGARES (ES) para la capa de ACTIVIDADES
 * del planificador, a partir del staging investigado y verificado por el workflow
 * (.tmp_research/planner-actividades-<cat>.json). Nace todo en `status: draft`.
 *
 * NO sobreescribe fichas existentes (idempotente por translationKey). El EN se
 * genera después con un pase de localización (como la guía de comida).
 *   node scripts/seed-actividades.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const STAGING = ".tmp_research";
const LUG = "src/content/lugares";
const TODAY = "2026-06-24";
const CATS = ["nautica", "enoturismo-producto", "bienestar", "aventura-naturaleza", "cultura-patrimonio", "familia-ninos", "atardecer-experiencia"];

// plannerType → type de la colección `lugares` (cala/restaurante/alojamiento/monumento/comercio/otro).
const TYPE_OF = (pt) =>
  pt === "yacimiento" || pt === "faro" ? "monumento"
  : pt === "interior-cultural" ? "monumento"
  : pt === "comida" || pt === "cena" || pt === "desayuno" ? "restaurante"
  : "otro";

const ENUM = {
  zone: new Set(["este", "sur-este", "sur-centro", "sur-oeste", "oeste", "norte", "centro", "eje-me1"]),
  plannerType: new Set(["cala", "playa", "pueblo", "faro", "yacimiento", "mirador", "atardecer", "desayuno", "comida", "cena", "actividad-acuatica", "excursion", "interior-cultural"]),
  carAccess: new Set(["coche-directo", "coche-mas-caminata", "solo-bus-lanzadera", "sin-coche-ok"]),
  effortLevel: new Set(["A1", "A2", "B", "C", "D"]),
  idealFor: new Set(["primera-vez", "parejas", "familias", "ninos-pequenos", "lujo-tranquilo", "nautica", "cultura", "gastronomia", "vida-nocturna", "naturaleza"]),
};

// Correcciones de la verificación adversarial (drop / soften de operadores no
// confirmados). Documentado: kayakgaldana = web de afiliación (no operador);
// Ocean Cat = empresa real pero su producto de atardecer no está documentado;
// picnic gourmet = sin proveedor verificable + logística contradicha.
const CORR = {
  "picnic-gourmet-atardecer-calas-suroeste": { drop: true },
  "kayak-galdana-rutas-cuevas-familia": {
    name: "Kayak guiado a cuevas desde Cala Galdana",
    officialUrl: null,
    certainty: "media",
  },
  "atardecer-catamaran-ciutadella-oceancat": {
    name: "Atardecer en barco desde Ciutadella",
    officialUrl: null,
    blurb: "Salida en barco desde el puerto de Ciutadella, en la costa de poniente, para ver la puesta de sol desde el mar — sin coche y a un ritmo sereno.",
    highlights: [
      "embarcar en el puerto histórico de Ciutadella, sin coche",
      "ver el sol caer sobre el mar en la costa de poniente",
      "la hora dorada con la luz baja sobre el agua",
    ],
    certainty: "media",
  },
};

// translationKeys ya existentes (para no duplicar).
const existing = new Set();
for (const file of readdirSync(LUG).filter((f) => f.endsWith(".json"))) {
  try { existing.add(JSON.parse(readFileSync(join(LUG, file), "utf8")).translationKey); } catch {}
}

let created = 0, skipped = 0, dropped = 0, warnings = [];

for (const cat of CATS) {
  let st;
  try { st = JSON.parse(readFileSync(join(STAGING, `planner-actividades-${cat}.json`), "utf8")); }
  catch { console.log(`(falta staging de ${cat})`); continue; }

  for (const a of st.activities || []) {
    if (!a.id || !a.name) { warnings.push(`${cat}: actividad sin id/name`); continue; }
    if (existing.has(a.id)) { skipped++; continue; }
    const fix = CORR[a.id] || {};
    if (fix.drop) { dropped++; continue; }
    const name = fix.name || a.name;
    const blurb = fix.blurb || a.blurb;
    const highlights = fix.highlights || a.highlights;
    const certainty = fix.certainty || a.certainty;
    const officialUrl = "officialUrl" in fix ? fix.officialUrl : a.officialUrl;

    // Validación/saneo de enums (con defaults prudentes + aviso).
    const zone = ENUM.zone.has(a.zone) ? a.zone : (warnings.push(`${a.id}: zone inválida "${a.zone}" → eje-me1`), "eje-me1");
    const plannerType = ENUM.plannerType.has(a.plannerType) ? a.plannerType : (warnings.push(`${a.id}: plannerType "${a.plannerType}" → excursion`), "excursion");
    const carAccess = ENUM.carAccess.has(a.carAccess) ? a.carAccess : "coche-directo";
    const effortLevel = ENUM.effortLevel.has(a.effortLevel) ? a.effortLevel : "A2";
    const idealFor = (a.idealFor || []).filter((x) => ENUM.idealFor.has(x));

    const fiche = {
      name,
      lang: "es",
      translationKey: a.id,
      type: TYPE_OF(plannerType),
      edition: "menorca",
      description: blurb || name,
      coordinates: { lat: Number(a.coordinates?.lat) || 39.95, lng: Number(a.coordinates?.lng) || 4.1 },
      area: a.area || "Menorca",
      images: [],
      tags: [],
      status: "draft",
      planner: {
        zone, cluster: a.cluster || `${zone}-actividades`, plannerType, idealFor,
        highlights: highlights || [],
        durationMin: Number(a.durationMin) || 120,
        carAccess, busServed: !!a.busServed, carAccessClosedSummer: false,
        effortLevel, isIndoor: false, indoorAlternativeOf: [],
        needsReservation: !!a.needsReservation,
        ...(officialUrl ? { officialUrl } : {}),
        dataCertainty: ["alta", "media", "baja"].includes(certainty) ? certainty : "media",
        lastVerified: TODAY,
      },
    };
    writeFileSync(join(LUG, `${a.id}-es.json`), JSON.stringify(fiche, null, 2) + "\n");
    existing.add(a.id);
    created++;
  }
}

console.log(`✓ fichas de actividad ES creadas: ${created} (omitidas por existir: ${skipped}, descartadas por verificación: ${dropped})`);
if (warnings.length) console.log(`⚠ avisos (${warnings.length}):\n  ${warnings.join("\n  ")}`);
