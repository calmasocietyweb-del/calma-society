/**
 * PASO 3 del motor — secuenciación intradía y regla de NO-SATURAR.
 * docs/PLANIFICADOR-BLUEPRINT.md.
 *
 * Secuencia: desayuno (base) → mañana (ancla del cluster) → comida → tarde
 * (2ª ancla opcional) → atardecer (mirador del mismo ramal) → cena (misma zona).
 * Presupuesto de horas útiles por ritmo; si se pasa, cae la parada de MENOR
 * afinidad (nunca la de la mañana) y se avisa. Función pura y trazable.
 */
import type { PlannerPlace, PlannerZone, BaseZone, IntradayBlock, Notice } from "../types.ts";
import type { Survey, Pace } from "../survey.ts";
import { affinity } from "./interests.ts";

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

export interface DayInput {
  base: BaseZone;
  cluster?: string;
  zone: PlannerZone | "base" | "cercano-aeropuerto";
  places: PlannerPlace[];
  travelFromBaseMin: number;
  pace: Pace;
  survey: Survey;
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
  const cfg = PACE[pace];
  const notices: Notice[] = [];

  const ranked = [...places].sort(
    (a, b) => affinity(b, survey) - affinity(a, survey) || a.name.localeCompare(b.name),
  );
  const morning = ranked.find((p) => DAYTIME.has(p.plannerType));
  const sunset = ranked.find((p) => SUNSET.has(p.plannerType));
  const tarde = ranked.find((p) => DAYTIME.has(p.plannerType) && p !== morning);

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

  // Construye la línea de tiempo en orden cronológico.
  const has = (slot: IntradayBlock["slot"]) => chosen.find((c) => c.slot === slot);
  const blocks: IntradayBlock[] = [];
  const meal = (slot: IntradayBlock["slot"], placeName: string, reason: string): IntradayBlock => ({
    slot, timeHint: TIME_HINT[slot], placeName, durationMin: slot === "desayuno" ? 45 : 90, reason,
  });
  const anchorBlock = (slot: IntradayBlock["slot"]): IntradayBlock | undefined => {
    const c = has(slot);
    if (!c) return undefined;
    return {
      slot, timeHint: TIME_HINT[slot], placeId: c.place.id, placeName: c.place.name,
      durationMin: durOf(c.place),
      reason: `${c.place.name} encaja por afinidad con tu perfil y está en el cluster del día (sin cruzar la isla).`,
    };
  };

  blocks.push(meal("desayuno", "Desayuno en la base", "Empieza con calma cerca del alojamiento."));
  const m = anchorBlock("manana"); if (m) blocks.push(m);
  blocks.push(meal("comida", "Comida en la zona", "Pausa de mediodía cerca de la mañana; evita conducir con el sol alto."));
  const t = anchorBlock("tarde"); if (t) blocks.push(t);
  const a = anchorBlock("atardecer"); if (a) blocks.push(a);
  blocks.push(meal("cena", "Cena en la zona", "Cierra el día sin desplazamientos largos."));

  // ── Avisos por lugar (chips) ──────────────────────────────────────────────
  for (const { place } of chosen) {
    if (place.needsReservation) notices.push({ kind: "reserva", text: `Reserva ${place.name} con antelación.`, placeId: place.id });
    if (place.carAccessClosedSummer) {
      notices.push({ kind: "parking", text: `${place.name}: coche restringido en verano. ${place.shuttleInfo ?? "Usa la lanzadera o ve a pie."}`, placeId: place.id });
    } else if ((place.plannerType === "cala" || place.plannerType === "playa") && place.carAccess !== "coche-directo") {
      notices.push({ kind: "madrugar", text: `Ve temprano a ${place.name}: el parking se llena pronto.`, placeId: place.id });
    }
    if (place.effortLevel === "C" || place.effortLevel === "D") {
      notices.push({ kind: "esfuerzo", text: `${place.name} requiere buena forma: ${place.effortNote ?? "caminata o terreno exigente"}.`, placeId: place.id });
      notices.push({ kind: "agua-sombra", text: `Lleva agua, sombra y calzado cómodo para ${place.name}.`, placeId: place.id });
    }
    if (place.officialUrl) notices.push({ kind: "confirma-horario", text: `Confirma el horario de ${place.name} el día de tu visita.`, placeId: place.id });
  }

  // Aviso de ritmo si se dejó fuera alguna parada disponible.
  if (dropped.length > 0) {
    notices.push({
      kind: "logistica",
      text: `Para no saturar el día (ritmo ${pace}) dejé fuera: ${dropped.map((d) => d.place.name).join(", ")}. Puedes recuperarla otro día.`,
    });
  }

  return { blocks, budgetHours, notices };
}
