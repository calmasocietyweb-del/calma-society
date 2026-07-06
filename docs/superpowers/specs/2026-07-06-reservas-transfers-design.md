# Reservas de transfers — diseño (v1 apagada, lista para la API de Menorca Bus)

> Spec aprobada en conversación con el dueño (2026-07-06). Alcance: **SOLO transfers**.
> El sistema se construye COMPLETO pero nace **APAGADO** (`bookings.enabled: false` en
> `src/config/site.ts`); los CTAs actuales a menorcabus.com no cambian hasta que el
> dueño lo encienda.

## 1. Objetivo

Registrar solicitudes de reserva de transfer desde calmasociety.com **calcando la
fórmula del panel de reserva de menorcabus.com** (mismos pasos y mismos datos), de
forma que cuando exista la API de Menorca Bus solo haya que enchufarla en cuatro
puntos documentados (precios, vuelos, cupón, pago) sin rehacer nada.

## 2. La fórmula de menorcabus.com (capturada el 2026-07-06, en vivo)

**Paso 1 — Buscador**
- Origen y destino: campo de texto con chips rápidos «Aeropuerto» / «Mi ubicación» y
  botón de intercambio. (En menorcabus.com el campo es autocompletado de Google
  Places; nuestra v1 usa texto libre + chips y el Places queda para la era API.)
- Si origen o destino es el aeropuerto: el campo de fecha pasa a **«Fecha y hora de
  llegada del vuelo»** = fecha + número de vuelo (en su panel, selector con los
  vuelos reales del día; nuestra v1: fecha + hora + número de vuelo a mano).
- Pasajeros desglosados: adultos (12+), niños (2-11), bebés (0-2).
- Solo ida / ida y vuelta (con fecha y hora de regreso).
- Sellos de confianza: reservas seguras · atención 24/7 · cancelación flexible ·
  conductores profesionales.

**Paso 2 — Categorías de vehículo** (tarjetas, precio cerrado IVA incluido)
- `3 PAX` privado («mejor precio») · `Shuttle` compartido (espera en aeropuerto, hora
  definitiva 24 h antes, paradas intermedias, 1 maleta 20 kg incluida) · `VIP 2 PAX`
  · `VIP 2 PAX Superior` (upsell desde VIP) · `VIP 6 PAX` (…ampliable).
- En su panel cada tarjeta lleva el precio calculado en vivo; **nuestra v1 muestra
  las mismas tarjetas sin precio**, con «precio cerrado: te lo confirma Menorca Bus
  al validar la reserva». (Punto de enchufe API nº1: cotización en vivo.)
- Resumen del trayecto (v1: origen → destino, fecha y pasajeros elegidos; el mapa y
  la distancia/tiempo estimados de su panel quedan para la era API).

**Paso 3 — Completa tu reserva**
- Titular: nombre y apellidos*, empresa, DNI/NIF o pasaporte*, email*, móvil*,
  dirección*, código postal*, ciudad*, país*.
- **Cupón** (campo texto; v1 lo guarda tal cual — punto de enchufe API nº3: validación).
- Vuelo de llegada + hora de llegada + **hora deseada de recogida***.
- Comentarios al conductor (equipaje, horarios, necesidades especiales).
- **Extras** con contador por trayecto: silla niño · Maxicosi · booster · maleta
  extra (v1 sin precio/ud; en su panel 8 €/ud).
- Opt-in comercial (opcional) + **acepto términos*** + avisos («cancelación gratuita
  hasta 24 h antes», «la categoría del vehículo es orientativa»).
- Confirmar → en su panel lleva a pago (punto de enchufe API nº4); **nuestra v1
  guarda la solicitud como `solicitada`** y muestra página de gracias («Menorca Bus
  te confirmará el precio cerrado y la reserva por correo»).

## 3. Arquitectura

Dos casas, como el resto del proyecto:

| Pieza | Dónde vive | Detalle |
|---|---|---|
| Formulario (3 pasos) | Web pública (Cloudflare Pages) | Página Astro ES/EN, **HTML puro sin JS de cliente**: los 3 pasos de la fórmula son SECCIONES numeradas de una misma página (la web estática no puede pasar estado entre páginas sin JS) y hay UN solo envío al final. Oculta tras `bookings.enabled` (noindex + fuera del sitemap + sin enlazar). |
| API de reservas | **Cloudflare Pages Functions** (`functions/api/reservas/…`) | `POST` crea (validación + honeypot anti-spam; devuelve localizador), `GET`/`PATCH` solo con clave de administración (cabecera `X-Admin-Key` = secreto `RESERVAS_ADMIN_KEY`). Con `enabled: false`, el POST responde deshabilitado. |
| Base de datos | **Cloudflare D1** (SQLite gestionado, gratis) | Tabla `bookings` (ver §4). Vínculo (binding) que se crea al encender. |
| Panel del dueño | **Vercel existente** (`…vercel.app/panel/reservas`) | Junto a Keystatic y `/panel/analitica`, con el mismo `PANEL_USER`/`PANEL_PASS`. Lee y actualiza vía la API de Cloudflare con `RESERVAS_ADMIN_KEY` (variable en Vercel). Lista con filtros por estado y botones confirmar/rechazar. |
| Aviso al dueño | Adaptador `notify()` | v1: stub documentado (el panel es la fuente). Al encender se elige proveedor de email y se apunta a `hola@calmasociety.com`. |
| API Menorca Bus (futuro) | Interfaz `BookingProvider` | `manual` (v1: guardar + avisar) y `menorcabus` (stub con los 4 puntos de enchufe: cotización, vuelos, cupón, pago). |

## 4. Modelo de datos (tabla `bookings`)

- `id` (localizador corto p. ej. `CS-2026-000123`), `created_at`, `locale`.
- `status`: `solicitada → confirmada | rechazada | cancelada`.
- Trayecto: `origin`, `destination`, `trip_type` (ida / ida-vuelta), `pickup_date`,
  `pickup_time`, `return_date?`, `return_time?`, `flight_number?`, `flight_arrival?`,
  `pickup_time_requested?`.
- Pasajeros: `adults`, `children`, `infants`.
- Vehículo: `vehicle_category` (`3pax | shuttle | vip2 | vip2sup | vip6`).
- Titular: `name`, `company?`, `id_document`, `email`, `phone`, `address`,
  `postal_code`, `city`, `country`.
- `coupon?`, `comments?`, `extras` (JSON: sillaNino/maxicosi/booster/maletaExtra
  con cantidades ida/vuelta), `marketing_optin` (bool), `terms_accepted_at`.
- Enchufe API: `provider` (`manual | menorcabus`), `provider_ref?`,
  `provider_status?`, `quoted_price?`.
- (La tabla lleva `type` con valor fijo `transfer` — sin coste y sin ninguna otra
  pieza multi-tipo construida.)

## 5. Qué NO hace la v1 (a propósito)

- No calcula precios ni valida cupones ni cobra (sin API no se puede; puntos de
  enchufe documentados).
- No lista vuelos reales (número de vuelo a mano).
- No usa Google Places (texto libre + chips).
- No hay login de cliente (en menorcabus.com es opcional; aquí YAGNI).
- No toca los CTAs existentes mientras `enabled: false`.

## 6. Pasos de encendido (documentados en `docs/`, ejecutar cuando el dueño diga)

1. Crear la base D1 y el binding en el proyecto de Cloudflare Pages (5 min, guiado).
2. Poner `RESERVAS_ADMIN_KEY` (secreto) en Cloudflare y en Vercel.
3. Elegir proveedor de aviso por email → `hola@calmasociety.com`.
4. Actualizar la política de privacidad (se guardan datos personales de reserva).
5. `bookings.enabled: true` + decidir desde qué CTAs se enlaza.

## 7. Calidad

- Tests unitarios de la validación del POST y del generador de localizadores.
- `astro check` + build + CI como siempre; Lighthouse intacto (cero JS nuevo).
- Formularios accesibles (labels, teclado, foco) y ES/EN con `translationKey`.
- Jira: ficha nueva en la épica de herramientas; vault el mismo día.
