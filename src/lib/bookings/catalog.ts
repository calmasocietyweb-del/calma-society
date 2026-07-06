/**
 * Catálogo de reserva de transfers — calca la fórmula del panel de
 * menorcabus.com (capturada el 2026-07-06). SIN precios: los precios
 * llegarán con la API de Menorca Bus (punto de enchufe nº1).
 */

export type VehicleCategoryId =
  | "privado-3"
  | "shuttle"
  | "vip-2"
  | "vip-2-superior"
  | "vip-6";

interface Localized {
  es: string;
  en: string;
}

export interface VehicleCategory {
  id: VehicleCategoryId;
  /** Plazas máximas (el shuttle es autocar compartido: sin límite práctico). */
  maxPax: number;
  badge: Localized;
  name: Localized;
  tagline: Localized;
  /** Puntos de la tarjeta, mismo orden ES/EN. */
  points: { es: string[]; en: string[] };
}

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = [
  {
    id: "privado-3",
    maxPax: 3,
    badge: { es: "Privado", en: "Private" },
    name: { es: "Privado · hasta 3 pasajeros", en: "Private · up to 3 passengers" },
    tagline: { es: "Traslado privado, directo y a tu hora", en: "A private, direct transfer on your schedule" },
    points: {
      es: [
        "Servicio exclusivo para tu reserva, hasta 3 pasajeros.",
        "Puerta a puerta: recogida y llegada directa al punto indicado.",
        "Conductor profesional durante todo el trayecto.",
      ],
      en: [
        "Exclusive service for your booking, up to 3 passengers.",
        "Door to door: direct pick-up and drop-off at your address.",
        "Professional driver for the whole journey.",
      ],
    },
  },
  {
    id: "shuttle",
    maxPax: 50,
    badge: { es: "Shuttle", en: "Shuttle" },
    name: { es: "Shuttle · traslado compartido", en: "Shuttle · shared transfer" },
    tagline: { es: "La opción económica, con paradas", en: "The budget option, with stops" },
    points: {
      es: [
        "Espera en el aeropuerto hasta completar la salida prevista.",
        "La hora definitiva de recogida se confirma 24 horas antes.",
        "El trayecto puede incluir paradas intermedias.",
        "Incluye 1 maleta mediana (hasta 20 kg) y equipaje de mano por pasajero.",
      ],
      en: [
        "Waits at the airport until the scheduled departure is complete.",
        "The final pick-up time is confirmed 24 hours in advance.",
        "The route may include intermediate stops.",
        "Includes 1 medium suitcase (up to 20 kg) and hand luggage per passenger.",
      ],
    },
  },
  {
    id: "vip-2",
    maxPax: 2,
    badge: { es: "VIP", en: "VIP" },
    name: { es: "VIP · 2 pasajeros", en: "VIP · 2 passengers" },
    tagline: { es: "Traslado privado en categoría premium", en: "A private transfer in premium class" },
    points: {
      es: [
        "Categoría premium: un nivel superior de confort frente al traslado estándar.",
        "Vehículos de alta gama seleccionados según disponibilidad.",
        "Servicio flexible si necesitas ajustar el trayecto o hacer una parada.",
      ],
      en: [
        "Premium class: a step up in comfort from the standard transfer.",
        "High-end vehicles selected subject to availability.",
        "Flexible service if you need to adjust the route or make a stop.",
      ],
    },
  },
  {
    id: "vip-2-superior",
    maxPax: 2,
    badge: { es: "Superior", en: "Superior" },
    name: { es: "VIP Superior · 2 pasajeros", en: "VIP Superior · 2 passengers" },
    tagline: { es: "Traslado premium de categoría superior", en: "A premium transfer, superior class" },
    points: {
      es: [
        "Máximo confort: una experiencia más exclusiva.",
        "Vehículos de representación seleccionados según disponibilidad.",
        "Atención personalizada en cada detalle del traslado.",
      ],
      en: [
        "Maximum comfort: a more exclusive experience.",
        "Executive vehicles selected subject to availability.",
        "Personalised care in every detail of the transfer.",
      ],
    },
  },
  {
    id: "vip-6",
    maxPax: 6,
    badge: { es: "VIP", en: "VIP" },
    name: { es: "VIP · hasta 6 pasajeros", en: "VIP · up to 6 passengers" },
    tagline: { es: "Traslado privado premium para grupos", en: "A premium private transfer for groups" },
    points: {
      es: [
        "Categoría premium con espacio para hasta 6 pasajeros.",
        "Vehículos de alta gama seleccionados según disponibilidad.",
        "Puerta a puerta, con conductor profesional.",
      ],
      en: [
        "Premium class with room for up to 6 passengers.",
        "High-end vehicles selected subject to availability.",
        "Door to door, with a professional driver.",
      ],
    },
  },
];

export function categoryById(id: string): VehicleCategory | undefined {
  return VEHICLE_CATEGORIES.find((c) => c.id === id);
}

export type ExtraId = "silla-nino" | "maxicosi" | "booster" | "maleta-extra";

export interface Extra {
  id: ExtraId;
  name: Localized;
}

export const EXTRAS: readonly Extra[] = [
  { id: "silla-nino", name: { es: "Silla de niño", en: "Child seat" } },
  { id: "maxicosi", name: { es: "Maxicosi", en: "Maxicosi" } },
  { id: "booster", name: { es: "Elevador (booster)", en: "Booster seat" } },
  { id: "maleta-extra", name: { es: "Maleta extra", en: "Extra suitcase" } },
];

export const EXTRA_IDS: readonly ExtraId[] = EXTRAS.map((e) => e.id);
