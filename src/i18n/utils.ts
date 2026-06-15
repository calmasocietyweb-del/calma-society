/**
 * Utilidades de i18n: detectar el idioma actual desde la URL y construir
 * las URLs equivalentes en otros idiomas.
 *
 * Nota: por ahora asume que el slug es el mismo entre idiomas. Cuando el
 * contenido tenga slugs traducidos (Fase 3+), el cálculo se afinará usando
 * `translationKey`. Ver docs/ESTRATEGIA-MULTIIDIOMA.md.
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

/** URL del mismo contenido en el idioma `target`. */
export function localizedPath(pathname: string, target: Locale): string {
  const base = stripLocale(pathname);
  if (target === SITE.defaultLocale) return base;
  return base === "/" ? `/${target}/` : `/${target}${base}`;
}

/** URL de la home en un idioma. */
export function homePath(locale: Locale): string {
  return locale === SITE.defaultLocale ? "/" : `/${locale}/`;
}
