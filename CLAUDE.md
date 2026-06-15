# CLAUDE.md — Memoria del proyecto para Claude Code

> Este archivo lo lee Claude Code automáticamente al iniciarse en la carpeta. Es la **fuente de verdad** del proyecto. Léelo entero antes de escribir una sola línea de código. Si algo en una petición contradice este archivo, prioriza este archivo y avisa.
> **Documentos de referencia:**
> - `docs/ANALISIS-MERCADO-MENORCA.md` — el porqué estratégico de todo.
> - `docs/GUIA-DE-ARRANQUE.md` — cómo usar esta carpeta y los prompts por fase.
> - `docs/ESTRATEGIA-MULTIIDIOMA.md` — cómo llegamos a toda Europa con calidad (pipeline de traducción + despliegue por mercados).
> - `docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md` — qué corre solo, qué aprueba el dueño, y la **bandeja de aprobación** (nada se publica sin visto bueno).
> - `docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md` — captación de audiencia, monetización, tráfico a negocios propios y metodología de nombre/dominio.

---

## 1. Qué estamos construyendo

Una **revista digital independiente sobre Menorca**, **multilingüe europea** (arranca en español + inglés y se amplía a alemán, francés, italiano… con calidad real), con criterio editorial, dirección de arte premium y cobertura de la isla **los 365 días del año**. Para quien la visita, quien la vive y quien sueña con quedarse. Aspira a ser **la revista sobre Menorca más popular de Europa**.

> **Operativa:** semi-automatizada pero **con aprobación humana**. La máquina propone (agenda, borradores, traducciones); una persona aprueba antes de publicar. La estructura es **genérica y ampliable** a otros temas/destinos en el futuro. Ver `docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md`.

**No es** una guía SEO genérica más, ni un escaparate comercial. El mercado de Menorca ya está saturado de eso. Nuestro hueco es ser **la publicación editorial de verdad**: voz propia, profundidad, fotografía, actualidad y confianza. (Justificación completa en el análisis de mercado.)

**El activo que construimos no es una web: es una audiencia leal.** La web es el medio; la **newsletter y la comunidad** son el fin. Esto guía todas las decisiones técnicas.

---

## 2. DECISIONES CLAVE — CONFIRMA O CAMBIA ANTES DE CONSTRUIR

> Estas son decisiones por defecto, razonadas a partir del análisis. Si el dueño del proyecto cambia alguna, **actualiza este archivo primero** y luego construye.

| # | Decisión | Valor por defecto | Cámbialo si… |
|---|---|---|---|
| 1 | **Nombre / marca** | `[PENDIENTE]` — usar placeholder `"Revista Menorca"` y centralizarlo en `src/config/site.ts` | Ya hay nombre y dominio decididos |
| 2 | **Idiomas** | **Multilingüe europeo.** Arranque **ES + EN**; arquitectura lista para N idiomas; despliegue por mercados (→ DE/FR/IT → NL/PL…). Traducción **asistida y revisada**, nunca automática chapucera. Ver `docs/ESTRATEGIA-MULTIIDIOMA.md` | Se quiere otro orden de mercados o limitar idiomas |
| 3 | **Stack** | **Astro + TypeScript + Tailwind + MDX + i18n nativo** (sitio estático) | Se prefiere no mantener código → entonces NO es proyecto de Claude Code, sino Ghost/WordPress (no-code) |
| 4 | **Audiencia** | Multi-segmento; **prioridad de contenido: gastronomía → agenda/qué hacer → lifestyle/vivir → descubrir → práctica** | Se decide enfocar a un solo segmento |
| 5 | **Hosting** | **Cloudflare Pages** (o Netlify/Vercel), plan gratuito al inicio | Hay otra preferencia de despliegue |
| 6 | **Newsletter** | **MailerLite** o **Buttondown** (free tier generoso), integrable por formulario/API | Se prefiere Beehiiv, Substack u otro |
| 7 | **Analítica** | **Cloudflare Web Analytics** o **Plausible/Umami** (respetuosas con la privacidad, sin cookies invasivas) | Se exige Google Analytics |
| 8 | **CMS** | Empezar con **archivos MDX en el repo**; añadir **Keystatic** (editor visual sobre Git) cuando haga falta editar sin tocar código | Se quiere headless CMS (Sanity/Storyblok) desde ya |
| 9 | **Automatización** | **Asistida, no automática.** La máquina propone (agenda, borradores, traducciones, SEO, imágenes, envío newsletter/redes); **el dueño aprueba antes de publicar**. Nada se publica solo. Ver `docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md` | Se acepta publicar sin revisión (NO recomendado: rompe el moat de calidad) |
| 10 | **Aprobación de contenido** | **Bandeja de aprobación obligatoria.** Todo contenido nace en estado `draft`/`pending` y solo pasa a `published` con visto bueno humano (un campo `status` en el modelo de contenido) | — |
| 11 | **Traducción (motor)** | `[PENDIENTE]` — definir proveedor (DeepL API / IA con revisión). Se decide en Fase 6. Hasta entonces, traducción manual/asistida en chat | Hay preferencia de proveedor |
| 12 | **Ámbito futuro** | Diseñar **genérico y ampliable** (hoy Menorca; mañana otros temas/destinos) sin acoplar el código a "Menorca" | — |

---

## 3. Principios rectores (NO NEGOCIABLES)

Cada decisión de diseño y código debe respetar esto:

1. **Audiencia-first.** La captación de suscriptores de newsletter es el KPI #1. Debe haber CTA de suscripción visible y elegante en home, en cada artículo y en una página propia, **desde el primer despliegue**.
2. **GEO + primera mano > SEO de volumen.** El tráfico de buscadores cae año a año por las respuestas de IA. Nuestro contenido debe ser citable por IA (datos claros, autoría visible, experiencia local real) y aportar lo que la IA no tiene: criterio, fotos propias, datos locales y actuales.
3. **Calidad sobre cantidad.** Mejor 1 artículo excelente que 5 mediocres. Nunca generar relleno SEO.
4. **Multilingüe de verdad.** Cada idioma activo, al mismo nivel de calidad. Traducción **asistida pero revisada** (glosario de marca, etiquetado), **nunca** automática chapucera ni páginas "huérfanas" sin su versión. La arquitectura soporta N idiomas; se despliegan por mercados. Ver `docs/ESTRATEGIA-MULTIIDIOMA.md`.
5. **Rendimiento sagrado.** Sitio estático, mínimo JavaScript de cliente, imágenes optimizadas. Objetivo: **Lighthouse 95+ en las cuatro métricas** y Core Web Vitals en verde.
6. **Accesibilidad (a11y).** HTML semántico, contraste suficiente, navegable por teclado, `alt` en todas las imágenes, foco visible. Objetivo: cumplir WCAG 2.1 AA.
7. **SEO técnico impecable.** Metadatos, Open Graph, sitemap, `robots.txt`, datos estructurados (schema.org), `hreflang`, RSS. Sin esto no se da por hecha ninguna página.
8. **Independencia y confianza.** El contenido patrocinado se etiqueta SIEMPRE de forma clara. La confianza del lector es el activo del negocio.
9. **Sin dependencia de un solo canal.** Diseñar para vivir de la audiencia propia + varias fuentes de tráfico (newsletter, redes, IA, buscador), nunca solo de Google.
10. **Aprobación humana antes de publicar.** Por mucho que se automatice, **ningún contenido se publica sin visto bueno de una persona**. La automatización ahorra trabajo, no sustituye al criterio. Este es el cortafuegos que protege la calidad (principios 2 y 3).

---

## 4. Stack tecnológico y razones

- **Framework: [Astro](https://astro.build/)** con **TypeScript**. Ideal para sitios de contenido: genera HTML estático rapidísimo (perfecto para rendimiento, SEO y GEO), tiene **content collections** tipadas y **i18n** nativa.
- **Estilos: Tailwind CSS** con **design tokens** centralizados (ver §7). Nada de CSS suelto y desordenado.
- **Contenido: MDX** (Markdown + componentes) gestionado con **content collections** y validado con **Zod** (ver §6).
- **Imágenes:** componente `<Image>` de Astro (`astro:assets`) con formatos modernos (AVIF/WebP), `loading="lazy"` y dimensiones explícitas. Las fotos son el alma de la revista: **nunca** servir imágenes sin optimizar.
- **Edición sin código (fase posterior):** **Keystatic** (editor visual que escribe en el propio repo Git) para que se puedan crear artículos sin tocar el código.
- **Newsletter:** integración por formulario/API con MailerLite o Buttondown (decisión #6).
- **Formularios:** endpoint/serverless del hosting (p. ej. Cloudflare Pages Functions o Netlify Forms). Sin backend pesado.
- **Despliegue:** Cloudflare Pages / Netlify / Vercel (CI desde Git: push → deploy).
- **Búsqueda en el sitio (cuando haya volumen):** **Pagefind** (búsqueda estática, sin servidor).

**Filosofía técnica:** estático primero, JS de cliente solo cuando aporta valor real, cero dependencias innecesarias, todo tipado. Si dudas entre algo simple y algo "potente pero complejo", elige lo simple.

---

## 5. Arquitectura de información (secciones y URLs)

Secciones (sirven a los segmentos del análisis sin abandonar al turista):

1. **Descubrir** (`/descubrir`) — inspiración: calas, rutas, pueblos, faros, naturaleza, biosfera.
2. **Agenda / Qué hacer** (`/agenda`) — eventos, fiestas, conciertos, mercados. **Actualizada.**
3. **Comer y beber** (`/comer-y-beber`) — gastronomía, restaurantes con criterio, producto local, vino, queso DOP.
4. **Vivir en Menorca** (`/vivir`) — lifestyle, propiedad, interiorismo, reformas, historias de gente, "todo el año".
5. **Cultura e identidad** (`/cultura`) — historia, Menorca talayótica, lengua, artesanía, oficios.
6. **Práctica** (`/practica`) — cómo llegar, moverse, mapas, cuándo ir, sostenibilidad.
7. **Newsletter** (`/newsletter`) — página dedicada de suscripción (no una sección menor).
8. **Quiénes somos / Criterio editorial** (`/quienes-somos`) — clave para E-E-A-T y para que la IA nos cite con confianza.

**Rutas e i18n (multilingüe):** español en la raíz (`/comer-y-beber/...`), el resto de idiomas bajo prefijo (`/en/eat-and-drink/...`, `/de/...`, `/fr/...`). La configuración de idiomas vive en `src/config/site.ts` (lista de locales activos) para **añadir un idioma nuevo cambiando un solo sitio**. Cada contenido enlaza a todas sus versiones (`hreflang` + selector visible). Slugs traducidos por idioma. Detalle en `docs/ESTRATEGIA-MULTIIDIOMA.md`.

---

## 6. Modelo de contenido (content collections)

Definir estas colecciones en `src/content/` con schema Zod. Crear **2-3 entradas de ejemplo por colección, en ES y EN**, para poder construir y ver la UI.

**`articulos`** (artículos editoriales)
- `title`, `slug`, `lang` (enum de locales activos en `site.ts`, p. ej. `'es' | 'en' | 'de' | …`), `translationKey` (id que une todas las versiones de idioma), `section` (enum de §5), `excerpt`, `publishDate`, `updatedDate?`, `author` (ref a `autores`), `heroImage`, `heroImageAlt`, `tags[]`, **`status`** (`'draft' | 'pending' | 'published'` — el cortafuegos de aprobación, ver §6 bis), `featured?` (bool), `sponsored?` (bool, para etiquetar branded content), **`source?`** (`'humano' | 'auto-agenda' | 'auto-traduccion' | …`, para saber qué generó la máquina), **`translationStatus?`** (`'original' | 'auto-sin-revisar' | 'revisado'`), `seo` (`{ title?, description?, ogImage? }`), `relatedPlaces?` (refs a `lugares`).

**`lugares`** (calas, restaurantes, alojamientos, puntos de interés — reutilizables y con datos estructurados)
- `name`, `slug`, `lang`, `translationKey`, `type` (`'cala' | 'restaurante' | 'alojamiento' | 'monumento' | 'comercio' | 'otro'`), `description`, `coordinates` (`{ lat, lng }`), `area` (norte/sur/este/oeste o municipio), `images[]`, `practicalInfo` (acceso, aparcamiento, servicios, mejor época/horario), `priceRange?`, `website?`, `tags[]`. → Estos datos alimentan **schema.org `Place`/`LocalBusiness`** y el contenido "in-situ" que la IA no tiene.

**`eventos`** (agenda)
- `title`, `slug`, `lang`, `translationKey`, `startDate`, `endDate?`, `location` (ref a `lugares` o texto), `category` (fiesta, concierto, mercado, deporte, cultura…), `description`, `image?`, `sourceUrl?`. → Alimenta **schema.org `Event`**.

**`autores`**
- `name`, `slug`, `bio`, `avatar`, `role`, `social?`. → Autoría visible = E-E-A-T y credibilidad ante IA.

**Reglas de contenido:**
- Todo artículo y lugar enlaza sus versiones de idioma por `translationKey` (no hace falta tener todos los idiomas a la vez, pero sí registrar cuáles faltan).
- `heroImageAlt` y `alt` de imágenes: **obligatorios** y descriptivos.
- Nada de contenido copiado de competidores ni texto generado de relleno. Voz propia siempre.
- **`status` por defecto = `draft`.** Solo el dueño lo pasa a `published`. La build de producción **no publica** nada que no esté en `published` (las traducciones `auto-sin-revisar` no salen al público).

## 6 bis. Flujo de aprobación (cortafuegos de calidad)

Regla absoluta: **nada se publica sin aprobación humana** (principio §3.10). El ciclo de vida de cualquier contenido es:

`propuesta (máquina o humano) → draft → [revisión del dueño] → published` (o `descartado`).

- La "máquina" (agenda automática, borradores de IA, traducciones) **siempre** deposita en `draft`/`pending`, nunca en `published`.
- Habrá una **bandeja de aprobación** sencilla (primero por carpeta/listado de borradores y por el editor visual Keystatic; ver Fase 6) donde el dueño aprueba, edita o descarta con un clic, sin tocar código.
- Detalle completo y diagrama en `docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md`.

---

## 7. Sistema de diseño / dirección de arte

**Tono visual:** mediterráneo, sereno, premium, editorial. Mucho aire (whitespace), tipografía con carácter, **la fotografía es la protagonista**. Coherente con la marca del destino: auténtico, calmado, anti-ruido. Lo contrario de una web recargada de banners.

**Tokens iniciales (propuesta — centralizar en Tailwind config + `src/styles`):**

```
Color (paleta "Menorca"):
  --blanco-cal:    #FAF8F3   (fondo principal, casas encaladas)
  --arena:         #E8DFCF   (fondos secundarios)
  --azul-mar:      #1E5F74   (primario, mar del sur / turquesa profundo)
  --turquesa:      #3FA7B5   (acento, agua de cala)
  --terracota:     #C26B4A   (acento cálido, tierra roja del norte)
  --piedra:        #4A4A42   (texto principal, gris cálido)
  --negro-tinta:   #1C1B18   (titulares)

Tipografía:
  Titulares / editorial:  serif con carácter  → "Fraunces" o "Lora"
  Texto / UI:             sans legible        → "Inter" o "Source Sans 3"
  (cargar con fuentes locales o subset; sin penalizar rendimiento)

Layout:
  - Mobile-first siempre.
  - Anchura de lectura cómoda (~65-75 caracteres) en artículos.
  - Rejilla editorial para portadas de sección (destacados grandes + listado).
  - Componentes base: Header, Footer, Nav bilingüe, ArticleCard, PlaceCard,
    EventCard, Hero, NewsletterSignup, SponsoredLabel, LanguageSwitcher.
```

> Estos tokens son un punto de partida. Si el dueño aporta marca/identidad propia, sustitúyelos manteniendo el espíritu.

---

## 8. SEO + GEO técnico (parte de la "definición de hecho")

Toda página debe incluir, donde aplique:
- `<title>` y `meta description` únicos y útiles (sin keyword-stuffing).
- **Open Graph** + Twitter/X cards con imagen.
- **Datos estructurados JSON-LD** según tipo: `Article` (artículos), `Place`/`LocalBusiness` (lugares), `Event` (agenda), `Organization` + `WebSite` (global), `BreadcrumbList` (navegación), `Person` (autores).
- **`hreflang`** entre versiones ES/EN + `canonical`.
- **Sitemap** (`@astrojs/sitemap`) y **`robots.txt`** correctos.
- **RSS feed** (para lectores y para distribución).
- Encabezados jerárquicos correctos (un solo `h1`), HTML semántico.
- **Página de autores y de criterio editorial** robustas (E-E-A-T) — esto es lo que hace que ChatGPT/Perplexity/Google AIO nos citen con confianza.

**GEO (Generative Engine Optimization):** estructurar el contenido en respuestas claras y autocontenidas, con datos concretos (horarios, precios, accesos, fechas), fuentes y autoría. Encabezados que respondan preguntas reales. Resúmenes/“key facts” al inicio cuando ayuden.

---

## 9. Estructura de carpetas (propuesta)

```
/                      ← raíz del repo (aquí va este CLAUDE.md)
├─ CLAUDE.md
├─ README.md
├─ docs/
│  ├─ ANALISIS-MERCADO-MENORCA.md
│  └─ GUIA-DE-ARRANQUE.md
├─ src/
│  ├─ config/site.ts          ← nombre, LOCALES ACTIVOS, redes, URLs (único sitio a tocar para datos globales)
│  ├─ content/                ← articulos / lugares / eventos / autores (+ config.ts con schemas Zod, incl. status)
│  ├─ components/             ← Header, Footer, Nav, *Card, Hero, NewsletterSignup, Seo, JsonLd…
│  ├─ layouts/                ← BaseLayout, ArticleLayout, SectionLayout…
│  ├─ pages/                  ← rutas ES (raíz) y resto de idiomas (/en, /de…) + sección, artículo, lugar, agenda…
│  ├─ styles/                 ← tokens y estilos globales
│  └─ i18n/                   ← diccionarios de UI por idioma + helpers (añadir idioma = añadir diccionario)
├─ scripts/                   ← automatización (recogida de agenda, borradores, traducción) — todo deja en `draft`
├─ public/                    ← favicons, robots.txt, imágenes estáticas
├─ astro.config.mjs
├─ tailwind.config.* 
├─ tsconfig.json
└─ package.json
```

---

## 10. Roadmap de construcción por fases

Construir incremental. **No pasar de fase sin que la anterior funcione, despliegue y pase Lighthouse.** (En paralelo a la Fase 0 se hace la **investigación de nombre y dominio**, ver `docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md`; hasta decidirlo se usa el placeholder "Revista Menorca".)

- **Fase 0 — Cimientos.** Scaffold Astro (TS, Tailwind, MDX, sitemap, i18n preparada para multi-idioma con ES por defecto + EN), estructura de carpetas, `src/config/site.ts` (con lista de locales), `robots.txt`, layout base que compile y despliegue. *Hecho =* la web vacía despliega y carga.
- **Fase 1 — Sistema de diseño.** Tokens, tipografía, Header, Footer, Nav multilingüe, LanguageSwitcher, componentes base, home placeholder. Mobile-first, accesible. *Hecho =* la identidad visual se ve y es responsive.
- **Fase 2 — Modelo de contenido (ampliable + multilingüe).** Content collections + schemas Zod (§6) **con campo `status`**, diseño genérico (no acoplado a "Menorca") + 2-3 entradas de ejemplo por colección en ES y EN.
- **Fase 3 — Páginas y plantillas.** Home editorial, portadas de sección, página de artículo, página de lugar (con su info práctica), agenda/eventos, página de autor, quiénes somos/criterio, página de newsletter. La build solo muestra contenido `published`.
- **Fase 4 — SEO + GEO + multilingüe técnico.** Componente `Seo`, Open Graph, JSON-LD por tipo, **`hreflang` entre todos los idiomas**, sitemap, RSS. Auditar.
- **Fase 5 — Captación, formularios y monetización.** Suscripción a newsletter (CTA en home, artículos y página propia) + formulario de contacto + base de afiliación y enlaces a negocios propios (ver doc de marketing) + (opcional) directorio premium básico.
- **Fase 6 — Automatización y bandeja de aprobación.** Scripts que **proponen** contenido en `draft` (agenda desde fuentes oficiales primero; luego borradores y traducciones), Keystatic como bandeja de aprobación sin código, e integración de envío de newsletter/redes tras aprobar. Ver `docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md`. *Hecho =* el dueño aprueba/publica sin tocar código y nada sale sin su visto bueno.
- **Fase 7 — Rendimiento y lanzamiento.** Optimizar imágenes, Lighthouse 95+, conectar dominio, analítica, a11y, páginas legales, checklist de lanzamiento.
- **Fase 8+ — Crecimiento.** Más idiomas (DE/FR/IT…), búsqueda con Pagefind, marketing activo (newsletter/redes/alianzas), monetización avanzada (branded/directorio/membresía/eventos). Ver `docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md`.

---

## 11. Convenciones de trabajo con Claude Code

- **Idioma:** comentarios, commits y documentación en **español**; identificadores de código y nombres de archivo en **inglés** (convención estándar).
- **Commits pequeños y claros**, estilo *Conventional Commits* (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`). Una cosa por commit.
- **Pregunta antes de**: añadir una dependencia nueva no contemplada, cambiar el stack, romper la estructura de carpetas, o tomar una decisión de las marcadas como `[PENDIENTE]`.
- **No rompas la i18n:** toda página/contenido nuevo enlaza sus versiones de idioma (`translationKey`) o deja explícitamente pendiente cuáles faltan. Añadir un idioma debe hacerse desde `src/config/site.ts` + diccionario, sin tocar plantillas.
- **Respeta el flujo de aprobación:** el contenido nuevo nace en `status: draft`; no marques nada como `published` por defecto.
- **No introduzcas JS de cliente** salvo necesidad real y justificada; preferir HTML/CSS y componentes de Astro.
- **Mantén `src/config/site.ts` como única fuente** de datos globales (nombre, idiomas, redes). No "hardcodees" el nombre del sitio por el código.
- **Trabaja por fases** (§10). Al terminar cada fase, resume qué hiciste y qué falta.

---

## 12. Qué NO hacer (anti-patrones)

- ❌ Generar contenido SEO de relleno, listas vacías o texto sin valor real.
- ❌ Copiar textos, estructura o fotos de los competidores del análisis.
- ❌ `localStorage`/`sessionStorage` para datos críticos; cookies invasivas o trackers pesados.
- ❌ Banners y publicidad agresiva que destrocen la experiencia (el modelo NO se basa en display intrusivo).
- ❌ Imágenes sin optimizar o sin `alt`.
- ❌ Páginas sin metadatos, sin `hreflang` o sin datos estructurados cuando aplican.
- ❌ Dependencias pesadas para resolver cosas que el HTML/CSS o Astro ya hacen.
- ❌ Romper el rendimiento por "efectos" innecesarios.

---

## 13. Definición de "hecho" (Definition of Done)

Una página o componente está terminado cuando:
1. Compila y despliega sin errores ni warnings.
2. Es responsive (mobile-first) y accesible (semántico, contraste, teclado, `alt`).
3. Tiene su versión en los idiomas activos (o queda explícitamente marcada como pendiente vía `translationKey`), y su `status` es correcto (nada llega a `published` sin aprobación).
4. Incluye metadatos + Open Graph + datos estructurados cuando aplica.
5. Usa los tokens del sistema de diseño (sin estilos sueltos fuera de sistema).
6. No baja de **Lighthouse 95** en Performance, Accessibility, Best Practices y SEO.
7. El código está tipado, comentado en español donde haga falta y commiteado con mensaje claro.

---

*Para el contexto estratégico completo (mercado, competencia, oportunidades, monetización, gestión y lecciones de éxito/fracaso), ver `docs/ANALISIS-MERCADO-MENORCA.md`. Para poner en marcha la carpeta y dirigir a Claude Code paso a paso, ver `docs/GUIA-DE-ARRANQUE.md`.*
