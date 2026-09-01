/**
 * Constructores de datos estructurados JSON-LD (schema.org) — CLAUDE.md §8.
 * Esto es lo que hace que Google y las IAs nos entiendan y nos citen (GEO).
 * Los campos `undefined` se omiten al serializar a JSON.
 */
import { SITE, getLocaleConfig, type Locale } from "../config/site";

/** Convierte un path en URL absoluta usando el dominio del sitio. */
export const abs = (path: string) => new URL(path, SITE.url).href;

/**
 * Etiqueta BCP-47 del idioma para `inLanguage`. Sale de `site.ts`, que es la
 * única fuente de los idiomas activos: estaba a mano como `es ? "es-ES" :
 * "en-GB"`, así que un artículo ALEMÁN le declaraba a Google y a la IA que
 * estaba escrito en inglés británico (KAN-133).
 */
const bcp47 = (locale: Locale) => getLocaleConfig(locale).htmlLang;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: abs("/icon-512.png"),
    image: abs("/og-default.png"),
    email: SITE.email,
    telephone: SITE.company.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "C/ Bajolí 7, POIMA",
      addressLocality: "Maó",
      postalCode: "07714",
      addressRegion: "Illes Balears",
      addressCountry: "ES",
    },
    sameAs: [SITE.social.instagram].filter(Boolean),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    // Todos los idiomas activos, no una lista a mano que se queda vieja.
    inLanguage: SITE.locales.map((l) => l.htmlLang),
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  locale: Locale;
  datePublished: Date;
  dateModified?: Date;
  authorName?: string;
  authorUrl?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    mainEntityOfPage: opts.url,
    inLanguage: bcp47(opts.locale),
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    author: opts.authorName
      ? { "@type": "Person", name: opts.authorName, url: opts.authorUrl }
      : undefined,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    image: opts.image ? [opts.image] : undefined,
  };
}

/* Cada tipo de lugar a su @type de schema.org (KAN-131). Cuanto más preciso, más
   fácil es que Google dé resultado enriquecido y que la IA nos cite bien. "Place"
   queda solo como red de seguridad para lo que de verdad no encaja en nada. */
const PLACE_SCHEMA_TYPE: Record<string, string> = {
  cala: "Beach",
  restaurante: "Restaurant",
  bodega: "Winery",
  productor: "FoodEstablishment",
  bar: "BarOrPub",
  experiencia: "TouristTrip",
  ruta: "TouristTrip",
  naturaleza: "Park",
  monumento: "TouristAttraction",
  museo: "Museum",
  spa: "HealthAndBeautyBusiness",
  alojamiento: "LodgingBusiness",
  comercio: "Store",
  pueblo: "City",
  otro: "Place",
};

export function placeSchema(opts: {
  name: string;
  description: string;
  url: string;
  type: string;
  area: string;
  lat: number;
  lng: number;
  priceRange?: string;
  website?: string;
  images?: string[];
}) {
  // Imágenes a URL absoluta (rich results las exigen). `abs` acepta rutas
  // relativas (/uploads/…) y URLs completas por igual.
  const image =
    opts.images && opts.images.length > 0
      ? opts.images.map(abs)
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": PLACE_SCHEMA_TYPE[opts.type] ?? "Place",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    image,
    address: { "@type": "PostalAddress", addressLocality: opts.area, addressRegion: "Menorca", addressCountry: "ES" },
    geo: { "@type": "GeoCoordinates", latitude: opts.lat, longitude: opts.lng },
    priceRange: opts.priceRange,
    sameAs: opts.website ? [opts.website] : undefined,
  };
}

export function eventSchema(opts: {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  url?: string;
  image?: string;
  /** Coordenadas del lugar (si el evento referencia una ficha de `lugares`). */
  geo?: { lat: number; lng: number };
  /** Web oficial del evento (sourceUrl): refuerza la entidad sin disputar `url`. */
  sameAs?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opts.title,
    description: opts.description,
    startDate: opts.startDate.toISOString().slice(0, 10),
    endDate: (opts.endDate ?? opts.startDate).toISOString().slice(0, 10),
    eventStatus: "https://schema.org/EventScheduled",
    // Todos los eventos de la agenda son presenciales (sin streaming).
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: opts.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: opts.location,
        addressRegion: "Menorca",
        addressCountry: "ES",
      },
      geo: opts.geo
        ? { "@type": "GeoCoordinates", latitude: opts.geo.lat, longitude: opts.geo.lng }
        : undefined,
    },
    // Imagen del evento (rich results de Event la destacan). A URL absoluta.
    image: opts.image ? [abs(opts.image)] : undefined,
    url: opts.url,
    sameAs: opts.sameAs ? [opts.sameAs] : undefined,
  };
}

/**
 * `TouristAttraction` para las fichas de "Cosas que hacer".
 *
 * POR QUÉ NO ES UN `Event`. Las fichas perennes no son citas: son cosas que se
 * pueden hacer cualquier día de su temporada. Emitirlas como `Event` obligaría a
 * declarar un `startDate` y un `endDate` que no significan lo que dicen —
 * afirmarle a Google y a la IA que "subir al Toro" empieza el 1 de enero y
 * termina el 31 de diciembre. Es dato estructurado falso, justo lo que este
 * proyecto no hace (CLAUDE.md §8 y §12). `TouristAttraction` dice la verdad:
 * esto es un sitio o una experiencia que se visita, y la temporada va en texto.
 */
export function touristAttractionSchema(opts: {
  name: string;
  description: string;
  /** Zona o municipio; alimenta la dirección postal aproximada. */
  location: string;
  url?: string;
  image?: string;
  geo?: { lat: number; lng: number };
  /** Web oficial del lugar o del operador (sourceUrl). */
  sameAs?: string;
  /** Temporada en palabras ("Todo el año", "De mayo a octubre"). */
  openingHours?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: opts.name,
    description: opts.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: opts.location,
      addressRegion: "Menorca",
      addressCountry: "ES",
    },
    geo: opts.geo
      ? { "@type": "GeoCoordinates", latitude: opts.geo.lat, longitude: opts.geo.lng }
      : undefined,
    image: opts.image ? [abs(opts.image)] : undefined,
    url: opts.url,
    sameAs: opts.sameAs ? [opts.sameAs] : undefined,
    openingHours: opts.openingHours,
  };
}

export function personSchema(opts: {
  name: string;
  description?: string;
  url: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    sameAs: opts.sameAs?.filter(Boolean),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
