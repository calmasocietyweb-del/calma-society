# Guía de arranque — Cómo construir la revista con Claude Code

> Guía práctica para poner en marcha el proyecto desde cero. Pensada para seguir paso a paso aunque no seas técnico. Acompaña a `CLAUDE.md` (las instrucciones que lee Claude Code) y a `docs/ANALISIS-MERCADO-MENORCA.md` (el contexto estratégico).

> **Actualización junio 2026 — alcance ampliado.** El proyecto pasa de "bilingüe ES+EN" a **multilingüe europeo**, incorpora **automatización con aprobación humana** (tú apruebas cada contenido antes de publicar) y un **plan de marketing/monetización** explícito. Lee también estos documentos nuevos:
> - `docs/ESTRATEGIA-MULTIIDIOMA.md` — cómo llegamos a toda Europa sin romper la calidad ni el SEO.
> - `docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md` — qué funciona solo, qué apruebas tú, y la pantalla de aprobación de contenidos.
> - `docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md` — captación de audiencia, monetización, tráfico a tus negocios y cómo elegimos nombre y dominio.
>
> Trabajaremos de forma **conversacional** (Claude construye fase a fase y tú revisas), pero los prompts de abajo siguen sirviendo como guion de referencia.

---

## 1. Cómo organizar la carpeta del escritorio

Crea una carpeta (por ejemplo `revista-menorca`) y coloca dentro estos archivos **antes** de abrir Claude Code:

```
revista-menorca/
├─ CLAUDE.md                         ← (raíz; Claude Code lo lee solo)
└─ docs/
   ├─ ANALISIS-MERCADO-MENORCA.md
   └─ GUIA-DE-ARRANQUE.md            ← este archivo
```

Cuando Claude Code empiece a construir, irá creando el resto (`src/`, `public/`, `package.json`, etc.) **alrededor** de estos archivos. No los borres ni los muevas.

---

## 2. Requisitos previos (instalar una sola vez)

1. **Node.js** (versión LTS) — entorno para construir el sitio. Descárgalo de [nodejs.org](https://nodejs.org). Para comprobar que está instalado, en la terminal: `node --version`.
2. **Git** — control de versiones. [git-scm.com](https://git-scm.com). Comprobar: `git --version`.
3. **Un editor de código** — recomendado **Visual Studio Code** ([code.visualstudio.com](https://code.visualstudio.com)). Trae terminal integrada.
4. **Claude Code** — el agente que construirá el sitio. Instálalo y accede según la documentación oficial de Anthropic ([docs.claude.com](https://docs.claude.com)). Requiere Node.js ya instalado.
5. **Una cuenta de despliegue gratuita** (elige una): **Cloudflare Pages**, **Netlify** o **Vercel**. (Más adelante.)
6. **(Opcional, recomendado) Una cuenta de newsletter:** **MailerLite** o **Buttondown** (ambas con plan gratuito).

> Si algún comando da error de permisos o de red, anótalo y pídeselo a Claude Code: suele saber resolver problemas de entorno.

---

## 3. Iniciar Claude Code en la carpeta

1. Abre la carpeta `revista-menorca` en VS Code (`Archivo → Abrir carpeta`).
2. Abre la terminal integrada (`Terminal → Nueva terminal`).
3. Inicia Claude Code en esa carpeta (según su documentación).
4. Lo primero que debe hacer Claude Code es **leer `CLAUDE.md` y la carpeta `docs/`**. El primer prompt (abajo) se lo pide explícitamente.

**Antes de construir, confirma las decisiones del §2 de `CLAUDE.md`** (nombre, idiomas, stack, etc.). Si cambias algo, dile a Claude Code que actualice `CLAUDE.md` primero.

---

## 4. Secuencia de prompts listos para pegar

Pega estos prompts **en orden**, uno por fase. Espera a que cada fase termine, despliegue/compile y la revises antes de pasar a la siguiente. Adapta lo que esté entre `[corchetes]`.

### Prompt 0 — Arranque y cimientos
```
Lee CLAUDE.md y todo lo que hay en docs/ antes de hacer nada. Es la fuente de
verdad del proyecto; resúmeme en 5 puntos qué vamos a construir y confírmame
las decisiones de la sección 2 de CLAUDE.md.

Después, ejecuta la Fase 0 del roadmap: scaffolda un proyecto Astro con
TypeScript, Tailwind CSS, soporte MDX, sitemap e i18n nativa preparada para
MÚLTIPLES idiomas europeos (español por defecto en la raíz, inglés bajo /en, y
la arquitectura lista para añadir /de, /fr, /it… sin rehacer nada). Crea la
estructura de carpetas indicada
en CLAUDE.md §9, un archivo src/config/site.ts con los datos globales del sitio
(usa "Revista Menorca" como nombre placeholder), un robots.txt y un layout base
mínimo que compile. No añadas dependencias que no estén contempladas. Inicia un
repositorio Git y haz el primer commit. Cuando termines, dime cómo arrancar el
servidor de desarrollo en local.
```

### Prompt 1 — Sistema de diseño
```
Ejecuta la Fase 1. Implementa el sistema de diseño de CLAUDE.md §7: los design
tokens de color y la tipografía (titulares serif tipo Fraunces/Lora, texto sans
tipo Inter), centralizados en la configuración de Tailwind y los estilos
globales. Crea los componentes base: Header, Footer, navegación bilingüe,
LanguageSwitcher, ArticleCard, Hero y NewsletterSignup, más una home placeholder
que los muestre. Mobile-first, accesible (semántico, contraste AA, navegable por
teclado) y con el mínimo JavaScript de cliente posible. Cuida el rendimiento.
```

### Prompt 2 — Modelo de contenido
```
Ejecuta la Fase 2. Crea las content collections de CLAUDE.md §6 (articulos,
lugares, eventos, autores) con sus schemas validados con Zod, ligando versiones
ES/EN mediante translationKey. Crea 2-3 entradas de ejemplo por colección, cada
una en español e inglés, con texto de muestra de calidad (NO relleno) y fotos
placeholder optimizadas. Asegúrate de que alt y heroImageAlt están siempre.
```

### Prompt 3 — Páginas y plantillas
```
Ejecuta la Fase 3. Construye las páginas y plantillas: home editorial, portadas
de cada sección (Descubrir, Agenda, Comer y beber, Vivir, Cultura, Práctica),
plantilla de artículo, plantilla de lugar (con su información práctica:
acceso, aparcamiento, servicios, mejor época), página de agenda/eventos,
página de autor, página "Quiénes somos / Criterio editorial" y página de
newsletter. Todo en ES y EN, respetando el sistema de diseño y enlazando cada
contenido con su versión en el otro idioma.
```

### Prompt 4 — SEO + GEO
```
Ejecuta la Fase 4. Crea un componente Seo reutilizable (title, meta description,
canonical, Open Graph, Twitter cards) y un componente para datos estructurados
JSON-LD que emita el schema correcto según el tipo de página: Article, Place/
LocalBusiness, Event, Organization + WebSite, BreadcrumbList y Person (autores).
Añade hreflang entre versiones ES/EN, el sitemap, un feed RSS y revisa la
jerarquía de encabezados. Optimiza para GEO según CLAUDE.md §8: respuestas
claras, datos concretos y autoría visible. Hazme una auditoría rápida al final.
```

### Prompt 5 — Captación y formularios
```
Ejecuta la Fase 5. Integra la suscripción a la newsletter con [MailerLite /
Buttondown] mediante formulario y su API, con CTA elegante en la home, al final
de cada artículo y en la página /newsletter. Añade un formulario de contacto.
Maneja estados de carga, éxito y error, y respeta la privacidad (sin trackers
invasivos). Si necesitas claves de API, indícame exactamente dónde ponerlas
(variables de entorno) sin exponerlas en el código.
```

### Prompt 6 — Rendimiento y lanzamiento
```
Ejecuta la Fase 6. Optimiza todas las imágenes (AVIF/WebP, lazy-load,
dimensiones), revisa accesibilidad y pasa Lighthouse hasta 95+ en las cuatro
métricas; corrige lo que falle. Prepara el proyecto para desplegar en
[Cloudflare Pages / Netlify / Vercel] con CI desde Git y guíame paso a paso en
la conexión del repositorio y del dominio. Configura la analítica
[Cloudflare Web Analytics / Plausible]. Dame al final el checklist de lanzamiento.
```

### Prompt 6 bis — Automatización y flujo de aprobación
```
Ejecuta la Fase 6 (automatización), según docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md.
Monta el flujo "asistido, no automático": una bandeja donde se acumulan los
contenidos propuestos (eventos recogidos de fuentes, borradores de artículo,
traducciones) en estado "borrador/pendiente", y donde YO los apruebo o rechazo
antes de que se publiquen. Nada se publica sin mi aprobación. Empieza por lo más
sencillo y fiable (agenda de eventos desde fuentes oficiales) y déjalo
documentado para que pueda usarlo sin tocar código.
```

### Prompt 7 — Multilingüe (más mercados)
```
Según docs/ESTRATEGIA-MULTIIDIOMA.md, añade el siguiente idioma del plan
(alemán, luego francés, italiano…) sobre la arquitectura ya preparada: rutas,
hreflang, selector de idioma y diccionario de UI. Para el contenido, genera
borradores de traducción que entren en mi bandeja de aprobación, nunca
publicados directamente. Mantén el glosario de marca.
```

### Prompts de crecimiento (Fase 8+, cuando proceda)
```
- Integra Keystatic para crear y editar artículos con un editor visual sin tocar código.
- Añade búsqueda en el sitio con Pagefind.
- Crea la sección de "directorio premium" de negocios locales (modelo de membresía).
- Activa el plan de marketing de docs/MARKETING-CRECIMIENTO-Y-NOMBRE.md (newsletter, redes, alianzas).
```

---

## 5. Cómo trabajar bien con Claude Code (buenas prácticas)

- **Una fase cada vez.** No le pidas todo de golpe; revisa y aprueba antes de seguir.
- **Pídele que te explique** lo que va a hacer antes de cambios grandes, y un resumen al terminar.
- **Commits frecuentes.** Que guarde cambios en Git a menudo (es tu "deshacer" seguro).
- **Si algo no te gusta, dilo en concreto** ("el header es demasiado grande en móvil", "esta foto debería ir a sangre"). El feedback específico funciona mucho mejor que "no me convence".
- **Protege las decisiones de `CLAUDE.md`.** Si una petición tuya las contradice, recuérdale que `CLAUDE.md` manda o actualízalo tú primero.
- **No compartas claves/contraseñas en el chat.** Que use siempre variables de entorno.
- **Revisa el rendimiento y el bilingüe** en cada entrega (las dos cosas que más se descuidan).

---

## 6. Checklist de lanzamiento

Antes de hacer público el sitio:

- [ ] Nombre y marca reales aplicados (en `src/config/site.ts`).
- [ ] Todas las páginas tienen versión ES y EN, con `hreflang` y selector de idioma.
- [ ] Metadatos, Open Graph y datos estructurados (JSON-LD) en todas las páginas que correspondan.
- [ ] `sitemap`, `robots.txt` y RSS funcionando.
- [ ] Página "Quiénes somos / Criterio editorial" y fichas de autor completas (E-E-A-T).
- [ ] CTA de newsletter visible en home, artículos y página propia; suscripción probada de principio a fin.
- [ ] Formulario de contacto probado.
- [ ] Imágenes optimizadas y con `alt`; nada sin comprimir.
- [ ] Lighthouse 95+ en Performance, Accessibility, Best Practices y SEO.
- [ ] Accesibilidad: navegable por teclado, contraste AA, foco visible.
- [ ] Analítica respetuosa con la privacidad instalada.
- [ ] Dominio conectado con HTTPS.
- [ ] Al menos 10-15 artículos pilar de calidad publicados (no lanzar vacío).
- [ ] Perfiles sociales (Instagram, etc.) creados y enlazados, listos para empezar la captación.
- [ ] Páginas legales mínimas (aviso legal, privacidad, cookies) según normativa.

---

## 7. Qué hacer después del lanzamiento (recordatorio estratégico)

El lanzamiento es el principio, no el final. Según el análisis:
1. **Captar audiencia desde el día uno** (newsletter + redes). "Si lo construyes, vendrán" es falso.
2. **Publicar con constancia** según el calendario por temporada.
3. **Medir lo correcto:** suscriptores, recurrencia, engagement y citas en IA — no páginas vistas.
4. **Activar ingresos por fases:** afiliación → patrocinios/branded → directorio premium → membresía.
5. **No depender de Google.** Diversificar canales (IA, redes, newsletter, boca a boca).

Todo el razonamiento está en `docs/ANALISIS-MERCADO-MENORCA.md`.
```
