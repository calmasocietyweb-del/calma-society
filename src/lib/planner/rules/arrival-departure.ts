/**
 * PASOS 7 y 8 del motor — día de LLEGADA y día de SALIDA (HUECO 2 del blueprint).
 * No generan lugares nuevos: producen un día ligero y cercano a la base (llegada)
 * o un día con margen al vuelo/puerto (salida), sin calas de caminata.
 *
 * Las horas de vuelo son opcionales: si no se dan, se asume un plan de mediodía.
 */
import type { PlannerPlace, BaseZone, IntradayBlock, Notice } from "../types.ts";
import type { Survey } from "../survey.ts";
import { BASE_SIDE } from "./interests.ts";

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

/** PASO 7 — día de llegada: ligero y en el cluster de la base, nunca lejos. */
export function arrivalDay(s: Survey, base: BaseZone, dataset: PlannerPlace[]): DayResult {
  const notices: Notice[] = [];
  const blocks: IntradayBlock[] = [];
  const flight = toMin(s.arrivalFlightTime);
  const usable = flight !== undefined ? flight + arrivalBuffer(s) : 13 * 60; // sin hora → mediodía
  const window = usable < 13 * 60 ? "manana" : usable < 17 * 60 ? "mediodia" : "tarde";

  notices.push({ kind: "logistica", text: `Hora útil estimada en tu base: ${toHHMM(usable)}. El día 1 es ligero y cercano a la base; nada de calas lejanas.` });
  notices.push({ kind: "logistica", text: "De camino, para a por agua y desayuno (super en Maó/Ciutadella/Alaior)." });

  // Cala fácil cercana a la base (solo si llega por la mañana y la hay en el dataset).
  const easyNearby = dataset.find(
    (p) => p.zone === BASE_SIDE[base] && (p.plannerType === "cala" || p.plannerType === "playa") &&
      (p.effortLevel === "A1" || p.effortLevel === "A2") && p.carAccess !== "solo-bus-lanzadera",
  );

  blocks.push({ slot: "desayuno", timeHint: toHHMM(Math.max(usable, 8 * 60)), placeName: "Llegada e instalación", durationMin: 60, reason: "Deja las maletas y respira antes de empezar." });
  if (window === "manana") {
    blocks.push({ slot: "manana", timeHint: "12:00", placeName: "Paseo por el casco de la base", durationMin: 60, reason: "Un primer contacto tranquilo, sin coche." });
    blocks.push({ slot: "comida", timeHint: "14:00", placeName: "Comida tranquila en la base", durationMin: 90, reason: "Cerca del alojamiento." });
    if (easyNearby) blocks.push({ slot: "tarde", timeHint: "16:30", placeId: easyNearby.id, placeName: easyNearby.name, durationMin: 120, reason: "Una cala de acceso fácil cerca de la base para estrenar el viaje." });
  } else if (window === "mediodia") {
    blocks.push({ slot: "comida", timeHint: toHHMM(usable + 30), placeName: "Comida cerca de la base", durationMin: 90, reason: "Check-in y primera comida sin prisa." });
    blocks.push({ slot: "atardecer", timeHint: "20:00", placeName: "Atardecer en la zona de la base", durationMin: 60, reason: "Cierra el primer día con calma." });
  } else {
    notices.push({ kind: "logistica", text: "Llegas tarde: solo logística y cena cercana. Sin turismo el primer día." });
  }
  blocks.push({ slot: "cena", timeHint: "21:30", placeName: "Cena cercana a la base", durationMin: 90, reason: "Sin desplazamientos largos al final del viaje." });

  return { blocks, budgetHours: window === "manana" ? 5 : window === "mediodia" ? 4 : 2.5, notices };
}

/** PASO 8 — día de salida: margen al vuelo, cerca del aeropuerto; sin calas de caminata. */
export function departureDay(s: Survey, base: BaseZone): DayResult {
  const notices: Notice[] = [];
  const blocks: IntradayBlock[] = [];
  const flight = toMin(s.departureFlightTime);

  // Margen total = vuelo −2 h −(devolución coche 30) −(cruce desde Ciutadella 45).
  let limit: number | undefined;
  if (flight !== undefined) {
    let margin = 120;
    if (s.transport === "coche-alquiler") margin += 30;
    if (base === "ciutadella") margin += 45;
    limit = flight - margin;
    notices.push({ kind: "logistica", text: `Hora límite de actividad: ${toHHMM(Math.max(limit, 7 * 60))}. Después, directo al aeropuerto con margen.` });
  } else {
    notices.push({ kind: "logistica", text: "Plan mínimo y cerca del aeropuerto: maleta y un café corto." });
  }

  if (base === "ciutadella" && flight !== undefined && flight < 12 * 60) {
    notices.push({ kind: "logistica", text: "Riesgo de cruce de isla: desde Ciutadella son 45 min por la Me-1. Sal con holgura o valora dormir la última noche más cerca de Maó." });
  }
  if (s.transport === "coche-alquiler") {
    notices.push({ kind: "logistica", text: "Reposta antes de devolver el coche (gasolineras en Maó y junto a la Me-1, no pegadas al aeropuerto)." });
  }

  blocks.push({ slot: "desayuno", timeHint: "08:30", placeName: "Desayuno con calma y maleta", durationMin: 60, reason: "Sin prisas pero con margen." });
  blocks.push({ slot: "manana", timeHint: "10:00", placeName: "Paseo corto cerca de la base o del aeropuerto", durationMin: 60, reason: "Nada de calas de caminata ni Camí de Cavalls el día de salida." });

  return { blocks, budgetHours: 2.5, notices };
}
