/**
 * Fábrica de lugares y dataset de muestra para los tests del motor.
 * (No es un *.test.ts → el runner no lo ejecuta; solo lo importan los tests.)
 */
import type { PlannerPlace, PlannerZone, PlannerType } from "../types.ts";

type Req = Pick<PlannerPlace, "id" | "zone" | "cluster" | "plannerType">;

export function place(p: Partial<PlannerPlace> & Req): PlannerPlace {
  // `id` llega SIEMPRE en `p` (Req) y el spread final lo aporta: no se repite aquí.
  return {
    name: p.id,
    slug: p.id,
    coordinates: { lat: 0, lng: 0 },
    idealFor: [],
    durationMin: undefined,
    carAccess: "coche-directo",
    busServed: false,
    carAccessClosedSummer: false,
    effortLevel: "A2",
    isIndoor: false,
    indoorAlternativeOf: [],
    needsReservation: false,
    dataCertainty: "alta",
    ...p,
  };
}

/** Dataset multi-zona para probar el PASO 1 (no repetir zona consecutiva). */
export const DATASET: PlannerPlace[] = [
  place({ id: "macarella", zone: "sur-oeste", cluster: "galdana-macarella", plannerType: "cala", idealFor: ["naturaleza", "parejas"], durationMin: 240, carAccess: "solo-bus-lanzadera", carAccessClosedSummer: true }),
  place({ id: "turqueta", zone: "sur-oeste", cluster: "galdana-macarella", plannerType: "cala", idealFor: ["familias", "naturaleza"], durationMin: 200, carAccess: "coche-mas-caminata", effortLevel: "C" }),
  place({ id: "pregonda", zone: "norte", cluster: "fornells-cavalleria", plannerType: "cala", idealFor: ["naturaleza"], durationMin: 240, carAccess: "coche-mas-caminata", effortLevel: "D" }),
  place({ id: "naveta", zone: "eje-me1", cluster: "interior-cultura", plannerType: "yacimiento", idealFor: ["cultura", "primera-vez"], durationMin: 45 }),
  place({ id: "son-bou", zone: "sur-centro", cluster: "son-bou-migjorn", plannerType: "playa", idealFor: ["familias"], durationMin: 180, effortLevel: "A1" }),
  place({ id: "mao", zone: "este", cluster: "mao-puerto", plannerType: "pueblo", idealFor: ["cultura", "gastronomia"], durationMin: 120 }),
];

const Z: PlannerZone[] = ["sur-oeste", "norte", "centro", "sur-centro", "este", "sur-este", "oeste", "eje-me1"];
export const ALL_ZONES = Z;
export type { PlannerType };
