// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { SITE, LOCALE_CODES } from './src/config/site';

import cloudflare from '@astrojs/cloudflare';

// Tailwind CSS v4 se carga vía PostCSS (ver postcss.config.mjs),
// compatible con el bundler Rolldown/Vite de Astro 6.

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
  ],

  adapter: cloudflare(),
});