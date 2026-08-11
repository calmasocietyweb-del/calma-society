/**
 * PASOS 7 y 8 del motor — día de LLEGADA y día de SALIDA (HUECO 2 del blueprint).
 * No generan lugares nuevos: producen un día ligero y cercano a la base (llegada)
 * o un día con margen al vuelo/puerto (salida), sin calas de caminata.
 *
 * Las horas de vuelo son opcionales: si no se dan, se asume un plan de mediodía.
 */
import type { PlannerPlace, BaseZone, IntradayBlock, Notice, BaseFood, Swap } from "../types.ts";
import type { Survey } from "../survey.ts";
import { BASE_SIDE, affinity } from "./interests.ts";
import { pickRotating } from "./seed.ts";
import { S, type Lang } from "../strings.ts";

export interface DayResult {
  blocks: IntradayBlock[];
  budgetHours: number;
  notices: Notice[];
  alsoNearby?: Swap[];
}

/** Opciones comunes de los días de llegada y salida. */
export interface EdgeDayInput {
  dataset: PlannerPlace[];
  seed?: number;
  used?: ReadonlySet<string>;
}

/** Tipos que valen para un paseo corto: se ven en una hora y están en el pueblo. */
const SHORT_STROLL = new Set<PlannerPlace["plannerType"]>([
  "pueblo", "mirador", "faro", "interior-cultural", "atardecer",
]);
const SUNSET_TYPES = new Set<PlannerPlace["plannerType"]>(["atardecer", "mirador", "faro"]);

/**
 * Un lugar REAL del lado de la base. Los días de llegada y salida eran los dos
 * únicos del plan sin una sola parada con nombre ("paseo por el pueblo", "comer
 * cerca de la base"): en un viaje de 3 días eso dejaba 2 de 3 días en genérico
 * (auditoría 2026-08-11). Mismo criterio que el resto del motor: afinidad,
 * accesibilidad ya filtrada, rotación determinista y sin repetir.
 */
function nearBase(
  input: EdgeDayInput,
  s: Survey,
  base: BaseZone,
  pred: (p: PlannerPlace) => boolean,
  salt: number,
): PlannerPlace | undefined {
  const zone = BASE_SIDE[base];
  const cands = input.dataset
    .filter((p) => p.zone === zone && pred(p) && !(input.used?.has(p.id) ?? false))
    .sort((a, b) => affinity(b, s) - affinity(a, s) || a.name.localeCompare(b.name));
  if (cands.length === 0) return undefined;
  const best = affinity(cands[0], s);
  const near = cands.filter((p) => affinity(p, s) >= best - 1.25);
  return pickRotating(near, input.seed ?? 0, salt);
}

const toMin = (hhmm?: string): number | undefined => {
  if (!hhmm) return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
};
const toHHMM = (min: number): string => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Buffer logístico (min) entre aterrizaje/desembarque y "hora útil de inicio". */
function arrivalBuffer(s: Survey): number {
  if (s.transport === "coche-alquiler") return 70; // maletas + papeleo coche
  if (s.transport === "coche-propio-ferry") return 40; // desembarco del coche
  return s.base === "mao" ? 75 : 45; // sin coche: bus L10 (solo Maó) vs transfer
}

/** Avisos logísticos de llegada (reutilizables en viajes cortos sin día de llegada dedicado). */
export function arrivalNotices(s: Survey, base: BaseZone, lang: Lang = "es"): Notice[] {
  const t = S(lang).arrival;
  const flight = toMin(s.arrivalFlightTime);
  const usable = flight !== undefined ? flight + arrivalBuffer(s) : 13 * 60;
  void base;
  return [
    { kind: "logistica", text: t.usefulTime(toHHMM(usable)) },
    { kind: "logistica", text: t.stopForSupplies },
  ];
}

/** Avisos logísticos de salida (reutilizables en viajes cortos sin día de salida dedicado). */
export function departureNotices(s: Survey, base: BaseZone, lang: Lang = "es"): Notice[] {
  const t = S(lang).departure;
  const flight = toMin(s.departureFlightTime);
  const out: Notice[] = [];
  if (flight !== undefined) {
    let margin = 120;
    if (s.transport === "coche-alquiler") margin += 30;
    if (base === "ciutadella") margin += 45;
    out.push({ kind: "logistica", text: t.activityLimit(toHHMM(Math.max(flight - margin, 7 * 60))) });
  } else {
    out.push({ kind: "logistica", text: t.minimalPlan });
  }
  if (base === "ciutadella" && flight !== undefined && flight < 12 * 60) {
    out.push({ kind: "logistica", text: t.islandCrossing });
  }
  if (s.transport === "coche-alquiler") {
    out.push({ kind: "logistica", text: t.refuel });
  }
  return out;
}

/** PASO 7 — día de llegada: ligero y en el cluster de la base, nunca lejos. */
export function arrivalDay(
  s: Survey, base: BaseZone, dataset: PlannerPlace[], lang: Lang = "es",
  baseFood?: BaseFood, sunsetHint?: string, seed = 0, used?: ReadonlySet<string>,
): DayResult {
  const t = S(lang).arrival;
  const notices: Notice[] = [];
  const blocks: IntradayBlock[] = [];
  const flight = toMin(s.arrivalFlightTime);
  const usable = flight !== undefined ? flight + arrivalBuffer(s) : 13 * 60; // sin hora → mediodía
  const window = usable < 13 * 60 ? "manana" : usable < 17 * 60 ? "mediodia" : "tarde";
  const edge: EdgeDayInput = { dataset, seed, used };

  notices.push(...arrivalNotices(s, base, lang));
  notices.push({ kind: "logistica", text: t.lightFirstDay });

  // Cala fácil cercana a la base: nada de caminata el primer día, y con la
  // accesibilidad ya filtrada aguas arriba (PASO 5).
  const easyNearby = nearBase(edge, s, base,
    (p) => (p.plannerType === "cala" || p.plannerType === "playa") &&
      (p.effortLevel === "A1" || p.effortLevel === "A2") && p.carAccess !== "solo-bus-lanzadera",
    901);
  // Paseo con nombre por el casco de la base, en vez de "un paseo por el pueblo".
  const stroll = nearBase(edge, s, base, (p) => SHORT_STROLL.has(p.plannerType) && p.id !== easyNearby?.id, 902);
  // Mirador/faro real para la primera puesta de sol del viaje.
  const sunsetSpot = nearBase(edge, s, base,
    (p) => SUNSET_TYPES.has(p.plannerType) && p.id !== stroll?.id && p.id !== easyNearby?.id, 903);

  // Atardecer real del día si hay fechas (en verano el sol cae ~21:25, no a las 20:00).
  const sunsetAt = sunsetHint ? toHHMM(Math.max((toMin(sunsetHint) ?? 20 * 60) - 30, 18 * 60)) : "20:00";
  const why = (p: PlannerPlace, fallback: string) =>
    (p.highlights?.length ? p.highlights.join(" · ") : p.blurb) || fallback;

  blocks.push({ slot: "llegada", timeHint: toHHMM(Math.max(usable, 8 * 60)), placeName: t.settleIn, durationMin: 60, reason: t.settleInReason });
  if (window === "manana") {
    blocks.push(stroll
      ? { slot: "manana", timeHint: "12:00", placeId: stroll.id, placeName: stroll.name, durationMin: 60, reason: why(stroll, t.townStrollReason) }
      : { slot: "manana", timeHint: "12:00", placeName: t.townStroll, durationMin: 60, reason: baseFood?.arrivalPaseo || t.townStrollReason });
    blocks.push({ slot: "comida", timeHint: "14:00", placeName: t.lunchInBase, durationMin: 90, reason: t.lunchInBaseReason });
    if (easyNearby) blocks.push({ slot: "tarde", timeHint: "16:30", placeId: easyNearby.id, placeName: easyNearby.name, durationMin: 120, reason: t.easyNearbyReason });
  } else if (window === "mediodia") {
    blocks.push({ slot: "comida", timeHint: toHHMM(usable + 30), placeName: t.lunchNearBase, durationMin: 90, reason: t.lunchNearBaseReason });
    // Con la tarde por delante, cabe un paseo con nombre antes de la puesta.
    if (stroll) {
      blocks.push({ slot: "tarde", timeHint: toHHMM(usable + 150), placeId: stroll.id, placeName: stroll.name, durationMin: 75, reason: why(stroll, t.townStrollReason) });
    }
    blocks.push(sunsetSpot
      ? { slot: "atardecer", timeHint: sunsetAt, placeId: sunsetSpot.id, placeName: sunsetSpot.name, durationMin: 60, reason: why(sunsetSpot, t.sunsetNearBaseReason) }
      : { slot: "atardecer", timeHint: sunsetAt, placeName: t.sunsetNearBase, durationMin: 60, reason: baseFood?.arrivalPaseo || t.sunsetNearBaseReason });
  } else {
    notices.push({ kind: "logistica", text: t.lateArrival });
  }
  blocks.push({ slot: "cena", timeHint: "21:30", placeName: t.dinnerNearBase, durationMin: 90, reason: baseFood?.arrivalDinner || t.dinnerNearBaseReason });

  return { blocks, budgetHours: window === "manana" ? 5 : window === "mediodia" ? 4 : 2.5, notices };
}

/** PASO 8 — día de salida: margen al vuelo, cerca del aeropuerto; sin calas de caminata. */
export function departureDay(
  s: Survey, base: BaseZone, lang: Lang = "es", baseFood?: BaseFood,
  dataset: PlannerPlace[] = [], seed = 0, used?: ReadonlySet<string>,
): DayResult {
  const t = S(lang).departure;
  const notices: Notice[] = departureNotices(s, base, lang);
  const blocks: IntradayBlock[] = [];

  blocks.push({ slot: "desayuno", timeHint: "08:30", placeName: t.breakfastPacking, durationMin: 60, reason: baseFood?.departureCafe || t.breakfastPackingReason });

  // Último paseo: corto de verdad (≤90 min) y con nombre. El día de salida era
  // el otro día del plan sin una sola parada real.
  const last = nearBase({ dataset, seed, used }, s, base,
    (p) => SHORT_STROLL.has(p.plannerType) && (p.durationMin ?? 120) <= 90 &&
      (p.effortLevel === "A1" || p.effortLevel === "A2" || p.effortLevel === "B"),
    904);
  blocks.push(last
    ? { slot: "manana", timeHint: "10:00", placeId: last.id, placeName: last.name, durationMin: Math.min(last.durationMin ?? 60, 90), reason: (last.highlights?.length ? last.highlights.join(" · ") : last.blurb) || t.shortStrollReason }
    : { slot: "manana", timeHint: "10:00", placeName: t.shortStroll, durationMin: 60, reason: baseFood?.departurePaseo || t.shortStrollReason });

  return { blocks, budgetHours: 2.5, notices };
}
