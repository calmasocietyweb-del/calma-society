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
import type { Plan, DayCard, PlannerPlace, PlannerZone, IntradayBlock, Notice, MenorcaBusHook, FoodByZone } from "./types.ts";
import type { Survey, Interest } from "./survey.ts";
import { normalizeSurvey, isCarless } from "./survey.ts";
import { recommendBase } from "./rules/base.ts";
import { buildDaySkeleton, rankClusters } from "./rules/days.ts";
import { BASE_SIDE } from "./rules/interests.ts";
import { sequenceDay } from "./rules/intraday.ts";
import { arrivalDay, departureDay, arrivalNotices, departureNotices } from "./rules/arrival-departure.ts";
import { filterAccessible, effectivePace, allowedEfforts } from "./rules/accessibility.ts";
import { windAdvice } from "./rules/wind.ts";
import { buildPlanB, weekdayForDay } from "./rules/planb.ts";
import { addDaysISO, agendaForDay } from "./rules/agenda.ts";
import type { PlannerEvent } from "./rules/agenda.ts";
import { S } from "./strings.ts";

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
  foodByZone?: FoodByZone,
): Plan {
  const survey = normalizeSurvey(rawSurvey);
  // PASO 5: filtra el dataset por accesibilidad ANTES de componer (afecta a todos los pasos).
  const usable = filterAccessible(dataset, survey.accessibility);
  const pace = effectivePace(survey);
  const { base, baseReason, splitBase } = recommendBase(survey, lang);
  const skeleton = buildDaySkeleton(survey, base, usable);
  const clusters = new Map(rankClusters(survey, base, usable).map((c) => [c.cluster, c]));
  const byId = new Map(usable.map((p) => [p.id, p]));
  // Guía de comida verificada de la zona BASE (desayuno) y anclas de base (llegada/salida).
  const baseFood = foodByZone?.zones[BASE_SIDE[base]];

  const days: DayCard[] = [];
  const menorcaBusHooks: MenorcaBusHook[] = [];
  const globalFiestas = new Map<string, Notice>(); // fiestas en otra zona, sin duplicar

  for (const sk of skeleton) {
    let result: DayResult;
    let dayPlanB: DayCard["planB"];

    if (sk.dayTypeKey === "dia-llegada") {
      result = arrivalDay(survey, base, usable, lang, foodByZone?.bases[base]);
      if (isCarless(survey) || base !== "mao") {
        menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer aeropuerto → ${base}`, dayIndex: sk.dayIndex });
      }
      // R7: accesibilidad + sin coche → transfer adaptado puerta a puerta a una playa A1.
      if (survey.accessibility !== "ninguna" && isCarless(survey)) {
        menorcaBusHooks.push({ type: "transfer-adaptado", context: `Transfer adaptado a una playa accesible desde ${base}`, dayIndex: sk.dayIndex });
      }
    } else if (sk.dayTypeKey === "dia-salida") {
      result = departureDay(survey, base, lang, foodByZone?.bases[base]);
      if (isCarless(survey)) {
        menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer ${base} → aeropuerto`, dayIndex: sk.dayIndex });
      }
    } else if (sk.cluster && clusters.has(sk.cluster)) {
      const info = clusters.get(sk.cluster)!;
      result = sequenceDay({
        base, cluster: sk.cluster, zone: info.zone, places: info.places,
        travelFromBaseMin: info.travelFromBaseMin, pace, survey, lang,
        zoneFood: foodByZone?.zones[info.zone], baseFood,
        baseBreakfasts: foodByZone?.bases[base]?.breakfasts, dayIndex: sk.dayIndex,
      });
      // PASO 4: aviso de viento (FLEXIBLE) con alternativa resguardada en costa opuesta.
      const anchors = result.blocks
        .map((b) => (b.placeId ? byId.get(b.placeId) : undefined))
        .filter((p): p is PlannerPlace => !!p);
      result.notices.push(...windAdvice(info.zone, anchors, usable, survey, lang));
      // PASO 6: plan-B de mal tiempo (interiores de la zona, filtrado por día de la semana).
      dayPlanB = buildPlanB(info.zone, usable, weekdayForDay(survey.arrivalDate, sk.dayIndex), lang);
      // Monetización + sin coche: ofrece el transfer de Menorca Bus para LLEGAR a
      // la cala/zona del día (la solución premium, no un fallo). Chip visible por
      // día + enganche, nombrando el lugar de la mañana para que sea concreto.
      if (isCarless(survey) && info.places.some((p) => p.carAccessClosedSummer || ((p.plannerType === "cala" || p.plannerType === "playa") && !p.busServed))) {
        const target = result.blocks.find((b) => b.slot === "manana")?.placeName || sk.cluster;
        result.notices.push({ kind: "transfer", text: S(lang).engine.busTransferDay(target) });
        menorcaBusHooks.push({ type: "excursion-cala", context: `Transfer a ${target}`, dayIndex: sk.dayIndex });
      }
    } else {
      const e = S(lang).engine;
      result = {
        blocks: [{ slot: "manana", placeName: e.freeDay, reason: e.freeDayReason }],
        budgetHours: 3,
        notices: [],
      };
    }

    // Viajes cortos (1-2 días): no hay día de llegada/salida dedicado, así que los
    // avisos logísticos y los enganches de transfer van al primer/último día SEA CUAL
    // SEA su tipo (también si cayó en colchón). PASOS 7/8 condensados.
    if (survey.days <= 2 && sk.dayTypeKey !== "dia-llegada" && sk.dayTypeKey !== "dia-salida") {
      if (sk.dayIndex === 0) {
        result.notices.unshift(...arrivalNotices(survey, base, lang));
        if (isCarless(survey) || base !== "mao") {
          menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer aeropuerto → ${base}`, dayIndex: sk.dayIndex });
        }
      }
      if (sk.dayIndex === skeleton.length - 1) {
        result.notices.push(...departureNotices(survey, base, lang));
        if (isCarless(survey)) {
          menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer ${base} → aeropuerto`, dayIndex: sk.dayIndex });
        }
      }
    }

    // PASO 2: cruce con la agenda de fiestas por fecha (si hay fechas y eventos).
    if (survey.arrivalDate && events.length) {
      const date = addDaysISO(survey.arrivalDate, sk.dayIndex);
      const { dayNotices, otherZone } = agendaForDay(sk.zone, date, events, lang);
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

  // Experiencia firma: 1 momento memorable extraído de la guía de la zona base o
  // de la más afín al perfil (lujo → lujo-tranquilo; si no, gastronomía; si no, base).
  let signature: Plan["signature"];
  if (foodByZone) {
    const baseZone = BASE_SIDE[base];
    const visited: PlannerZone[] = [
      baseZone,
      ...skeleton
        .map((sk) => sk.zone)
        .filter((z): z is PlannerZone => z !== "base" && z !== "cercano-aeropuerto"),
    ];
    const cands = [...new Set(visited)]
      .map((z) => foodByZone.zones[z]?.signature)
      .filter((s): s is NonNullable<typeof s> => !!s);
    const wantLux = survey.budget === "alto" || survey.interests.includes("lujo-tranquilo");
    const wantGastro = survey.interests.includes("gastronomia");
    const pick =
      (wantLux ? cands.find((c) => c.idealFor.includes("lujo-tranquilo")) : undefined) ||
      (wantGastro ? cands.find((c) => c.idealFor.includes("gastronomia")) : undefined) ||
      foodByZone.zones[baseZone]?.signature ||
      cands[0];
    if (pick) signature = { title: pick.title, desc: pick.desc };
  }

  const globalNotices = [...buildGlobalNotices(survey, base, lang, splitBase), ...globalFiestas.values()];
  return { base, baseReason, splitBase, days, globalNotices, menorcaBusHooks, signature };
}

function buildGlobalNotices(survey: Survey, base: string, lang: "es" | "en", splitBase?: string): Notice[] {
  const t = S(lang).engine;
  const out: Notice[] = [];
  if (survey.transport === "coche-alquiler") {
    out.push({ kind: "reserva", text: t.rentalCar });
  }
  if (splitBase) {
    out.push({ kind: "logistica", text: t.splitBase(survey.days, base, splitBase) });
  }
  if (isCarless(survey)) {
    out.push({ kind: "logistica", text: t.carless });
  }
  if (survey.accessibility !== "ninguna") {
    out.push({ kind: "accesibilidad", text: t.accessibilityFilter(survey.accessibility, allowedEfforts(survey.accessibility).join("/")) });
    out.push({ kind: "accesibilidad", text: t.accessibilityWindow });
  }
  return out;
}

// Re-export para los consumidores (UI, tests).
export { normalizeSurvey };
export type { Survey, Interest, Plan };
