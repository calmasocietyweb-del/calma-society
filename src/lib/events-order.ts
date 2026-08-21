/**
 * Orden de la agenda (KAN-126). Módulo PURO, sin `astro:content`, para poder
 * probarlo con `node --test` igual que las reglas del planificador.
 *
 * Dos niveles:
 *
 *  1. EN CURSO primero — los que ya han empezado pero aún no han terminado
 *     (`endDate >= hoy`), del que antes se acaba al que más tarde. Son los más
 *     útiles para quien está en la isla ahora: mercados nocturnos, festivales
 *     de varias semanas, exposiciones de temporada.
 *  2. El resto, por PROXIMIDAD de la próxima ocurrencia desde hoy, dando la
 *     vuelta al año (un evento de diciembre va antes que uno de enero si hoy
 *     es noviembre). Como casi todos son fiestas anuales, se usa el mes-día de
 *     `startDate` respecto a la fecha de compilación.
 *
 * Antes se ordenaba SOLO por `startDate` y nunca se miraba `endDate`: un
 * festival que empezó en julio y termina en septiembre contaba como "pasado" y
 * caía al fondo de la agenda estando en marcha.
 */

/** Lo mínimo que necesita el comparador de una ficha de evento. */
export interface EventDates {
  startDate: Date;
  endDate?: Date;
}

/** Fecha de fin efectiva (los eventos de un solo día terminan ese mismo día). */
function endOf(e: EventDates): Date {
  return e.endDate ?? e.startDate;
}

/**
 * Pasa una fecha de contenido (guardada como AAAA-MM-DD, o sea medianoche UTC)
 * al calendario local, para poder compararla con el "hoy" de la compilación.
 */
function asLocalDay(d: Date): number {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime();
}

/** ¿El evento está ocurriendo hoy? */
export function isOngoing(e: EventDates, today: Date): boolean {
  return asLocalDay(e.startDate) <= today.getTime() && asLocalDay(endOf(e)) >= today.getTime();
}

/** Milisegundos hasta la próxima ocurrencia anual de `start` desde `today`. */
function msUntilNext(start: Date, today: Date): number {
  const next = new Date(today.getFullYear(), start.getUTCMonth(), start.getUTCDate());
  if (next.getTime() < today.getTime()) next.setFullYear(next.getFullYear() + 1);
  return next.getTime() - today.getTime();
}

/** Comparador de los dos niveles. */
export function compareEvents(a: EventDates, b: EventDates, today: Date): number {
  const aVivo = isOngoing(a, today);
  const bVivo = isOngoing(b, today);
  if (aVivo !== bVivo) return aVivo ? -1 : 1;
  // Entre los que están en curso, primero el que antes se acaba (más urgente).
  if (aVivo && bVivo) return endOf(a).getTime() - endOf(b).getTime();
  return msUntilNext(a.startDate, today) - msUntilNext(b.startDate, today);
}

/** "Hoy" sin hora, en el calendario local. */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
