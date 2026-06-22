/**
 * Matching de intereses y proximidad — utilidades compartidas por los PASOS 1 y 3.
 * docs/PLANIFICADOR-BLUEPRINT.md ("Intereses -> tags" y regla de no-saturar).
 *
 * Todo determinista: el cruce encuesta↔dataset es una TABLA, no IA.
 */
import type { IdealFor, PlannerPlace, PlannerZone, BaseZone } from "../types.ts";
import type { Survey, Interest } from "../survey.ts";

/** Cada interés de la encuesta apunta a uno o varios `idealFor` del dataset. */
const INTEREST_TO_IDEALFOR: Record<Interest, IdealFor[]> = {
  calas: ["naturaleza", "familias"],
  gastronomia: ["gastronomia"],
  cultura: ["cultura"],
  naturaleza: ["naturaleza"],
  "vida-nocturna": ["vida-nocturna"],
  nautica: ["nautica"],
  "lujo-tranquilo": ["lujo-tranquilo"],
};

/** Perfiles `idealFor` que busca esta encuesta (intereses + niños). */
export function targetIdealFor(s: Survey): Set<IdealFor> {
  const out = new Set<IdealFor>();
  for (const i of s.interests) for (const t of INTEREST_TO_IDEALFOR[i]) out.add(t);
  if (s.kids.has) {
    out.add("familias");
    if (s.kids.ages?.includes("0-3") || s.kids.ages?.includes("4-8")) out.add("ninos-pequenos");
  }
  if (s.budget === "alto") out.add("lujo-tranquilo");
  return out;
}

/**
 * Afinidad de un lugar con la encuesta (mayor = más relevante). Ranking, no filtro.
 * Suma solapes de `idealFor` + bonus por niños + bonus por certeza alta.
 */
export function affinity(place: PlannerPlace, s: Survey): number {
  const target = targetIdealFor(s);
  let score = 0;
  for (const tag of place.idealFor) if (target.has(tag)) score += 1;
  if (s.kids.has && place.idealFor.includes("familias")) score += 1;
  if (place.dataCertainty === "alta") score += 0.5;
  return score;
}

// ── Proximidad coarse a lo largo del eje Me-1 (espina de pez) ────────────────
// Posición de cada zona en el eje Maó(este)↔Ciutadella(oeste). El norte y el sur
// cuelgan como ramales; los aproximamos a su altura en el eje. Sirve para ESTIMAR
// tiempos de coche cuando no hay un par exacto en src/data/travelTimes.ts.
const ZONE_AXIS: Record<PlannerZone, number> = {
  oeste: 0,
  "sur-oeste": 1,
  "eje-me1": 2,
  centro: 2,
  "sur-centro": 2.5,
  norte: 3,
  "sur-este": 4,
  este: 4.5,
};

/** Lado (zona) en que cae cada base. */
export const BASE_SIDE: Record<BaseZone, PlannerZone> = {
  ciutadella: "oeste",
  mao: "este",
  "cala-galdana": "sur-centro",
  "son-bou": "sur-centro",
  "es-mercadal": "centro",
  fornells: "norte",
};

/** Estimación de minutos en coche entre el lado de la base y una zona. */
export function estimateTravelMin(base: BaseZone, zone: PlannerZone): number {
  const diff = Math.abs(ZONE_AXIS[BASE_SIDE[base]] - ZONE_AXIS[zone]);
  return Math.min(55, Math.round(12 + diff * 12)); // 12 min (misma zona) … 55 (cruce isla)
}

/** ¿La zona es "del día" desde la base (sin cruzar media isla)? */
export function isSameSide(base: BaseZone, zone: PlannerZone): boolean {
  return estimateTravelMin(base, zone) <= 30;
}
