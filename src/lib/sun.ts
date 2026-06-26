/**
 * Salida y puesta del sol — "sunrise equation" (NOAA simplificado).
 *
 * Calcula el INSTANTE UTC del amanecer y el atardecer para una fecha civil y
 * unas coordenadas. Precisión ~1-2 min: de sobra para una guía. El formateo a
 * hora local de Menorca se hace con Intl + `timeZone: 'Europe/Madrid'`, así que
 * el horario de verano (CET/CEST) se aplica solo —no hay que tocarlo a mano—.
 *
 * Todo es determinista (no usa la fecha del sistema): se le pasa la fecha. Lo
 * usa el componente SunTimes para una tabla mes a mes que NO caduca.
 *
 * Coordenadas de referencia de Menorca (centro de la isla). La diferencia este-
 * oeste de la salida/puesta es de ~2-3 min (la costa oeste, Ciutadella, ve la
 * puesta algo más tarde; el este, Maó, ve el amanecer algo antes): irrelevante
 * para la tabla, y se avisa en el pie.
 */
export const MENORCA = { lat: 39.95, lng: 4.0 } as const;

const J2000 = 2451545.0;
const toRad = (d: number) => (d * Math.PI) / 180;
const julianFromUnix = (ms: number) => ms / 86400000 + 2440587.5;
const unixFromJulian = (j: number) => (j - 2440587.5) * 86400000;

export interface SunEvents {
  /** Instante UTC del amanecer (o null en noche/día polar — no aplica a Menorca). */
  sunrise: Date | null;
  /** Instante UTC del atardecer. */
  sunset: Date | null;
}

/** Amanecer y atardecer (instantes UTC) para la fecha civil `year-month-day`. */
export function sunTimes(
  lat: number,
  lng: number,
  year: number,
  month: number,
  day: number,
): SunEvents {
  const jdate = julianFromUnix(Date.UTC(year, month - 1, day, 12)); // mediodía UTC
  const n = Math.round(jdate - J2000 - 0.0009);
  const Jstar = n + 0.0009 - lng / 360; // tiempo solar medio
  const M = (357.5291 + 0.98560028 * Jstar) % 360; // anomalía media
  const Mr = toRad(M);
  const C = 1.9148 * Math.sin(Mr) + 0.02 * Math.sin(2 * Mr) + 0.0003 * Math.sin(3 * Mr);
  const lambda = (M + C + 180 + 102.9372) % 360; // longitud eclíptica
  const lr = toRad(lambda);
  const Jtransit = J2000 + Jstar + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * lr);
  const delta = Math.asin(Math.sin(lr) * Math.sin(toRad(23.4397))); // declinación
  const cosOmega =
    (Math.sin(toRad(-0.833)) - Math.sin(toRad(lat)) * Math.sin(delta)) /
    (Math.cos(toRad(lat)) * Math.cos(delta));
  if (cosOmega > 1 || cosOmega < -1) return { sunrise: null, sunset: null };
  const omegaDeg = (Math.acos(cosOmega) * 180) / Math.PI;
  return {
    sunrise: new Date(unixFromJulian(Jtransit - omegaDeg / 360)),
    sunset: new Date(unixFromJulian(Jtransit + omegaDeg / 360)),
  };
}

/** Hora local de Menorca (Europe/Madrid → CET/CEST con su cambio de hora). */
export function fmtMenorcaTime(d: Date | null, locale: "es" | "en"): string {
  if (!d) return "—";
  return d.toLocaleTimeString(locale === "es" ? "es-ES" : "en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Duración del día (sunset − sunrise) en "Xh Ym", localizada. */
export function dayLength(ev: SunEvents, locale: "es" | "en"): string {
  if (!ev.sunrise || !ev.sunset) return "—";
  const mins = Math.round((ev.sunset.getTime() - ev.sunrise.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return locale === "es" ? `${h} h ${m} min` : `${h}h ${m}m`;
}
