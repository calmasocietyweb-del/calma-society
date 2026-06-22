/**
 * Motor del Planificador — función PURA (Survey, dataset) → Plan.
 * docs/PLANIFICADOR-BLUEPRINT.md (PASO 9: ensamblaje).
 *
 * Orquesta los pasos ya implementados: PASO 0 (base) · PASO 1 (esqueleto de
 * días) · PASO 3 (secuencia intradía + no-saturar) · PASOS 7/8 (llegada/salida).
 * Cada decisión deja un `reason`/`notice` trazable (E-E-A-T + GEO) y, donde
 * encaja sin romper el lujo tranquilo, un enganche a Menorca Bus (monetización).
 *
 * Pendiente de capas posteriores: PASO 2 (agenda), 4 (viento), 5 (accesibilidad
 * como filtro), 6 (plan-B mal tiempo). Se acoplan sin cambiar esta interfaz.
 */
import type { Plan, DayCard, PlannerPlace, IntradayBlock, Notice, MenorcaBusHook } from "./types.ts";
import type { Survey, Interest } from "./survey.ts";
import { normalizeSurvey, isCarless } from "./survey.ts";
import { recommendBase } from "./rules/base.ts";
import { buildDaySkeleton, rankClusters } from "./rules/days.ts";
import { sequenceDay } from "./rules/intraday.ts";
import { arrivalDay, departureDay, arrivalNotices, departureNotices } from "./rules/arrival-departure.ts";
import { filterAccessible, effectivePace, allowedEfforts } from "./rules/accessibility.ts";
import { windAdvice } from "./rules/wind.ts";
import { buildPlanB, weekdayForDay } from "./rules/planb.ts";
import { addDaysISO, agendaForDay } from "./rules/agenda.ts";
import type { PlannerEvent } from "./rules/agenda.ts";

interface DayResult {
  blocks: IntradayBlock[];
  budgetHours: number;
  notices: Notice[];
}

export function planTrip(
  rawSurvey: Partial<Survey>,
  dataset: PlannerPlace[],
  lang: "es" | "en" = "es",
  events: PlannerEvent[] = [],
): Plan {
  const survey = normalizeSurvey(rawSurvey);
  // PASO 5: filtra el dataset por accesibilidad ANTES de componer (afecta a todos los pasos).
  const usable = filterAccessible(dataset, survey.accessibility);
  const pace = effectivePace(survey);
  const { base, baseReason, splitBase } = recommendBase(survey);
  const skeleton = buildDaySkeleton(survey, base, usable);
  const clusters = new Map(rankClusters(survey, base, usable).map((c) => [c.cluster, c]));
  const byId = new Map(usable.map((p) => [p.id, p]));

  const days: DayCard[] = [];
  const menorcaBusHooks: MenorcaBusHook[] = [];
  const globalFiestas = new Map<string, Notice>(); // fiestas en otra zona, sin duplicar

  for (const sk of skeleton) {
    let result: DayResult;
    let dayPlanB: DayCard["planB"];

    if (sk.dayTypeKey === "dia-llegada") {
      result = arrivalDay(survey, base, usable);
      if (isCarless(survey) || base !== "mao") {
        menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer aeropuerto → ${base}`, dayIndex: sk.dayIndex });
      }
      // R7: accesibilidad + sin coche → transfer adaptado puerta a puerta a una playa A1.
      if (survey.accessibility !== "ninguna" && isCarless(survey)) {
        menorcaBusHooks.push({ type: "transfer-adaptado", context: `Transfer adaptado a una playa accesible desde ${base}`, dayIndex: sk.dayIndex });
      }
    } else if (sk.dayTypeKey === "dia-salida") {
      result = departureDay(survey, base);
      if (isCarless(survey)) {
        menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer ${base} → aeropuerto`, dayIndex: sk.dayIndex });
      }
    } else if (sk.cluster && clusters.has(sk.cluster)) {
      const info = clusters.get(sk.cluster)!;
      result = sequenceDay({
        base, cluster: sk.cluster, zone: info.zone, places: info.places,
        travelFromBaseMin: info.travelFromBaseMin, pace, survey,
      });
      // PASO 4: aviso de viento (FLEXIBLE) con alternativa resguardada en costa opuesta.
      const anchors = result.blocks
        .map((b) => (b.placeId ? byId.get(b.placeId) : undefined))
        .filter((p): p is PlannerPlace => !!p);
      result.notices.push(...windAdvice(info.zone, anchors, usable, survey));
      // PASO 6: plan-B de mal tiempo (interiores de la zona, filtrado por día de la semana).
      dayPlanB = buildPlanB(info.zone, usable, weekdayForDay(survey.arrivalDate, sk.dayIndex));
      // Monetización: sin coche + cala no conectada → excursión/transfer (no es un fallo, es la solución premium).
      if (isCarless(survey) && info.places.some((p) => p.carAccessClosedSummer || (p.plannerType === "cala" && !p.busServed))) {
        menorcaBusHooks.push({ type: "excursion-cala", context: `Excursión o transfer a ${sk.cluster}`, dayIndex: sk.dayIndex });
      }
    } else {
      result = {
        blocks: [{ slot: "manana", placeName: "Día libre: repite tu cala favorita o descansa", reason: "Margen para reordenar por viento o por cansancio." }],
        budgetHours: 3,
        notices: [],
      };
    }

    // Viajes cortos (1-2 días): no hay día de llegada/salida dedicado, así que los
    // avisos logísticos y los enganches de transfer van al primer/último día SEA CUAL
    // SEA su tipo (también si cayó en colchón). PASOS 7/8 condensados.
    if (survey.days <= 2 && sk.dayTypeKey !== "dia-llegada" && sk.dayTypeKey !== "dia-salida") {
      if (sk.dayIndex === 0) {
        result.notices.unshift(...arrivalNotices(survey, base));
        if (isCarless(survey) || base !== "mao") {
          menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer aeropuerto → ${base}`, dayIndex: sk.dayIndex });
        }
      }
      if (sk.dayIndex === skeleton.length - 1) {
        result.notices.push(...departureNotices(survey, base));
        if (isCarless(survey)) {
          menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer ${base} → aeropuerto`, dayIndex: sk.dayIndex });
        }
      }
    }

    // PASO 2: cruce con la agenda de fiestas por fecha (si hay fechas y eventos).
    if (survey.arrivalDate && events.length) {
      const date = addDaysISO(survey.arrivalDate, sk.dayIndex);
      const { dayNotices, otherZone } = agendaForDay(sk.zone, date, events);
      result.notices.push(...dayNotices);
      for (const o of otherZone) if (!globalFiestas.has(o.key)) globalFiestas.set(o.key, o.notice);
    }

    days.push({
      dayIndex: sk.dayIndex,
      dayTypeKey: sk.dayTypeKey,
      label: sk.label[lang],
      zone: sk.zone,
      cluster: sk.cluster,
      blocks: result.blocks,
      notices: result.notices,
      budgetHours: result.budgetHours,
      planB: dayPlanB,
    });
  }

  const globalNotices = [...buildGlobalNotices(survey, base, splitBase), ...globalFiestas.values()];
  return { base, baseReason, splitBase, days, globalNotices, menorcaBusHooks };
}

function buildGlobalNotices(survey: Survey, base: string, splitBase?: string): Notice[] {
  const out: Notice[] = [];
  if (survey.transport === "coche-alquiler") {
    out.push({ kind: "reserva", text: "Reserva el coche de alquiler con antelación: en verano la flota se agota y los precios se disparan." });
  }
  if (splitBase) {
    out.push({ kind: "logistica", text: `Con ${survey.days} días e intereses en costas opuestas, valora dividir la estancia: mitad en ${base}, mitad en ${splitBase}.` });
  }
  if (isCarless(survey)) {
    out.push({ kind: "logistica", text: "Sin coche: algunas calas top requieren bus + transfer o una excursión en barco. Lo marcamos en cada día." });
  }
  if (survey.accessibility !== "ninguna") {
    out.push({ kind: "accesibilidad", text: `Plan filtrado por esfuerzo (${survey.accessibility}): solo lugares de nivel ${allowedEfforts(survey.accessibility).join("/")}. Las playas con baño asistido son A1 (Son Bou, Punta Prima, Es Grau).` });
    out.push({ kind: "accesibilidad", text: "Los servicios de baño asistido (silla anfibia, personal) operan del 1 de mayo al 31 de octubre. Fuera de esas fechas, confirma con el ayuntamiento." });
  }
  return out;
}

// Re-export para los consumidores (UI, tests).
export { normalizeSurvey };
export type { Survey, Interest, Plan };
