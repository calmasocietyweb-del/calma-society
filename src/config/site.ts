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
  // Marca paraguas premium. Menorca es la PRIMERA EDICIÓN; ampliable a otros
  // destinos (ver docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md).
  name: 'Calma Society',
  shortName: 'Calma',
  /** Edición/destino actual. Mañana: 'Mallorca', 'Cyclades'… */
  edition: 'Menorca',
  description:
    'Calma Society — el arte del lujo tranquilo en el Mediterráneo. Primera edición: Menorca, sus experiencias elevadas.',
  url: 'https://calmasociety.com',

  /** Token de verificación de Google Search Console (método "etiqueta HTML"). */
  googleSiteVerification: 'lRhppI_bkJUfmIJUuXg6D15p7A2eJV1CMEpzb-a1djk', // Google Search Console (etiqueta HTML)

  /** Idioma por defecto (va en la raíz, sin prefijo). */
  defaultLocale: 'es' as Locale,

  /** Idiomas ACTIVOS. Despliegue por mercados (ver docs/ESTRATEGIA-MULTIIDIOMA.md). */
  locales: [
    { code: 'es', label: 'Español', htmlLang: 'es-ES' },
    { code: 'en', label: 'English', htmlLang: 'en-GB' },
  ] as LocaleConfig[],

  /** Redes sociales. */
  social: {
    instagram: 'https://www.instagram.com/calma.society/',
  },

  /**
   * Negocios propios / socios a los que dirigimos tráfico (ver
   * docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md: "tráfico a negocios propios").
   * Menorca Bus es el servicio de transporte/transfers del mismo grupo titular
   * (Menorca Bus, S.L.). Única fuente de la URL: cámbiala solo aquí.
   */
  partners: {
    menorcaBus: {
      name: 'Menorca Bus',
      url: 'https://menorcabus.com',
    },
  },

  /**
   * Analítica web (Umami, sin cookies → respeta la privacidad, CLAUDE.md #7).
   * Mide páginas vistas y clics en enlaces/CTAs (atributos data-umami-event).
   *
   * Para ACTIVAR la medición en la web pública:
   *   1. Crea el sitio en Umami (cloud gratis: https://cloud.umami.is — o self-host).
   *   2. Pega aquí su `websiteId` (público) y pon `enabled: true`.
   *
   * El DASHBOARD a medida (panel de Vercel, /panel/analitica) lee la API de Umami
   * con variables de entorno SECRETAS en Vercel (NUNCA en el repo):
   *   UMAMI_API_URL (p.ej. https://api.umami.is/v1), UMAMI_API_KEY, UMAMI_WEBSITE_ID,
   *   PANEL_USER, PANEL_PASS (usuario/clave del panel).
   */
  analytics: {
    provider: 'umami' as const,
    enabled: false,
    websiteId: '', // pega el ID público de Umami y pon enabled: true
    scriptUrl: 'https://cloud.umami.is/script.js', // self-host: cambia la URL
  },

  /**
   * Newsletter (MailerLite). Pega aquí la URL "action" del formulario embebido
   * (MailerLite → Forms → Embedded form → versión HTML → copia el `action`).
   * Mientras esté vacío, el formulario se muestra pero no envía.
   */
  newsletter: {
    // Interruptor general: false = newsletter EN PAUSA (no carga MailerLite,
    // no aparece el pop-up ni los botones). Ponlo en true cuando quieras lanzarla.
    enabled: false,
    provider: 'mailerlite' as const,
    accountId: '2445939', // ID de cuenta MailerLite (script universal)
    // Formulario emergente (pop-up): nuestro botón abre el formulario de MailerLite.
    popupFormId: 'ETGJGK',
    // Alternativas: URL "action" de la versión HTML, o "data-form" del embebido.
    action: '',
    formId: '',
    emailField: 'fields[email]',
  },

  /**
   * Formulario de contacto. Endpoint que recibe el envío (p. ej. Formspree).
   * Mientras esté vacío, se muestra el correo de contacto en su lugar.
   */
  forms: {
    contact: 'https://formspree.io/f/xzdqwzrq', // Formspree → calmasocietyweb@gmail.com
  },

  /** Correo de contacto público. */
  email: 'calmasocietyweb@gmail.com',

  /** Datos de la empresa titular (para páginas legales). */
  company: {
    legalName: 'Menorca Bus, S.L.',
    responsible: 'Cristian Camps',
    email: 'calmasocietyweb@gmail.com',
    phone: '670 424 593',
    cif: 'B07642218',
    address: 'C/ Bajolí 7, POIMA, 07714 Maó (Menorca), Illes Balears',
  },
};

/** Lista de códigos de idioma, para la configuración de i18n de Astro. */
export const LOCALE_CODES: string[] = SITE.locales.map((l) => l.code);

/** Devuelve la configuración de un idioma (o la del idioma por defecto). */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return SITE.locales.find((l) => l.code === locale) ?? SITE.locales[0];
}
