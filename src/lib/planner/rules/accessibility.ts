/**
 * PASO 5 del motor — accesibilidad y esfuerzo (HUECO 3 del blueprint).
 * Filtra y reordena los lugares según la necesidad declarada, sin frustrar:
 * excluye lo que no encaja y, donde el usuario insista, avisa (no bloquea fuera).
 *
 * Escala: A1 accesible-asistido (baño con silla anfibia + personal, 1 may–31 oct)
 * · A2 fácil/llano · B moderado · C exigente · D duro (Camí de Cavalls).
 */
import type { PlannerPlace, EffortLevel } from "../types.ts";
import type { Survey, Accessibility, Pace } from "../survey.ts";

/** Niveles de esfuerzo permitidos por necesidad. */
export function allowedEfforts(a: Accessibility): EffortLevel[] {
  switch (a) {
    case "movilidad-reducida": return ["A1", "A2"];      // silla de ruedas / movilidad muy limitada
    case "carrito": return ["A1", "A2", "B"];            // carrito de bebé (B con aviso)
    case "mayores": return ["A1", "A2", "B"];            // mayores con movilidad algo limitada
    default: return ["A1", "A2", "B", "C", "D"];
  }
}

/** ¿Es apto este lugar para la necesidad declarada? */
export function isAccessible(p: PlannerPlace, a: Accessibility): boolean {
  if (a === "ninguna") return true;
  if (!allowedEfforts(a).includes(p.effortLevel)) return false;
  // Movilidad reducida: el baño solo en playas A1 (pasarela + silla anfibia + personal).
  if (a === "movilidad-reducida" && (p.plannerType === "cala" || p.plannerType === "playa") && p.effortLevel !== "A1") {
    return false;
  }
  return true;
}

/** Filtra el dataset por accesibilidad (PASO 5 como FILTRO sobre los pasos 1-3). */
export function filterAccessible(dataset: PlannerPlace[], a: Accessibility): PlannerPlace[] {
  return a === "ninguna" ? dataset : dataset.filter((p) => isAccessible(p, a));
}

/** "Mayores": menos paradas → un escalón de ritmo más tranquilo (regla R3). */
export function effectivePace(s: Survey): Pace {
  if (s.accessibility !== "mayores") return s.pace;
  return s.pace === "intenso" ? "equilibrado" : "relajado";
}
