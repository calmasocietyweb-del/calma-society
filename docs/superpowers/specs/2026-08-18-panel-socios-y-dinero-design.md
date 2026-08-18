# Panel de socios y dinero — diseño (v1, construido completo y listo para encender)

> Spec del sistema interno para **registrar el dinero** de Calma Society y **monitorizar los
> socios y sus tratos**. Secciones 1-2 acordadas con el dueño el 17-ago-2026 («me cuadra el
> reparto»); secciones 3-4 diseñadas por Claude el 18-ago-2026 por delegación expresa del dueño
> («diseñalo según lo que funciona»). Objetivo de fondo: **que Calma genere dinero antes de
> final de año** y que ese dinero quede registrado sin depender de un Excel que nadie rellena.
>
> Contexto: el registro vivo era `COLABORACIONES/Registro de colaboraciones - Calma Society.xlsx`
> (22 socios, 30 columnas en 5 bandas). Estado real: todos `pendiente`, `Modelo = trueque`,
> `Precio = 0`, banda MEDICIÓN vacía (se rellena a mano → nadie la rellena) y notas ya
> desfasadas («FICHA EN DRAFT» cuando las 12 fichas de restaurante están publicadas desde el
> 14-ago, KAN-117). Cristian NO usa Excel → coste de migración cero.

## 0. Qué se descartó (no reabrir sin que lo saque el dueño)

- **Panel público de pago** (login de empresas, Stripe, moderación): camino más lento al primer
  euro, contradice la promesa publicada en `/para-negocios` («la ficha editorial es gratuita…
  el puesto y la opinión no se compran») y choca con `CLAUDE.md` §1 y §6bis. Descartado el
  17-ago. Esta v1 es el panel **INTERNO**.
- **Unificar el panel en Cloudflare**: no mueve un euro antes de diciembre; el split
  Cloudflare (web + API) / Vercel (panel con login) es deliberado y se mantiene.

## 1. Modelo de datos — cuatro tablas (SECCIÓN 1, aprobada)

Las 30 columnas del Excel mezclan tres ritmos distintos; se parten en cuatro tablas en
**Cloudflare D1** (SQLite):

| Tabla | Qué es | Ritmo |
|---|---|---|
| `socios` | QUIÉN ES + DÓNDE ESTAMOS (nombre, tipo, zona, contacto, estado de la relación, tanda, flags datos/fotos/enlace, slug de su ficha en la web) | cambia poco |
| `tratos` | EL TRATO. **Una fila por acuerdo**, con fechas, para conservar histórico cuando un socio pase de trueque a cuota | por acuerdo |
| `medicion_mensual` | MEDICIÓN. **Una fila por socio y mes** (visitas a su ficha + clics enviados a su web) → es lo que da la CURVA | mensual, automática |
| `cobros` | No existía en el Excel. Fecha, socio, concepto, importe, facturado, cobrado | por pago |

**La regla que sostiene todo (innegociable):** `cobros` es **dinero recibido, lo escribe el
dueño, es la verdad**; `medicion_mensual` es **valor entregado, se calcula solo, es el
argumento de venta**. Nunca se mezclan: si se mezclan, se acaba creyendo ingresado un dinero
que solo estaba prometido. `tratos.precio_anual` dice lo que un acuerdo *vale*; `cobros` dice
lo que *entró*.

Detalles de esquema:

- Importes **siempre en céntimos** (`INTEGER`), nunca coma flotante. Helpers `parseEuros` /
  `formatEuros` en `src/lib/socios/money.ts`.
- `socios.id` = slug de la empresa (`torralbenc`); `socios.slug_ficha` = slug de su ficha en
  la web **sin sufijo de idioma** (`restaurante-torralbenc`), el mismo valor que viaja en
  `data-umami-event-negocio` (PlaceLayout/NightlifeMap) → es la clave que cruza D1 con Umami.
- `tratos.modelo` ∈ `trueque | cuota-directorio | afiliacion | branded | otro` (el modelo de
  tarifa validado el 15-jul). `tratos.etiquetado` ∈ `editorial | patrocinado`: **el día que un
  trato pasa a pagado, la ficha se etiqueta y su enlace pasa a `rel="sponsored"`** (ley + moat;
  eso se ejecuta en la capa editorial, el panel lo registra).
- `medicion_mensual` con `UNIQUE(socio_id, mes)` y upsert: la foto de un mes se puede rehacer.
- Sin `DELETE` en v1: los estados (`descartado`, `terminado`, `rechazado`) conservan histórico.
- Esquema completo en `src/lib/socios/sql.ts` (fuente) + copia ejecutable `db/socios-schema.sql`.

## 2. Arquitectura y orígenes (SECCIÓN 2, acordada)

**D1 + funciones en el Worker de Cloudflare siguiendo el patrón KAN-63 (reservas)**, con dos
cambios ya decididos: **una sola función `/api/socios`** (no repartir en endpoints) y
`ensureSchema` de las cuatro tablas, para que encender sea un paso.

| Pieza | Dónde vive | Detalle |
|---|---|---|
| API | `functions/api/socios.ts`, enrutada en `worker.js` | GET estado completo · POST acciones (`crear`, `actualizar`, `snapshot`, `importar`). **Todos los métodos** exigen cabecera `x-admin-key` = secreto `SOCIOS_ADMIN_KEY` (a diferencia de reservas, aquí no hay ningún acceso público). Si `env.DB` no existe → `503` con mensaje claro («base de datos no creada»). |
| Base de datos | Cloudflare **D1**, base **`calma-db`**, binding `DB` | **Una sola base para toda la casa**: tablas de socios (4) + la futura `bookings` de reservas. Se estandariza aquí (ninguna de las dos existía aún); el runbook de reservas se actualiza con una nota. Un solo `wrangler d1 create` sirve para todo. |
| Lógica pura | `src/lib/socios/` (`catalog.ts`, `sql.ts`, `money.ts`, `resumen.ts`) | Tipada y **testeada** con `node --test` (se añade al glob de `npm test`). |
| Panel del dueño | `src/pages/panel/socios.astro` (Vercel, SSR) | Basic auth `PANEL_USER`/`PANEL_PASS` (las mismas de analítica/reservas). Lee la API de Cloudflare con `SOCIOS_ADMIN_KEY`; formularios POST-redirect-GET (patrón reservas). En Cloudflare/local se prerenderiza el aviso estático de siempre, sin secretos. |
| Índice del panel | `src/pages/panel/index.astro` | Cierra el pendiente del 10-jul: **una sola URL** con tarjetas a Editor (Keystatic) · Analítica · **Socios y dinero** · Reservas + accesos externos (Umami, MailerLite, GSC). Sin secretos, `noindex`, fuera del sitemap (la exclusión `/panel/` ya existe). |
| Foto mensual | `worker.js` → handler `scheduled` + cron en `wrangler.jsonc` (`23 4 2 * *`) | El día 2 de cada mes calcula la foto del **mes anterior** desde la API de Umami y la upserta en `medicion_mensual`. Guardado con no-op silencioso si faltan `DB` o los secretos de Umami. Además hay **botón manual** en el panel («Hacer la foto del mes») que llama a la misma acción `snapshot`. |

### El gran rescate (ya construido, se reutiliza)

`/panel/analitica` §Colaboradores (KAN-78) ya calcula clics por negocio desde Umami
(`event-data/values?propertyName=negocio` sobre `click-salida-web`, `planner-reserva`,
`planner-web-oficial`) y visitas por ficha (regex `/lugar|en\/place|fr\/lieu/` sobre
`metrics?type=url`). **La acción `snapshot` reimplementa exactamente esa lógica en la función**
(el Worker no tiene content collections; el roster sale de la tabla `socios`). Lo que le
faltaba a analítica —guardar la foto para tener curva y unirla a trato y cobro— es
precisamente lo que añade este sistema.

### Snapshot: cálculo de un mes `YYYY-MM`

1. Rango UTC: `startAt = 1 del mes 00:00`, `endAt = último instante del mes`.
2. `metrics?type=url&limit=1000` → visitas por `slug_ficha` (suma ES+EN+FR, regex de ficha).
3. `event-data/values` por cada uno de los 3 eventos de salida → clics por `slug_ficha`.
4. Roster = filas de `socios` con `slug_ficha` no vacío → upsert `(socio_id, mes, visitas,
   clics, fuente='umami-auto')`. Los socios sin ficha quedan sin fila (no se inventan ceros
   de cobertura; el panel muestra «—»).
5. Si el plan de Umami no expone event-data (`!ok`), se guardan solo las visitas y
   `fuente='umami-sin-eventdata'` — el panel lo avisa (mismo plan B que analítica).

## 3. Pantallas (SECCIÓN 3 — diseñada 18-ago)

Principio: **el panel responde tres preguntas en este orden: ¿cuánto ha entrado? ·
¿quién nos debe qué? · ¿qué valor entregamos este mes?** Todo HTML/CSS del sistema de diseño
(tokens Calma), sin JS de cliente, sin emojis (lujo tranquilo).

### `/panel/` — índice (nuevo)

Tarjetas: **Editor de artículos** (Keystatic) · **Analítica** · **Socios y dinero** ·
**Reservas de transfers** (marcada «apagado») + fila discreta de enlaces externos (Umami,
MailerLite, Search Console). Un párrafo de una línea por tarjeta. Nada más.

### `/panel/socios` — la pantalla principal

Orden vertical:

1. **Dinero** — 5 tarjetas resumen:
   - «Cobrado en {año}» (cobros con `cobrado=1`, por `fecha_cobro`) — el número grande.
   - «Facturado sin cobrar» (`facturado=1 ∧ cobrado=0`).
   - «Cuotas anuales comprometidas» (suma `precio_anual` de tratos `activo`) — etiquetada
     como compromiso, NO como ingreso (la regla de no mezclar).
   - «Valor entregado el mes pasado» (clics totales enviados a socios, de `medicion_mensual`).
   - «Socios N · con trato activo M».
2. **Curva mensual** (últimos 12 meses): tabla con barras CSS — por mes, `€ cobrado` y
   `clics entregados`. Es la curva que el Excel nunca tuvo.
3. **Renovaciones y avisos**: tratos activos con `fin` en ≤60 días, y facturas sin cobrar
   de >30 días. Vacío = «Nada pendiente», en gris.
4. **Socios** (tabla): Nombre · Tipo · Estado relación · Modelo vigente · Precio anual ·
   Cobrado {año} · Clics mes pasado · enlace «Abrir». Filtro por estado vía `?estado=`
   (chips, como reservas). Orden: primero con trato activo, luego por clics.
5. **Botón «Hacer la foto del mes»** (POST → `snapshot` del mes anterior) + fecha de la
   última foto. Al lado, nota de una línea: «la foto se hace sola el día 2».

### `/panel/socios?socio=<id>` — detalle de un socio

1. **Ficha**: datos de contacto + estado + tanda + flags datos/fotos/enlace + próxima acción.
   Formulario compacto para actualizar estado/próxima acción/notas.
2. **Tratos** (histórico completo): lista + formulario «Nuevo trato» (modelo, descripción,
   precio anual €, inicio, fin, renovable, etiquetado). Cambio de estado por botones
   (activar · terminar · rechazar).
3. **Cobros**: lista + formulario «Registrar cobro» (fecha, concepto, importe €, facturado,
   nº factura, cobrado, fecha de cobro). **Este formulario es el único origen de verdad del
   dinero.**
4. **Medición mensual** del socio (tabla 12 meses: visitas + clics) + recordatorio del
   argumento: «el socio puede verlo en su propia analítica: llegamos como
   calmasociety / referral».

Los formularios hacen POST a la propia página; el servidor reenvía a la API con
`SOCIOS_ADMIN_KEY` y redirige 303 (`?ok=…`/`?error=…` para el aviso). Sin JS.

## 4. Operativa, encendido y seguridad (SECCIÓN 4 — diseñada 18-ago)

### Ritmo de trabajo

- **El Excel queda CONGELADO como archivo histórico** tras la importación (se deja aviso
  `LEEME` en `COLABORACIONES/`). El registro vivo pasa a ser el panel. Cristian sigue
  operando como decidió el 15-jul: **dicta en el chat** («X dijo que sí, 300 al año desde
  septiembre») y Claude lo registra — ahora en el panel/API en vez del Excel — o usa él mismo
  los formularios.
- **Mensual (día 2, solo):** el cron hace la foto del mes anterior. **Mensual (Cristian o
  Claude, 5 min):** abrir el panel, mirar Dinero + Renovaciones, registrar cobros que hayan
  entrado. La lectura mensual de analítica del vault (§17 bis) se apoya en esta misma foto.
- **Facturas**: se emiten fuera del sistema (gestoría de Menorca Bus, S.L.); el panel guarda
  `factura_ref`. El panel NO factura ni cobra: registra.

### Importación de los 22 socios

`scripts/socios/export-excel.mjs` (one-off, local): lee el Excel con `exceljs` (instalación
temporal `npm i --no-save exceljs`, NO entra en `package.json`) y genera en
`COLABORACIONES/panel-seed/` (gitignorado): `seed.sql` (INSERTs de socios + su trato trueque
vigente) y `socios-seed.json` (espejo legible). El seed se carga al encender con
`wrangler d1 execute calma-db --remote --file=COLABORACIONES/panel-seed/seed.sql`.
Normalizaciones en la importación: `id` = slug del nombre; `slug_ficha` derivado de la columna
«URL de la ficha»; las notas «FICHA EN DRAFT» de los 12 restaurantes se corrigen (están
publicadas desde el 14-ago); Purobeach conserva su `descartado`.

### Encendido (runbook `docs/PANEL-SOCIOS-DINERO.md`) — ~10 minutos del dueño

1. `npx wrangler login` (una vez) → `npx wrangler d1 create calma-db`.
2. Pegar el `database_id` en el bloque `d1_databases` de `wrangler.jsonc` (va **comentado**
   en el repo para no romper el deploy de Workers Builds mientras la base no exista) y push.
3. Secretos en Cloudflare (Worker `calma-society`): `SOCIOS_ADMIN_KEY` (clave larga),
   `UMAMI_API_KEY`, `UMAMI_WEBSITE_ID` (los mismos valores que ya están en Vercel).
4. Variable en Vercel: `SOCIOS_ADMIN_KEY` (la misma clave).
5. Cargar esquema y seed con wrangler (`db/socios-schema.sql` + `panel-seed/seed.sql`).
6. Abrir `…vercel.app/panel/socios`, pulsar «Hacer la foto del mes» y comprobar la curva.

Hasta el encendido: la API responde 503 con mensaje claro, el panel en Vercel muestra la
tarjeta «Falta encender la base de datos» con el enlace al runbook, y **nada se rompe**.

### Seguridad y privacidad (el repo es PÚBLICO)

- D1 guarda datos de contacto **de empresas** (interés legítimo, capacidad profesional), no
  de lectores. Aun así: API cerrada al 100% con `x-admin-key`, panel con Basic auth,
  `/panel/` fuera del sitemap y `noindex` (ya vigente).
- **`.gitignore` se blinda**: `COLABORACIONES/`, `NEGOCIO/`, `ESTRATEGIA/` y `_PANEL/`
  entran en la lista de ignorados (hoy están solo «sin trackear», a un `git add .` de
  publicarse en un repo público). Su copia de seguridad es el script de KAN-53, no git.
- Ningún secreto en el código; nombres y patrón idénticos a KAN-63.

## 5. Qué NO hace la v1 (a propósito)

- No factura, no cobra, no manda emails (las facturas las emite la gestoría; los emails de
  captación los envía el dueño — `NEGOCIO/CAPTACION-EMPRESAS.md`).
- No expone nada público ni toca las fichas de la web (el etiquetado `sponsored` de un trato
  pagado se ejecuta como cambio editorial aparte cuando ocurra).
- No decide la tarifa: el panel registra el precio que **gerencia** fije (banda recomendada
  vigente 250-400 €/año, congelada 2 años a fundadores — la cifra final no es de Claude).
- No sustituye a Umami: es el registro del dinero y del valor entregado, no la analítica.

## 6. Criterios de «hecho»

1. `npm test` en verde con los tests nuevos de `src/lib/socios/`; `astro check` 0 errores;
   `npm run build` completa.
2. Con D1 apagada: la web pública no cambia en nada, el panel muestra el aviso de encendido,
   la API responde 503 y el cron no hace nada (verificable en local).
3. Seed generado desde el Excel real con los 22 socios y sus fichas cruzadas.
4. Runbook de encendido completo y probado en seco; bitácora del vault + Jira al día.
