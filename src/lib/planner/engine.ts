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
import { arrivalDay, departureDay } from "./rules/arrival-departure.ts";

interface DayResult {
  blocks: IntradayBlock[];
  budgetHours: number;
  notices: Notice[];
}

export function planTrip(
  rawSurvey: Partial<Survey>,
  dataset: PlannerPlace[],
  lang: "es" | "en" = "es",
): Plan {
  const survey = normalizeSurvey(rawSurvey);
  const { base, baseReason, splitBase } = recommendBase(survey);
  const skeleton = buildDaySkeleton(survey, base, dataset);
  const clusters = new Map(rankClusters(survey, base, dataset).map((c) => [c.cluster, c]));

  const days: DayCard[] = [];
  const menorcaBusHooks: MenorcaBusHook[] = [];

  for (const sk of skeleton) {
    let result: DayResult;

    if (sk.dayTypeKey === "dia-llegada") {
      result = arrivalDay(survey, base, dataset);
      if (isCarless(survey) || base !== "mao") {
        menorcaBusHooks.push({ type: "transfer-aeropuerto", context: `Transfer aeropuerto → ${base}`, dayIndex: sk.dayIndex });
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
        travelFromBaseMin: info.travelFromBaseMin, pace: survey.pace, survey,
      });
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

    days.push({
      dayIndex: sk.dayIndex,
      dayTypeKey: sk.dayTypeKey,
      label: sk.label[lang],
      zone: sk.zone,
      cluster: sk.cluster,
      blocks: result.blocks,
      notices: result.notices,
      budgetHours: result.budgetHours,
    });
  }

  return { base, baseReason, splitBase, days, globalNotices: buildGlobalNotices(survey, base, splitBase), menorcaBusHooks };
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
    out.push({ kind: "accesibilidad", text: "Los servicios de baño asistido (silla anfibia, personal) operan del 1 de mayo al 31 de octubre. Fuera de esas fechas, confirma con el ayuntamiento." });
  }
  return out;
}

// Re-export para los consumidores (UI, tests).
export { normalizeSurvey };
export type { Survey, Interest, Plan };
