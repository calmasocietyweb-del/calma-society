/**
 * Enriquecimiento del bloque `planner` en las fichas de `src/content/lugares`.
 *
 * P1 del Planificador de viajes (docs/PLANIFICADOR-BLUEPRINT.md): deriva los
 * campos máquina-legibles del motor de reglas A PARTIR de la investigación
 * verificada (.tmp_research/planner-lugares-COMPLETO.json) + las reglas de
 * asignación del blueprint (esfuerzo A1–D, calendario de cierre estival, etc.).
 *
 * Diseño:
 *  - Mapeo CURADO por `translationKey` (no volcado ciego): el blueprint pide un
 *    proceso semi-automático con criterio humano (§ riesgo R8). Cada valor sale
 *    de la investigación; lo que no se puede verificar NO se inventa.
 *  - Inserta `planner` SIN reformatear el resto de la ficha (diff mínimo) y es
 *    idempotente (si ya hay `planner`, avisa y no lo duplica).
 *  - Los textos libres (shuttleInfo/effortNote/seasonalHours) van localizados
 *    por idioma; el resto son enums/numeros neutros de idioma.
 *  - PILOTO: arranca con las fichas ya en el repo respaldadas por los 204
 *    lugares de la investigación. Para el P1-full se amplía el MAPA.
 *
 * Uso:  node scripts/enrich-planner.mjs        (aplica)
 *       node scripts/enrich-planner.mjs --dry   (solo informa)
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
const TODAY = "2026-06-22"; // lastVerified de esta pasada
const DRY = process.argv.includes("--dry");

// ── MAPA CURADO (piloto). Clave = translationKey. ───────────────────────────
// `common` = campos neutros de idioma. `es`/`en` = textos libres localizados.
const MAP = {
  "cala-macarella": {
    common: {
      zone: "sur-oeste", cluster: "calas-virgenes-ciutadella", plannerType: "cala",
      idealFor: ["primera-vez", "parejas", "naturaleza"],
      durationMin: 240,
      carAccess: "solo-bus-lanzadera", busServed: true, carAccessClosedSummer: true,
      effortLevel: "C", isIndoor: false, weatherProof: "exterior",
      needsReservation: false, dataCertainty: "alta", lastVerified: TODAY,
    },
    es: {
      shuttleInfo: "1 jun–30 sep: coche y moto privados prohibidos. Bus lanzadera desde Ciutadella, taxi autorizado, bici o a pie (Camí de Cavalls desde Cala Galdana, ~45 min). Fuera de temporada: coche hasta el parking gratuito a 15-20 min a pie.",
      effortNote: "Acceso a pie o en lanzadera en verano; sendero del Camí de Cavalls. Sin servicios garantizados: lleva agua y sombra.",
    },
    en: {
      shuttleInfo: "1 Jun–30 Sep: private cars and motorbikes are banned. Shuttle bus from Ciutadella, licensed taxi, bike or on foot (Camí de Cavalls from Cala Galdana, ~45 min). Off-season: drive to the free car park, 15-20 min walk away.",
      effortNote: "Reached on foot or by shuttle in summer, along the Camí de Cavalls. No reliable services: bring water and shade.",
    },
  },
  "cala-turqueta": {
    common: {
      zone: "sur-oeste", cluster: "calas-virgenes-ciutadella", plannerType: "cala",
      idealFor: ["familias", "parejas", "naturaleza"],
      durationMin: 200,
      carAccess: "coche-mas-caminata", busServed: true, carAccessClosedSummer: false,
      effortLevel: "C", isIndoor: false, weatherProof: "exterior",
      needsReservation: false, dataCertainty: "alta", lastVerified: TODAY,
    },
    es: {
      shuttleInfo: "Mantiene acceso en coche en verano, pero el parking se llena muy pronto (llega ~8:00). También bus lanzadera desde Ciutadella en temporada. Punto de partida habitual para caminar a Macarella.",
      effortNote: "Sendero de 10-15 min entre pinos desde el parking; firme pero no apto para silla de ruedas ni carrito.",
    },
    en: {
      shuttleInfo: "Keeps car access in summer, but the car park fills up very early (arrive ~8:00). Seasonal shuttle bus from Ciutadella too. Common starting point for the walk to Macarella.",
      effortNote: "10-15 min path through pines from the car park; firm but not suitable for wheelchairs or strollers.",
    },
  },
  "cala-mitjana": {
    common: {
      zone: "sur-centro", cluster: "galdana-mitjana", plannerType: "cala",
      idealFor: ["familias", "naturaleza", "parejas"],
      durationMin: 180,
      carAccess: "coche-mas-caminata", busServed: true, carAccessClosedSummer: false,
      effortLevel: "B", isIndoor: false, weatherProof: "exterior",
      needsReservation: false, dataCertainty: "alta", lastVerified: TODAY,
    },
    es: {
      shuttleInfo: "Gran parking de tierra gratuito (~250 plazas) + camino señalizado de 1,2 km en bajada. Llega antes de las 10h en temporada alta. Bus L52 (Ciutadella) / L51 (Maó); también a pie desde Cala Galdana por el Camí de Cavalls.",
      effortNote: "Camino de 1,2 km en bajada, mayormente cómodo y apto para familias; no para silla de ruedas.",
    },
    en: {
      shuttleInfo: "Large free dirt car park (~250 spaces) + 1.2 km signposted downhill path. Arrive before 10am in peak season. Bus L52 (Ciutadella) / L51 (Maó); also on foot from Cala Galdana along the Camí de Cavalls.",
      effortNote: "1.2 km downhill path, mostly easy and family-friendly; not for wheelchairs.",
    },
  },
  "cala-pregonda": {
    common: {
      zone: "norte", cluster: "fornells-cavalleria", plannerType: "cala",
      idealFor: ["naturaleza", "parejas"],
      durationMin: 240,
      carAccess: "coche-mas-caminata", busServed: false, carAccessClosedSummer: false,
      effortLevel: "D", isIndoor: false, weatherProof: "exterior",
      needsReservation: false, dataCertainty: "alta", lastVerified: TODAY,
    },
    es: {
      effortNote: "Sin acceso rodado a la cala: ~30 min a pie (2 km) por el Camí de Cavalls desde el parking de Binimel·la. Sin servicios; calzado cómodo, agua y sombra imprescindibles.",
      seasonalHours: "Junio o septiembre; en julio/agosto el parking de Binimel·la se llena pronto. Mejor con poco viento del norte.",
    },
    en: {
      effortNote: "No road access to the cove: ~30 min walk (2 km) along the Camí de Cavalls from the Binimel·la car park. No services; sturdy footwear, water and shade are essential.",
      seasonalHours: "June or September; in July/August the Binimel·la car park fills up early. Best with little northerly wind.",
    },
  },
  "naveta-tudons": {
    common: {
      zone: "eje-me1", cluster: "interior-cultura", plannerType: "yacimiento",
      idealFor: ["cultura", "primera-vez", "familias"],
      durationMin: 40,
      carAccess: "coche-directo", busServed: false, carAccessClosedSummer: false,
      effortLevel: "B", isIndoor: false, weatherProof: "exterior",
      needsReservation: false, dataCertainty: "alta", lastVerified: TODAY,
    },
    es: {
      effortNote: "Aparcamiento junto a la carretera Me-1 (km ~40) + paseo corto de 5 min por camino de tierra firme. Sin sombra: evita el mediodía en verano.",
      seasonalHours: "Mañana o última hora; cualquier época. La mejor luz y menos calor a primera o última hora del día.",
    },
    en: {
      effortNote: "Car park beside the Me-1 road (km ~40) + short 5-min walk on a firm dirt track. No shade: avoid midday in summer.",
      seasonalHours: "Morning or late afternoon; any season. Best light and least heat early or late in the day.",
    },
  },
  "cova-den-xoroi": {
    common: {
      zone: "sur-centro", cluster: "calanporter-xoroi", plannerType: "atardecer",
      idealFor: ["parejas", "lujo-tranquilo", "vida-nocturna"],
      durationMin: 120,
      carAccess: "coche-directo", busServed: true, carAccessClosedSummer: false,
      effortLevel: "B", isIndoor: false, weatherProof: "semicubierto",
      needsReservation: true, officialUrl: "https://www.covadenxoroi.com",
      dataCertainty: "alta", lastVerified: TODAY,
    },
    es: {
      effortNote: "Se baja al acantilado por escaleras talladas; no apto para silla de ruedas ni movilidad muy reducida.",
      seasonalHours: "Jun-ago desde 11:30 h hasta el anochecer; may/oct desde 15 h. De día mirador (~8,5 €), tarde lounge (~12 €), noche discoteca. Reserva online recomendable en verano.",
    },
    en: {
      effortNote: "You climb down to the cliff on carved steps; not suitable for wheelchairs or very limited mobility.",
      seasonalHours: "Jun-Aug from 11:30 until dusk; May/Oct from 15:00. Daytime viewpoint (~€8.5), afternoon lounge (~€12), nightclub after dark. Online booking recommended in summer.",
    },
  },
  "artrutx-sea-club": {
    common: {
      zone: "sur-oeste", cluster: "artrutx-cap", plannerType: "atardecer",
      idealFor: ["parejas", "lujo-tranquilo", "gastronomia"],
      durationMin: 90,
      carAccess: "coche-directo", busServed: false, carAccessClosedSummer: false,
      effortLevel: "A2", isIndoor: false, weatherProof: "exterior",
      needsReservation: true, dataCertainty: "alta", lastVerified: TODAY,
    },
    es: {
      shuttleInfo: "Coche desde Ciutadella (~8-10 km al sur, 15-20 min). Parking privado del restaurante y en la carretera (se llena pronto en verano: llega con antelación).",
      effortNote: "Terraza llana junto al faro del Cap d'Artrutx.",
    },
    en: {
      shuttleInfo: "Drive from Ciutadella (~8-10 km south, 15-20 min). Restaurant's private car park and roadside parking (fills up early in summer: arrive ahead of time).",
      effortNote: "Flat terrace next to the Cap d'Artrutx lighthouse.",
    },
  },
};

/** Inserta `planner` antes de la llave de cierre, sin reformatear el resto. */
function appendPlanner(raw, plannerObj) {
  const i = raw.lastIndexOf("}");
  const head = raw.slice(0, i).replace(/\s+$/, ""); // hasta la última propiedad (sin coma final)
  const inner = JSON.stringify(plannerObj, null, 2)
    .split("\n")
    .map((l, idx) => (idx === 0 ? l : "  " + l)) // anida bajo la raíz
    .join("\n");
  return head + ",\n  \"planner\": " + inner + "\n}\n";
}

let changed = 0, skipped = 0;
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const path = join(DIR, file);
  const raw = readFileSync(path, "utf8");
  const j = JSON.parse(raw);
  const entry = MAP[j.translationKey];
  if (!entry) continue;
  if (j.planner) { console.log("• ya tiene planner, omito:", file); skipped++; continue; }
  const localized = entry[j.lang] || {};
  const plannerObj = { ...entry.common, ...localized };
  if (DRY) {
    console.log("→ (dry) añadiría planner a", file, "·", plannerObj.plannerType, plannerObj.zone, "effort", plannerObj.effortLevel);
  } else {
    writeFileSync(path, appendPlanner(raw, plannerObj));
    console.log("✓", file, "·", plannerObj.plannerType, plannerObj.zone, "effort", plannerObj.effortLevel);
  }
  changed++;
}
console.log(`\n${DRY ? "DRY-RUN" : "Hecho"}: ${changed} fichas ${DRY ? "a enriquecer" : "enriquecidas"}, ${skipped} ya tenían planner.`);
