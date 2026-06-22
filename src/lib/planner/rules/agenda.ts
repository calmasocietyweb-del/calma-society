/**
 * PASO 2 del motor — cruce con la AGENDA de fiestas (src/content/eventos).
 * docs/PLANIFICADOR-BLUEPRINT.md.
 *
 * Para cada día con fecha, busca fiestas que solapen. Una fiesta EN la zona del
 * día se inserta como aviso (reserva + mucha gente); una fiesta en otra zona NO
 * rompe la espina de pez: se ofrece como aviso global ("puedes reorganizar un
 * día para verla, o solo tenerla en cuenta"). Determinista.
 */
import type { PlannerZone, Notice } from "../types.ts";

export interface PlannerEvent {
  translationKey: string;
  title: string;
  startDate: string; // ISO YYYY-MM-DD
  endDate?: string;
  zone: PlannerZone | "varios";
  category: string;
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Suma `n` días (≥0) a una fecha ISO. Puro, sin Date (determinista). */
export function addDaysISO(iso: string, n: number): string {
  // Validación ESTRICTA: una fecha malformada haría `d = NaN` y el bucle no
  // terminaría nunca (NaN <= dim siempre false) → cuelgue. Ante entrada inválida,
  // devolvemos la cadena tal cual (no-op seguro).
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const y0 = +match[1];
  const m0 = +match[2];
  const d0 = +match[3];
  if (m0 < 1 || m0 > 12 || d0 < 1 || d0 > 31) return iso;
  let y = y0;
  let m = m0;
  let d = d0 + Math.max(0, Math.floor(n));
  for (let guard = 0; guard < 100000; guard++) {
    const dim = m === 2 && isLeap(y) ? 29 : MD[m - 1];
    if (d <= dim) break;
    d -= dim;
    if (++m > 12) { m = 1; y++; }
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Fiestas que solapan una fecha concreta. */
export function eventsOnDate(events: PlannerEvent[], date: string): PlannerEvent[] {
  return events.filter((e) => date >= e.startDate && date <= (e.endDate ?? e.startDate));
}

/**
 * Avisos de agenda para un día. Devuelve los avisos "de zona" (van al día) y los
 * "de otra zona" (el motor los acumula como globales, sin duplicar).
 */
export function agendaForDay(
  dayZone: PlannerZone | "base" | "cercano-aeropuerto",
  date: string,
  events: PlannerEvent[],
): { dayNotices: Notice[]; otherZone: Array<{ key: string; notice: Notice }> } {
  const dayNotices: Notice[] = [];
  const otherZone: Array<{ key: string; notice: Notice }> = [];
  for (const ev of eventsOnDate(events, date)) {
    if (ev.zone === "varios" || ev.zone === dayZone) {
      dayNotices.push({ kind: "fiesta", text: `Coincide con ${ev.title} en esta zona (${date}): reserva alojamiento y mesa con antelación y cuenta con mucha gente.` });
    } else {
      otherZone.push({ key: ev.translationKey, notice: { kind: "fiesta", text: `El ${date} hay ${ev.title} (${ev.zone}). Puedes reorganizar un día para verla, o solo tenerla en cuenta.` } });
    }
  }
  return { dayNotices, otherZone };
}
