/**
 * PASO 6 del motor — plan-B de mal tiempo (HUECO 1 del blueprint).
 * No es un día aparte: es un MODO (toggle "Si llueve / hace mucho calor") que
 * sustituye la cala + atardecer por 2-3 interiores DENTRO de la zona del día
 * (o del eje Me-1, de paso), con una comida larga de ancla. Filtra por día de
 * la semana (el lunes cierran muchos museos/queserías) y añade la nota de calor.
 */
import type { PlannerPlace, PlannerZone, IntradayBlock, Notice, Weekday } from "../types.ts";
import { S, type Lang } from "../strings.ts";

const WEEKDAYS: Weekday[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

/**
 * Día de la semana de un día del viaje (puro, sin Date: Zeller + offset).
 * `arrivalDate` ISO "YYYY-MM-DD"; `dayIndex` 0 = llegada.
 */
export function weekdayForDay(arrivalDate: string | undefined, dayIndex: number): Weekday | undefined {
  if (!arrivalDate) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(arrivalDate);
  if (!m) return undefined;
  let y = +m[1];
  let mo = +m[2];
  const d = +m[3];
  if (mo < 3) { mo += 12; y -= 1; }
  const K = y % 100;
  const J = Math.floor(y / 100);
  const h = (d + Math.floor((13 * (mo + 1)) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) + 5 * J) % 7; // 0=sáb
  const arrivalIdx = (h + 5) % 7; // → índice en WEEKDAYS (0=lun)
  return WEEKDAYS[(arrivalIdx + dayIndex) % 7];
}

export interface PlanB {
  blocks: IntradayBlock[];
  notices: Notice[];
}

const isCovered = (p: PlannerPlace): boolean =>
  p.isIndoor || p.weatherProof === "cubierto" || p.weatherProof === "semicubierto";

/** Construye el plan-B de un día: interiores de la zona (o eje/centro de paso). */
export function buildPlanB(
  zone: PlannerZone | "base" | "cercano-aeropuerto",
  dataset: PlannerPlace[],
  weekday?: Weekday,
  lang: Lang = "es",
): PlanB {
  const t = S(lang).planb;
  const opens = (p: PlannerPlace) => !p.openDays || !weekday || p.openDays.includes(weekday);
  const candidates = dataset
    .filter((p) => isCovered(p) && opens(p) && (p.zone === zone || p.zone === "eje-me1" || p.zone === "centro"))
    // prioriza los de la zona exacta, luego los del eje/centro (de paso)
    .sort((a, b) => Number(a.zone !== zone) - Number(b.zone !== zone) || a.name.localeCompare(b.name));
  const picks = candidates.slice(0, 3);

  const blocks: IntradayBlock[] = [
    { slot: "comida", timeHint: "13:30", placeName: t.longLunch, durationMin: 120, reason: t.longLunchReason },
  ];
  for (const p of picks) {
    blocks.push({
      slot: "tarde", timeHint: "16:00", placeId: p.id, placeName: p.name, durationMin: p.durationMin ?? 90,
      reason: t.indoorReason(p.needsReservation),
    });
  }

  const notices: Notice[] = [];
  if (picks.length === 0) {
    notices.push({ kind: "logistica", text: t.fewIndoors });
  }
  if (weekday === "lun") {
    notices.push({ kind: "confirma-horario", text: t.mondayClosed });
  }
  notices.push({ kind: "logistica", text: t.extremeHeat });
  return { blocks, notices };
}
