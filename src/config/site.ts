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
export type Locale = 'es' | 'en' | 'fr';

export interface LocaleConfig {
  /** Código corto (prefijo de URL para los no-por-defecto). */
  code: Locale;
  /** Nombre del idioma en su propio idioma, para el selector. */
  label: string;
  /** Valor del atributo `lang` de <html> (incluye región). */
  htmlLang: string;
  /**
   * Despliegue del idioma. 'full' = traducido en todo el sitio (es, en).
   * 'partial' = desplegado POR MERCADOS, solo en algunas páginas (fr): el selector
   * solo ofrece este idioma donde la página declara su `alternate` (evita enlazar
   * a páginas que aún no existen → cero "huérfanas"). Ver docs/ESTRATEGIA-MULTIIDIOMA.md.
   */
  rollout?: 'full' | 'partial';
}

export const SITE = {
  // Marca paraguas premium. Menorca es la PRIMERA EDICIÓN; ampliable a otros
  // destinos (ver docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md).
  name: 'Calma Society',
  shortName: 'Calma',
  /** Edición/destino actual. Mañana: 'Mallorca', 'Cyclades'… */
  edition: 'Menorca',
  description:
    'Calma Society — el Mediterráneo, sin prisa: una mirada de lujo tranquilo. Primera edición: Menorca, sus experiencias elevadas.',
  url: 'https://calmasociety.com',

  /** Token de verificación de Google Search Console (método "etiqueta HTML"). */
  googleSiteVerification: 'lRhppI_bkJUfmIJUuXg6D15p7A2eJV1CMEpzb-a1djk', // Google Search Console (etiqueta HTML)

  /** Idioma por defecto (va en la raíz, sin prefijo). */
  defaultLocale: 'es' as Locale,

  /** Idiomas ACTIVOS. Despliegue por mercados (ver docs/ESTRATEGIA-MULTIIDIOMA.md). */
  locales: [
    { code: 'es', label: 'Español', htmlLang: 'es-ES', rollout: 'full' },
    { code: 'en', label: 'English', htmlLang: 'en-GB', rollout: 'full' },
    // Francés: arranque POR MERCADOS (jun 2026) — solo en las páginas perennes
    // traducidas (herramientas + faro). El selector solo lo muestra donde existe.
    { code: 'fr', label: 'Français', htmlLang: 'fr-FR', rollout: 'partial' },
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
      // Código promocional del lector (Capa 2) — se canjea en el checkout de
      // menorcabus.com. Única fuente: cámbialo o cadúcalo solo aquí. Cuando pasa
      // `until`, el componente MenorcaBusPromo deja de mostrarlo en toda la web.
      promo: {
        code: 'CALMASOCIETY',
        amount: '10 €',
        until: '2026-12-31',
      },
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
    enabled: true,
    websiteId: '4d0dc279-733a-43b7-b0f7-861e16c6b688', // ID público de Umami (cloud)
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
    // true = MailerLite ACTIVO (jun 2026): los correos entran en la lista de
    // MailerLite vía el formulario embebido (formId abajo). El aspecto del
    // formulario se edita en MailerLite. Con esto, el modo Formspree y nuestro
    // popup propio quedan en pausa (los gestiona MailerLite).
    enabled: true,
    // CAPTACIÓN DE FUNDADORES (modo puente mientras MailerLite está en pausa).
    // Con `enabled:false` pero `capture.enabled:true` mostramos el formulario de
    // "la Sociedad" y recogemos los correos por Formspree (encargado ya declarado
    // en privacidad), con consentimiento RGPD. NO se envían campañas: solo se crea
    // la LISTA DE FUNDADORES. Al reactivar MailerLite (enabled:true) este modo se
    // ignora y manda MailerLite. Es el KPI nº1 (CLAUDE.md §3.1).
    capture: {
      enabled: true,
      // Endpoint Formspree que recibe los correos. Por defecto reutiliza el del
      // formulario de contacto; crea uno DEDICADO en formspree.io y pégalo aquí
      // para separar la lista de fundadores de los mensajes de contacto.
      endpoint: 'https://formspree.io/f/xzdqwzrq',
    },
    // Ventana flotante (popup) de captación. NO salta al entrar (eso molesta):
    // aparece cuando el lector ha bajado `scrollPercent`% de la página, UNA sola
    // vez, y se puede cerrar (X / ESC / clic fuera). Si la cierra o se une, no
    // vuelve a salir. Pon `enabled:false` para desactivarla del todo.
    popup: {
      enabled: true,
      scrollPercent: 35, // % de scroll antes de aparecer (sube el número = más tarde)
    },
    provider: 'mailerlite' as const,
    accountId: '2445939', // ID de cuenta MailerLite (script universal)
    // Formulario emergente (pop-up): nuestro botón abre el formulario de MailerLite.
    popupFormId: 'ETGJGK',
    // Formulario EMBEBIDO de MailerLite (data-form). Su JS lo renderiza dentro de
    // la web; el aspecto se edita en MailerLite (Forms → Embedded forms → GIibQ8).
    action: '',
    formId: 'GIibQ8',
    emailField: 'fields[email]',
    /**
     * Imán de captación "Las calas con menos gente" (lead magnet · KPI nº1).
     * Con `enabled: true` la landing /calas-tranquilas (+ /en/quiet-coves) se
     * INDEXA y se ENLAZA, y aparecen sus colocaciones (home, /newsletter). Mientras
     * sea `false`, la landing existe pero queda en `noindex` y sin enlazar (modo
     * previsualización): así no PROMETEMOS una guía que todavía no se entrega.
     *
     * Enciéndelo SOLO cuando estén listas las dos patas de la ENTREGA, en ES y EN:
     *   1. Los PDF maquetados (marca) con su URL de descarga (uno por idioma).
     *   2. En MailerLite: grupos `calas-en-calma` (ES) y `calas-en-calma-en` (EN)
     *      + una automatización de bienvenida por idioma (3 correos) que entrega
     *      el PDF + su formulario embebido por idioma (formIds abajo).
     */
    leadMagnet: {
      enabled: true,
      // formId del formulario EMBEBIDO de MailerLite POR IDIOMA, cada uno ligado a
      // su grupo (`calas-en-calma` ES / `calas-en-calma-en` EN) — Forms → Embedded.
      // Vacío = la landing de ese idioma usa el formulario general.
      // Montados el 2026-06-30 (doble opt-in + automatización de bienvenida de 3 correos).
      formIds: { es: '0vOXXn', en: '7HCJAQ' },
      // Rutas de la landing por idioma (para enlazarla desde las colocaciones).
      paths: { es: '/calas-tranquilas', en: '/en/quiet-coves' },
    },
  },

  /**
   * Reservas de transfers (v1 APAGADA — spec docs/superpowers/specs/
   * 2026-07-06-reservas-transfers-design.md). Mientras `enabled` sea false:
   * la página existe pero va en noindex, fuera del sitemap y sin enlazar;
   * la API de Cloudflare responde 503 (variable BOOKINGS_ENABLED aparte).
   * Encendido completo: docs/RESERVAS-TRANSFERS.md.
   */
  bookings: {
    enabled: false,
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
