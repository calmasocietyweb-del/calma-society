/**
 * API de reservas de transfers (Cloudflare Pages Functions + D1).
 * v1 = proveedor "manual": guarda la solicitud y el dueño la gestiona
 * desde /panel/reservas (Vercel). Puntos de enchufe de la futura API de
 * Menorca Bus: cotización (paso 2), vuelos (paso 1), cupón y pago (paso 3)
 * — ver docs/RESERVAS-TRANSFERS.md.
 *
 * Interruptores: BOOKINGS_ENABLED ("true" para aceptar POST) y
 * RESERVAS_ADMIN_KEY (cabecera x-admin-key para GET/PATCH del panel).
 */
import { validateBookingInput } from "../../src/lib/bookings/validate.ts";
import { makeBookingRef } from "../../src/lib/bookings/ref.ts";
import {
  SCHEMA_SQL,
  insertStatement,
  LIST_SQL,
  UPDATE_STATUS_SQL,
  BOOKING_STATUSES,
} from "../../src/lib/bookings/sql.ts";

// Tipos mínimos de D1 (evitamos la dependencia @cloudflare/workers-types).
interface D1Result {
  results?: unknown[];
  meta?: { changes?: number };
}
interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all(): Promise<D1Result>;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

/**
 * Crea la tabla si no existe. OJO: se usa prepare().run() y NO exec()
 * porque exec() de D1 trocea por saltos de línea y rompe una sentencia
 * CREATE TABLE multilínea.
 */
async function ensureSchema(db: D1Database): Promise<void> {
  await db.prepare(SCHEMA_SQL).run();
}

interface Env {
  DB: D1Database;
  BOOKINGS_ENABLED?: string;
  RESERVAS_ADMIN_KEY?: string;
}

type Ctx = { request: Request; env: Env };

const THANKS_PATH: Record<string, string> = {
  es: "/reservar-traslado/gracias",
  en: "/en/book-transfer/thanks",
};

// Página de error de marca (sin JS): la API redirige aquí en vez de devolver
// texto pelado. `?motivo=` queda en la URL/logs; la página muestra un mensaje
// general con salida (no puede leer el parámetro sin JS de cliente).
const ERROR_PATH: Record<string, string> = {
  es: "/reservar-traslado/error",
  en: "/en/book-transfer/error",
};

function adminOk(request: Request, env: Env): boolean {
  const key = env.RESERVAS_ADMIN_KEY ?? "";
  return key !== "" && request.headers.get("x-admin-key") === key;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** Alta de una solicitud (el formulario de la web envía form-data clásico). */
export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  // Leemos el formulario primero para conocer el idioma y redirigir errores a la
  // página de error del idioma correcto (sin JS de cliente): mejor que texto pelado.
  const form = await request.formData();
  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const locale = raw.locale === "en" ? "en" : "es";
  const redirectTo = (path: string, query: string): Response =>
    Response.redirect(new URL(`${path}?${query}`, request.url).toString(), 303);
  const errorTo = (motivo: string): Response => redirectTo(ERROR_PATH[locale], `motivo=${motivo}`);

  if (env.BOOKINGS_ENABLED !== "true") return errorTo("no-disponible");

  const result = validateBookingInput(raw);
  if (!result.ok) return errorTo("datos");

  await ensureSchema(env.DB);
  const createdAt = new Date().toISOString();
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = makeBookingRef(new Date());
    const { sql, params } = insertStatement(result.value, ref, createdAt);
    try {
      await env.DB.prepare(sql).bind(...params).run();
      return redirectTo(THANKS_PATH[result.value.locale] ?? THANKS_PATH.es, `ref=${encodeURIComponent(ref)}`);
    } catch (e) {
      lastError = e; // choque de localizador (PRIMARY KEY): reintenta una vez
    }
  }
  console.error("reservas: insert fallido", lastError);
  return errorTo("servidor");
}

/** Listado para el panel (Vercel) — cabecera x-admin-key obligatoria. */
export async function onRequestGet({ request, env }: Ctx): Promise<Response> {
  if (!adminOk(request, env)) return new Response("No autorizado", { status: 401 });
  await ensureSchema(env.DB);
  const status = new URL(request.url).searchParams.get("status");
  const valid = status && (BOOKING_STATUSES as readonly string[]).includes(status) ? status : null;
  const { results } = await env.DB.prepare(LIST_SQL).bind(valid).all();
  return json({ bookings: results ?? [] });
}

/** Cambio de estado desde el panel: {ref, status} — x-admin-key obligatoria. */
export async function onRequestPatch({ request, env }: Ctx): Promise<Response> {
  if (!adminOk(request, env)) return new Response("No autorizado", { status: 401 });
  const body = (await request.json().catch(() => null)) as { ref?: string; status?: string } | null;
  const ref = body?.ref ?? "";
  const status = body?.status ?? "";
  if (!ref || !(BOOKING_STATUSES as readonly string[]).includes(status)) {
    return new Response("Petición no válida", { status: 400 });
  }
  const r = await env.DB.prepare(UPDATE_STATUS_SQL).bind(status, ref).run();
  if (!r.meta?.changes) return new Response("Reserva no encontrada", { status: 404 });
  return json({ ok: true });
}
