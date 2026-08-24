# Los cuatro idiomas europeos, al completo (diseño)

- **Fecha:** 2026-08-24
- **Tickets Jira:** KAN-51 (motor de traducción), KAN-133 (deuda de arquitectura i18n), KAN-131 / KAN-129 (trabajo verificado sin commitear que bloquea el arranque). Ficha nueva pendiente para el despliegue en sí.
- **Petición del dueño:** «quiero poner idiomas en la página web, traducirla toda al completo en todos los idiomas».
- **Decisiones tomadas en la sesión (24-ago-2026):**
  1. **Idiomas: DE, FR, IT, PT.** Sin neerlandés — planteado con los datos de GSC, decidió mantener su orden. No se vuelve a sacar.
  2. **Ruta: alemán como banco de pruebas (~35 páginas), luego los cuatro al 100 % en paralelo.**
  3. **Aprobación mixta:** fichas de lugar y eventos se publican solos (dato objetivo); los artículos nacen en `draft` y esperan un «dale» por lote.
  4. **Máquina:** agentes en paralelo por lotes, patrón de `scripts/_traducir-lugares.template.js`.
  5. **Eventos caducados (43 de 84) no se traducen.**

> ⚠️ **Este documento deroga una decisión anterior.** El spec `2026-07-10-terminar-frances-via-pragmatica-design.md` dejaba la paridad total del francés explícitamente **fuera de alcance** («contraria a la estrategia de despliegue por mercados»). El dueño ha cambiado el rumbo el 24-ago: el destino ahora es la paridad completa en los cuatro idiomas. El despliegue por mercados sigue rigiendo el **orden**, no el **destino**.

---

## Contexto

Español e inglés están al 100 % (353 piezas cada uno). El francés lleva parado en el 5 % desde junio y el alemán se dio de alta hoy mismo, sin una sola página. Italiano y portugués no existen.

La causa de la parálisis está medida y documentada (memoria `idiomas-coste-real-de-anadir-uno`): `CLAUDE.md` y `src/config/site.ts` prometen que añadir un idioma es «una entrada en `locales` y su diccionario», y **no es cierto** — son ~330 cadenas de andamiaje antes de traducir una línea de contenido. Esa promesa falsa es lo que hizo subestimar el francés durante dos meses.

El premio está en los datos de Search Console (14-jun → 9-ago, 44.171 impresiones): en **Alemania salimos en posición 7,3** —mejor que en España— **con un CTR del 0,46 %**. Rankeamos en primera página y pasan de largo porque el título está en otro idioma.

---

## El inventario, medido en el repo (24-ago-2026)

### Qué es «un idioma completo»

| Bloque | Piezas | Palabras |
|---|---|---|
| Artículos | 83 | 127.600 (media 1.537) |
| Fichas de lugar | 186 | 36.000 (media 193) |
| Eventos vigentes | 41 | 5.000 (media 121) |
| **Contenido** | **310** | **~169.000** |
| Diccionario UI (`i18n/ui.ts`) | 133 claves | — |
| Etiquetas de datos | 44 | — |
| Rutas (`i18n/utils.ts`), secciones (`config/sections.ts`), componentes con copy | ~150 cadenas | — |
| Páginas fijas (`src/pages/<idioma>/`) | 24 ficheros | — |

### Qué falta idioma a idioma

| Idioma | Andamiaje | Contenido pendiente |
|---|---|---|
| Alemán | diccionario hecho (133 claves) · **faltan las 24 páginas fijas** | 310 piezas |
| Francés | hecho · **le faltan 6 rutas** | 291 piezas (tiene 7 artículos + 12 fichas) |
| Italiano | todo (~330 cadenas + 24 páginas) | 310 piezas |
| Portugués | todo (~330 cadenas + 24 páginas) | 310 piezas |
| **Total** | | **1.221 piezas ≈ 660.000 palabras** |

**Las 6 rutas que le faltan al francés:** detalle de agenda (`fr/agenda/[slug]`), planificador, cruceros, enlaces, calas tranquilas y reservar traslado. La ausencia del detalle de agenda es la razón de que el francés tenga **cero eventos**: `/fr/agenda` existe como índice de sección (lo genera `[section].astro`), pero un evento francés no tendría dónde aterrizar.

---

## La deuda de arquitectura (KAN-133): se paga una vez, antes de traducir

Añadir un idioma rompe el código de dos formas, y **solo una avisa**:

**Ruidosa y buena.** Los mapas `Record<Locale, string>` — rutas, secciones, `INTL_LOCALE`, `placesIndexPath`, `privacyPath`, `businessPath`. Al ampliar el tipo `Locale` con `it` y `pt`, TypeScript escupe ~113 errores en 11 ficheros. Molestan, pero señalan exactamente qué falta.

**Muda y cara.** **25 escaleras de ternarios en 10 ficheros**, de la forma `locale === "es" ? … : locale === "fr" ? … : inglés`. Con un idioma nuevo **caen a inglés en silencio**: ni error, ni warning, solo texto inglés en una página alemana.

| Fichero | Ternarios |
|---|---|
| `src/components/NightlifeMap.astro` | 12 |
| `src/components/SunsetDrinksFaq.astro` | 3 |
| `src/layouts/PlaceLayout.astro` | 2 |
| `src/components/MenorcaBusPromo.astro` | 2 |
| `src/components/ParteCalmaMap.astro` | 1 |
| `src/components/SunTimes.astro` | 1 |
| `src/layouts/ArticleLayout.astro` | 1 |
| `src/lib/newsletter/subscribe.ts` | 1 |
| `src/pages/fr/article/[slug].astro` | 1 |
| `src/pages/fr/lieu/[slug].astro` | 1 |

**El patrón que lo arregla** (ya aplicado en `ParteCalmaMap`): una herramienta no tiene por qué existir en todos los idiomas — el despliegue es por mercados. Que el componente **declare dónde vive** convierte el fallo mudo en error de compilación:

```ts
type ToolLocale = Extract<Locale, "es" | "en" | "fr">;
interface Props { locale: ToolLocale; }
```

Además, `NightlifeMap` guarda **datos con sufijo de idioma** (`areaEs/areaEn/areaFr`, `descEs/…`, `noteEs/…`, `altEs/…`) en ~45 locales: ~135 cadenas más solo ahí. Se migra a un mapa por locale en vez de campos con sufijo.

---

## La máquina de traducción

```
generador (saca el lote pendiente)
   → agentes en paralelo (lotes de 8-10 piezas, esquema JSON fijo + glosario de marca)
   → escritura de ficheros con translationKey, slug nativo y status según tipo
   → verificación (astro check + build + barrido de inglés colado)
```

**Reglas que la mantienen honesta:**

- **Glosario de marca por idioma.** Voz de lujo tranquilo en alemán, francés, italiano y portugués. Sobria, sin exclamaciones ni superlativos vacíos. Nombres propios de lugar/negocio **intactos** (Cala Algaiarens, Cova den Xoroi, Bodegas Binifadet).
- **Esquema JSON fijo por tipo de pieza.** El agente no puede devolver campos de más ni de menos.
- **Slugs nativos por mercado**, no traducción literal: `/de/veranstaltungen`, no `/de/agenda`.
- **`translationKey` compartido** con el original ES/EN → `hreflang` y selector correctos, cero huérfanas.
- **No inventar.** Si un dato no está en el original (un horario, un precio), no aparece en la traducción.
- **`alt` de imágenes traducidos**; créditos y licencias **intactos**.

**Publicación (decisión 3):** fichas de lugar y eventos → `status: published`, `translationStatus: auto-sin-revisar`. Artículos → `status: draft` hasta el «dale» del dueño por lote.

---

## Alcance

### Dentro
- Pagar la deuda de KAN-133 (25 ternarios mudos + datos con sufijo de idioma).
- Andamiaje completo de alemán, italiano y portugués; las 6 rutas que le faltan al francés.
- Traducción de las 310 piezas por idioma en los cuatro idiomas.
- Un guardián en CI que avise de piezas sin sus cuatro hermanas.
- Corregir la promesa falsa de `CLAUDE.md` y `src/config/site.ts`.

### Fuera (a propósito)
- **Neerlandés y cualquier otro idioma.** Decidido: los cuatro y ya.
- **Los 43 eventos caducados.** Ahorra ~20.000 palabras que nadie leería.
- **Revisor nativo profesional.** La decisión 11 del `CLAUDE.md` es IA + glosario + revisión; se añadirá encima de este flujo solo si la calidad de un mercado lo pide.
- **Lead magnets y embudos por idioma.** El formulario ya se localiza solo por `currentLocale()`; los PDF y grupos de MailerLite por idioma son otro proyecto.
- **El fleco de KAN-129** (quitar el sufijo de marca de los títulos largos): decisión pendiente del dueño, independiente de esto.

---

## Definición de hecho (por pieza traducida)

1. `astro check` en 0 errores y build verde.
2. `translationKey` compartido con el original; `hreflang` y selector resuelven a la página correcta.
3. Slug nativo del mercado, no traducción literal.
4. `status` correcto según tipo (fichas/eventos `published`; artículos `draft`).
5. `translationStatus: auto-sin-revisar` hasta que una persona lo apruebe.
6. **Ni una palabra en inglés** en una página que no sea inglesa — verificado por barrido, no por confianza.
7. `alt` traducido; crédito y licencia de imagen intactos.

---

## Ruta

### Tramo 1 — Asegurar y afinar
1. **Commitear los 169 ficheros sueltos en `main`** (KAN-131 fichas/schema.org, KAN-129 títulos, KAN-51/133 alta del alemán). Verificar antes, no confiar en la nota.
2. Pagar la deuda de los 25 fallos mudos.
3. Las 24 páginas fijas alemanas.
4. **Banco de pruebas: ~35 páginas alemanas** — la agenda primero (`/en/whats-on/` es la nº1 de la web con 4.100 impresiones), luego los artículos con más impresiones y las fichas que enlazan.
5. Barrido de inglés colado en páginas alemanas + medición de coste real (tokens, tiempo, tiempo de build).

*Hecho =* alemán en Google y la máquina medida.

### Tramo 2 — El motor a fondo
- Andamiaje italiano y portugués; las 6 rutas francesas.
- 186 fichas × 4 idiomas y 41 eventos × 4, publicándose solos.
- 83 artículos × 4, en `draft`, por lotes para el «dale».

*Hecho =* los cuatro idiomas al 100 %.

### Tramo 3 — Que no se vuelva a quedar atrás
- Guardián en CI: pieza ES/EN sin sus cuatro hermanas → aviso.
- La agenda traduce **al crear** el evento, no después.
- `CLAUDE.md` y `site.ts` dicen la verdad sobre lo que cuesta un idioma.

---

## Riesgos vigilados

| Riesgo | Cómo se detecta | Respuesta |
|---|---|---|
| **Tiempo de build.** De 835 a ~2.700 páginas. | Se mide en el Tramo 1, con el alemán. | Si se dispara, se reporta antes de escalar a cuatro idiomas — no después. |
| **Inglés colado en silencio.** Los 25 ternarios. | Barrido automático de páginas no inglesas. | Se paga la deuda **antes** de traducir, no después. |
| **Calidad de traducción por idioma.** | Muestreo del dueño en el lote alemán. | Si un idioma no da la talla, revisor nativo encima del flujo. |
| **Los cron pisan el trabajo.** `parte-calma` y `cruceros` commitean a `main` a diario. | `git status` antes de cada tanda. | Rebase; nunca `--force`. |
| **Eventos que caducan durante el despliegue.** | Fecha de fin en el generador. | El generador excluye caducados en cada pasada, no una sola vez. |

---

*Origen: sesión de brainstorming del 24-ago-2026. Contexto estratégico en `docs/ESTRATEGIA-MULTIIDIOMA.md`; el porqué de los mercados en `docs/ANALISIS-MERCADO-MENORCA.md`.*
