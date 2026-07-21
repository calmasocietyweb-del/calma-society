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
  article: { es: "/articulo", en: "/en/article", fr: "/fr/article" },
  place: { es: "/lugar", en: "/en/place", fr: "/fr/lieu" },
  author: { es: "/autor", en: "/en/author", fr: "/fr/auteur" },
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

/** Índice de lugares (la puerta de entrada a las fichas; ver lib/places.ts). */
const PLACES_INDEX = {
  es: "/lugares",
  en: "/en/places",
  fr: "/fr/lieux",
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
} satisfies Record<Locale, string>;

export function privacyPath(locale: Locale): string {
  return PRIVACY_PATH[locale];
}

/** Locale BCP-47 por idioma (para Intl: fechas, números…). */
export const INTL_LOCALE: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  fr: "fr-FR",
};

/** Formatea una fecha según el idioma. */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
