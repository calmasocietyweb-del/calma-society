/**
 * Catálogo de reserva de transfers — calca la fórmula del panel de
 * menorcabus.com (capturada el 2026-07-06). SIN precios: los precios
 * llegarán con la API de Menorca Bus (punto de enchufe nº1).
 */
import type { Locale } from "../../config/site";


export type VehicleCategoryId =
  | "privado-3"
  | "shuttle"
  | "vip-2"
  | "vip-2-superior"
  | "vip-6";

/**
 * Idiomas en los que se ofrece la reserva. Es una pieza de DESPLIEGUE POR
 * MERCADOS: no tiene por qué existir en los seis idiomas, pero en los que
 * existe tiene que estar COMPLETA. Por eso se declara con `Extract<Locale, …>`
 * y no con un `{es, en}` a mano: al añadir un idioma aquí, `astro check`
 * enumera uno a uno todos los textos que faltan por rellenar (CLAUDE.md §11).
 */
export type BookingLocale = Extract<Locale, "es" | "en" | "fr" | "de">;

/** Un texto en todos los idiomas en los que la reserva está desplegada. */
type Localized = Record<BookingLocale, string>;

export interface VehicleCategory {
  id: VehicleCategoryId;
  /** Plazas máximas (el shuttle es autocar compartido: sin límite práctico). */
  maxPax: number;
  badge: Localized;
  name: Localized;
  tagline: Localized;
  /** Puntos de la tarjeta, en el mismo orden en todos los idiomas. */
  points: Record<BookingLocale, string[]>;
  /**
   * Precio orientativo de la categoría (enchufe nº1 de la API de Menorca Bus).
   * VACÍO en la v1 a propósito: la tarjeta muestra «Precio a confirmar» hasta
   * que exista la API o el dueño fije una cifra aquí; entonces se muestra sola,
   * sin tocar la plantilla. Ej.: `price: { es: "desde 35 €", en: "from €35", fr: "à partir de 35 €", de: "ab 35 €" }`.
   */
  price?: Localized;
}

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = [
  {
    id: "privado-3",
    maxPax: 3,
    badge: { es: "Privado", en: "Private", fr: "Privé", de: "Privat" },
    name: {
      es: "Privado · hasta 3 pasajeros",
      en: "Private · up to 3 passengers",
      fr: "Privé · jusqu’à 3 passagers",
      de: "Privat · bis zu 3 Fahrgäste",
    },
    tagline: {
      es: "Traslado privado, directo y a tu hora",
      en: "A private, direct transfer on your schedule",
      fr: "Un transfert privé, direct et à votre heure",
      de: "Ein privater Transfer, direkt und zu Ihrer Zeit",
    },
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
      fr: [
        "Service exclusif pour votre réservation, jusqu’à 3 passagers.",
        "Porte à porte : prise en charge et dépose directes à l’adresse indiquée.",
        "Chauffeur professionnel pendant tout le trajet.",
      ],
      de: [
        "Exklusiver Service für Ihre Buchung, bis zu 3 Fahrgäste.",
        "Von Tür zu Tür: Abholung und direkte Ankunft an der angegebenen Adresse.",
        "Professioneller Fahrer während der gesamten Fahrt.",
      ],
    },
  },
  {
    id: "shuttle",
    maxPax: 50,
    badge: { es: "Shuttle", en: "Shuttle", fr: "Navette", de: "Shuttle" },
    name: {
      es: "Shuttle · traslado compartido",
      en: "Shuttle · shared transfer",
      fr: "Navette · transfert partagé",
      de: "Shuttle · gemeinsamer Transfer",
    },
    tagline: {
      es: "La opción económica, con paradas",
      en: "The budget option, with stops",
      fr: "L’option économique, avec des arrêts",
      de: "Die günstige Option, mit Zwischenstopps",
    },
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
      fr: [
        "Attend à l’aéroport jusqu’à ce que le départ prévu soit complet.",
        "L’heure définitive de prise en charge est confirmée 24 heures à l’avance.",
        "Le trajet peut comporter des arrêts intermédiaires.",
        "Comprend 1 valise moyenne (jusqu’à 20 kg) et un bagage à main par passager.",
      ],
      de: [
        "Wartet am Flughafen, bis die vorgesehene Abfahrt vollständig ist.",
        "Die endgültige Abholzeit wird 24 Stunden vorher bestätigt.",
        "Die Fahrt kann Zwischenstopps enthalten.",
        "Enthält 1 mittleren Koffer (bis 20 kg) und Handgepäck pro Fahrgast.",
      ],
    },
  },
  {
    id: "vip-2",
    maxPax: 2,
    badge: { es: "VIP", en: "VIP", fr: "VIP", de: "VIP" },
    name: {
      es: "VIP · 2 pasajeros",
      en: "VIP · 2 passengers",
      fr: "VIP · 2 passagers",
      de: "VIP · 2 Fahrgäste",
    },
    tagline: {
      es: "Traslado privado en categoría premium",
      en: "A private transfer in premium class",
      fr: "Un transfert privé en catégorie premium",
      de: "Ein privater Transfer in der Premium-Klasse",
    },
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
      fr: [
        "Catégorie premium : un niveau de confort supérieur au transfert standard.",
        "Véhicules haut de gamme sélectionnés selon disponibilité.",
        "Service souple si vous devez ajuster le trajet ou faire un arrêt.",
      ],
      de: [
        "Premium-Klasse: eine Stufe mehr Komfort als beim Standardtransfer.",
        "Fahrzeuge der Oberklasse, nach Verfügbarkeit ausgewählt.",
        "Flexibler Service, wenn Sie die Route anpassen oder einen Halt einlegen möchten.",
      ],
    },
  },
  {
    id: "vip-2-superior",
    maxPax: 2,
    badge: { es: "Superior", en: "Superior", fr: "Supérieur", de: "Superior" },
    name: {
      es: "VIP Superior · 2 pasajeros",
      en: "VIP Superior · 2 passengers",
      fr: "VIP Supérieur · 2 passagers",
      de: "VIP Superior · 2 Fahrgäste",
    },
    tagline: {
      es: "Traslado premium de categoría superior",
      en: "A premium transfer, superior class",
      fr: "Un transfert premium de catégorie supérieure",
      de: "Ein Premium-Transfer der gehobenen Klasse",
    },
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
      fr: [
        "Confort maximal : une expérience plus exclusive.",
        "Véhicules de représentation sélectionnés selon disponibilité.",
        "Une attention personnalisée dans chaque détail du transfert.",
      ],
      de: [
        "Höchster Komfort: ein exklusiveres Erlebnis.",
        "Repräsentationsfahrzeuge, nach Verfügbarkeit ausgewählt.",
        "Persönliche Betreuung in jedem Detail des Transfers.",
      ],
    },
  },
  {
    id: "vip-6",
    maxPax: 6,
    badge: { es: "VIP", en: "VIP", fr: "VIP", de: "VIP" },
    name: {
      es: "VIP · hasta 6 pasajeros",
      en: "VIP · up to 6 passengers",
      fr: "VIP · jusqu’à 6 passagers",
      de: "VIP · bis zu 6 Fahrgäste",
    },
    tagline: {
      es: "Traslado privado premium para grupos",
      en: "A premium private transfer for groups",
      fr: "Un transfert privé premium pour les groupes",
      de: "Ein privater Premium-Transfer für Gruppen",
    },
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
      fr: [
        "Catégorie premium avec de la place pour 6 passagers.",
        "Véhicules haut de gamme sélectionnés selon disponibilité.",
        "Porte à porte, avec chauffeur professionnel.",
      ],
      de: [
        "Premium-Klasse mit Platz für bis zu 6 Fahrgäste.",
        "Fahrzeuge der Oberklasse, nach Verfügbarkeit ausgewählt.",
        "Von Tür zu Tür, mit professionellem Fahrer.",
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
  { id: "silla-nino", name: { es: "Silla de niño", en: "Child seat", fr: "Siège enfant", de: "Kindersitz" } },
  { id: "maxicosi", name: { es: "Maxicosi", en: "Maxicosi", fr: "Cosy (siège bébé)", de: "Babyschale" } },
  { id: "booster", name: { es: "Elevador (booster)", en: "Booster seat", fr: "Rehausseur", de: "Sitzerhöhung" } },
  { id: "maleta-extra", name: { es: "Maleta extra", en: "Extra suitcase", fr: "Valise supplémentaire", de: "Zusätzlicher Koffer" } },
];

export const EXTRA_IDS: readonly ExtraId[] = EXTRAS.map((e) => e.id);
