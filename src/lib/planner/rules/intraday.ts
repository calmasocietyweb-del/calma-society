/**
 * PASO 3 del motor — secuenciación intradía y regla de NO-SATURAR.
 * docs/PLANIFICADOR-BLUEPRINT.md.
 *
 * Secuencia: desayuno (base) → mañana (ancla del cluster) → comida → tarde
 * (2ª ancla opcional) → atardecer (mirador del mismo ramal) → cena (misma zona).
 * Presupuesto de horas útiles por ritmo; si se pasa, cae la parada de MENOR
 * afinidad (nunca la de la mañana) y se avisa. Función pura y trazable.
 */
import type { PlannerPlace, PlannerZone, BaseZone, IntradayBlock, Notice, ZoneFood } from "../types.ts";
import type { Survey, Pace } from "../survey.ts";
import { affinity } from "./interests.ts";
import { S, type Lang } from "../strings.ts";

const PACE: Record<Pace, { budget: number; maxAnchors: number }> = {
  relajado: { budget: 7, maxAnchors: 2 },
  equilibrado: { budget: 8.5, maxAnchors: 3 },
  intenso: { budget: 9.5, maxAnchors: 4 },
};

// Comidas (no cuentan como "paradas"): desayuno, comida, cena.
const MEALS_MIN = 45 + 90 + 90;
const PARKING_PER_ANCHOR = 20;
const INTRA_HOP_MIN = 15; // salto típico entre paradas del mismo cluster

const DAYTIME = new Set<PlannerPlace["plannerType"]>([
  "cala", "playa", "yacimiento", "actividad-acuatica", "excursion", "pueblo", "interior-cultural",
]);
const SUNSET = new Set<PlannerPlace["plannerType"]>(["atardecer", "mirador", "faro"]);

function durOf(p: PlannerPlace): number {
  if (p.durationMin) return p.durationMin;
  switch (p.plannerType) {
    case "cala":
    case "playa": return 180;
    case "atardecer":
    case "mirador":
    case "faro": return 90;
    case "yacimiento": return 45;
    default: return 120;
  }
}

const BASE_TOWN: Record<BaseZone, string> = {
  ciutadella: "Ciutadella", mao: "Maó", "cala-galdana": "Cala Galdana",
  "son-bou": "Son Bou", "es-mercadal": "Es Mercadal", fornells: "Fornells",
};

/** "Qué ver y hacer" de un lugar: highlights si los hay, si no la descripción corta. */
function whatToSee(p: PlannerPlace, lang: Lang): string {
  if (p.highlights && p.highlights.length) return S(lang).intraday.whatToSee(p.highlights.join(" · "));
  if (p.blurb) return p.blurb;
  return "";
}

export interface DayInput {
  base: BaseZone;
  cluster?: string;
  zone: PlannerZone | "base" | "cercano-aeropuerto";
  places: PlannerPlace[];
  travelFromBaseMin: number;
  pace: Pace;
  survey: Survey;
  /** Idioma del texto generado (default español para no romper llamadas existentes). */
  lang?: Lang;
  /** Guía de comida VERIFICADA de la zona del día (comida/cena). Opcional. */
  zoneFood?: ZoneFood;
  /** Guía de comida de la zona BASE (desayuno, que se hace en la base). Opcional. */
  baseFood?: ZoneFood;
}

export interface DayResult {
  blocks: IntradayBlock[];
  budgetHours: number;
  notices: Notice[];
}

/** Horas útiles que consume un conjunto de anclas (paradas) + comidas + coche. */
function budgetHoursOf(anchors: PlannerPlace[], travelFromBaseMin: number): number {
  const dur = anchors.reduce((s, p) => s + durOf(p), 0);
  const parking = PARKING_PER_ANCHOR * anchors.length;
  const intra = anchors.length > 1 ? INTRA_HOP_MIN * (anchors.length - 1) : 0;
  const travel = travelFromBaseMin * 2 + intra; // ida + vuelta a la base + saltos
  return Math.round(((MEALS_MIN + dur + parking + travel) / 60) * 10) / 10;
}

const TIME_HINT: Record<IntradayBlock["slot"], string> = {
  desayuno: "08:30", manana: "10:00", comida: "14:00", tarde: "16:30", atardecer: "19:30", cena: "21:00",
};

/** Secuencia un día pleno respetando el presupuesto de horas del ritmo. */
export function sequenceDay(input: DayInput): DayResult {
  const { places, travelFromBaseMin, pace, survey } = input;
  const lang = input.lang ?? "es";
  const t = S(lang).intraday;
  const cfg = PACE[pace];
  const notices: Notice[] = [];

  const ranked = [...places].sort(
    (a, b) => affinity(b, survey) - affinity(a, survey) || a.name.localeCompare(b.name),
  );
  const morning = ranked.find((p) => DAYTIME.has(p.plannerType));
  const sunset = ranked.find((p) => SUNSET.has(p.plannerType));
  const tarde = ranked.find((p) => DAYTIME.has(p.plannerType) && p !== morning);
  // Para anclar las comidas a sitios reales (no "cenar en la zona").
  const pueblo = ranked.find((p) => p.plannerType === "pueblo");
  const diner = ranked.find((p) => p.plannerType === "cena" || p.plannerType === "comida");

  // Orden de preferencia de las paradas OPCIONALES (la mañana es la esencial).
  const optional: Array<{ slot: IntradayBlock["slot"]; place: PlannerPlace }> = [];
  if (survey.boatSunset) {
    if (sunset) optional.push({ slot: "atardecer", place: sunset });
    if (tarde) optional.push({ slot: "tarde", place: tarde });
  } else {
    if (tarde) optional.push({ slot: "tarde", place: tarde });
    if (sunset) optional.push({ slot: "atardecer", place: sunset });
  }

  // Selección golosa: la mañana siempre; las opcionales mientras quepan en
  // presupuesto y no superen el máximo de paradas del ritmo.
  const chosen: Array<{ slot: IntradayBlock["slot"]; place: PlannerPlace }> = [];
  if (morning) chosen.push({ slot: "manana", place: morning });
  const dropped: Array<{ slot: IntradayBlock["slot"]; place: PlannerPlace }> = [];
  for (const opt of optional) {
    const trial = [...chosen.map((c) => c.place), opt.place];
    if (chosen.length < cfg.maxAnchors && budgetHoursOf(trial, travelFromBaseMin) <= cfg.budget + 0.25) {
      chosen.push(opt);
    } else {
      dropped.push(opt);
    }
  }

  const anchorPlaces = chosen.map((c) => c.place);
  const budgetHours = budgetHoursOf(anchorPlaces, travelFromBaseMin);

  // Construye la línea de tiempo en orden cronológico, con instrucciones concretas.
  const has = (slot: IntradayBlock["slot"]) => chosen.find((c) => c.slot === slot);
  const blocks: IntradayBlock[] = [];
  const anchorBlock = (slot: IntradayBlock["slot"]): IntradayBlock | undefined => {
    const c = has(slot);
    if (!c) return undefined;
    return {
      slot, timeHint: TIME_HINT[slot], placeId: c.place.id, placeName: c.place.name,
      durationMin: durOf(c.place),
      reason: whatToSee(c.place, lang) || t.anchorFallbackReason(c.place.name),
    };
  };
  const puebloIsAnchor = chosen.some((c) => c.place === pueblo);

  // DESAYUNO — en la base (guía verificada de la zona base si la hay).
  blocks.push({ slot: "desayuno", timeHint: TIME_HINT.desayuno, placeName: t.breakfast(BASE_TOWN[input.base]), durationMin: 45, reason: input.baseFood?.breakfast || t.breakfastReason });

  const m = anchorBlock("manana"); if (m) blocks.push(m);

  // COMIDA — anclada a un restaurante/mercado o al pueblo del día; la guía
  // verificada de la zona enriquece el "por qué" cuando no hay ficha real.
  if (diner) {
    blocks.push({ slot: "comida", timeHint: TIME_HINT.comida, placeId: diner.id, placeName: t.lunchAt(diner.name), durationMin: 90, reason: whatToSee(diner, lang) || input.zoneFood?.lunch || t.lunchAtReason });
  } else if (pueblo) {
    blocks.push({ slot: "comida", timeHint: TIME_HINT.comida, placeName: t.lunchInTown(pueblo.name), durationMin: 90, reason: input.zoneFood?.lunch || t.lunchInTownReason });
  } else {
    blocks.push({ slot: "comida", timeHint: TIME_HINT.comida, placeName: t.lunchLocal, durationMin: 90, reason: input.zoneFood?.lunch || t.lunchLocalReason });
  }

  const tardeBlock = anchorBlock("tarde"); if (tardeBlock) blocks.push(tardeBlock);
  const a = anchorBlock("atardecer"); if (a) blocks.push(a);

  // CENA — pasea por el pueblo y cena allí; si no hay pueblo, a un restaurante.
  // La cena es el hueco donde la guía de comida verificada (que nombra mesas
  // reales: caldereta, alta cocina…) aporta más, así que tiene prioridad.
  if (pueblo) {
    const reason = input.zoneFood?.dinner
      || (puebloIsAnchor
        ? t.dinnerStrollAnchorReason
        : (pueblo.highlights && pueblo.highlights.length)
          ? t.dinnerStrollHighlightsReason(pueblo.highlights.join(" · "))
          : t.dinnerStrollDefaultReason);
    blocks.push({ slot: "cena", timeHint: TIME_HINT.cena, placeId: pueblo.id, placeName: t.dinnerStroll(pueblo.name), durationMin: 90, reason });
  } else if (diner) {
    blocks.push({ slot: "cena", timeHint: TIME_HINT.cena, placeId: diner.id, placeName: t.dinnerAt(diner.name), durationMin: 90, reason: whatToSee(diner, lang) || input.zoneFood?.dinner || t.dinnerAtReason });
  } else {
    blocks.push({ slot: "cena", timeHint: TIME_HINT.cena, placeName: t.dinnerLocal, durationMin: 90, reason: input.zoneFood?.dinner || t.dinnerLocalReason });
  }

  // ── Avisos por lugar (chips) ──────────────────────────────────────────────
  for (const { place } of chosen) {
    if (place.needsReservation) notices.push({ kind: "reserva", text: t.reservation(place.name), placeId: place.id });
    if (place.carAccessClosedSummer) {
      notices.push({ kind: "parking", text: t.parkingClosed(place.name, place.shuttleInfo ?? t.parkingClosedFallback), placeId: place.id });
    } else if ((place.plannerType === "cala" || place.plannerType === "playa") && place.carAccess !== "coche-directo") {
      notices.push({ kind: "madrugar", text: t.goEarly(place.name), placeId: place.id });
    }
    if (place.effortLevel === "C" || place.effortLevel === "D") {
      notices.push({ kind: "esfuerzo", text: t.effort(place.name, place.effortNote ?? t.effortFallbackNote), placeId: place.id });
      notices.push({ kind: "agua-sombra", text: t.waterShade(place.name), placeId: place.id });
    }
    if (place.officialUrl) notices.push({ kind: "confirma-horario", text: t.confirmHours(place.name), placeId: place.id });
  }

  // Aviso de ritmo si se dejó fuera alguna parada disponible.
  if (dropped.length > 0) {
    notices.push({
      kind: "logistica",
      text: t.pace(pace, dropped.map((d) => d.place.name).join(", ")),
    });
  }

  return { blocks, budgetHours, notices };
}
