/**
 * Configuración global del sitio — ÚNICA fuente de verdad de los datos globales.
 *
 * Cambia aquí el nombre, el dominio, los idiomas activos y las redes.
 * No "hardcodees" estos datos por el resto del código (CLAUDE.md §11).
 *
 * Para AÑADIR UN IDIOMA NUEVO: añade su entrada a `locales` y crea su
 * diccionario en `src/i18n/ui.ts`. No hace falta tocar nada más.
 * (Ver docs/ESTRATEGIA-MULTIIDIOMA.md)
 */

/** Códigos de idioma soportados. Amplía la unión al activar más idiomas. */
export type Locale = 'es' | 'en';

export interface LocaleConfig {
  /** Código corto (prefijo de URL para los no-por-defecto). */
  code: Locale;
  /** Nombre del idioma en su propio idioma, para el selector. */
  label: string;
  /** Valor del atributo `lang` de <html> (incluye región). */
  htmlLang: string;
}

export const SITE = {
  // [PENDIENTE] Nombre y dominio reales — ver docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md
  name: 'Revista Menorca',
  shortName: 'Revista Menorca',
  description:
    'Revista digital independiente sobre Menorca: criterio editorial, dirección de arte y la isla los 365 días del año.',
  url: 'https://revista-menorca.example.com', // [PENDIENTE] dominio real

  /** Idioma por defecto (va en la raíz, sin prefijo). */
  defaultLocale: 'es' as Locale,

  /** Idiomas ACTIVOS. Despliegue por mercados (ver docs/ESTRATEGIA-MULTIIDIOMA.md). */
  locales: [
    { code: 'es', label: 'Español', htmlLang: 'es-ES' },
    { code: 'en', label: 'English', htmlLang: 'en-GB' },
  ] as LocaleConfig[],

  /** Redes sociales (rellenar cuando existan). */
  social: {
    instagram: '', // [PENDIENTE]
  },
};

/** Lista de códigos de idioma, para la configuración de i18n de Astro. */
export const LOCALE_CODES: string[] = SITE.locales.map((l) => l.code);

/** Devuelve la configuración de un idioma (o la del idioma por defecto). */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return SITE.locales.find((l) => l.code === locale) ?? SITE.locales[0];
}
