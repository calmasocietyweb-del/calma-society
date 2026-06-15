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
  article: { es: "/articulo", en: "/en/article" },
  place: { es: "/lugar", en: "/en/place" },
  author: { es: "/autor", en: "/en/author" },
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

/** Formatea una fecha según el idioma. */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
