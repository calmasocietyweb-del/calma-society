/**
 * Constructores de datos estructurados JSON-LD (schema.org) — CLAUDE.md §8.
 * Esto es lo que hace que Google y las IAs nos entiendan y nos citen (GEO).
 * Los campos `undefined` se omiten al serializar a JSON.
 */
import { SITE, type Locale } from "../config/site";

/** Convierte un path en URL absoluta usando el dominio del sitio. */
export const abs = (path: string) => new URL(path, SITE.url).href;

const ogLocale = (locale: Locale) => (locale === "es" ? "es-ES" : "en-GB");

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    sameAs: [SITE.social.instagram].filter(Boolean),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
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
    inLanguage: ogLocale(opts.locale),
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    author: opts.authorName
      ? { "@type": "Person", name: opts.authorName, url: opts.authorUrl }
      : undefined,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    image: opts.image ? [opts.image] : undefined,
  };
}

const PLACE_SCHEMA_TYPE: Record<string, string> = {
  cala: "TouristAttraction",
  restaurante: "Restaurant",
  alojamiento: "LodgingBusiness",
  monumento: "TouristAttraction",
  comercio: "Store",
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": PLACE_SCHEMA_TYPE[opts.type] ?? "Place",
    name: opts.name,
    description: opts.description,
    url: opts.url,
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opts.title,
    description: opts.description,
    startDate: opts.startDate.toISOString().slice(0, 10),
    endDate: (opts.endDate ?? opts.startDate).toISOString().slice(0, 10),
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: opts.location, address: `${opts.location}, Menorca, España` },
    url: opts.url,
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
