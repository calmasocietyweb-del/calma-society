/**
 * Salida y puesta del sol — "sunrise equation" (NOAA simplificado), SIN
 * dependencias (ni config ni i18n): lo importan tanto los componentes Astro
 * (vía src/lib/sun.ts, que añade el formateo localizado) como el MOTOR del
 * planificador (que corre en node --test y en el navegador).
 *
 * Precisión ~1-2 min: de sobra para una guía. Todo determinista (no usa la
 * fecha del sistema): se le pasa la fecha.
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
