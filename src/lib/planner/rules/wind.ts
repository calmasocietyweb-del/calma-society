/**
 * PASO 4 del motor — regla del viento (FLEXIBLE). docs/PLANIFICADOR-BLUEPRINT.md.
 *
 * El motor NO conoce el viento real del día: NO reordena a la fuerza. Para cada
 * día de playa en una costa expuesta, AÑADE un aviso ("mira el parte esa mañana")
 * y propone una ALTERNATIVA resguardada en la costa opuesta. La regla maestra es
 * por costa (Tramontana del norte → al sur; Migjorn del sur → al norte), la más
 * robusta; el abrigo fino por cala (windExposure) puede afinarlo más adelante.
 */
import type { PlannerPlace, PlannerZone, Notice } from "../types.ts";
import type { Survey } from "../survey.ts";
import { affinity } from "./interests.ts";
import { S, type Lang } from "../strings.ts";

export type Coast = "norte" | "sur" | "mixto";

/** Costa dominante de una zona (a efectos de viento). */
export function coastOf(zone: PlannerZone | "base" | "cercano-aeropuerto"): Coast {
  if (zone === "norte") return "norte";
  if (typeof zone === "string" && zone.startsWith("sur")) return "sur";
  return "mixto"; // este, oeste, centro, eje-me1, base…
}

/** Mejor playa/cala (por afinidad) en una costa concreta del dataset. */
function bestBeachInCoast(dataset: PlannerPlace[], coast: Coast, s: Survey): PlannerPlace | undefined {
  const beaches = dataset
    .filter((p) => (p.plannerType === "cala" || p.plannerType === "playa") && coastOf(p.zone) === coast)
    .sort((a, b) => affinity(b, s) - affinity(a, s) || a.name.localeCompare(b.name));
  return beaches[0];
}

/**
 * Aviso de viento para un día. Solo si el día tiene una parada de costa
 * (cala/playa/atardecer) en una costa expuesta. Devuelve 0 o 1 aviso.
 */
export function windAdvice(
  zone: PlannerZone | "base" | "cercano-aeropuerto",
  anchors: PlannerPlace[],
  dataset: PlannerPlace[],
  s: Survey,
  lang: Lang = "es",
): Notice[] {
  const t = S(lang).wind;
  const isCoastDay = anchors.some(
    (p) => p.plannerType === "cala" || p.plannerType === "playa" || p.plannerType === "atardecer",
  );
  if (!isCoastDay) return [];
  const coast = coastOf(zone);

  if (coast === "norte") {
    const backup = bestBeachInCoast(dataset, "sur", s);
    return [{
      kind: "viento",
      text: t.tramontana(backup?.name),
    }];
  }
  if (coast === "sur") {
    const backup = bestBeachInCoast(dataset, "norte", s);
    return [{
      kind: "viento",
      text: t.migjorn(backup?.name),
    }];
  }
  return [];
}
