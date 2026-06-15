# Marketing, crecimiento, monetización y nombre/dominio

> El "cómo" operativo que faltaba: cómo se capta audiencia, cómo se gana dinero, cómo se lleva tráfico a tus negocios, y cómo elegimos el nombre y el dominio. Acompaña al análisis de mercado (Partes IV-V) y a `CLAUDE.md`.

---

## 1. Recordatorio estratégico (de tu propio análisis)

- **El activo es la audiencia, no la web** (newsletter + comunidad). La web es el medio.
- **El error nº1 es "si lo construyo, vendrán".** La captación es el 50% del trabajo desde el día 1.
- **No depender de Google.** Tráfico orgánico en caída; el visitante vía IA convierte mejor → GEO + audiencia propia.
- **Métricas correctas:** suscriptores, recurrencia, engagement, citas en IA — NO páginas vistas.

---

## 2. Elección de nombre y dominio (primer entregable, sin código)

**Método (lo hace Claude con investigación de palabras clave):**

1. **Investigar la demanda real:** qué busca el turista europeo sobre Menorca, por idioma (EN, DE, FR, IT…) y con qué volumen e intención. Identificar términos "marca + Menorca" defendibles.
2. **Generar candidatos** que cumplan:
   - Memorable y **pronunciable en varios idiomas** (evitar sonidos difíciles para no hispanohablantes).
   - Que **no se ate solo a "guía"** (queremos "revista/medio", y poder ampliar a otros temas en el futuro — `CLAUDE.md` decisión 12).
   - Que sugiera Menorca/Mediterráneo/calidad sin ser genérico.
   - Con **encaje SEO** (que ayude a posicionar) pero priorizando **marca** sobre keyword exacta (la era post-SEO premia marca).
3. **Comprobar disponibilidad:** dominio (`.com` preferente; `.eu`, `.travel`, `.menorca` como apoyo) y handles de redes (Instagram, etc.).
4. **Presentar tabla comparada** (nombre · significado · dominios libres · redes libres · pros/contras) para que el dueño **elija**.
5. Aplicar el elegido en `src/config/site.ts` (un solo sitio).

**Criterios de dominio:** preferir `.com` (confianza internacional); registrar variantes defensivas; HTTPS siempre; evitar guiones y nombres difíciles de deletrear por teléfono.

> Hasta decidir, se usa el placeholder **"Revista Menorca"** centralizado en `src/config/site.ts`.

---

## 3. Captación de audiencia (el motor del proyecto)

**Newsletter (KPI nº1):**
- CTA de suscripción elegante en home, al final de cada artículo y en `/newsletter` desde el primer despliegue (`CLAUDE.md` §3.1).
- **Doble opt-in** (RGPD) y un "lead magnet" de valor (p. ej. "Guía de las 10 calas con menos gente", "Agenda del mes de Menorca").
- Cadencia sostenible (p. ej. quincenal) > picos irregulares.

**Redes sociales (descubrimiento):**
- Instagram/Reels y YouTube como **canal de captación**, no adorno (análisis §2.8: lo visual mueve Menorca y está poco profesionalizado).
- Dirección de arte coherente = destacar rápido.
- Publicación semi-automatizada de lo ya aprobado (ver doc de automatización).

**IA / GEO:**
- Contenido citable: datos concretos, autoría visible, página "Quiénes somos / Criterio editorial" robusta (E-E-A-T).
- Ser la fuente que ChatGPT/Perplexity recomiendan para Menorca.

**Alianzas y boca a boca:**
- Colaboración con negocios locales, fotógrafos, creadores; spotlights a la comunidad.
- Aliados posibles: webs institucionales (menorca.es/org) como fuente/colaborador, no rival.

---

## 4. Monetización (diversificada desde el diseño)

Del análisis §4.6, por orden realista de activación:

1. **Afiliación turística** (pilar temprano): actividades (GetYourGuide/Civitatis), hoteles (Booking), coches, ferries, seguros; agregadores (Stay22/Travelpayouts). Comisiones 5-50%.
2. **Branded content / patrocinios** etiquetados: reportajes de hoteles, restaurantes, bodegas, inmobiliarias. 500-5.000 €/pieza según autoridad.
3. **Directorio premium local** (ingreso **recurrente**, resiste la estacionalidad): membresía anual de negocios.
4. **Membresía / contenido premium** (lo más predecible): guía premium, contenido para propietarios, descuentos.
5. **Productos digitales / eventos**: los eventos rinden bien en temporada baja.
6. **Display**: solo "suelo", nunca el pilar; sin banners agresivos (`CLAUDE.md` §12).

**Regla de oro:** nunca depender de un solo canal. **Plazo realista:** el primer año es construcción, no beneficio.

---

## 5. Tráfico a tus propias empresas (con criterio, sin penalización)

El dueño quiere que la revista lleve tráfico a sus webs/negocios. Cómo hacerlo **sin** dañar la confianza ni el SEO:

- **Transparencia total:** si un contenido promociona un negocio propio, se etiqueta como tal (`sponsored`/aviso). La confianza es el activo (§3.8).
- **Enlaces honestos:** desde contenido genuinamente útil y relevante; nada de enlaces forzados o irrelevantes.
- **Atributos correctos:** enlaces patrocinados/propios con `rel="sponsored"` o `nofollow` según corresponda (Google penaliza el enlazado manipulador; hacerlo bien protege el dominio).
- **Valor primero:** el lector llega a tu negocio porque el contenido le sirvió, no porque le engañamos. Eso convierte mejor (el visitante de calidad gasta más).
- **Separación de marca:** la revista mantiene su independencia editorial percibida; tus negocios aparecen como aliados/anunciantes claramente identificados, no disfrazados de criterio editorial.

> Equilibrio clave: la revista vale **porque es creíble**. Si se percibe como folleto de tus empresas, pierde el valor que la hace útil para llevar tráfico. Independencia editorial + promoción etiquetada = lo mejor de ambos.

---

## 6. SEO + GEO operativo

- **GEO > SEO de volumen:** respuestas claras y autocontenidas, datos concretos, autoría, "key facts" al inicio (`CLAUDE.md` §8).
- **SEO técnico impecable:** metadatos, OG, sitemap, robots, JSON-LD, hreflang, RSS (Fase 4).
- **Contenido pilar atemporal** (calas, gastronomía, cómo llegar) + **contenido fresco** (agenda, actualidad) + **contenido de temporada baja** ("Menorca todo el año" — diferenciador).
- **Investigación de palabras clave por idioma** antes de escribir pilares.

---

## 7. Calendario por temporada (operativa)

- **Pre-temporada (primavera):** captación, pilares, lead magnets, preparar agenda de verano.
- **Verano (pico):** in-situ, agenda, redes intensas, afiliación activa.
- **Otoño/invierno (valle):** identidad, gastronomía, propiedad/lifestyle, eventos propios, contenido perenne, traducciones. Convertir la debilidad estacional en diferenciación.

---

## 8. Indicadores de éxito (los correctos)

Suscriptores de newsletter · recurrencia · engagement · nº de negocios en el directorio · ingresos por fuente (diversificación) · **citas en IA**. *No* obsesionarse con páginas vistas.
