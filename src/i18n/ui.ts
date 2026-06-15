/**
 * Diccionarios de la INTERFAZ (menús, botones, etiquetas) por idioma.
 * El contenido editorial NO va aquí: vive en las content collections (Fase 2).
 *
 * Para añadir un idioma: añade su bloque con las mismas claves.
 * (Ver docs/ESTRATEGIA-MULTIIDIOMA.md)
 */
import { SITE, type Locale } from '../config/site';

export const ui = {
  es: {
    'site.tagline': 'La isla, los 365 días del año.',
    'nav.home': 'Inicio',
    'lang.switch': 'English',
    'home.building': 'Estamos construyendo la revista. Pronto, mucho más.',
  },
  en: {
    'site.tagline': 'The island, 365 days a year.',
    'nav.home': 'Home',
    'lang.switch': 'Español',
    'home.building': 'We are building the magazine. Much more, soon.',
  },
} satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['es'];

/** Devuelve una función de traducción `t('clave')` para el idioma dado. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui[SITE.defaultLocale][key];
  };
}
