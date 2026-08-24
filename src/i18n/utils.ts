/**
 * Utilidades de i18n: detectar el idioma actual desde la URL, construir las
 * URLs equivalentes en otros idiomas y las URLs de cada tipo de contenido.
 *
 * El selector de idioma usa, cuando puede, las traducciones ligadas por
 * `translationKey` (ver lib/content.ts). Ver docs/ESTRATEGIA-MULTIIDIOMA.md.
 */
import { SITE, type Locale } from "../config/site";

/** Idioma actual a partir del path (`/en/...` → 'en'; raíz → idioma por defecto). */
export function currentLocale(pathname: string): Locale {
  for (const { code } of SITE.locales) {
    if (code === SITE.defaultLocale) continue;
    if (pathname === `/${code}` || pathname.startsWith(`/${code}/`)) return code;
  }
  return SITE.defaultLocale;
}

/** Quita el prefijo de idioma y devuelve el path base (siempre empieza por '/'). */
export function stripLocale(pathname: string): string {
  for (const { code } of SITE.locales) {
    if (code === SITE.defaultLocale) continue;
    if (pathname === `/${code}` || pathname === `/${code}/`) return "/";
    if (pathname.startsWith(`/${code}/`)) return pathname.slice(code.length + 1);
  }
  return pathname || "/";
}

/** URL del mismo path en el idioma `target` (asume mismo slug). */
export function localizedPath(pathname: string, target: Locale): string {
  const base = stripLocale(pathname);
  if (target === SITE.defaultLocale) return base;
  return base === "/" ? `/${target}/` : `/${target}${base}`;
}

/** URL de la home en un idioma. */
export function homePath(locale: Locale): string {
  return locale === SITE.defaultLocale ? "/" : `/${locale}/`;
}

// ---- URLs de los tipos de contenido (prefijos traducidos por idioma) ----

const PREFIX = {
  article: { es: "/articulo", en: "/en/article", fr: "/fr/article", de: "/de/artikel", it: "/it/articolo", pt: "/pt/artigo" },
  place: { es: "/lugar", en: "/en/place", fr: "/fr/lieu", de: "/de/ort", it: "/it/luogo", pt: "/pt/local" },
  author: { es: "/autor", en: "/en/author", fr: "/fr/auteur", de: "/de/autor", it: "/it/autore", pt: "/pt/autor" },
  // Detalle de evento: cuelga de la propia agenda (KAN-102). FR aún no tiene
  // eventos publicados; el prefijo existe para que el tipo no se rompa al
  // activar ese mercado.
  event: { es: "/agenda", en: "/en/whats-on", fr: "/fr/agenda", de: "/de/veranstaltungen", it: "/it/eventi", pt: "/pt/eventos" },
} satisfies Record<string, Record<Locale, string>>;

export function articleUrl(locale: Locale, slug: string): string {
  return `${PREFIX.article[locale]}/${slug}`;
}

export function placeUrl(locale: Locale, slug: string): string {
  return `${PREFIX.place[locale]}/${slug}`;
}

export function authorUrl(locale: Locale, slug: string): string {
  return `${PREFIX.author[locale]}/${slug}`;
}

export function eventUrl(locale: Locale, slug: string): string {
  return `${PREFIX.event[locale]}/${slug}`;
}

/** Índice de lugares (la puerta de entrada a las fichas; ver lib/places.ts). */
const PLACES_INDEX = {
  es: "/lugares",
  en: "/en/places",
  fr: "/fr/lieux",
  de: "/de/orte",
  it: "/it/luoghi",
  pt: "/pt/locais",
} satisfies Record<Locale, string>;

export function placesIndexPath(locale: Locale): string {
  return PLACES_INDEX[locale];
}

/**
 * Política de privacidad por idioma. ÚNICA fuente para los formularios con
 * consentimiento RGPD (suscripción, contacto, planificador): componer el path
 * a mano (`/${locale}/privacy`) generó 404 en FR (/fr/privacy no existe).
 */
const PRIVACY_PATH = {
  es: "/privacidad",
  en: "/en/privacy",
  fr: "/fr/confidentialite",
  de: "/de/datenschutz",
  it: "/it/privacy",
  pt: "/pt/privacidade",
} satisfies Record<Locale, string>;

export function privacyPath(locale: Locale): string {
  return PRIVACY_PATH[locale];
}

/**
 * Puerta de entrada de negocios de la isla (ficha editorial gratuita). Se
 * enlaza desde el pie de las ~330 fichas de lugar, y esas fichas existen
 * también en FR: por eso los tres idiomas tienen página, igual que privacidad.
 */
const BUSINESS_PATH = {
  es: "/para-negocios",
  en: "/en/for-businesses",
  fr: "/fr/pour-les-professionnels",
  de: "/de/fuer-unternehmen",
  it: "/it/per-le-aziende",
  pt: "/pt/para-empresas",
} satisfies Record<Locale, string>;

export function businessPath(locale: Locale): string {
  return BUSINESS_PATH[locale];
}

/**
 * Página de bienvenida tras darse de alta. Es el `redirect` del formulario de
 * captación, así que un path mal compuesto no da un enlace roto: se lleva por
 * delante el final del alta.
 *
 * Estaba a mano en `SocietyCaptureForm` como `es ? "/sociedad-bienvenida" :
 * "/en/society-welcome"` — exactamente el fallo que ya documenta PRIVACY_PATH
 * más arriba: al lector FRANCÉS que se suscribía se le devolvía a la página de
 * gracias en INGLÉS, existiendo /fr/societe-bienvenue (KAN-133).
 */
const WELCOME_PATH = {
  es: "/sociedad-bienvenida",
  en: "/en/society-welcome",
  fr: "/fr/societe-bienvenue",
  de: "/de/willkommen-in-der-society",
  it: "/it/benvenuti-nella-society",
  pt: "/pt/bem-vindo-a-society",
} satisfies Record<Locale, string>;

export function welcomePath(locale: Locale): string {
  return WELCOME_PATH[locale];
}

/** Locale BCP-47 por idioma (para Intl: fechas, números…). */
export const INTL_LOCALE: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT", // portugués EUROPEO, no de Brasil (ver docs/GLOSARIO-TRADUCCION.md)
};

/** Formatea una fecha según el idioma. */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
