/**
 * Formateo LOCALIZADO de la salida/puesta del sol para los componentes Astro.
 * La matemática NOAA vive en src/lib/sun-core.ts (sin dependencias, la comparte
 * el motor del planificador); aquí solo se añade Intl + zona horaria de Menorca.
 */
import type { Locale } from '../config/site';
import { INTL_LOCALE } from '../i18n/utils';
export { MENORCA, sunTimes } from './sun-core.ts';
export type { SunEvents } from './sun-core.ts';
import type { SunEvents } from './sun-core.ts';

/** Hora local de Menorca (Europe/Madrid → CET/CEST con su cambio de hora). */
export function fmtMenorcaTime(d: Date | null, locale: Locale): string {
  if (!d) return "—";
  return d.toLocaleTimeString(INTL_LOCALE[locale], {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Duración del día (sunset − sunrise) en "Xh Ym", localizada. */
export function dayLength(ev: SunEvents, locale: Locale): string {
  if (!ev.sunrise || !ev.sunset) return "—";
  const mins = Math.round((ev.sunset.getTime() - ev.sunrise.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  // EN: "9h 39m"; ES y FR: "9 h 39 min".
  return locale === "en" ? `${h}h ${m}m` : `${h} h ${m} min`;
}
