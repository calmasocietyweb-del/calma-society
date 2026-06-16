// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import { SITE, LOCALE_CODES } from './src/config/site';

// Tailwind CSS v4 se carga vía PostCSS (ver postcss.config.mjs),
// compatible con el bundler Rolldown/Vite de Astro 6.

// EDITOR VISUAL (Keystatic): solo se activa al editar en local (`npm run dev`).
// En la build de producción (Cloudflare) NO se carga, así el sitio sigue 100%
// estático y el despliegue no se ve afectado. Las rutas de Keystatic necesitan
// servidor, y aquí no usamos adaptador: por eso queda restringido a desarrollo.
const cmsEnabled =
  process.env.KEYSTATIC === 'true' ||
  ['dev', 'start', 'cms'].includes(process.env.npm_lifecycle_event ?? '');

// https://astro.build/config
export default defineConfig({
  site: SITE.url,

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
    mdx(),
    sitemap({
      // Añade enlaces hreflang entre idiomas en el sitemap.
      i18n: {
        defaultLocale: "es",
        locales: { es: "es-ES", en: "en-GB" },
      },
    }),
    // React + Keystatic SOLO en desarrollo (ver nota arriba).
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
          "**/*.tmp.*",
        ],
      },
    },
  },
});
