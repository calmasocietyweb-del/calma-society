# Reservas de transfers — runbook de encendido

> Sistema de reservas de transfers v1 de calmasociety.com. Nació **APAGADO**
> (2026-07-06) y este documento explica qué es, dónde vive cada pieza y los
> pasos exactos para encenderlo cuando el dueño lo decida.
> Spec de diseño: `docs/superpowers/specs/2026-07-06-reservas-transfers-design.md`.
> Plan de implementación: `docs/superpowers/plans/2026-07-06-reservas-transfers.md`.

## 1. Qué es

Un sistema de solicitud de reservas de transfer que **calca la fórmula del panel
de menorcabus.com** (mismos 3 pasos y mismos datos: trayecto → vehículo → datos
del titular), pero adaptado a nuestra web estática: los 3 pasos son secciones de
una misma página y hay un único envío al final, **sin JavaScript de cliente**.

La v1 es el **proveedor «manual»**: guarda la solicitud en una base de datos
(estado `solicitada`), el lector recibe una página de gracias con su localizador
(`CS-2026-XXXXXX`), y el dueño la gestiona desde el panel (confirmar / rechazar /
cancelar). **No calcula precios, ni valida cupones, ni cobra**: eso llega con la
API de Menorca Bus por los puntos de enchufe del §5, sin rehacer nada.

## 2. Mapa de piezas

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| Página de reserva ES | `src/pages/reservar-traslado/index.astro` → `/reservar-traslado` | Formulario de 3 secciones-paso, HTML puro. Con el interruptor apagado va en `noindex` y fuera del sitemap. |
| Página de reserva EN | `src/pages/en/book-transfer/index.astro` → `/en/book-transfer` | Ídem, copy EN nativo, mismos `name` de campo. |
| Páginas de gracias | `src/pages/reservar-traslado/gracias.astro` · `src/pages/en/book-transfer/thanks.astro` | Confirmación tras el envío; el localizador llega por `?ref=` (siempre `noindex`). |
| API de reservas | `functions/api/reservas.ts` (Cloudflare Pages Functions) | `POST` alta (form-data → 303 a gracias con `?ref=`) · `GET ?status=` listado · `PATCH {ref, status}` cambio de estado. GET/PATCH exigen cabecera `x-admin-key`. |
| Librería (lógica pura, testeada) | `src/lib/bookings/` | `catalog.ts` (categorías y extras), `validate.ts` (validación + honeypot), `ref.ts` (localizador), `sql.ts` (esquema y sentencias D1). Tests con `npm test`. |
| Base de datos | Cloudflare **D1** (tabla `bookings`) | Se crea al encender (§4). La API crea la tabla sola si no existe. |
| Panel del dueño | `src/pages/panel/reservas.astro` → `…vercel.app/panel/reservas` | SSR solo en Vercel, Basic auth `PANEL_USER`/`PANEL_PASS` (las mismas de `/panel/analitica`). Lista con filtro por estado y botones Confirmar/Rechazar/Cancelar. |
| Esquema documentado | `db/reservas-schema.sql` | Copia del `SCHEMA_SQL` para ejecutar con wrangler al encender. |

## 3. Interruptores (son DOS, y es a propósito)

| Interruptor | Dónde | Qué controla |
|---|---|---|
| `SITE.bookings.enabled` | `src/config/site.ts` | La **visibilidad web**: con `false`, la página existe pero va en `noindex`, fuera del sitemap y sin enlazar desde ningún sitio. Es una constante de build (la web es estática). |
| `BOOKINGS_ENABLED` | Variable de entorno en Cloudflare Pages | La **API**: salvo que valga exactamente `"true"`, el `POST /api/reservas` responde `503` y no guarda nada. Es una variable de runtime (se cambia sin tocar código). |

Son dos porque viven en mundos distintos: el primero se hornea en el HTML al
compilar; el segundo protege el endpoint en tiempo real. Así, aunque alguien
encuentre la página en previsualización, la API no acepta altas hasta que el
dueño encienda la variable — y se puede apagar la API al instante sin redeploy
de la web.

## 4. Pasos de encendido

Ejecutar en orden cuando el dueño dé el visto bueno:

1. **Crear la base D1 y el binding.**
   ```bash
   npx wrangler d1 create calma-reservas
   ```
   Después, en el proyecto de Cloudflare Pages: **Settings → Functions →
   D1 database bindings** → añadir binding con nombre `DB` apuntando a
   `calma-reservas` (en producción y en preview si se quiere probar allí).

2. **Crear la tabla.**
   ```bash
   npx wrangler d1 execute calma-reservas --file=db/reservas-schema.sql
   ```
   (La API también crea la tabla sola en el primer uso; este paso la deja
   lista y documentada.)

3. **Variables de entorno.**
   - En **Cloudflare Pages** (Settings → Environment variables):
     `BOOKINGS_ENABLED=true` y `RESERVAS_ADMIN_KEY=<clave larga aleatoria>`.
   - En **Vercel** (el panel): `RESERVAS_ADMIN_KEY` con **la misma** clave.
     (`PANEL_USER`/`PANEL_PASS` ya existen para `/panel/analitica`.)

4. **Aviso por email al dueño** (opcional para arrancar): elegir proveedor de
   envío y apuntarlo a `hola@calmasociety.com`. **Pendiente de elección**; el
   panel `/panel/reservas` funciona sin él (la fuente de verdad es la base).

5. **Política de privacidad**: actualizar `/privacidad` y `/en/privacy` — con
   las reservas se guardan datos personales (nombre, documento, contacto,
   dirección) en Cloudflare D1, con Menorca Bus, S.L. como destinatario del
   servicio.

6. **Encender la web**: `bookings.enabled: true` en `src/config/site.ts`
   (la página pasa a indexable y entra en el sitemap) y **decidir desde qué
   CTAs se enlaza** (decisión editorial del dueño: los CTAs actuales a
   menorcabus.com no se tocan sin su visto bueno). Commit + push → deploy.

## 5. Puntos de enchufe de la API de Menorca Bus

Cuando exista la API real, son CUATRO enchufes, ya localizados:

| # | Enchufe | Dónde tocar |
|---|---|---|
| 1 | **Cotización de precios** en las tarjetas del paso 2 (hoy: «precio cerrado: te lo confirma Menorca Bus») | `src/lib/bookings/catalog.ts` (añadir precio por categoría/trayecto) + las tarjetas de `src/pages/reservar-traslado/index.astro` y `src/pages/en/book-transfer/index.astro`. Si la cotización es en vivo, la página necesitará un endpoint de cotización en `functions/api/`. |
| 2 | **Lista de vuelos reales** en el paso 1 (hoy: número de vuelo a mano) | Campo `flightNumber` de las páginas de reserva; sustituir por selector alimentado por la API. |
| 3 | **Validación del cupón** (hoy: se guarda tal cual) | `functions/api/reservas.ts` (`onRequestPost`): validar `coupon` contra la API antes del INSERT. |
| 4 | **Pago al confirmar** (hoy: el dueño confirma a mano y cobra Menorca Bus) | `functions/api/reservas.ts` con `provider: "menorcabus"`: en vez de guardar y esperar, crear la reserva en la API de Menorca Bus y rellenar `provider_ref`, `provider_status` y `quoted_price` (columnas ya existentes). |

La tabla `bookings` ya lleva las columnas del enchufe (`provider`,
`provider_ref`, `provider_status`, `quoted_price`) con `provider = 'manual'`
por defecto: migrar a la API es cambiar el proveedor, no migrar datos.

## 6. Modelo de datos

Esquema completo: `db/reservas-schema.sql` (fuente de verdad en código:
`SCHEMA_SQL` en `src/lib/bookings/sql.ts`). Claves:

- `ref` (PK): localizador `CS-AAAA-XXXXXX` sin caracteres ambiguos (sin 0/O/1/I/L).
- `status`: ciclo `solicitada → confirmada | rechazada | cancelada`
  (`BOOKING_STATUSES` en `sql.ts`; el panel solo ofrece esos tres destinos).
- `type` (`transfer`) y `provider` (`manual`): los enchufes multi-tipo y
  multi-proveedor del futuro, sin ninguna otra pieza construida (YAGNI).
- `extras`: JSON con unidades por extra (`silla-nino`, `maxicosi`, `booster`,
  `maleta-extra`).
- `marketing_optin` (0/1) y `terms_accepted_at` (ISO): rastro del consentimiento.
