/**
 * PASOS 7 y 8 del motor — día de LLEGADA y día de SALIDA (HUECO 2 del blueprint).
 * No generan lugares nuevos: producen un día ligero y cercano a la base (llegada)
 * o un día con margen al vuelo/puerto (salida), sin calas de caminata.
 *
 * Las horas de vuelo son opcionales: si no se dan, se asume un plan de mediodía.
 */
import type { PlannerPlace, BaseZone, IntradayBlock, Notice, BaseFood } from "../types.ts";
import type { Survey } from "../survey.ts";
import { BASE_SIDE } from "./interests.ts";
import { S, type Lang } from "../strings.ts";

export interface DayResult {
  blocks: IntradayBlock[];
  budgetHours: number;
  notices: Notice[];
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
export function arrivalDay(s: Survey, base: BaseZone, dataset: PlannerPlace[], lang: Lang = "es", baseFood?: BaseFood): DayResult {
  const t = S(lang).arrival;
  const notices: Notice[] = [];
  const blocks: IntradayBlock[] = [];
  const flight = toMin(s.arrivalFlightTime);
  const usable = flight !== undefined ? flight + arrivalBuffer(s) : 13 * 60; // sin hora → mediodía
  const window = usable < 13 * 60 ? "manana" : usable < 17 * 60 ? "mediodia" : "tarde";

  notices.push(...arrivalNotices(s, base, lang));
  notices.push({ kind: "logistica", text: t.lightFirstDay });

  // Cala fácil cercana a la base (solo si llega por la mañana y la hay en el dataset).
  const easyNearby = dataset.find(
    (p) => p.zone === BASE_SIDE[base] && (p.plannerType === "cala" || p.plannerType === "playa") &&
      (p.effortLevel === "A1" || p.effortLevel === "A2") && p.carAccess !== "solo-bus-lanzadera",
  );

  blocks.push({ slot: "desayuno", timeHint: toHHMM(Math.max(usable, 8 * 60)), placeName: t.settleIn, durationMin: 60, reason: t.settleInReason });
  if (window === "manana") {
    blocks.push({ slot: "manana", timeHint: "12:00", placeName: t.townStroll, durationMin: 60, reason: baseFood?.arrivalPaseo || t.townStrollReason });
    blocks.push({ slot: "comida", timeHint: "14:00", placeName: t.lunchInBase, durationMin: 90, reason: t.lunchInBaseReason });
    if (easyNearby) blocks.push({ slot: "tarde", timeHint: "16:30", placeId: easyNearby.id, placeName: easyNearby.name, durationMin: 120, reason: t.easyNearbyReason });
  } else if (window === "mediodia") {
    blocks.push({ slot: "comida", timeHint: toHHMM(usable + 30), placeName: t.lunchNearBase, durationMin: 90, reason: t.lunchNearBaseReason });
    blocks.push({ slot: "atardecer", timeHint: "20:00", placeName: t.sunsetNearBase, durationMin: 60, reason: baseFood?.arrivalPaseo || t.sunsetNearBaseReason });
  } else {
    notices.push({ kind: "logistica", text: t.lateArrival });
  }
  blocks.push({ slot: "cena", timeHint: "21:30", placeName: t.dinnerNearBase, durationMin: 90, reason: baseFood?.arrivalDinner || t.dinnerNearBaseReason });

  return { blocks, budgetHours: window === "manana" ? 5 : window === "mediodia" ? 4 : 2.5, notices };
}

/** PASO 8 — día de salida: margen al vuelo, cerca del aeropuerto; sin calas de caminata. */
export function departureDay(s: Survey, base: BaseZone, lang: Lang = "es", baseFood?: BaseFood): DayResult {
  const t = S(lang).departure;
  const notices: Notice[] = departureNotices(s, base, lang);
  const blocks: IntradayBlock[] = [];

  blocks.push({ slot: "desayuno", timeHint: "08:30", placeName: t.breakfastPacking, durationMin: 60, reason: baseFood?.departureCafe || t.breakfastPackingReason });
  blocks.push({ slot: "manana", timeHint: "10:00", placeName: t.shortStroll, durationMin: 60, reason: baseFood?.departurePaseo || t.shortStrollReason });

  return { blocks, budgetHours: 2.5, notices };
}
