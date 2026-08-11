/**
 * Matching de intereses y proximidad — utilidades compartidas por los PASOS 1 y 3.
 * docs/PLANIFICADOR-BLUEPRINT.md ("Intereses -> tags" y regla de no-saturar).
 *
 * Todo determinista: el cruce encuesta↔dataset es una TABLA, no IA.
 */
import type { IdealFor, PlannerPlace, PlannerType, PlannerZone, BaseZone } from "../types.ts";
import type { Survey, Interest } from "../survey.ts";
import { isCarless } from "../survey.ts";

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

/**
 * Cada interés apunta además a TIPOS de lugar: el "qué" literal que pide el
 * viajero. Sin esto, pedir "calas" podía dar un plan sin una sola cala (una
 * visita apícola etiquetada `naturaleza` puntuaba igual que Macarella).
 */
const INTEREST_TO_TYPES: Record<Interest, PlannerType[]> = {
  calas: ["cala", "playa"],
  gastronomia: ["comida", "cena", "desayuno"],
  cultura: ["yacimiento", "interior-cultural"],
  naturaleza: ["excursion", "mirador", "faro"],
  "vida-nocturna": ["atardecer"],
  nautica: ["actividad-acuatica"],
  "lujo-tranquilo": [], // es un "cómo", no un tipo: lo cubre `idealFor`
};

/** Tipos de lugar que pide literalmente esta encuesta. */
export function targetTypes(s: Survey): Set<PlannerType> {
  const out = new Set<PlannerType>();
  for (const i of s.interests) for (const t of INTEREST_TO_TYPES[i]) out.add(t);
  return out;
}

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
 * Manda el TIPO pedido (pides calas → las calas dominan el ranking); después,
 * solapes de `idealFor` + bonus por niños + bonus por certeza alta. Sin coche,
 * lo alcanzable en bus/lanzadera sube y lo solo-coche baja (no se bloquea:
 * el aviso/transfer lo resuelve el motor, pero no debe ser el plan por defecto).
 */
export function affinity(place: PlannerPlace, s: Survey): number {
  const target = targetIdealFor(s);
  let score = 0;
  if (targetTypes(s).has(place.plannerType)) score += 2.5;
  for (const tag of place.idealFor) if (target.has(tag)) score += 1;
  if (s.kids.has && place.idealFor.includes("familias")) score += 1;
  if (place.dataCertainty === "alta") score += 0.5;
  if (isCarless(s)) {
    const reachable =
      place.busServed || place.carAccess === "sin-coche-ok" || place.carAccessClosedSummer;
    score += reachable ? 0.5 : -1.5;
  }
  return score;
}

// ── Minutos de coche de cada base a cada zona (espina de pez) ────────────────
// Anclado en los pares VERIFICADOS de `src/data/travelTimes.ts` (Maó–Ciutadella
// 45, Maó–Fornells 20, Ciutadella–Galdana 27, Es Mercadal–Fornells 12, Ferreries
// –Galdana 15…) y completado por interpolación sobre esos anclajes.
//
// Antes esto era un eje de una sola dimensión con las zonas colocadas por
// posición Maó↔Ciutadella. El modelo trataba los RAMALES como si estuvieran en
// la carretera principal: Fornells y Cala Galdana, que son fondos de saco a los
// que se baja desde la Me-1, salían "centrales" y por tanto cerca de todo. Con
// eso, el motor recomendaba Fornells a quien pedía gastronomía —cuando los
// mercados y las mesas están en Maó, a 20 min— y las seis bases quedaban dentro
// del 1% unas de otras, así que la recomendación no discriminaba nada
// (auditoría 2026-08-11).
const TRAVEL: Record<BaseZone, Record<PlannerZone, number>> = {
  //              oeste sur-oeste sur-centro sur-este este norte centro eje-me1
  ciutadella:   { oeste: 10, "sur-oeste": 20, "sur-centro": 27, "sur-este": 48, este: 45, norte: 33, centro: 22, "eje-me1": 22 },
  mao:          { oeste: 45, "sur-oeste": 50, "sur-centro": 30, "sur-este": 15, este: 10, norte: 25, centro: 25, "eje-me1": 25 },
  "cala-galdana": { oeste: 27, "sur-oeste": 25, "sur-centro": 10, "sur-este": 40, este: 34, norte: 30, centro: 15, "eje-me1": 15 },
  "son-bou":    { oeste: 35, "sur-oeste": 40, "sur-centro": 12, "sur-este": 30, este: 27, norte: 30, centro: 15, "eje-me1": 15 },
  "es-mercadal": { oeste: 22, "sur-oeste": 30, "sur-centro": 20, "sur-este": 32, este: 25, norte: 12, centro: 8, "eje-me1": 8 },
  fornells:     { oeste: 33, "sur-oeste": 45, "sur-centro": 32, "sur-este": 35, este: 20, norte: 12, centro: 12, "eje-me1": 12 },
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

/** Minutos en coche (solo ida) de la base a una zona. */
export function estimateTravelMin(base: BaseZone, zone: PlannerZone): number {
  return TRAVEL[base][zone];
}

/** ¿La zona es "del día" desde la base (sin cruzar media isla)? */
export function isSameSide(base: BaseZone, zone: PlannerZone): boolean {
  return estimateTravelMin(base, zone) <= 30;
}
