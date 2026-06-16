/**
 * Configuración del editor visual (Keystatic) — la "bandeja de aprobación".
 *
 * Mapea el panel visual a tu contenido real (los mismos archivos de
 * src/content). NO cambia el modelo: solo da una pantalla bonita para editar
 * sin tocar código. Cada campo lleva un CONSEJO (description) para que el
 * contenido y las fotos se posicionen bien en Google y en las IA (GEO).
 *
 * Modo LOCAL: edita los archivos de tu ordenador (cero riesgo, sin login).
 * Cuando queramos que otras personas editen, cambiaremos `storage` a GitHub.
 *
 * Las rutas de imagen se guardan como texto (p. ej. /uploads/foto.webp) para
 * respetar el flujo de fotos optimizadas (ver docs/GUIA-EDITOR.md).
 */
import { config, fields, collection } from "@keystatic/core";

/** Opciones de idioma (en sync con src/config/site.ts). */
const IDIOMAS = [
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
] as const;

/** Secciones de la revista (en sync con src/content.config.ts §5). */
const SECCIONES = [
  { label: "Descubrir", value: "descubrir" },
  { label: "Agenda / Qué hacer", value: "agenda" },
  { label: "Comer y beber", value: "comer-y-beber" },
  { label: "Vivir en Menorca", value: "vivir" },
  { label: "Cultura e identidad", value: "cultura" },
  { label: "Práctica", value: "practica" },
] as const;

/** Estado del contenido — el cortafuegos de aprobación (CLAUDE.md §6 bis). */
const ESTADOS = [
  { label: "📝 Borrador (no se publica)", value: "draft" },
  { label: "👀 Pendiente de revisión", value: "pending" },
  { label: "✅ Publicado (visible en la web)", value: "published" },
] as const;

export default config({
  // Almacenamiento según el entorno:
  //  - En tu ordenador (`npm run dev`): modo LOCAL → editas archivos de tu PC,
  //    nada se sube solo (trastear sin riesgo).
  //  - En Vercel (panel con login): modo GitHub → los cambios van al repositorio
  //    a través del login de GitHub, y la web pública se actualiza sola.
  // `import.meta.env.DEV` lo sustituye Vite en compilación (no es process.env,
  // que rompería en el navegador).
  storage: import.meta.env.DEV
    ? { kind: "local" }
    : { kind: "github", repo: "calmasocietyweb-del/calma-society" },

  ui: {
    brand: { name: "Calma Society" },
    navigation: {
      Contenido: ["articulos", "eventos"],
      Datos: ["lugares", "autores"],
    },
  },

  collections: {
    // ─────────────────────────────────────────────────────────────────────
    // ARTÍCULOS
    // ─────────────────────────────────────────────────────────────────────
    articulos: collection({
      label: "Artículos",
      path: "src/content/articulos/*",
      format: { contentField: "content" },
      slugField: "title",
      columns: ["title", "section", "status"],
      entryLayout: "content",
      schema: {
        title: fields.slug({
          name: {
            label: "Título",
            description:
              "Claro y atractivo. Si puedes, incluye la palabra clave y el lugar (p. ej. «Las mejores calas vírgenes de Menorca»). El recuadro «slug» es la dirección del artículo: déjalo corto y con guiones.",
            validation: { length: { min: 1 } },
          },
        }),
        lang: fields.select({
          label: "Idioma",
          options: IDIOMAS,
          defaultValue: "es",
          description: "Idioma de ESTE artículo.",
        }),
        translationKey: fields.text({
          label: "Clave de traducción",
          description:
            "Mismo código en la versión en español y en inglés para enlazarlas (p. ej. «mejores-calas»). Así Google sabe que son la misma pieza en dos idiomas.",
        }),
        section: fields.select({
          label: "Sección",
          options: SECCIONES,
          defaultValue: "descubrir",
        }),
        edition: fields.text({
          label: "Edición / destino",
          defaultValue: "menorca",
          description: "Déjalo en «menorca» salvo que sea otro destino.",
        }),
        excerpt: fields.text({
          label: "Resumen (entradilla)",
          multiline: true,
          description:
            "1-2 frases. Es lo que ve la gente en Google y al compartir. Resume la idea principal con un dato concreto y, si encaja, el lugar. Evita frases de relleno.",
        }),
        publishDate: fields.date({
          label: "Fecha de publicación",
          validation: { isRequired: true },
        }),
        updatedDate: fields.date({
          label: "Fecha de actualización (opcional)",
          description:
            "Rellénala cuando revises un artículo antiguo. Una fecha reciente da confianza a Google y a las IA.",
        }),
        author: fields.relationship({
          label: "Autor",
          collection: "autores",
          validation: { isRequired: true },
          description: "La autoría visible da credibilidad (E-E-A-T).",
        }),
        heroImage: fields.text({
          label: "Foto principal (ruta)",
          description:
            "Ruta de una foto ya optimizada, p. ej. /uploads/casa-piedra.webp. Para añadir fotos nuevas (que pesen poco) sigue docs/GUIA-EDITOR.md.",
        }),
        heroImageAlt: fields.text({
          label: "Texto alternativo de la foto",
          description:
            "Describe la imagen en una frase (OBLIGATORIO si hay foto). Ayuda a personas ciegas y a Google a entender la imagen. Ej.: «Cala de arena blanca y aguas turquesa en el norte de Menorca».",
        }),
        heroImageCredit: fields.text({
          label: "Crédito / pie de foto (fuente)",
          description:
            "De dónde es la foto, p. ej. «Adobe Stock» o «Autor / Wikimedia Commons (CC BY-SA 4.0)». Aparece pequeñito bajo la imagen. Déjalo vacío si es foto propia.",
        }),
        tags: fields.array(fields.text({ label: "Etiqueta" }), {
          label: "Etiquetas",
          itemLabel: (props) => props.value,
          description: "3-6 temas concretos (p. ej. calas, norte, familia).",
        }),
        status: fields.select({
          label: "Estado",
          options: ESTADOS,
          defaultValue: "draft",
          description:
            "Nace en BORRADOR. Solo lo que esté en «Publicado» sale a la web. Este es el control de calidad.",
        }),
        featured: fields.checkbox({
          label: "Destacado en portada",
          defaultValue: false,
        }),
        sponsored: fields.checkbox({
          label: "Contenido patrocinado",
          defaultValue: false,
          description:
            "Márcalo SIEMPRE si es contenido pagado. La transparencia es nuestro activo.",
        }),
        source: fields.select({
          label: "Origen",
          options: [
            { label: "Humano", value: "humano" },
            { label: "Auto · agenda", value: "auto-agenda" },
            { label: "Auto · traducción", value: "auto-traduccion" },
          ],
          defaultValue: "humano",
        }),
        translationStatus: fields.select({
          label: "Estado de traducción",
          options: [
            { label: "Original", value: "original" },
            { label: "Auto · sin revisar", value: "auto-sin-revisar" },
            { label: "Revisado", value: "revisado" },
          ],
          defaultValue: "original",
        }),
        seo: fields.object(
          {
            title: fields.text({
              label: "Título SEO (opcional)",
              description:
                "Solo si quieres un título distinto para Google. ~55-60 caracteres.",
            }),
            description: fields.text({
              label: "Meta descripción (opcional)",
              multiline: true,
              description: "~150 caracteres. Convence de hacer clic.",
            }),
            ogImage: fields.text({
              label: "Imagen para redes (opcional, ruta)",
              description: "Ruta /uploads/… para cuando se comparte el enlace.",
            }),
          },
          {
            label: "SEO (avanzado)",
            description: "Opcional. Si lo dejas vacío, se usan el título y el resumen.",
          },
        ),
        relatedPlaces: fields.array(
          fields.relationship({ label: "Lugar", collection: "lugares" }),
          {
            label: "Lugares relacionados",
            itemLabel: (props) => props.value ?? "Lugar",
            description: "Conecta el artículo con calas, restaurantes, etc.",
          },
        ),
        content: fields.mdx({
          label: "Contenido del artículo",
          description:
            "Usa encabezados (H2) que respondan preguntas reales. Da datos concretos (horarios, precios, accesos). Voz propia y experiencia local: es lo que las IA no tienen y lo que te hace citable.",
        }),
      },
    }),

    // ─────────────────────────────────────────────────────────────────────
    // EVENTOS (agenda)
    // ─────────────────────────────────────────────────────────────────────
    eventos: collection({
      label: "Eventos (agenda)",
      path: "src/content/eventos/*",
      format: { data: "json" },
      slugField: "title",
      columns: ["title", "startDate", "status"],
      schema: {
        title: fields.slug({ name: { label: "Título del evento" } }),
        lang: fields.select({ label: "Idioma", options: IDIOMAS, defaultValue: "es" }),
        translationKey: fields.text({
          label: "Clave de traducción",
          description: "Mismo código en ES y EN para enlazar las versiones.",
        }),
        edition: fields.text({ label: "Edición", defaultValue: "menorca" }),
        startDate: fields.date({
          label: "Fecha de inicio",
          validation: { isRequired: true },
        }),
        endDate: fields.date({ label: "Fecha de fin (opcional)" }),
        location: fields.text({
          label: "Lugar (texto)",
          description: "Dónde ocurre, p. ej. «Plaça des Born, Ciutadella».",
        }),
        locationRef: fields.relationship({
          label: "Lugar (ficha, opcional)",
          collection: "lugares",
        }),
        category: fields.select({
          label: "Categoría",
          options: [
            { label: "Fiesta", value: "fiesta" },
            { label: "Concierto", value: "concierto" },
            { label: "Mercado", value: "mercado" },
            { label: "Deporte", value: "deporte" },
            { label: "Cultura", value: "cultura" },
            { label: "Gastronomía", value: "gastronomia" },
            { label: "Otro", value: "otro" },
          ],
          defaultValue: "fiesta",
        }),
        description: fields.text({ label: "Descripción", multiline: true }),
        image: fields.text({ label: "Imagen (ruta, opcional)" }),
        sourceUrl: fields.url({ label: "Fuente oficial (URL, opcional)" }),
        status: fields.select({ label: "Estado", options: ESTADOS, defaultValue: "draft" }),
        source: fields.select({
          label: "Origen",
          options: [
            { label: "Humano", value: "humano" },
            { label: "Auto · agenda", value: "auto-agenda" },
          ],
          defaultValue: "humano",
        }),
      },
    }),

    // ─────────────────────────────────────────────────────────────────────
    // LUGARES (calas, restaurantes, alojamientos…)
    // ─────────────────────────────────────────────────────────────────────
    lugares: collection({
      label: "Lugares",
      path: "src/content/lugares/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name", "type", "status"],
      schema: {
        name: fields.slug({ name: { label: "Nombre del lugar" } }),
        lang: fields.select({ label: "Idioma", options: IDIOMAS, defaultValue: "es" }),
        translationKey: fields.text({ label: "Clave de traducción" }),
        type: fields.select({
          label: "Tipo",
          options: [
            { label: "Cala / playa", value: "cala" },
            { label: "Restaurante", value: "restaurante" },
            { label: "Alojamiento", value: "alojamiento" },
            { label: "Monumento", value: "monumento" },
            { label: "Comercio", value: "comercio" },
            { label: "Otro", value: "otro" },
          ],
          defaultValue: "cala",
        }),
        edition: fields.text({ label: "Edición", defaultValue: "menorca" }),
        description: fields.text({ label: "Descripción", multiline: true }),
        coordinates: fields.object(
          {
            lat: fields.number({ label: "Latitud" }),
            lng: fields.number({ label: "Longitud" }),
          },
          {
            label: "Coordenadas",
            description: "Para el mapa y los datos estructurados (Google Maps).",
          },
        ),
        area: fields.text({
          label: "Zona",
          description: "Norte / sur / este / oeste o municipio.",
        }),
        images: fields.array(fields.text({ label: "Ruta de imagen" }), {
          label: "Imágenes (rutas)",
          itemLabel: (props) => props.value,
        }),
        practicalInfo: fields.object(
          {
            acceso: fields.text({ label: "Acceso" }),
            aparcamiento: fields.text({ label: "Aparcamiento" }),
            servicios: fields.text({ label: "Servicios" }),
            mejorEpoca: fields.text({ label: "Mejor época" }),
            horario: fields.text({ label: "Horario" }),
          },
          {
            label: "Información práctica",
            description:
              "Datos concretos = oro para SEO/GEO. Las IA citan webs con horarios, accesos y aparcamiento claros.",
          },
        ),
        priceRange: fields.select({
          label: "Rango de precio",
          options: [
            { label: "€", value: "€" },
            { label: "€€", value: "€€" },
            { label: "€€€", value: "€€€" },
            { label: "€€€€", value: "€€€€" },
          ],
          defaultValue: "€€",
        }),
        website: fields.url({ label: "Web (opcional)" }),
        tags: fields.array(fields.text({ label: "Etiqueta" }), {
          label: "Etiquetas",
          itemLabel: (props) => props.value,
        }),
        status: fields.select({ label: "Estado", options: ESTADOS, defaultValue: "draft" }),
      },
    }),

    // ─────────────────────────────────────────────────────────────────────
    // AUTORES (E-E-A-T)
    // ─────────────────────────────────────────────────────────────────────
    autores: collection({
      label: "Autores",
      path: "src/content/autores/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name"],
      schema: {
        name: fields.slug({ name: { label: "Nombre" } }),
        role: fields.object(
          {
            es: fields.text({ label: "Rol (ES)" }),
            en: fields.text({ label: "Rol (EN)" }),
          },
          { label: "Rol / cargo" },
        ),
        bio: fields.object(
          {
            es: fields.text({ label: "Biografía (ES)", multiline: true }),
            en: fields.text({ label: "Biografía (EN)", multiline: true }),
          },
          {
            label: "Biografía",
            description:
              "Experiencia real y local. Es lo que hace que Google y las IA confíen en la autoría.",
          },
        ),
        avatar: fields.text({ label: "Foto (ruta, opcional)" }),
        social: fields.object(
          {
            instagram: fields.url({ label: "Instagram" }),
            x: fields.url({ label: "X / Twitter" }),
            web: fields.url({ label: "Web" }),
          },
          { label: "Redes (opcional)" },
        ),
      },
    }),
  },
});
