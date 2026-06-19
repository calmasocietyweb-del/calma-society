/**
 * Modelo de contenido (Astro Content Layer) — CLAUDE.md §6 y §6 bis.
 *
 * Claves transversales del proyecto:
 *  - `status`  → cortafuegos de aprobación: nada se publica sin visto bueno.
 *  - `translationKey` → une las versiones de idioma de una misma pieza.
 *  - `edition` → marca paraguas: 'menorca' hoy, otros destinos mañana (ampliable).
 *
 * Las imágenes optimizadas (astro:assets) se conectan cuando lleguen fotos
 * reales con el contenido; por eso varias son opcionales en esta fase.
 */
import { defineCollection, reference } from "astro:content";
import { z } from "astro:schema";
import { glob } from "astro/loaders";

// Mantener en sync con los locales activos de src/config/site.ts
const LOCALE = z.enum(["es", "en"]);

// Ciclo de vida del contenido (ver docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md)
const STATUS = z.enum(["draft", "pending", "published"]).default("draft");

const SECTION = z.enum([
  "descubrir",
  "agenda",
  "comer-y-beber",
  "vivir",
  "cultura",
  "practica",
]);

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
  })
  .optional();

/** Artículos editoriales (Markdown/MDX). */
const articulos = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articulos" }),
  schema: z
      .object({
        title: z.string(),
        lang: LOCALE,
        translationKey: z.string(),
        section: SECTION,
        edition: z.string().default("menorca"),
        excerpt: z.string(),
        publishDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        author: reference("autores"),
        heroImage: z.string().optional(), // ruta pública (p. ej. /uploads/foto.jpg), gestionable desde el CMS
        heroImageAlt: z.string().optional(),
        heroImageCredit: z.string().optional(), // pie de foto / crédito (autor o fuente), p. ej. "Adobe Stock"
        tags: z.array(z.string()).default([]),
        status: STATUS,
        featured: z.boolean().default(false),
        sponsored: z.boolean().default(false),
        source: z
          .enum(["humano", "auto-agenda", "auto-traduccion"])
          .default("humano"),
        translationStatus: z
          .enum(["original", "auto-sin-revisar", "revisado"])
          .default("original"),
        seo,
        relatedPlaces: z.array(reference("lugares")).optional(),
      })
      // El alt es OBLIGATORIO si hay imagen (accesibilidad, CLAUDE.md §6).
      .refine((d) => !d.heroImage || !!d.heroImageAlt, {
        message: "heroImageAlt es obligatorio cuando hay heroImage",
        path: ["heroImageAlt"],
      }),
});

/** Lugares reutilizables (calas, restaurantes, alojamientos…). Datos → JSON. */
const lugares = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/lugares" }),
  schema: z.object({
    name: z.string(),
    lang: LOCALE,
    translationKey: z.string(),
    type: z.enum([
      "cala",
      "restaurante",
      "alojamiento",
      "monumento",
      "comercio",
      "otro",
    ]),
    edition: z.string().default("menorca"),
    description: z.string(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }),
    area: z.string(), // norte/sur/este/oeste o municipio
    images: z.array(z.string()).default([]),
    practicalInfo: z
      .object({
        acceso: z.string().optional(),
        aparcamiento: z.string().optional(),
        servicios: z.string().optional(),
        mejorEpoca: z.string().optional(),
        horario: z.string().optional(),
      })
      .optional(),
    priceRange: z.enum(["€", "€€", "€€€", "€€€€"]).optional(),
    website: z.url().optional(),
    tags: z.array(z.string()).default([]),
    status: STATUS,
    // `description` es texto editorial visible en la ficha; si es muy largo para
    // la etiqueta <meta description> (>160), `seo.description` la sustituye SOLO
    // en el <head> (el texto en pantalla no cambia). Ver Seo.astro.
    seo,
  }),
});

/** Agenda de eventos. Datos → JSON. */
const eventos = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/eventos" }),
  schema: z.object({
    title: z.string(),
    lang: LOCALE,
    translationKey: z.string(),
    edition: z.string().default("menorca"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.string(), // texto libre…
    locationRef: reference("lugares").optional(), // …o referencia a un lugar
    category: z.enum([
      "fiesta",
      "concierto",
      "mercado",
      "deporte",
      "cultura",
      "gastronomia",
      "otro",
    ]),
    description: z.string(),
    image: z.string().optional(),
    sourceUrl: z.url().optional(),
    status: STATUS,
    source: z.enum(["humano", "auto-agenda"]).default("humano"),
  }),
});

/** Autores (E-E-A-T). Una entrada por persona; textos localizados. */
const autores = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/autores" }),
  schema: z.object({
      name: z.string(),
      role: z.object({ es: z.string(), en: z.string() }),
      bio: z.object({ es: z.string(), en: z.string() }),
      // `bio` es texto visible (corto). `seoDescription` la sustituye SOLO en la
      // <meta description> de la página de autor cuando la bio es muy corta para SEO.
      seoDescription: z.object({ es: z.string(), en: z.string() }).optional(),
      avatar: z.string().optional(),
      social: z
        .object({
          instagram: z.url().optional(),
          x: z.url().optional(),
          web: z.url().optional(),
        })
        .optional(),
    }),
});

export const collections = { articulos, lugares, eventos, autores };
