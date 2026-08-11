/**
 * PASO 3 del motor — secuenciación intradía y regla de NO-SATURAR.
 * docs/PLANIFICADOR-BLUEPRINT.md.
 *
 * Secuencia: desayuno (base) → mañana (ancla del cluster) → comida → tarde
 * (2ª ancla opcional) → atardecer (mirador del mismo ramal) → cena (misma zona).
 * Presupuesto de horas útiles por ritmo; si se pasa, cae la parada de MENOR
 * afinidad (nunca la de la mañana) y se avisa. Función pura y trazable.
 */
import type { PlannerPlace, PlannerZone, BaseZone, IntradayBlock, Notice, ZoneFood, Weekday, Swap } from "../types.ts";
import type { Survey, Pace } from "../survey.ts";
import { affinity } from "./interests.ts";
import { pickRotating } from "./seed.ts";
import { S, type Lang } from "../strings.ts";

/**
 * Ventana de "casi empate" (puntos de afinidad). Dentro de ella, dos lugares son
 * igual de buenos para el viaje, así que la elección puede ROTAR por semilla sin
 * bajar la calidad. Fuera de ella manda la afinidad y no se rota.
 * Calibrado con la sonda de cobertura: 1,25 sube el dataset alcanzable del 62%
 * al 90%+ sin colar lugares poco afines (el salto de tipo pedido vale 2,5).
 */
const NEAR_TIE = 1.25;
/** Cuántos recambios se ofrecen por hueco. Tres es elegir; diez es un catálogo. */
const ALT_COUNT = 3;
/** Cuántos lugares "también cerca" se listan por día. */
const NEARBY_COUNT = 5;

interface Selection {
  pick?: PlannerPlace;
  alts: PlannerPlace[];
}

/**
 * Elige un lugar para un hueco: entre los que cumplen el filtro, descarta los ya
 * usados en el viaje, se queda con los de afinidad comparable a la del mejor y
 * rota por semilla. Devuelve además los recambios de ese hueco.
 */
function selectFrom(
  ranked: readonly PlannerPlace[],
  pred: (p: PlannerPlace) => boolean,
  survey: Survey,
  seed: number,
  salt: number,
  taken: Set<string>,
  /**
   * Si no queda nada sin usar, ¿vale repetir un lugar de OTRO día? Solo para la
   * parada de la mañana (la esencial: antes repetir que dejar el día vacío en una
   * estancia larga). Para los huecos opcionales NO: repetir la cala de la mañana
   * por la tarde del mismo día sería un plan roto, no un plan lleno.
   */
  reuse = false,
): Selection {
  const all = ranked.filter(pred);
  if (all.length === 0) return { alts: [] };
  const fresh = all.filter((p) => !taken.has(p.id));
  const pool = fresh.length ? fresh : reuse ? all : [];
  if (pool.length === 0) return { alts: [] };
  const best = affinity(pool[0], survey);
  const near = pool.filter((p) => affinity(p, survey) >= best - NEAR_TIE);
  const pick = pickRotating(near, seed, salt);
  const alts = pool.filter((p) => p !== pick).slice(0, ALT_COUNT);
  return { pick, alts };
}

/** Una frase corta que justifique el recambio (sin volcar la ficha entera). */
function swapNote(p: PlannerPlace): string | undefined {
  const raw = p.highlights?.[0] || p.blurb;
  if (!raw) return undefined;
  return raw.length > 110 ? `${raw.slice(0, 107).trimEnd()}…` : raw;
}

const toSwap = (p: PlannerPlace): Swap => ({ placeId: p.id, name: p.name, note: swapNote(p) });

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
  /** Opciones de desayuno de la base para ROTAR por día (variedad). Opcional. */
  baseBreakfasts?: string[];
  /** Índice del día (0-based), para rotar el desayuno sin repetir. */
  dayIndex?: number;
  /** Día de la semana REAL (solo si la encuesta trae fechas): cruza `openDays`
   * para no mandar a nadie a una quesería cerrada en domingo. */
  weekday?: Weekday;
  /** Hora real del atardecer "HH:MM" (sun.ts, solo con fechas): sustituye al
   * 19:30 fijo y desplaza la cena si el sol se pone tarde (verano). */
  sunsetHint?: string;
  /** Semilla del plan (rules/seed.ts): rota entre lugares igual de afines. */
  seed?: number;
  /** Lugares YA programados en días anteriores: no se repiten. */
  used?: ReadonlySet<string>;
}

export interface DayResult {
  blocks: IntradayBlock[];
  budgetHours: number;
  notices: Notice[];
  /** Lo que queda a mano y no cabe en el día (profundidad sin saturar). */
  alsoNearby?: Swap[];
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
  llegada: "13:00", desayuno: "08:30", manana: "10:00", comida: "14:00", tarde: "16:30", atardecer: "19:30", cena: "21:00",
};

/** ¿El lugar abre el día de la semana dado? (sin dato de días o sin fecha → sí). */
const openOn = (p: PlannerPlace, weekday?: Weekday): boolean =>
  !weekday || !p.openDays || p.openDays.includes(weekday);

/** Secuencia un día pleno respetando el presupuesto de horas del ritmo. */
export function sequenceDay(input: DayInput): DayResult {
  const { places, travelFromBaseMin, pace, survey, weekday } = input;
  const lang = input.lang ?? "es";
  const t = S(lang).intraday;
  const cfg = PACE[pace];
  const notices: Notice[] = [];

  const ranked = [...places].sort(
    (a, b) => affinity(b, survey) - affinity(a, survey) || a.name.localeCompare(b.name),
  );
  // Semilla y memoria del viaje: la elección rota entre lugares igual de afines
  // y no repite lo ya programado en días anteriores. `taken` arranca con lo usado
  // y va creciendo dentro del día (la tarde no puede caer en la misma cala que
  // la mañana). El salt lleva el día para que dos días no roten en fase.
  const seed = input.seed ?? 0;
  const day = input.dayIndex ?? 0;
  const taken = new Set<string>(input.used ?? []);
  const claim = (p?: PlannerPlace) => { if (p) taken.add(p.id); return p; };

  // Cruce openDays × día real: lo cerrado ese día no se propone (y si era el
  // mejor candidato, se dice por qué quedó fuera — trazabilidad, §6 blueprint).
  const morningAny = ranked.find((p) => DAYTIME.has(p.plannerType));
  const mSel = selectFrom(ranked, (p) => DAYTIME.has(p.plannerType) && openOn(p, weekday), survey, seed, day * 10 + 1, taken, true);
  const morning = claim(mSel.pick);
  if (morningAny && morning && morning !== morningAny && !openOn(morningAny, weekday)) {
    notices.push({
      kind: "confirma-horario",
      text: t.closedThatDay(morningAny.name, S(lang).weekdayName[weekday!]),
      placeId: morningAny.id,
    });
  }
  const sSel = selectFrom(ranked, (p) => SUNSET.has(p.plannerType) && openOn(p, weekday), survey, seed, day * 10 + 2, taken);
  const sunset = claim(sSel.pick);
  const tSel = selectFrom(ranked, (p) => DAYTIME.has(p.plannerType) && openOn(p, weekday), survey, seed, day * 10 + 3, taken);
  const tarde = claim(tSel.pick);
  // Para anclar las comidas a sitios reales (no "cenar en la zona"). Si la mañana
  // o la tarde YA son un pueblo, ese es el pueblo del día (cenas donde has estado);
  // si no, se elige uno aparte.
  const anchorTown = [morning, tarde].find((p) => p?.plannerType === "pueblo");
  const pueblo = anchorTown
    ?? claim(selectFrom(ranked, (p) => p.plannerType === "pueblo", survey, seed, day * 10 + 4, taken).pick);
  const diner = claim(
    selectFrom(
      ranked,
      (p) => (p.plannerType === "cena" || p.plannerType === "comida") && openOn(p, weekday),
      survey, seed, day * 10 + 5, taken,
    ).pick,
  );
  const altsFor = (slot: IntradayBlock["slot"]): Swap[] | undefined => {
    const sel = slot === "manana" ? mSel : slot === "tarde" ? tSel : slot === "atardecer" ? sSel : undefined;
    const list = sel?.alts.filter((p) => p !== morning && p !== tarde && p !== sunset).map(toSwap);
    return list && list.length ? list : undefined;
  };

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

  // Horas orientativas: el atardecer usa la hora REAL del sol si hay fechas
  // (en julio el sol cae ~21:25, no a las 19:30) y la cena se desplaza tras él.
  const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  const toHHMM = (min: number) =>
    `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  const timeOf = (slot: IntradayBlock["slot"]): string => {
    if (input.sunsetHint) {
      if (slot === "atardecer") return toHHMM(toMin(input.sunsetHint) - 30); // en el mirador antes de la puesta
      if (slot === "cena") return toHHMM(Math.max(21 * 60, toMin(input.sunsetHint) + 45));
    }
    return TIME_HINT[slot];
  };

  // Construye la línea de tiempo en orden cronológico, con instrucciones concretas.
  const has = (slot: IntradayBlock["slot"]) => chosen.find((c) => c.slot === slot);
  const blocks: IntradayBlock[] = [];
  const anchorBlock = (slot: IntradayBlock["slot"]): IntradayBlock | undefined => {
    const c = has(slot);
    if (!c) return undefined;
    return {
      slot, timeHint: timeOf(slot), placeId: c.place.id, placeName: c.place.name,
      durationMin: durOf(c.place),
      reason: whatToSee(c.place, lang) || t.anchorFallbackReason(c.place.name),
      alternatives: altsFor(slot),
    };
  };
  const puebloIsAnchor = chosen.some((c) => c.place === pueblo);

  // DESAYUNO — en la base. Rota entre opciones verificadas por día (variedad);
  // si no hay varias, usa la guía de la zona base; si no, el texto genérico.
  const bfOpts = input.baseBreakfasts;
  const breakfastReason =
    (bfOpts && bfOpts.length ? bfOpts[(input.dayIndex ?? 0) % bfOpts.length] : input.baseFood?.breakfast)
    || t.breakfastReason;
  blocks.push({ slot: "desayuno", timeHint: timeOf("desayuno"), placeName: t.breakfast(BASE_TOWN[input.base]), durationMin: 45, reason: breakfastReason });

  const m = anchorBlock("manana"); if (m) blocks.push(m);

  // COMIDA — anclada a un restaurante/mercado o al pueblo del día; la guía
  // verificada de la zona enriquece el "por qué" cuando no hay ficha real.
  if (diner) {
    blocks.push({ slot: "comida", timeHint: timeOf("comida"), placeId: diner.id, placeName: t.lunchAt(diner.name), durationMin: 90, reason: whatToSee(diner, lang) || input.zoneFood?.lunch || t.lunchAtReason });
  } else if (pueblo) {
    blocks.push({ slot: "comida", timeHint: timeOf("comida"), placeName: t.lunchInTown(pueblo.name), durationMin: 90, reason: input.zoneFood?.lunch || t.lunchInTownReason });
  } else {
    blocks.push({ slot: "comida", timeHint: timeOf("comida"), placeName: t.lunchLocal, durationMin: 90, reason: input.zoneFood?.lunch || t.lunchLocalReason });
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
    blocks.push({ slot: "cena", timeHint: timeOf("cena"), placeId: pueblo.id, placeName: t.dinnerStroll(pueblo.name), durationMin: 90, reason });
  } else if (diner) {
    blocks.push({ slot: "cena", timeHint: timeOf("cena"), placeId: diner.id, placeName: t.dinnerAt(diner.name), durationMin: 90, reason: whatToSee(diner, lang) || input.zoneFood?.dinner || t.dinnerAtReason });
  } else {
    blocks.push({ slot: "cena", timeHint: timeOf("cena"), placeName: t.dinnerLocal, durationMin: 90, reason: input.zoneFood?.dinner || t.dinnerLocalReason });
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
      text: t.pace(S(lang).paceName[pace], dropped.map((d) => d.place.name).join(", ")),
    });
  }

  // "También cerca": lo bueno del ramal que el día no llega a programar. No es
  // relleno — es lo que hace que el plan se lea como una guía de la zona y no
  // como una lista cerrada, y da salida a los lugares verificados que la regla
  // de no-saturar deja siempre fuera.
  const scheduled = new Set(blocks.map((b) => b.placeId).filter(Boolean) as string[]);
  const alsoNearby = ranked
    .filter((p) => !scheduled.has(p.id) && !(input.used?.has(p.id) ?? false) && p.plannerType !== "cena" && p.plannerType !== "comida")
    .slice(0, NEARBY_COUNT)
    .map(toSwap);

  return { blocks, budgetHours, notices, alsoNearby: alsoNearby.length ? alsoNearby : undefined };
}
