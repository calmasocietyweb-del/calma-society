/**
 * API del registro de socios y dinero (KAN-122) — una sola función, decisión
 * de la spec §2 (docs/superpowers/specs/2026-08-18-panel-socios-y-dinero-design.md).
 *
 * TODOS los métodos exigen la cabecera x-admin-key = SOCIOS_ADMIN_KEY (a
 * diferencia de reservas, aquí no hay ningún acceso público). Sin la base D1
 * creada responde 503: el sistema nace APAGADO y se enciende siguiendo el
 * runbook docs/PANEL-SOCIOS-DINERO.md.
 *
 * Acciones POST: crear | actualizar | snapshot | importar.
 */
import {
  SCHEMA_STATEMENTS,
  insertInto,
  updateById,
  upsertMedicion,
  LIST_SQL,
  type Tabla,
} from "../../src/lib/socios/sql.ts";
import { mesAnterior, mesRango } from "../../src/lib/socios/money.ts";
import { ESTADOS_SOCIO, ESTADOS_TRATO, MODELOS_TRATO } from "../../src/lib/socios/catalog.ts";

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

export interface Env {
  DB?: D1Database;
  SOCIOS_ADMIN_KEY?: string;
  UMAMI_API_URL?: string;
  UMAMI_API_KEY?: string;
  UMAMI_WEBSITE_ID?: string;
}
type Ctx = { request: Request; env: Env };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function adminOk(request: Request, env: Env): boolean {
  const key = env.SOCIOS_ADMIN_KEY ?? "";
  return key !== "" && request.headers.get("x-admin-key") === key;
}

/** Crea las 4 tablas si no existen. Una sentencia por run() (lección KAN-63). */
async function ensureSchema(db: D1Database): Promise<void> {
  for (const s of SCHEMA_STATEMENTS) await db.prepare(s).run();
}

/** Cortafuegos de valores: estados/modelos fuera de catálogo no entran en la base. */
function valoresValidos(tabla: Tabla, datos: Record<string, unknown>): string | null {
  const en = (lista: readonly string[], v: unknown) => v === undefined || lista.includes(String(v));
  if (tabla === "socios" && !en(ESTADOS_SOCIO, datos.estado)) return "estado de socio no válido";
  if (tabla === "tratos" && !en(ESTADOS_TRATO, datos.estado)) return "estado de trato no válido";
  if (tabla === "tratos" && !en(MODELOS_TRATO, datos.modelo)) return "modelo de trato no válido";
  if (tabla === "cobros" && datos.importe_cents !== undefined && !Number.isSafeInteger(datos.importe_cents))
    return "importe no válido";
  return null;
}

export async function onRequest({ request, env }: Ctx): Promise<Response> {
  if (!adminOk(request, env)) return new Response("No autorizado", { status: 401 });
  if (!env.DB)
    return json(
      {
        error: "base-no-creada",
        detalle: "Falta crear la base D1 calma-db y su binding. Runbook: docs/PANEL-SOCIOS-DINERO.md",
      },
      503,
    );

  if (request.method === "GET") {
    await ensureSchema(env.DB);
    const [socios, tratos, cobros, mediciones] = await Promise.all([
      env.DB.prepare(LIST_SQL.socios).all(),
      env.DB.prepare(LIST_SQL.tratos).all(),
      env.DB.prepare(LIST_SQL.cobros).all(),
      env.DB.prepare(LIST_SQL.mediciones).all(),
    ]);
    return json({
      socios: socios.results ?? [],
      tratos: tratos.results ?? [],
      cobros: cobros.results ?? [],
      mediciones: mediciones.results ?? [],
    });
  }

  if (request.method !== "POST")
    return new Response("Método no permitido", { status: 405, headers: { allow: "GET, POST" } });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ error: "json-no-valido" }, 400);
  await ensureSchema(env.DB);
  const now = new Date().toISOString();
  const accion = String(body.accion ?? "");
  const TABLAS: Tabla[] = ["socios", "tratos", "cobros"];

  if (accion === "crear" || accion === "actualizar") {
    const tabla = String(body.tabla ?? "") as Tabla;
    if (!TABLAS.includes(tabla)) return json({ error: "tabla-no-valida" }, 400);
    const datos = (body.datos ?? {}) as Record<string, unknown>;
    const motivo = valoresValidos(tabla, datos);
    if (motivo) return json({ error: "datos-no-validos", motivo }, 400);
    const stmt =
      accion === "crear" ? insertInto(tabla, datos, now) : updateById(tabla, body.id, datos, now);
    if (!stmt) return json({ error: "sin-datos" }, 400);
    try {
      const r = await env.DB.prepare(stmt.sql).bind(...stmt.params).run();
      if (accion === "actualizar" && !r.meta?.changes) return json({ error: "no-encontrado" }, 404);
      return json({ ok: true });
    } catch (e) {
      console.error("socios: escritura fallida", e);
      return json({ error: "escritura-fallida" }, 500);
    }
  }

  if (accion === "snapshot") {
    const mes = typeof body.mes === "string" && mesRango(body.mes) ? body.mes : mesAnterior(new Date());
    const r = await runSnapshot(env, mes);
    return json(r, r.ok ? 200 : 501);
  }

  if (accion === "importar") {
    const socios = Array.isArray(body.socios) ? (body.socios as Record<string, unknown>[]) : [];
    const tratos = Array.isArray(body.tratos) ? (body.tratos as Record<string, unknown>[]) : [];
    let filas = 0;
    for (const s of socios) {
      const stmt = insertInto("socios", s, now);
      if (!stmt) continue;
      // INSERT OR REPLACE: reimportar el seed no duplica socios (misma PK = slug).
      await env.DB.prepare(stmt.sql.replace("INSERT INTO", "INSERT OR REPLACE INTO"))
        .bind(...stmt.params)
        .run();
      filas++;
    }
    for (const t of tratos) {
      const stmt = insertInto("tratos", t, now);
      if (stmt) {
        await env.DB.prepare(stmt.sql).bind(...stmt.params).run();
        filas++;
      }
    }
    return json({ ok: true, filas });
  }

  return json({ error: "accion-no-valida" }, 400);
}

// ── Foto mensual desde Umami (la pieza nueva de la spec §2) ──────────────────
// Reimplementa en el Worker la lógica de /panel/analitica §Colaboradores
// (KAN-78): visitas por ficha via metrics?type=url y clics salientes por
// negocio via event-data/values. El roster sale de la tabla `socios` (el
// Worker no tiene content collections).
const SALIDA_EVENTS = ["click-salida-web", "planner-reserva", "planner-web-oficial"];
const FICHA_RE = /^\/(?:lugar|en\/place|fr\/lieu)\/(.+)-(?:es|en|fr)$/;
const cleanPath = (u: unknown) =>
  String(u ?? "").split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

/** Calcula la foto de un mes (visitas + clics por socio) y la upserta en D1. */
export async function runSnapshot(
  env: Env,
  mes: string,
): Promise<{ ok: boolean; mes: string; filas: number; eventData: boolean; motivo?: string }> {
  if (!env.DB) return { ok: false, mes, filas: 0, eventData: false, motivo: "base-no-creada" };
  if (!env.UMAMI_API_KEY || !env.UMAMI_WEBSITE_ID)
    return { ok: false, mes, filas: 0, eventData: false, motivo: "faltan-secretos-umami" };
  const rango = mesRango(mes);
  if (!rango) return { ok: false, mes, filas: 0, eventData: false, motivo: "mes-no-valido" };

  await ensureSchema(env.DB);
  const apiUrl = (env.UMAMI_API_URL ?? "https://api.umami.is/v1").replace(/\/$/, "");
  const headers = { "x-umami-api-key": env.UMAMI_API_KEY, accept: "application/json" };
  const qs = `startAt=${rango.startAt}&endAt=${rango.endAt}`;
  const base = `${apiUrl}/websites/${env.UMAMI_WEBSITE_ID}`;

  // 1) Visitas por ficha (suma ES+EN+FR). Límite alto: las fichas son long-tail.
  const urls = (await fetch(`${base}/metrics?type=url&${qs}&limit=1000`, { headers })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])) as { x?: unknown; y?: unknown }[];
  const visitas: Record<string, number> = {};
  for (const p of Array.isArray(urls) ? urls : []) {
    const m = cleanPath(p.x).match(FICHA_RE);
    if (m) visitas[m[1]] = (visitas[m[1]] ?? 0) + (Number(p.y) || 0);
  }

  // 2) Clics salientes por negocio. Plan B si el plan de Umami no expone
  //    event-data: se guarda solo la parte de visitas y se marca la fuente.
  const clics: Record<string, number> = {};
  let eventData = false;
  for (const name of SALIDA_EVENTS) {
    const lista = (await fetch(
      `${base}/event-data/values?${qs}&eventName=${encodeURIComponent(name)}&propertyName=negocio`,
      { headers },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)) as { value?: unknown; x?: unknown; total?: unknown; y?: unknown }[] | null;
    if (!Array.isArray(lista)) continue;
    eventData = true;
    for (const row of lista) {
      const slug = String(row.value ?? row.x ?? "");
      if (slug) clics[slug] = (clics[slug] ?? 0) + (Number(row.total ?? row.y) || 0);
    }
  }

  // 3) Roster desde D1 → upsert de la foto por socio (solo socios con ficha).
  const roster = (await env.DB.prepare("SELECT id, slug_ficha FROM socios WHERE slug_ficha != ''").all())
    .results as { id: string; slug_ficha: string }[] | undefined;
  const now = new Date().toISOString();
  let filas = 0;
  for (const s of roster ?? []) {
    const stmt = upsertMedicion(
      {
        socio_id: s.id,
        mes,
        visitas_ficha: visitas[s.slug_ficha] ?? 0,
        clics_web: clics[s.slug_ficha] ?? 0,
        fuente: eventData ? "umami-auto" : "umami-sin-eventdata",
      },
      now,
    );
    await env.DB.prepare(stmt.sql).bind(...stmt.params).run();
    filas++;
  }
  return { ok: true, mes, filas, eventData };
}
