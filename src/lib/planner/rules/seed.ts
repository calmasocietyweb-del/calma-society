/**
 * Semilla determinista del plan — cómo el motor consigue VARIEDAD sin perder la
 * invariante sagrada del planificador: **la misma URL da siempre el mismo plan**
 * (el plan se comparte por querystring; si cambiara al recargar, dejaría de ser
 * compartible).
 *
 * La solución no es azar: es una FUNCIÓN de la propia encuesta. Dos encuestas
 * distintas producen semillas distintas → planes distintos; la misma encuesta
 * produce siempre la misma semilla → el mismo plan, hoy y dentro de un año.
 *
 * `variant` es la única palanca que el viajero mueve a mano ("enséñame otra
 * versión"): entra en la semilla y viaja en la querystring como todo lo demás.
 *
 * Auditoría 2026-08-11: sin esto, el motor solo llegaba a 87 de los 141 lugares
 * verificados (62%). Elegía siempre el mejor de cada cluster y desempataba por
 * ORDEN ALFABÉTICO, así que 54 lugares —17 de ellos calas— eran inalcanzables
 * para cualquier viajero.
 */
import type { Survey } from "../survey.ts";

/** Hash FNV-1a de 32 bits. Puro, estable y sin dependencias (mismo valor en Node y navegador). */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // FNV prime (16777619) por desplazamientos: evita el desbordamiento de `*`.
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/**
 * Semilla de una encuesta. Incluye TODO lo que define el viaje (y la variante),
 * en orden fijo, para que el valor no dependa del orden de las claves del objeto.
 */
export function surveySeed(s: Survey): number {
  const parts = [
    s.days,
    s.transport,
    s.ferryPort ?? "",
    s.base,
    s.pace,
    [...s.interests].sort().join("+"),
    s.kids.has ? `k:${[...(s.kids.ages ?? [])].sort().join("+")}` : "k:no",
    s.accessibility,
    s.boatSunset ? "b" : "-",
    s.budget,
    s.arrivalDate ?? "",
    s.variant ?? 0,
  ];
  return hash32(parts.join("|"));
}

/**
 * Elige un elemento del conjunto de forma determinista, rotando según la semilla.
 * `salt` distingue decisiones distintas dentro del mismo plan (día, hueco), para
 * que dos huecos del mismo día no caigan siempre en la misma posición del pool.
 */
export function pickRotating<T>(pool: readonly T[], seed: number, salt: number): T | undefined {
  if (pool.length === 0) return undefined;
  if (pool.length === 1) return pool[0];
  // Mezcla la semilla con el salt antes del módulo: sin esto, pools de tamaños
  // distintos con el mismo salt se correlacionan y la "variedad" se repite.
  const mixed = hash32(`${seed}:${salt}`);
  return pool[mixed % pool.length];
}
