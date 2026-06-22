/**
 * Encuesta del Planificador (entrada del motor). 12 preguntas en 6 bloques.
 * docs/PLANIFICADOR-BLUEPRINT.md — "Encuesta final".
 *
 * La encuesta se serializa en la querystring (plan COMPARTIBLE sin backend),
 * así que los valores son strings/enums estables y cortos.
 */

export type Transport = "coche-alquiler" | "coche-propio-ferry" | "sin-coche";
export type FerryPort = "mao" | "ciutadella";
export type Pace = "relajado" | "equilibrado" | "intenso";
export type Budget = "ajustado" | "medio" | "alto";
export type Accessibility = "ninguna" | "carrito" | "movilidad-reducida" | "mayores";

/** Intereses (P8 "Qué te mueve"). Se cruzan con `idealFor` de cada lugar. */
export type Interest =
  | "calas"
  | "gastronomia"
  | "cultura"
  | "naturaleza"
  | "vida-nocturna"
  | "nautica"
  | "lujo-tranquilo";

/** Tramos de edad de los niños (P9). */
export type KidAge = "0-3" | "4-8" | "9-14" | "15+";

import type { BaseZone } from "./types.ts";

/** `base`: o una de las 6 zonas, o pedir recomendación al motor (PASO 0). */
export type BaseChoice = BaseZone | "recomiendame";

export interface Survey {
  /** P1 — número de días de viaje (mín. 1). */
  days: number;
  /** P2 — fechas (ISO "YYYY-MM-DD"); cruzan con agenda, temporada y ventana accesible. */
  arrivalDate?: string;
  departureDate?: string;
  /** P4/P5 — horas aprox. de vuelo (opcionales; afinan días de llegada/salida). */
  arrivalFlightTime?: string; // "HH:MM"
  departureFlightTime?: string; // "HH:MM"

  /** P3 — cómo te mueves. */
  transport: Transport;
  ferryPort?: FerryPort; // solo si transport = coche-propio-ferry

  /** P6 — dónde duermes (o "recomiendame" → el motor ejecuta el PASO 0). */
  base: BaseChoice;

  /** P7 — ritmo. */
  pace: Pace;
  /** P8 — qué te mueve (multi). */
  interests: Interest[];

  /** P9 — viajas con niños. */
  kids: { has: boolean; ages?: KidAge[] };
  /** P10 — necesidad de accesibilidad. */
  accessibility: Accessibility;

  /** P11 — barco y atardeceres. */
  boatSunset: boolean;
  /** P12 — presupuesto. */
  budget: Budget;
}

/** Encuesta por defecto (perfil "calma" de marca: primera vez, equilibrado). */
export const DEFAULT_SURVEY: Survey = {
  days: 5,
  transport: "coche-alquiler",
  base: "recomiendame",
  pace: "equilibrado",
  interests: ["calas", "gastronomia"],
  kids: { has: false },
  accessibility: "ninguna",
  boatSunset: true,
  budget: "medio",
};

/** Normaliza una encuesta parcial (p. ej. desde querystring) a una válida. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeSurvey(input: Partial<Survey>): Survey {
  const s: Survey = { ...DEFAULT_SURVEY, ...input };
  s.days = clampDays(s.days);
  if (!s.interests || s.interests.length === 0) s.interests = [...DEFAULT_SURVEY.interests];
  if (s.transport !== "coche-propio-ferry") delete s.ferryPort;
  if (!s.kids) s.kids = { has: false };
  // Descarta fechas mal formadas (defensa en profundidad: evita cuelgues/cruces raros).
  if (s.arrivalDate && !ISO_DATE.test(s.arrivalDate)) delete s.arrivalDate;
  if (s.departureDate && !ISO_DATE.test(s.departureDate)) delete s.departureDate;
  return s;
}

function clampDays(d: number): number {
  if (!Number.isFinite(d)) return DEFAULT_SURVEY.days;
  return Math.min(21, Math.max(1, Math.round(d)));
}

/** ¿Viaja sin coche? (decisivo en el PASO 0 y en el filtrado de lugares). */
export function isCarless(s: Survey): boolean {
  return s.transport === "sin-coche";
}

/** Banda de días, útil para reglas de split de base (PASO 0). */
export function dayBand(s: Survey): "corta" | "media" | "larga" {
  if (s.days <= 4) return "corta";
  if (s.days <= 7) return "media";
  return "larga";
}
