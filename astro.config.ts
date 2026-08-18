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
      // Excluye las páginas de confirmación ("gracias"), que van con noindex,
      // y el panel interno (/panel/), que no debe anunciarse a buscadores.
      filter: (page) =>
        !page.includes("/sociedad-bienvenida") &&
        !page.includes("/society-welcome") &&
        !page.includes("/societe-bienvenue") &&
        !page.includes("/panel/") &&
        // El imán entra en el sitemap solo cuando está vivo (si no, va noindex).
        (lmLive ||
          (!page.includes("/calas-tranquilas") && !page.includes("/quiet-coves"))) &&
        // Reservas de transfers: en el sitemap solo con el interruptor encendido.
        (bookingsLive ||
          (!page.includes("/reservar-traslado") && !page.includes("/book-transfer"))),
      // Añade enlaces hreflang entre idiomas en el sitemap.
      i18n: {
        defaultLocale: "es",
        locales: { es: "es-ES", en: "en-GB", fr: "fr-FR" },
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
