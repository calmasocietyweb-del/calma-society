# Spec A — Guía de escala en el puerto de Maó (cruceros)

- **Fecha:** 2026-07-16
- **Ticket Jira:** KAN-79 (a crear)
- **Estado:** aprobado por el dueño, pendiente de plan de implementación
- **Spec hermano:** Spec B — artículos de Mercedes Clase E y Audi A8 (fuera de este documento)

---

## 1. Objetivo

Convertir los dos artículos de cruceros (ES + EN) en una **guía de recomendaciones de qué hacer al llegar al puerto de Maó**, enfocada a la intención de búsqueda real del crucerista, con fotografía y con llamadas a transfer/excursión de Menorca Bus que conviertan sin quemar la confianza del lector.

Además, dotar de **fotografía y CTA a las 30 páginas por barco** (15 barcos × ES/EN), que hoy reciben tráfico de cola larga con altísima intención y no tienen ni imagen ni salida comercial.

### Criterio de éxito

1. Los artículos responden la pregunta real del crucerista ("tengo X horas, ¿qué hago?") antes de proponer nada comercial.
2. El lector entiende cuánto tiempo tiene **de verdad** en tierra — dato que ninguna guía competidora da.
3. Cada página por barco enlaza a la guía y ofrece una salida de transporte contextual con su hora real.
4. Todo enlace saliente a Menorca Bus lleva UTM → se puede medir qué pieza convierte.
5. No baja Lighthouse 95 ni rompe la paridad ES/EN.

---

## 2. Alcance

### Dentro

- Reescritura estructural de `src/content/articulos/cruceros-en-menorca-2026.mdx` (ES) y `cruises-in-menorca-2026.mdx` (EN).
- Fotografía en el cuerpo de ambos artículos (hoy: cero).
- Componente nuevo `FlotaChofer.astro` (módulo "Cómo moverte según con quién viajas").
- Bloque de transporte contextual + foto en `src/components/CruiseShipPage.astro` (afecta a las 30 páginas).
- Ampliación del `faq` del frontmatter (schema `FAQPage` ya operativo).
- Enlazado interno: guía ↔ páginas por barco ↔ clúster de chófer.

### Fuera (explícito)

- **Francés.** El artículo de cruceros no existe en FR y no se crea aquí.
- **Artículos de Clase E y Audi A8.** Van al Spec B.
- **Cambios de `status`.** Ambos artículos ya están `published`; esto son ediciones.
- **Precios, condiciones, cancelación o compromisos de Menorca Bus.** No se inventan (ver §7).
- El robot APB, el calendario de escalas y `src/lib/cruises.ts` no se tocan.

---

## 3. Estructura nueva del artículo (ES y EN)

Orden aprobado. En negrita lo nuevo.

| # | Sección | Contenido |
|---|---------|-----------|
| 1 | Intro + Lo esencial | Se mantiene. Key facts para GEO/citación por IA. |
| 2 | **Dónde atracas: el puerto de Maó** | Dónde deja el barco, qué hay a pie (centro histórico, mercados, destilería de gin), distancias reales. Foto. |
| 3 | **Cuánto tiempo tienes de verdad** | El "todos a bordo" se adelanta ~1 h a la salida: una escala de 8 h son ~6 h útiles. Enlaza a las 15 páginas por barco. |
| 4 | **Qué hacer según tus horas** | Núcleo de la guía. Planes por franja: `<4 h` Maó a pie · `4-6 h` Maó + Ciutadella *o* una cala · `6-8 h` calas del sur · `8 h+` norte y faros. Foto de Menorca. |
| 5 | **Ir por libre o contratar** | Comparativa honesta: a pie / bus público / taxi / transfer privado, con pros y contras reales de cada uno — **incluido cuándo NO hace falta transfer**. |
| 6 | **Cómo moverte según con quién viajas** | `<FlotaChofer />`. Ver §5. |
| 7 | Consejos para cruceristas | Se mantiene, ampliado. |
| 8 | Una temporada de lujo + `<CruceroCalendar />` | **Baja desde la posición 4.** Conserva su H2 y sigue indexable. |
| 9 | Nuestro criterio | Se mantiene. |

### Decisiones de diseño y su porqué

- **§3 es el moat.** Ninguna guía competidora dice que una escala de 8 h son 6 h reales. Es dato honesto, verificable y engancha con `utilesMin`, que las páginas por barco ya calculan. Es lo que la IA citará.
- **§5 debe incluir cuándo NO contratar transfer.** Con una escala corta, Maó a pie es la respuesta correcta y así hay que decirlo. Es contraintuitivo comercialmente, pero es lo único que hace creíbles las secciones 4 y 6. Un artículo que solo empuja el coche no lo cree nadie — y aquí el lector no tiene etiqueta de patrocinio que le avise (ver §7).
- **§6 va después de haber dado valor, nunca antes.** El lector debe llegar al módulo de flota con un problema ya sentido ("6 h y quiero ver Ciutadella y una cala").

---

## 4. Fotografía

Hoy los artículos tienen `heroImage` y **ninguna imagen en el cuerpo**.

### Disponible ya (verificado en `public/uploads/`)

| Archivo | Uso previsto |
|---|---|
| `mb-cruceros.webp` | Hero. Se mantiene. |
| `mb-clase-s-puerto.webp` | **§2 (Dónde atracas)** — es un Clase S en el puerto: contexto exacto. |
| `mb-clase-s-interior.webp` | Tarjeta Clase S en `FlotaChofer`. |
| `mb-clase-v-interior.webp` | Tarjeta Clase V en `FlotaChofer`. |
| `mb-excursiones.webp`, `mb-aeropuerto.webp`, `mb-lujo.webp`, `mb-lujo-detalle.webp` | Reserva. |

### Pendiente de aportar por el dueño

- **Clase E** y **Audi A8** → nombrar `mb-clase-e-*.webp` y `mb-audi-a8-*.webp` en `public/uploads/`.
- **Requisito innegociable:** deben ser fotos **de la flota real**, no material de prensa de Audi/Mercedes (no es libre). Norma del proyecto: ninguna foto sin autor y licencia.

### Equilibrio editorial

La §4 lleva **1-2 fotos de Menorca real** (Ciutadella / cala del sur). Si todas las imágenes son coches, la pieza es un catálogo por muy bueno que sea el texto.

**Origen de esas fotos, por orden de preferencia:**
1. Reutilizar imagen ya presente en `public/uploads/` de otro artículo publicado (Ciutadella, calas del sur) — coste cero, licencia ya resuelta.
2. `MATERIAL FOTOS RRSS/Menorca/_web_CC/` — material con licencia ya despejada.
3. Wikimedia CC con `imageCredit` explícito, como se hizo en las fichas talayóticas y la agenda.

En ningún caso foto sin autor y licencia verificables. Si ninguna de las tres vías da una foto digna, se entrega la §4 sin imagen antes que con una de origen dudoso.

### Requisitos técnicos

- `<Figure>` (ya registrado en `mdxComponents`), con `alt` descriptivo, `caption` y `credit`.
- Variantes 480/960 webp, `loading="lazy"`, dimensiones explícitas → Lighthouse 95+ intacto.

---

## 5. Componente `FlotaChofer.astro`

Módulo de 4 tarjetas: foto · nombre · para quién · una línea · enlace.

### Mapeo (confirmado por el dueño, 2026-07-16)

| Vehículo | Público | Enlace | Foto |
|---|---|---|---|
| **Mercedes Clase V** | Familias y grupos con equipaje | `/articulo/mercedes-clase-v-menorca/` · EN `/en/article/mercedes-v-class-menorca/` (200 ✅) | `mb-clase-v-interior.webp` |
| **Mercedes Clase S** | Pareja, gama alta | `/articulo/mercedes-clase-s-menorca/` · EN `/en/article/mercedes-s-class-menorca/` (200 ✅) | `mb-clase-s-interior.webp` |
| **Mercedes Clase E** | Pareja | menorcabus.com + UTM *(temporal → Spec B)* | pendiente |
| **Audi A8** | Pareja | menorcabus.com + UTM *(temporal → Spec B)* | pendiente |

**Sobre el A8:** es **A8 normal**, no A8 L (confirmado por el dueño). Por tanto se describe como berlina de pareja junto al Clase E y **no** se sitúa por encima del Clase S. Justificación: la distancia entre ejes del A8 normal (2.998 mm) está a 37 mm del Clase E (2.961 mm) y por debajo del Clase S (3.106 mm). Solo el A8 L (3.128 mm) superaría al Clase S. La etiqueta de segmento (A8 = F, E = E) es cierta pero irrelevante para el pasajero de atrás.

**Además:** el Audi A8 está descatalogado desde el 18-feb-2026, sin sucesor. No se habla de él en presente comercial ("puedes pedirlo", "lo último de Audi"). Se describe el coche que hay, no un producto a la venta.

### Requisitos

- i18n por locale (ES/EN), textos en el propio componente.
- **Sin emojis.** Iconos de línea SVG finos si hacen falta.
- `rel="sponsored"` en todo saliente a Menorca Bus (norma técnica; no lleva etiqueta visible de patrocinio — ver §7).
- UTM vía `menorcaBusUrl()`, igual que `MenorcaBusCTA`.
- Registrar en `mdxComponents` de `src/pages/articulo/[slug].astro` y `src/pages/en/article/[slug].astro`.
- Degradación: si falta la foto de E o A8, la tarjeta no se rompe (se omite o usa reserva). El módulo debe funcionar hoy con V y S.

---

## 6. Páginas por barco (`CruiseShipPage.astro`)

Afecta a las 30 páginas (15 barcos × ES/EN) generadas por `barcosConPagina()`.

**Se añade**, tras el bloque "qué no te cabe" (`T.noCabe`) y antes de "fechas" (`T.fechas`):

- Bloque de transporte contextual que usa **la hora real del barco**: *"El MSC Opera zarpa a las 16:00. Te quedan ~6 h útiles → así te mueves."* Los datos (`arrival`, `departure`, `utilesMin`) ya existen en el objeto `barco`.
- Una foto (`mb-clase-s-puerto.webp`).
- CTA con UTM (reutilizar `MenorcaBusCTA` o variante compacta).
- **Enlace a la guía** — hoy no existe: las páginas por barco están huérfanas de enlace hacia el artículo padre.

**No se añade** el módulo `FlotaChofer` completo: 4 tarjetas repetidas en 30 páginas es ruido y lastra el rendimiento. Un CTA compacto + enlace a la guía.

---

## 7. Restricciones innegociables

1. **No inventar condiciones comerciales de Menorca Bus.** Nada de precios, tarifas, cancelación, disponibilidad, compromisos ni tiempos de espera que el dueño no haya confirmado. Copy neutro.
2. **No inventar la flota.** No sabemos el año, el acabado ni si el Clase E o el A8 son híbridos enchufables (esto último hunde el maletero del A8 de 505 a 390 L). Si un dato depende de eso, no se afirma.
3. **`rel="sponsored"` sí; etiqueta visible de patrocinio no.** Decisión registrada del dueño: la web es canal propio y la flota propia no se etiqueta como "patrocinado". **Consecuencia asumida:** como el lector no recibe aviso, la carga de la honestidad recae entera sobre el contenido. De ahí §5 ("cuándo NO hace falta transfer") y el orden de §3: no son adornos, son lo que sostiene esta decisión.
4. **Sin emojis** en la UI (lujo tranquilo).
5. **Ninguna foto sin autor y licencia.**
6. **Paridad ES/EN.** Todo lo que entra en ES entra en EN.

---

## 8. SEO / GEO

- **Intención objetivo:** "qué hacer en escala Maó", "cruceros Menorca 2026", "shore excursion Mahon", "Mahon cruise port what to do". Sin keyword stuffing.
- `seo.title` / `seo.description` reorientados de "temporada de cruceros" a "qué hacer en tu escala".
- **FAQ ampliada** (`faq` en frontmatter → `FAQPage`) con preguntas reales: ¿me da tiempo a Ciutadella? ¿el centro está a pie? ¿hay taxis en el puerto? ¿cuánto tiempo tengo de verdad?
- **Dato citable de alto valor GEO:** un Clase E no híbrido (540 L) lleva más maleta que un A8 (505 L). "Más gama = más maletas" es falso. Útil si se usa en el clúster; verificar antes de publicar.
- **Enlazado interno:** guía → 15 páginas de barco · barco → guía · guía → clúster de chófer (V y S). Hoy el flujo barco→guía no existe.
- Canonical y `hreflang` ES/EN ya operativos: no tocar.

---

## 9. Medición

- `MenorcaBusCTA` ya genera UTM con `menorcaBusUrl("cta", Astro.url.pathname)` → en el panel de Menorca Bus se distingue qué artículo y qué página de barco convierten.
- `FlotaChofer` debe usar el mismo mecanismo, con `content` distinto por tarjeta para saber **qué coche** se clica.
- Lectura de resultados: junto con la revisión quincenal de analítica.

---

## 10. Dependencias y bloqueantes

| Dependencia | Bloquea | Estado |
|---|---|---|
| Fotos reales de Clase E y A8 | Solo las 2 tarjetas del módulo | ⏳ Pendiente del dueño. **No bloquea el resto del spec.** |
| Spec B (artículos E/A8) | Solo el destino final de 2 enlaces | ⏳ Posterior. Redirigir = 1 línea. |
| ¿Clase E / A8 híbridos? | Solo si se citan maleteros | ⏳ A confirmar por el dueño |

**Ninguna bloquea la entrega.** La guía, la fotografía existente, el módulo con V y S, y las 30 páginas por barco se construyen ya.

---

## 11. Definición de hecho

1. `npm run build` sin errores ni warnings.
2. Paridad ES/EN completa.
3. Lighthouse ≥ 95 en las cuatro métricas, en el artículo y en una página de barco.
4. Todas las imágenes con `alt` descriptivo y crédito; jerarquía de encabezados correcta (un solo `h1`).
5. Todos los enlaces nuevos verificados con `curl -sL` (200, con barra final).
6. `FAQPage` válido.
7. Verificado en navegador real, no solo en tests.
8. Ficha Jira movida a Finalizado; registro de la web actualizado el mismo día.

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| Editar 2 artículos publicados en producción | Cambios en git, revisables y reversibles; build + Lighthouse antes de desplegar |
| El calendario baja a §8 y pierde posiciones | Conserva H2 e indexación. Vigilar en GSC en la siguiente lectura |
| CTA en 30 páginas lee a spam | Un solo CTA compacto y contextual por página, con la hora real del barco: es información útil, no un banner |
| El módulo de flota lee a catálogo | Va tras el valor (§6), no antes; fotos de Menorca en §4 para equilibrar |
| Afirmar algo falso del A8 (descatalogado) | Prohibido el presente comercial; A8 normal, no L |
