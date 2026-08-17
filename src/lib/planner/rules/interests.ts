/**
 * Matching de intereses y proximidad — utilidades compartidas por los PASOS 1 y 3.
 * docs/PLANIFICADOR-BLUEPRINT.md ("Intereses -> tags" y regla de no-saturar).
 *
 * Todo determinista: el cruce encuesta↔dataset es una TABLA, no IA.
 */
import type { IdealFor, PlannerPlace, PlannerType, PlannerZone, BaseZone, CostBand } from "../types.ts";
import type { Survey, Interest, Budget } from "../survey.ts";
import { isCarless } from "../survey.ts";

/**
 * Cuánto pesa el coste según el presupuesto declarado. Antes, la pregunta del
 * presupuesto solo servía para añadir la etiqueta "lujo-tranquilo" cuando era
 * alto: elegir "ajustado" o "alto" apenas cambiaba el plan (auditoría 2026-08-11).
 *
 * Con presupuesto ajustado NO se empobrece el viaje: lo mejor de Menorca —las
 * calas, los miradores, el Camí de Cavalls— es de acceso libre, así que subir lo
 * gratis sube justo lo que la isla tiene de mejor. Y con presupuesto alto sí se
 * pide lo contrario: que el plan se atreva con lo que hay que reservar y pagar.
 */
const COST_WEIGHT: Record<Budget, Record<CostBand, number>> = {
  ajustado: { gratis: 1.5, "€": 0.5, "€€": -0.75, "€€€": -2.25 },
  medio: { gratis: 0.4, "€": 0.25, "€€": 0, "€€€": -0.75 },
  alto: { gratis: 0, "€": 0.1, "€€": 0.9, "€€€": 1.6 },
};

/** Las bandas de coste, de menos a más. */
const BAND_ORDER: readonly CostBand[] = ["gratis", "€", "€€", "€€€"];

/**
 * Banda máxima que el plan se permite NOMBRAR según el presupuesto declarado.
 *
 * El peso de arriba ORDENA, y ordenar no sirve cuando toda la lista de un hueco
 * está fuera de precio: hay zonas donde lo único que el dataset tiene de comer
 * es de banda alta (en el norte, Es Cranc y Sa Llagosta, las dos €€€), así que
 * quien marcaba "ajustado" recibía Es Cranc por ser el mejor de los caros
 * (medido con la sonda el 17-ago-2026). El techo corta eso: si no hay nada
 * asequible, el plan NO nombra la parada y deja el texto genérico de la zona.
 *
 * No toca lo gratis, que es donde está lo mejor de la isla: nadie pierde una
 * cala, un mirador ni un tramo de Camí de Cavalls por marcar presupuesto
 * ajustado. Solo deja de recibir la mesa y el barco que no puede pagar.
 */
const COST_CEILING: Record<Budget, CostBand> = { ajustado: "€€", medio: "€€€", alto: "€€€" };

/** ¿Cabe esta parada en el presupuesto declarado? Sin banda → sí (no consta gasto). */
export const affordable = (place: PlannerPlace, s: Survey): boolean =>
  !place.costBand ||
  BAND_ORDER.indexOf(place.costBand) <= BAND_ORDER.indexOf(COST_CEILING[s.budget]);

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
  // Coste: el presupuesto declarado inclina la balanza, no filtra. Nadie se queda
  // sin ver Macarella por marcar "ajustado", pero el plan deja de proponerle un
  // spa; y quien marca "alto" deja de recibir el mismo plan que todo el mundo.
  if (place.costBand) score += COST_WEIGHT[s.budget][place.costBand];
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
