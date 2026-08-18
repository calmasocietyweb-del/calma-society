# Panel de socios y dinero — runbook de encendido

> El registro interno del dinero de Calma Society (KAN-122). Nació **APAGADO**
> (2026-08-18) y este documento explica qué es, dónde vive cada pieza y los
> pasos exactos para encenderlo (~10 minutos, una sola vez).
> Spec: `docs/superpowers/specs/2026-08-18-panel-socios-y-dinero-design.md`.
> Plan: `docs/superpowers/plans/2026-08-18-panel-socios-y-dinero.md`.

## 1. Qué es

Cuatro tablas en Cloudflare D1 que sustituyen al Excel de colaboraciones
(congelado el 18-ago-2026; ver `COLABORACIONES/LEEME-el-registro-vivo-es-el-panel.txt`):

| Tabla | Qué guarda | Ritmo |
|---|---|---|
| `socios` | Quién es y dónde está la relación (contacto, estado, tanda, su ficha en la web) | cambia poco |
| `tratos` | El acuerdo. **Una fila por acuerdo** con fechas → conserva el histórico cuando alguien pasa de trueque a cuota | por acuerdo |
| `medicion_mensual` | **Valor entregado**: visitas a su ficha y clics a su web, por socio y mes (desde Umami) | mensual, automático |
| `cobros` | **Dinero recibido**: fecha, concepto, importe, facturado, cobrado | por pago |

**La regla de oro:** `cobros` lo escribe el dueño y es la verdad; `medicion_mensual`
se calcula sola y es el argumento de venta. **Nunca se mezclan** — si se mezclan, se
acaba creyendo ingresado un dinero que solo estaba prometido. El precio de un trato
dice lo que el acuerdo *vale*; los cobros dicen lo que *entró*.

## 2. Mapa de piezas

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| API | `functions/api/socios.ts`, enrutada en `worker.js` | `GET` estado completo · `POST` acciones `crear` / `actualizar` / `snapshot` / `importar`. **Todos los métodos** exigen la cabecera `x-admin-key` = secreto `SOCIOS_ADMIN_KEY`. Sin base D1 responde `503`. |
| Lógica pura | `src/lib/socios/` (`catalog`, `money`, `sql`, `resumen`) | Catálogo de estados/modelos, dinero en céntimos, esquema y sentencias, composición del panel. Testeada (`npm test`). |
| Panel | `src/pages/panel/socios.astro` → `…vercel.app/panel/socios` | SSR solo en Vercel, Basic auth (`PANEL_USER`/`PANEL_PASS`). Dinero, curva mensual, avisos, tabla de socios y detalle con formularios (ficha, tratos, cobros). |
| Índice | `src/pages/panel/index.astro` → `/panel/` | Una sola puerta: Editor, Analítica, Socios y dinero, Reservas + cuentas externas. |
| Foto mensual | `worker.js` (handler `scheduled`) + cron `23 4 2 * *` en `wrangler.jsonc` | El día 2 fotografía el **mes anterior** desde la API de Umami a `medicion_mensual`. También hay botón manual en el panel. |
| Esquema | `db/socios-schema.sql` (copia de `src/lib/socios/sql.ts`) | Para cargarlo con wrangler al encender (la API también lo crea sola). |
| Seed | `COLABORACIONES/panel-seed/seed.sql` (gitignorado) | Los 22 socios del Excel + su trato de trueque. Se regenera con `node scripts/socios/export-excel.mjs` (necesita `npm i --no-save exceljs`). |

## 3. El interruptor

**La existencia del binding D1 ES el interruptor.** Mientras la base no esté creada
y enlazada, la API responde `503` con mensaje claro, el panel muestra la tarjeta de
encendido y el cron no hace nada. No hay variable adicional que apagar: para
apagarlo de urgencia basta retirar el binding (o el secreto `SOCIOS_ADMIN_KEY`).

## 4. Encendido (una vez, en orden)

1. **Entrar y crear la base** (en la carpeta del repo):
   ```bash
   npx wrangler login
   npx wrangler d1 create calma-db
   ```
   > Nota: `calma-db` es la base ÚNICA de la casa. La compartirá con las reservas
   > de transfers (KAN-63) cuando aquellas se enciendan.
2. **Enlazarla:** en `wrangler.jsonc`, descomentar el bloque `d1_databases` y pegar
   el `database_id` que devolvió el paso 1. Commit + push (el deploy de Workers
   Builds recoge el binding).
3. **Secretos en Cloudflare** (Worker `calma-society` → Settings → Variables):
   - `SOCIOS_ADMIN_KEY` = una clave larga aleatoria (p. ej. `openssl rand -hex 24`).
   - `UMAMI_WEBSITE_ID` = el id público del sitio en Umami (está en `site.ts`).
   - `UMAMI_API_KEY` — ⚠️ **hoy NO existe y no puede existir**: la cuenta de Umami
     Cloud es del plan gratuito y **el acceso por API requiere el plan Pro**
     (comprobado el 18-ago-2026 en cloud.umami.is → Settings → API keys). Sin ella,
     la foto AUTOMÁTICA del cron responde `faltan-secretos-umami` y la foto se hace
     por la vía ASISTIDA (§5). Si algún día se contrata Umami Pro, se crea la clave
     ahí, se sube aquí, y el cron toma el relevo sin tocar código.
4. **Variable en Vercel** (proyecto del panel): `SOCIOS_ADMIN_KEY` con **la misma**
   clave. (`PANEL_USER`/`PANEL_PASS` ya existen.) Redeploy.
5. **Esquema y socios:**
   ```bash
   npx wrangler d1 execute calma-db --remote --file=db/socios-schema.sql
   npx wrangler d1 execute calma-db --remote --file=COLABORACIONES/panel-seed/seed.sql
   ```
   (El seed es idempotente: repetirlo no duplica.)
6. **Probar:** abrir `…vercel.app/panel/socios`, comprobar que salen los 22 socios
   y pulsar **«Hacer la foto del mes»**. Si devuelve `faltan-secretos-umami`,
   revisar el paso 3.

## 5. Operativa mensual (5-10 minutos)

- **Día 2-3 — la foto del mes anterior, por la vía ASISTIDA** (mientras Umami siga
  en plan gratuito): Claude lee el dashboard de `cloud.umami.is` con el navegador
  (mes anterior completo: visitas de las fichas `/lugar/…` + desglose del dato
  `negocio` en los eventos `click-salida-web` / `planner-reserva` /
  `planner-web-oficial`) y deposita las filas con la acción `medicion` de la API
  (mismo upsert que usaría el cron; fuente `manual-asistida`). El cron del día 2
  queda en guardia: si algún día hay Umami Pro + `UMAMI_API_KEY`, hace la foto solo
  y la vía asistida sobra.
- **Cuando entra dinero:** registrar el cobro en el detalle del socio (fecha,
  concepto, importe, nº de factura, cobrado). La factura la emite la gestoría de
  Menorca Bus, S.L.; el panel solo guarda la referencia.
- **Cuando se cierra un trato:** dictarlo en el chat (Claude lo registra) o usar
  el formulario «Nuevo trato». ⚠️ Si el trato es **pagado**, la ficha pública se
  etiqueta y su enlace pasa a `rel="sponsored"` — es un cambio editorial aparte
  y es obligatorio (ley + moat).
- **Renovaciones:** el panel avisa de los tratos que terminan en ≤60 días y de
  las facturas sin cobrar de más de 30.

## 6. Seguridad y privacidad

- La base guarda datos de contacto **de empresas** en su capacidad profesional
  (interés legítimo), no de lectores.
- API cerrada al 100% (`x-admin-key` en todos los métodos); panel con Basic auth;
  `/panel/` con `noindex` y fuera del sitemap.
- El repo es **público**: `COLABORACIONES/`, `NEGOCIO/`, `ESTRATEGIA/` y `_PANEL/`
  están en `.gitignore` (su copia de seguridad es el respaldo de KAN-53, no git).
  El seed con contactos vive solo en `COLABORACIONES/panel-seed/`.

## 7. Qué NO hace la v1

- No factura ni cobra (gestoría) y no manda emails (la captación la envía el
  dueño: `NEGOCIO/CAPTACION-EMPRESAS.md`).
- No decide la tarifa: registra el precio que **gerencia** fije (banda recomendada
  vigente: 250-400 €/año, congelada 2 años a fundadores).
- No toca las fichas públicas de la web ni sustituye a Umami.
