# Análisis experto de la web Calma Society

> Análisis del 24-jun-2026 por un panel de 11 analistas (arquitectura, IA/navegación, contenido, SEO/GEO, rendimiento, a11y, diseño, conversión, monetización, herramientas y producto), con verificación adversarial de cada hallazgo grave contra el código real y el sitio en vivo (27 agentes, 15 hallazgos graves verificados). Límite honesto: no se ejecutó Lighthouse real en navegador ni se midió INP/TBT en campo; no se pudo confirmar desde fuera si los formularios pop-up de MailerLite (ETGJGK) y embebido (GIibQ8) están publicados y activos en la cuenta; los juicios de rendimiento se basan en el peso de los bundles en `dist/` y el análisis estático.

## Veredicto en una frase

Es un producto editorial y de ingeniería de gama alta —voz propia real, GEO impecable, herramientas con IP genuina— montado sobre un motor de audiencia que aún no arranca: el KPI nº1 (captar correos) cuelga al 100% del JS de un tercero sin red de seguridad, no hay lead magnet pese a estar escrito, y el planificador ya público sirve 81 fichas sin aprobar; la estrategia es de sobresaliente, la ejecución del "negocio con audiencia" todavía no demuestra el moat (0 suscriptores, 0 ingresos extra).

## Madurez por dimensión

| Dimensión | Score | Juicio en una línea |
|---|---|---|
| Arquitectura y stack | 78 | Split de despliegue en 3 modos brillante; mínimo-JS real (~42 KB); deuda de type-check acotada y exagerada por un paquete hermano. |
| Arquitectura de información | 70 | Base limpia y ampliable, pero esconde las dos herramientas insignia y deja las fichas de lugar sin tejido interno. |
| Contenido y calidad editorial | 78 | Lo más maduro del proyecto: voz de lujo tranquilo, GEO universal y disciplina anti-invención; desequilibrio por secciones. |
| SEO y GEO técnico | 82 | Muy por encima de la media; faltan `lastmod`, schema en portadas de sección y densidad de enlazado interno. |
| Rendimiento y CWV | 82 | Andamiaje sólido (estático, CSS <10 KB gz, imágenes ejemplares); MailerLite global y preload de hero son las fugas. |
| Accesibilidad (WCAG AA) | 82 | Oficio real (skip link, foco, reduced-motion); pulir jerarquía de encabezados y dos colores de acento. |
| Diseño y dirección de arte | 78 | Sistema premium genuino; contradicción "esquina dura vs rounded-xl" y portadas de sección uniformes. |
| Conversión y motor de audiencia | 52 | El eslabón más débil y el más importante: el embudo tiene fugas reales y no ejecuta la estrategia ya escrita. |
| Monetización y modelo | 62 | Diagnóstico honesto, palanca única bien instrumentada; falta el `rel="sponsored"` y declarar el conflicto en /quienes-somos. |
| Dirección estratégica y producto | 74 | Estrategia clarísima y brechas cerradas desde la radiografía; el motor de audiencia y el respaldo en git siguen pendientes. |

## Lo que MANTENDRÍA (no tocar)

- **El split de despliegue en 3 modos desde un solo repo** (`astro.config.ts:29-69`, `keystatic.config.ts:101-103`). Cloudflare sirve la web 100% estática sin adaptador ni Keystatic; Vercel monta el panel; local usa Keystatic en modo file. Es la decisión arquitectónica más fina del proyecto y blinda que la web pública nunca vuelva a llevar adaptador (el incidente del KV no se repite).

- **El mínimo-JS real y medible**: todo el JS de cliente del sitio cabe en ~42 KB sin comprimir en 2 bundles (planificador 37,7 KB + mapa 4,4 KB); el resto es HTML/CSS/SVG, y no se filtra runtime de React/Keystatic al build público. Cumple §3.5 al pie de la letra y honra la excepción razonada de la decisión #13.

- **El motor del planificador como función pura, tipada y con 55 tests verdes** (`engine.ts`, `npm test` → 55/55). Determinista (plan compartible por querystring), separado en reglas trazables, sin IO ni azar. Es código de calidad de producción.

- **La voz editorial de lujo tranquilo y la estructura GEO universal**. Prosa con tesis y honestidad (`caldereta-de-langosta-fornells.mdx:20-22`), bloque "Lo esencial / The essentials" + encabezados-pregunta + "Nuestro criterio" en los 116 publicados, y disciplina anti-invención (56/58 ES con lenguaje de cautela y fechado). Es el activo que la IA no puede replicar y la razón de ser del medio.

- **La paridad ES/EN y el cortafuegos de aprobación que funciona de verdad** en artículos: 61 `translationKey` exactos (1 ES + 1 EN), 0 `published` con `auto-sin-revisar`, traducciones nuevas esperando en draft.

- **Los dos activos GEO de primer nivel**: el mapa "Mar en calma" emite 75 entidades `Beach` con geo + estado del mar fechado (`observationDate`) y la metodología lleva `FAQPage`; el cron AEMET degrada con honestidad ejemplar (nunca "calma" falsa, staleness en servidor y cliente, zona horaria de Menorca). Es exactamente el dato concreto, geolocalizado y fechado que las IA citan.

- **La paleta cálida "Calma" sin azul y la tipografía con eje óptico** (`global.css:9-21, 57-76`). El mayor diferenciador visual frente a una competencia que abusa del turquesa; la itálica real de Fraunces en tagline y entradillas es una firma editorial que pocos proyectos ejecutan.

- **El diagnóstico de monetización honesto**: el plan reconoce sin maquillar que no hay audiencia ni ingresos, aparca patrocinios/directorio/membresía hasta tener masa crítica y concentra el ingreso en la palanca correcta (tráfico a Menorca Bus), bien instrumentada con UTM + Umami + panel propio. No monetizar prematuramente protege el moat.

## Lo que CAMBIARÍA (mejorar lo que hay)

Ordenado por impacto sobre el objetivo real (audiencia/newsletter + GEO).

### 1. El KPI nº1 cuelga 100% del JS de MailerLite, sin fallback estático — y el fallback ya existe en el repo `[ALTA]`
- **Problema:** con `enabled:true`, `NewsletterSignup.astro:86-87` renderiza solo un `<div class="ml-embedded" data-form="GIibQ8">` vacío. Cero `<input type=email>`, cero `<form>`, cero `<noscript>`. Si un ad-blocker/Brave/uBlock/CSP/fallo de red bloquea el script, el visitante no ve ningún campo de correo en ninguna página — y ese perfil de privacidad solapa justo con la audiencia premium objetivo.
- **Evidencia:** verificado en vivo (`/newsletter`, HTML estático: 0 ocurrencias de `type=email`, 0 de `<form`). El componente nativo de respaldo `SocietyCaptureForm.astro:47-81` (form Formspree + email + consentimiento RGPD, funciona sin JS) **ya está escrito** pero cerrado tras la condición `!enabled`.
- **Qué hacer:** renderizar SIEMPRE el `<form>` nativo (reutilizando `SocietyCaptureForm`) y dejar que MailerLite lo realce encima (progressive enhancement), o como mínimo inmediato meterlo en `<noscript>` junto al embed. Verificar en navegador real con uBlock que GIibQ8 carga.

### 2. No existe el lead magnet, pese a que el plan lo declara imprescindible `[ALTA]`
- **Problema:** `/newsletter` ofrece "cada quince días, las noticias de la Sociedad" — un intercambio débil. No hay imán de valor a cambio del correo. El propio brief (`ESTRATEGIA/BRIEFS/brief-web-lead-magnet-calas.md`) y `docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md:52` exigen "Las calas con menos gente" / "Agenda del mes" con doble opt-in, landing dedicada (`/la-society/calas-en-calma`) y secuencia de bienvenida.
- **Evidencia:** la landing no existe (`src/pages/**` sin `/la-society` ni `/the-society`); no hay PDF en `public/`. Está especificado y documentado, pero ni construido ni desplegado.
- **Qué hacer:** empaquetar un imán con lo que ya se produce (PDF "Agenda del mes" o "Las calas con menos gente, por viento" derivado del mapa de calma), ofrecerlo explícitamente en `/newsletter` y al cierre del planificador, construir la landing ES+EN con `hreflang`. Es la palanca de mayor retorno sobre el KPI nº1 y casi todo el contenido ya existe.

### 3. El KPI nº1 está SIN medir en la analítica propia `[ALTA]`
- **Problema:** no hay ningún `data-umami-event` en el CTA ni en el submit de newsletter; los únicos eventos trackeados son `home-reserva-menorcabus`, `home-guia-movilidad`, `footer-menorcabus` y `planner-*`. El submit vive dentro del JS de MailerLite y no se mide. La conversión visitante→suscriptor —la hipótesis sobre la que descansa todo el negocio— hoy es invisible.
- **Evidencia:** grep de `data-umami-event` sin coincidencias en `NewsletterSignup.astro`, `SocietyCaptureForm.astro` ni `NewsletterPopup.astro`.
- **Qué hacer:** instrumentar al menos el clic en "Unirme a la Sociedad" (trackeable aunque el campo lo gestione MailerLite) y, si se adopta el form nativo del punto 1, el submit real. Sin esto no se puede saber si el embudo funciona.

### 4. El planificador EN VIVO sirve 81/88 fichas en estado `draft`, saltándose el cortafuegos §6 bis `[ALTA]`
- **Problema:** la página es pública y promocionada (en el Header), pero `scripts/build-planner-data.mjs:65-84` compila los borradores a propósito ("gatear a published en P3") y `toPlannerPlace()` no emite el campo `status`, así que ni el cliente puede filtrar. De 88 fichas por idioma con bloque planner, 81 son `draft`. Es una violación viva del principio NO NEGOCIABLE de aprobación humana antes de publicar (§3.10) sobre datos de horarios/accesos.
- **Matiz:** no es emergencia de datos falsos —las fichas draft están curadas (`highlights`, `lastVerified`, `dataCertainty`)— sino de gobernanza editorial.
- **Qué hacer:** decisión de una línea, antes de seguir promocionando: o emitir `status` en build y filtrar a `published`, o aprobar (marcar `published`) las fichas ya curadas. Aplicar al planificador el mismo rigor que ya tiene la agenda (`import-agenda.mjs:114`, todo nace draft).

### 5. Las dos herramientas insignia están infrapromocionadas: no aparecen en home ni en portadas de sección `[ALTA]`
- **Problema:** el Planificador y "Mar en calma" —el núcleo del moat GEO y los mejores ganchos para captar la Sociedad— solo viven al final de la nav del header (tras un divisor) y, en móvil, debajo de las 6 secciones dentro del `<details>` colapsado. El cuerpo de la home no las menciona (0 coincidencias en `index.astro`), y el Planificador ni siquiera está en el footer. En contraste, Menorca Bus (afiliación) tiene bloque propio en home + botones + entrada de footer.
- **Qué hacer:** promocionar ambas a la home con un bloque propio (como el de Menorca Bus), enlazarlas desde las portadas de sección afines (Mar en calma desde Descubrir; Planificador desde Descubrir/Moverse), añadir el Planificador al footer y subirlas en el menú móvil. Esconder los mejores activos contradice el KPI nº1.

### 6. Las páginas índice de sección y de lugar no tienen ningún punto de captación `[MEDIA]`
- **Problema:** `SectionView.astro` y `PlaceLayout.astro` no incluyen `NewsletterSignup`. Un visitante que llegue de buscador/IA a `/descubrir` o a una ficha de lugar y no entre en un artículo nunca ve una invitación a suscribirse. Son páginas de entrada de tráfico orgánico desaprovechadas.
- **Qué hacer:** añadir `<NewsletterSignup />` (variante section/inline) al pie de ambas plantillas, con el mismo cuidado anti-ruido del resto.

### 7. Enlaces a Menorca Bus sin `rel="sponsored"` `[MEDIA]`
- **Problema:** los 4 puntos de salida a menorcabus.com usan solo `rel="noopener"`, contradiciendo el propio plan (`PLAN-DE-MONETIZACION.md:96`), `MARKETING-CRECIMIENTO-Y-NOMBRE.md:91` y CLAUDE.md §8. La transparencia con el lector ya está resuelta (el disclosure inline existe en `MenorcaBusCTA.astro:67`); lo que falta es la higiene SEO del self-dealing.
- **Evidencia:** `MenorcaBusCTA.astro:61`, `index.astro:148`, `Footer.astro:98`, `PlannerView.astro:398`. El componente `OutboundLink.astro:18-23` ya implementa `kind='partner'` → `"sponsored noopener"` pero no se usa aquí.
- **Qué hacer:** añadir `rel="sponsored noopener"` reutilizando `OutboundLink kind='partner'`. Cambio de minutos.

### 8. Artículos de la flota propia publicados como editorial neutro, sin marca de patrocinado `[MEDIA]`
- **Problema:** `mercedes-clase-s-menorca.mdx`, `mercedes-clase-v-menorca.mdx` y `moverse-con-lujo-menorca.mdx` están en `section: practica`, `status: published`, sin `sponsored: true`, y cierran con un epígrafe "## Nuestro criterio" que los reviste de neutralidad. Solo divulgan al *operador*, no que Menorca Bus es el propio negocio del grupo editor.
- **Matiz importante:** la infraestructura YA existe (schema `sponsored` en `content.config.ts:59`, render de la pill "Contenido patrocinado" en `ArticleLayout.astro:74-80`). No hay que crear ningún componente; solo activarlo.
- **Qué hacer:** marcar `sponsored: true` en esos 3 artículos (la etiqueta aparece sola), añadir divulgación explícita de la titularidad del grupo y replantear el "## Nuestro criterio" que los presenta como juicio independiente.

### 9. SEO/GEO: faltan `lastmod`, schema en portadas de sección y un par de afinados `[MEDIA]`
- **Problema:** (a) el sitemap no lleva `<lastmod>` en ninguna de sus 184 URLs — penaliza el recrawl de un mapa que cambia a diario; (b) las portadas de sección no emiten `ItemList/CollectionPage` ni `BreadcrumbList` (hub que la IA usa como índice temático, desaprovechado); (c) afinados: clubs como `Store` en vez de `NightClub/BarOrPub/BeachResort`, `Event` sin `offers/organizer`, `Article` sin `publisher.logo`.
- **Qué hacer:** emitir `lastmod = updatedDate ?? publishDate` (y la fecha del parte en el mapa) vía `serialize` de `@astrojs/sitemap`; añadir Breadcrumb + ItemList a las portadas de sección; subdividir el tipo `comercio` y enriquecer `Event`/`Article`. Todo incremental, sin tocar arquitectura.

### 10. Fichas de lugar finas y sin salida editorial; breadcrumb visual ausente en todo el sitio `[MEDIA]`
- **Problema:** `PlaceLayout` solo tiene breadcrumb en JSON-LD (no clicable en pantalla) y sus únicas acciones son externas (Google Maps, web). No hay "Aparece en", ni calas vecinas, ni enlace a la sección — el contenido es un callejón sin salida. Las fichas son delgadas (~160 palabras). Y ninguna plantilla (artículo ni lugar) muestra el breadcrumb visual que el JSON-LD sí declara.
- **Nota de verificación:** se descartó el hallazgo de "páginas huérfanas en el sitemap" — los 17 lugares publicados por idioma reciben todos enlace interno (clúster vida nocturna + naveta + 4 calas del mapa); las ~162 fichas sin enlazar están en `draft` y no se rutean ni entran al sitemap.
- **Qué hacer:** añadir breadcrumb visual (Inicio › Sección › Título) coherente con el JSON-LD en `ArticleLayout` y `PlaceLayout`; un bloque "Aparece en" calculado por relación inversa de `relatedPlaces`; enlazar menciones internas (p. ej. Macarelleta dentro de la ficha de Macarella); y enriquecer las fichas que se mantengan publicadas.

### 11. MailerLite Universal carga en TODAS las páginas `[MEDIA]`
- **Problema:** `BaseLayout.astro:108-127` inyecta `universal.js` sin condición por ruta, cuando solo se necesita en ~6 páginas (home x2, newsletter x2, planificador x2). Los ~232 artículos lo cargan sin renderizar ningún widget. Va con `async`, así que no bloquea render, pero su runtime de webforms suma trabajo de hilo principal (TBT/INP) en todo el sitio.
- **Qué hacer:** cargarlo solo donde se usa, o diferirlo on-interaction. **Medir antes/después con Lighthouse móvil** antes de afirmar que es el cuello de botella (no se verificó el impacto real).

### 12. Rendimiento del hero: sin `preload` del LCP, sirviendo 1600w en escritorio `[MEDIA]`
- **Problema:** la imagen LCP no lleva `<link rel="preload">` (0 en `dist/index.html`) pese a ser `eager+fetchpriority`; el navegador no la descubre hasta parsear. Y a `sizes="100vw"` el escritorio tira del WebP de 1600w (~339 KB) cuando el contenedor casi nunca lo necesita.
- **Qué hacer:** añadir `<link rel="preload" as="image" imagesrcset imagesizes="100vw">` solo en páginas con hero (prop opcional al BaseLayout); añadir un escalón intermedio (1280w) o ajustar `sizes`. Ganancia directa de LCP en home y portadas.

### 13. A11y: saltos de encabezado y dos colores de acento bajo AA `[MEDIA]`
- **Problema:** en `/agenda` y `/[section]` el h1 salta a h3 sin h2 (WCAG 1.3.1/2.4.10); `terracota` como hover de enlaces da 3,66:1 (AA✗ en texto normal) y `oro` sobre `arena` 3,96:1. El `alt` de las tarjetas de evento repite el título en vez de describir la foto (falta `imageAlt` en el schema de eventos).
- **Qué hacer:** introducir un h2 (visible o `sr-only`) o hacer `headingLevel` configurable en las *Card; oscurecer el terracota usado como texto o reforzar el hover con subrayado/peso; usar `arcilla` para eyebrows sobre arena; añadir `imageAlt` opcional a eventos (y `alt=""` cuando falte, mejor que duplicar el título).

### 14. Inconsistencias de marca y de sistema de diseño `[MEDIA]`
- **Problema:** (a) `SITE.description` y `/newsletter` siguen con el lema viejo ("el arte del lujo tranquilo en el Mediterráneo") mientras la marca usa "El Mediterráneo, sin prisa" — y ese string alimenta meta description y OG; (b) contradicción real: las tarjetas predican "sin marco / esquina dura" pero hero de artículo, lugar y `Figure` usan `rounded-xl`; (c) las portadas de sección son una rejilla uniforme 3-col que renuncia al ritmo asimétrico de la home; (d) conviven tres gramáticas de botón (rounded-md, rounded-full pill, filete subrayado).
- **Qué hacer:** unificar `SITE.description` (1 línea, efecto en SEO/GEO); decidir UNA regla de radio (la esquina recta es la más alineada con el propio discurso del código); llevar el ritmo asimétrico de la home a las secciones (la lógica ya existe en `index.astro`); centralizar `.btn`/`.btn-ghost`/`.link-filete` y eliminar el pill del manifiesto.

### 15. Higiene técnica: type-check, CI y respaldo en git `[MEDIA]`
- **Problema:** (a) `tsconfig.json` arrastra el paquete hermano `REDES-SOCIALES` (gitignored, 1,2 GB), que aporta 13 de los 56 errores de `astro check`; los reales del sitio son ~33 en el mapa (implicit-any del JS de la timeline) + 6 triviales de narrowing en index; (b) no hay CI que ejecute build/test/check en cada push — los 55 tests del planificador hoy nadie los corre; (c) `REDES-SOCIALES/`, `ESTRATEGIA/`, `marca/`, `NEGOCIO/` y `MARCA-PARA-ABRIR/` están fuera de git (el motor de crecimiento, sin red de seguridad).
- **Qué hacer:** excluir `REDES-SOCIALES` y `.tmp_research` en `tsconfig`; tipar el `<script>` del mapa y estrechar los `.filter(Boolean)` para poner `astro check` en verde; añadir un workflow de push/PR con `npm ci && npm test && npm run build`; versionar al menos el texto/estrategia/config de las carpetas excluidas (no los binarios pesados).

## Lo que haría DIFERENTE (replantear de raíz)

- **El embudo de captación, no parchearlo: invertir la dependencia.** Hoy la arquitectura asume MailerLite como base y el form nativo como excepción apagada. Lo invertiría: form nativo estático SIEMPRE como capa base (cumple "mínimo JS" y "rendimiento sagrado" en el punto más crítico), MailerLite como realce opcional encima. Trade-off honesto: Formspree recoge correos pero no los mete en la lista de MailerLite, así que habría que decidir destino único (integración Formspree→MailerLite o API directa). Pero tener el KPI nº1 colgando de un tercero, sin medición y sin fallback, es el riesgo de producto más grande que tiene la casa.

- **La autoría como `Person` para una firma colectiva.** La decisión de firmar "Redacción de Calma Society" es legítima y del dueño — no la discuto. Lo que cambiaría es el mapeo de schema: un colectivo emitido como `{"@type":"Person"}` es semánticamente incorrecto y un evaluador de IA difícilmente lo lee como "experto real". Emitir `author` como `Organization` y reforzar E-E-A-T en `/quienes-somos` con metodología de verificación y, si es posible, 1-2 colaboradores reales con especialidad. El moat anti-IA vende "autoría visible"; hoy es una marca, no una persona verificable.

- **La dependencia casi total de foto de stock.** No es un defecto, es el techo real de la "dirección de arte premium" en una revista cuyo principio dice "la fotografía es el alma". El velo cálido `.img-calma` lo doma con criterio, pero dos calas distintas con el mismo filtro empiezan a parecerse. A medio plazo: curaduría más estricta del stock, un tratamiento de color/grano aún más propio, e introducir poco a poco fotografía propia o de colaboradores locales en las piezas estrella (lead de cada sección, hero de home). Es lo que separará "plantilla bonita con buen stock" de "revista con mirada propia" — y conecta directo con el moat de primera mano.

- **El conflicto Menorca Bus en la página de confianza.** La editora *es literalmente* la empresa de buses (`Menorca Bus, S.L.`, titular de la web), pero `/quienes-somos` habla de patrocinios "si los hay" en genérico y proclama "recomendamos por convicción, no por comisión", sin nombrar el conflicto más relevante. El CTA ya lo declara inline; consolidarlo con un párrafo honesto "cómo nos financiamos" en la página donde la confianza se juzga *refuerza* E-E-A-T en vez de restarlo. La transparencia parcial es peor señal que la total.

## Hoja de ruta priorizada

**AHORA (días, alto retorno sobre el KPI y la credibilidad):**
1. Render del formulario nativo SIEMPRE en `/newsletter` y en los CTA (reutilizar `SocietyCaptureForm`); MailerLite como realce. → cierra la fuga nº1 del embudo.
2. Gatear el planificador a `published` (emitir `status` y filtrar, o aprobar las fichas curadas). → resuelve la violación viva de §6 bis.
3. Instrumentar Umami en el CTA/submit de newsletter. → empezar a medir el KPI nº1.
4. Unificar `SITE.description` con el tagline vigente. → 1 línea, efecto SEO/GEO.
5. Añadir `rel="sponsored noopener"` a los 4 enlaces a Menorca Bus y `sponsored: true` a los 3 artículos de la flota. → cumplimiento de transparencia/SEO, minutos.

**SIGUIENTE (semanas, construir el motor de audiencia):**
6. Lead magnet real (PDF "Las calas con menos gente" / "Agenda del mes") + landing ES+EN + doble opt-in. → la palanca de mayor retorno, ya especificada.
7. Promocionar Planificador y "Mar en calma" en la home (bloque propio) y en portadas de sección; añadir Planificador al footer.
8. `NewsletterSignup` al pie de `SectionView` y `PlaceLayout`; añadir `<NewsletterSignup/>` y breadcrumb visual a las plantillas.
9. Párrafo "cómo nos financiamos" en `/quienes-somos` nombrando Menorca Bus.
10. CI ligero (build + test + check) en push/PR; excluir `REDES-SOCIALES` de `tsconfig` y poner `astro check` en verde.
11. Versionar texto/estrategia/config de las carpetas hoy fuera de git.

**MÁS ADELANTE (meses, robustez y techo de producto):**
12. `lastmod` en sitemap + `ItemList/CollectionPage` en portadas de sección + afinados de schema (clubs, Event, publisher.logo).
13. `author` como `Organization` y E-E-A-T reforzado en `/quienes-somos`.
14. Migrar el cron AEMET a Cloudflare Cron Triggers + alerta si el parte envejece >36h (no depender de la actividad del repo).
15. Reequilibrar contenido hacia "vivir" (segmento de mayor valor: publicar los 3 drafts revisados y producir más).
16. Publicar progresivamente un subconjunto de fichas de lugar de alta calidad, indexables y enriquecidas (activo GEO ya producido).
17. Preload del hero LCP + escalón 1280w; medir y, si procede, diferir MailerLite Universal. Pagefind cuando el volumen por sección moleste.
18. Replantear stock → fotografía propia en piezas estrella; resolver la incoherencia de radio y la gramática de botones.

## La verdad incómoda

La brecha no está entre "buena web" y "mala web" — la web es buena, en partes excelente. La brecha está entre **lo declarado y lo demostrado**, y cae justo sobre el corazón del negocio. El proyecto declara que "el activo no es la web, es una audiencia leal" y que captar suscriptores es el KPI nº1; sin embargo, ese KPI hoy depende al 100% del JS de un tercero sin red de seguridad, no se mide en la analítica propia, no ofrece ningún incentivo concreto a cambio del correo, y el respaldo nativo que resolvería el problema *ya está escrito en el repo, apagado*. Lo más revelador es que toda la estrategia correcta ya está documentada (el brief del lead magnet, las colocaciones, el doble opt-in): no es un problema de criterio, es un problema de **ejecución del último 10%** — precisamente el 10% que convierte el tráfico en negocio. El resultado actual: 0 suscriptores, 0 citas IA conocidas, 0 ingresos extra. El moat se presume, no se ha demostrado con un solo dato.

¿Es la dirección correcta? Sí, sin duda. Priorizar audiencia antes que monetizar, construir GEO y primera mano en vez de SEO de volumen, defender la calma frente al ruido publicitario — es la apuesta acertada, y la ejecución técnica y editorial está a la altura. Pero la dirección correcta con el embudo roto produce una revista hermosa que nadie sigue. El mayor riesgo no es técnico ni de gusto: es que el equipo siga puliendo lo que ya brilla (más herramientas, más artículos, más afinados de schema) mientras el motor de captación —el único que valida toda la hipótesis— sigue a medio gas. Las cinco acciones de "AHORA" cuestan días, no meses, y desbloquean la única pregunta que importa: ¿el lector cualificado, al llegar, se queda? Hasta responderla con datos, todo lo demás —branded, directorio, membresía, más idiomas— es proyección sobre una hipótesis no validada.

---

*Informe generado por análisis multiagente (27 agentes, verificación adversarial). Actualizar cuando se ejecuten las acciones. Complementa `docs/RADIOGRAFIA-CALMA-SOCIETY.md`.*
