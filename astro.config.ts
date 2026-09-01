// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

import { SITE, LOCALE_CODES } from './src/config/site';

// Tailwind CSS v4 se carga vía PostCSS (ver postcss.config.mjs),
// compatible con el bundler Rolldown/Vite de Astro 6.

// TRES MODOS DE BUILD (un solo repo, dos despliegues):
//
//  1) Cloudflare (web pública)  → NI adaptador NI Keystatic. 100% estática,
//     EXACTAMENTE como hasta ahora. Es lo que sirve calmasociety.com.
//     (No hay VERCEL ni npm_lifecycle_event de dev → cmsEnabled = false.)
//
//  2) Desarrollo local (`npm run dev`/`cms`) → Keystatic en modo LOCAL,
//     sin adaptador (lo sirve el dev server). Para trastear en tu PC.
//
//  3) Vercel (panel de edición con login) → Keystatic en modo GitHub +
//     adaptador de Vercel (rutas con servidor para el login). Es el panel
//     que usan los editores desde cualquier ordenador.
//
// Así NUNCA volvemos a meter el adaptador en Cloudflare (que fue lo que congeló
// la web por el KV). Ver memoria deployment-cloudflare.
const onVercel = !!process.env.VERCEL;
const cmsEnabled =
  onVercel ||
  process.env.KEYSTATIC === 'true' ||
  ['dev', 'start', 'cms'].includes(process.env.npm_lifecycle_event ?? '');

// Imán de captación "las calas con menos gente": mientras el flag está apagado,
// la landing va en noindex y NO debe anunciarse en el sitemap (ver site.ts).
const lmLive = SITE.newsletter.leadMagnet.enabled;

// Reservas de transfers: misma mecánica que el imán (noindex + fuera del
// sitemap mientras el interruptor esté apagado).
const bookingsLive = SITE.bookings.enabled;

// ── Rutas que NO deben anunciarse en el sitemap ──────────────────────────────
// Se escriben en un solo sitio y con TODOS los idiomas. Al crear la ruta de un
// idioma nuevo hay que añadirla aquí; lo vigila `src/lib/sitemap-exclusiones.test.ts`,
// que compara estas listas contra las páginas que existen de verdad en `src/pages`.

/** Bienvenida a la Sociedad (va con noindex) y panel interno. */
const NOINDEX_SIEMPRE = [
  "/sociedad-bienvenida",
  "/society-welcome",
  "/societe-bienvenue",
  "/willkommen-in-der-society",
  "/benvenuti-nella-society",
  "/bem-vindo-a-society",
  "/panel/",
];

/** Imán de captación: solo entra cuando `leadMagnet.enabled`. */
const RUTAS_LEAD_MAGNET = ["/calas-tranquilas", "/quiet-coves"];

/** Reserva de transfers: solo entra cuando `bookings.enabled`. */
const RUTAS_RESERVAS = [
  "/reservar-traslado",
  "/book-transfer",
  "/reserver-un-transfert",
  "/transfer-buchen",
];

// https://astro.build/config
export default defineConfig({
  site: SITE.url,

  // Adaptador SOLO en Vercel (panel de edición). En Cloudflare y en local NO hay
  // adaptador → la web pública sigue siendo estática pura.
  adapter: onVercel ? vercel() : undefined,

  // i18n nativa de Astro, preparada para multi-idioma.
  // El idioma por defecto (es) va en la raíz; el resto bajo prefijo (/en, /de…).
  i18n: {
    defaultLocale: SITE.defaultLocale,
    locales: LOCALE_CODES,
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    // Paneles internos con datos (socios/analítica/reservas): en Vercel deben ser
    // SSR de verdad. ⚠️ Un `export const prerender = <expresión>` en la página NO
    // funciona (Astro solo analiza literales y cae al default estático): con las
    // credenciales puestas, la build llegó a HORNEAR el 401 como HTML público
    // (KAN-122, 18-ago-2026). Por eso se decide AQUÍ, donde sí sabemos si hay
    // adaptador, con el hook oficial astro:route:setup.
    {
      name: 'panel-ssr-en-vercel',
      hooks: {
        'astro:route:setup': ({ route }) => {
          if (onVercel && /panel[\\/](socios|analitica|reservas)\.astro$/.test(route.component)) {
            route.prerender = false;
          }
        },
      },
    } satisfies import('astro').AstroIntegration,
    mdx(),
    sitemap({
      // Excluye del sitemap lo que va con `noindex` y el panel interno.
      //
      // ⚠️ Las listas de rutas se escriben ENTERAS, con todos los idiomas, y se
      // comprueban en `src/lib/sitemap-exclusiones.test.ts`. El 1-sep-2026 aquí
      // solo estaban las variantes es/en/fr de la página de bienvenida, así que
      // las versiones ALEMANA, ITALIANA y PORTUGUESA se anunciaban a Google
      // llevando `noindex` — una señal contradictoria que nadie había mirado.
      filter: (page) =>
        !NOINDEX_SIEMPRE.some((r) => page.includes(r)) &&
        // El imán entra en el sitemap solo cuando está vivo (si no, va noindex).
        (lmLive || !RUTAS_LEAD_MAGNET.some((r) => page.includes(r))) &&
        // Reservas de transfers: en el sitemap solo con el interruptor encendido.
        (bookingsLive || !RUTAS_RESERVAS.some((r) => page.includes(r))),
      // Enlaces hreflang entre idiomas. Se derivan de `SITE.locales` para que
      // añadir un idioma no deje su hreflang fuera sin que nadie se entere:
      // hasta el 1-sep-2026 aquí solo había es/en/fr y el alemán —el segundo
      // mercado con más demanda— no recibía anotación ninguna.
      i18n: {
        defaultLocale: SITE.defaultLocale,
        locales: Object.fromEntries(
          SITE.locales.map((l) => [l.code, l.htmlLang]),
        ) as Record<string, string>,
      },
    }),
    // React + Keystatic solo en desarrollo y en Vercel (NUNCA en Cloudflare).
    ...(cmsEnabled ? [react(), keystatic()] : []),
  ],

  vite: {
    server: {
      watch: {
        // El vigilante de archivos NO debe seguir las carpetas de material
        // fuente en bruto (fotos/vídeos pesados que Adobe mantiene bloqueados)
        // ni los archivos temporales. Si no, en Windows lanza errores
        // "unhandled rejection" EBUSY/ENOENT en cascada. Estas carpetas ya
        // están fuera del repo (.gitignore); aquí las sacamos del vigilante.
        ignored: [
          "**/MATERIAL FOTOS RRSS/**",
          "**/MATERIAL VIDEOS RRSS/**",
          // Operativa de redes sociales: assets pesados, Remotion y node_modules
          // propios. Fuera del vigilante (igual que el material) para no romper
          // el dev server en Windows con EBUSY/ENOENT.
          "**/REDES-SOCIALES/**",
          "**/*.tmp.*",
        ],
      },
    },
  },
});
