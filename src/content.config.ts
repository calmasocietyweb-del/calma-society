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

// ─── PLANIFICADOR DE VIAJES — vocabulario del bloque `planner` ───────────────
// Enums máquina-legibles que alimentan el motor de reglas determinista
// (docs/PLANIFICADOR-BLUEPRINT.md). Mantener en sync con src/lib/planner/types.ts
// y con src/data/{travelTimes,dayTypes}.ts.

// Zona normalizada (regla "espina de pez": 1 lugar = 1 zona, unidad de agrupación
// por día). `eje-me1` = de paso para cualquier base (interiores del eje Maó–Ciutadella).
const PLANNER_ZONE = z.enum([
  "este",
  "sur-este",
  "sur-centro",
  "sur-oeste",
  "oeste",
  "norte",
  "centro",
  "eje-me1",
]);

// Papel del lugar en la secuencia del día (encaja en un hueco intradía).
const PLANNER_TYPE = z.enum([
  "cala",
  "playa",
  "pueblo",
  "faro",
  "yacimiento",
  "mirador",
  "atardecer",
  "desayuno",
  "comida",
  "cena",
  "actividad-acuatica",
  "excursion",
  "interior-cultural",
]);

// Perfiles/intereses de la encuesta con los que casa el lugar (ranking, no filtro).
const PLANNER_IDEAL_FOR = z.enum([
  "primera-vez",
  "parejas",
  "familias",
  "ninos-pequenos",
  "lujo-tranquilo",
  "nautica",
  "cultura",
  "gastronomia",
  "vida-nocturna",
  "naturaleza",
]);

// Acceso en coche (el "moat": restricciones de verano y caminatas).
const PLANNER_CAR_ACCESS = z.enum([
  "coche-directo", // aparcas y estás
  "coche-mas-caminata", // coche + sendero a pie
  "solo-bus-lanzadera", // coche prohibido en verano → lanzadera/bus
  "sin-coche-ok", // se llega bien sin coche (urbano o bus directo)
]);

// Escala de esfuerzo/accesibilidad (HUECO 3): A1 accesible-asistido … D duro.
const PLANNER_EFFORT = z.enum(["A1", "A2", "B", "C", "D"]);

// Resguardo frente a lluvia, para el plan-B (HUECO 1).
const PLANNER_WEATHERPROOF = z.enum(["cubierto", "semicubierto", "exterior"]);

// Nivel de certeza del dato (gobernanza / credibilidad ante la IA — GEO).
const CERTAINTY = z.enum(["alta", "media", "baja"]);

// Días de la semana que abre (filtro crítico del plan-B: museos cierran lunes…).
const WEEKDAY = z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]);

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
    // Exposición al viento por cala — IP de "Dónde el mar está en calma".
    // Solo aplica a type: "cala". Dato editorial curado, separado del feed meteo
    // (lo rellena/verifica una persona; nunca lo toca el cron diario).
    windExposure: z
      .object({
        // Rumbo (0-360) hacia el que la cala ABRE al mar abierto: la dirección
        // desde la que el viento entra de frente (peor abrigo).
        openingBearingDeg: z.number().min(0).max(360),
        embayment: z.enum(["abierta", "encajonada", "bahia-cerrada"]),
        // Código INE del municipio: con él se pide el viento a AEMET.
        municipioINE: z.string(),
        shelteredFrom: z.array(z.string()).default([]),
        exposedTo: z.array(z.string()).default([]),
        tienePradera: z.boolean().default(false),
        tieneVigilancia: z.boolean().default(false),
      })
      .optional(),
    // ── PLANIFICADOR DE VIAJES — bloque máquina-legible para el motor de reglas.
    // Todo OPCIONAL: las fichas existentes siguen validando. Se rellena por script
    // en `status: draft` para visto bueno (§6 bis). NO duplica `windExposure`
    // (la sensibilidad al viento vive en ese bloque, no aquí).
    planner: z
      .object({
        // — Geografía / clustering (anti-zigzag "espina de pez") —
        zone: PLANNER_ZONE,
        cluster: z.string(), // micro-zona que comparte ramal/parking/base de día
        plannerType: PLANNER_TYPE,
        idealFor: z.array(PLANNER_IDEAL_FOR).default([]),

        // — Ritmo (no-saturar: 8,5 h útiles/día) —
        durationMin: z.number().int().positive().optional(), // minutos típicos de visita

        // — Acceso coche / sin coche (el moat) —
        carAccess: PLANNER_CAR_ACCESS,
        busServed: z.boolean().default(false),
        carAccessClosedSummer: z.boolean().default(false), // Macarella, Favàritx…
        shuttleInfo: z.string().optional(), // lanzadera/transbordo (texto)

        // — Esfuerzo / accesibilidad (HUECO 3) —
        effortLevel: PLANNER_EFFORT,
        effortNote: z.string().optional(),
        // Solo en lugares A1: servicio de baño asistido (ventana 1 may–31 oct).
        accessibleService: z
          .object({
            amphibiousChair: z.boolean().default(false), // silla anfibia
            adaptedToilet: z.boolean().default(false), // baño adaptado
            reservedParking: z.boolean().default(false), // parking reservado
            staff: z.boolean().default(false), // personal de apoyo (Cruz Roja/monitor)
            seasonWindow: z
              .object({ from: z.string(), to: z.string() })
              .default({ from: "05-01", to: "10-31" }),
            certainty: CERTAINTY.default("media"),
          })
          .optional(),

        // — Plan-B de mal tiempo (HUECO 1) —
        isIndoor: z.boolean().default(false),
        weatherProof: PLANNER_WEATHERPROOF.optional(),
        // Clusters/zonas que este interior cubre cuando llueve o aprieta el calor.
        indoorAlternativeOf: z.array(z.string()).default([]),

        // — Operativos (estacionales y cambiantes → siempre con certeza y fuente) —
        openDays: z.array(WEEKDAY).optional(), // si se omite, se asume abierto siempre
        seasonalHours: z.string().optional(),
        needsReservation: z.boolean().default(false),
        officialUrl: z.url().optional(),

        // — Gobernanza del dato (credibilidad / GEO) —
        dataCertainty: CERTAINTY.default("media"),
        lastVerified: z.string().optional(), // fecha ISO de la última verificación
      })
      .optional(),
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
