# Estrategia multilingüe — Llegar a toda Europa con calidad

> Cómo la revista alcanza a todo el turista europeo **sin** romper la calidad editorial, el SEO ni la confianza. Acompaña a `CLAUDE.md` (§2 decisión 2, §3 principio 4, §5, §6).

---

## 1. El principio (y la trampa que evitamos)

**Objetivo del dueño:** "todos los idiomas europeos por igual" para llegar a todo el turista.

**La trampa:** traducir la web a 20 idiomas con traducción automática "de botón". Esto **hunde** el proyecto porque:
- Google detecta y **degrada** el contenido traducido en masa de baja calidad (lo trata como spam/contenido fino).
- Las IAs (ChatGPT, Perplexity) **no citan** contenido genérico mal traducido → perdemos el canal que más convierte (ver análisis §4.5).
- Rompe la **confianza**, que es el activo del negocio (`CLAUDE.md` §3.8).
- El propio análisis lo prohíbe: *"Nada de traducciones automáticas chapuceras"*.

**La solución:** separar **arquitectura** (preparada para infinitos idiomas desde el día 1) de **despliegue** (idiomas que se activan por orden de mercado, con traducción revisada).

> Resumen: *"por igual" se cumple en la estructura; el despliegue se hace por prioridad de mercado y siempre con revisión humana.*

---

## 2. Orden de mercados (despliegue por fases)

Basado en los mercados emisores de Menorca (análisis §1.1):

| Prioridad | Idioma | Locale | Mercado | Cuándo |
|---|---|---|---|---|
| 1 | Español | `es` (raíz) | Nacional + LATAM | Día 1 |
| 1 | Inglés | `en` | **UK** (mayor emisor) + internacional | Día 1 |
| 2 | Alemán | `de` | Alemania | Tras validar ES/EN |
| 2 | Francés | `fr` | Francia | Con DE |
| 3 | Italiano | `it` | Italia | Siguiente ola |
| 4 | Neerlandés, Polaco… | `nl`, `pl`… | Países Bajos, Polonia… | Según datos de tráfico real |
| Futuro | Asiáticos (no europeos) | `zh`, `ja`… | Cuando haya demanda medida | Fase tardía |

**Regla:** no se añade un idioma "por si acaso". Se añade cuando (a) hay capacidad de mantener su calidad y (b) los datos o la estrategia lo justifican. Inglés es el único **no negociable** junto al español (análisis §1.1: *"el inglés no es opcional"*).

---

## 3. Arquitectura (lo que se construye desde el día 1)

- **Lista de locales en un solo sitio:** `src/config/site.ts` exporta los idiomas activos. Añadir un idioma = añadir una entrada ahí + su diccionario de UI. **Nunca** tocar plantillas.
- **Rutas:** español en la raíz (`/comer-y-beber/`), el resto bajo prefijo (`/en/eat-and-drink/`, `/de/…`). Slugs traducidos por idioma (mejor SEO local).
- **Diccionarios de UI** en `src/i18n/` (un archivo por idioma): los textos de interfaz (menús, botones, "Leer más"…), separados del contenido editorial.
- **`translationKey`** en cada contenido: une todas las versiones de idioma de la misma pieza. Permite el selector de idioma y el `hreflang`.
- **`hreflang` + `canonical`** automáticos entre todas las versiones (Fase 4). Esto le dice a Google qué versión servir a cada usuario sin penalizar por "contenido duplicado".
- **Selector de idioma** visible que lleva a la versión equivalente (no a la home).
- **Fallback honesto:** si una pieza no existe en el idioma del usuario, se indica y se ofrece la versión disponible — nunca se muestra una traducción automática sin avisar.

---

## 4. El pipeline de traducción (calidad acelerada, no chapuza)

Flujo de cada pieza traducida (encaja con el flujo de aprobación, ver `docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md`):

```
Original (ES o EN)
   → traducción asistida (DeepL API / IA con glosario de marca)   [genera status: draft, translationStatus: 'auto-sin-revisar']
   → revisión humana (nativo o competente)                        [translationStatus: 'revisado']
   → aprobación del dueño                                          [status: published]
```

- **Glosario de marca:** términos que NO se traducen o se traducen siempre igual (nombre de la revista, "Camí de Cavalls", "queso Mahón-Menorca DOP", secciones…). Se mantiene un archivo de glosario.
- **Etiquetado interno:** el campo `translationStatus` distingue `original` / `auto-sin-revisar` / `revisado`. **La build pública solo muestra `revisado` + `published`.**
- **Prioridad de traducción:** primero los **pilares atemporales** (guías de calas, gastronomía, "cómo llegar") que sirven todo el año y a todos los mercados; lo efímero (agenda) puede vivir con menos idiomas.
- **Motor (`[PENDIENTE]`):** DeepL API (excelente para idiomas europeos) o IA con revisión. Se decide en Fase 6 según presupuesto.

---

## 5. SEO/GEO multilingüe (lo que de verdad posiciona)

- Slugs y metadatos **nativos por idioma** (no traducción literal de keywords): investigar qué busca de verdad cada mercado.
- `hreflang` correcto = Google sirve la versión adecuada y no penaliza.
- Una pieza **excelente en 3 idiomas** posiciona más que una mediocre en 15.
- Para GEO: datos concretos (horarios, precios, accesos) + autoría visible en cada idioma → las IAs citan con confianza en ese mercado.

---

## 6. Errores a no cometer

- ❌ Activar un idioma sin capacidad de mantener su calidad.
- ❌ Publicar traducción `auto-sin-revisar` al público.
- ❌ Traducir slugs/keywords literalmente sin investigar el mercado.
- ❌ Dejar páginas "huérfanas" (existen en un idioma y enlazan a un 404 en otro).
- ❌ Olvidar `hreflang`/`canonical` (genera canibalización y penalización).
