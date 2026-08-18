/**
 * Esquema y sentencias D1 del registro de socios (KAN-122): las 4 tablas de la
 * spec (docs/superpowers/specs/2026-08-18-panel-socios-y-dinero-design.md).
 *
 * REGLA DE ORO del modelo: `cobros` es dinero RECIBIDO (lo escribe el dueño,
 * es la verdad); `medicion_mensual` es valor ENTREGADO (se calcula solo desde
 * Umami, es el argumento de venta). No se mezclan jamás — si se mezclan, se
 * acaba creyendo ingresado un dinero que solo estaba prometido.
 *
 * OJO D1: una sentencia por prepare().run(); exec() trocea por saltos de línea
 * y rompe un CREATE TABLE multilínea (lección de KAN-63).
 */

export const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS socios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'otro',
    zona TEXT NOT NULL DEFAULT '',
    web TEXT NOT NULL DEFAULT '',
    contacto TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    telefono TEXT NOT NULL DEFAULT '',
    relacion TEXT NOT NULL DEFAULT 'captacion-ficha',
    tanda TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'pendiente',
    dijo TEXT NOT NULL DEFAULT '',
    fecha_primer_email TEXT NOT NULL DEFAULT '',
    fecha_seguimiento TEXT NOT NULL DEFAULT '',
    proxima_accion TEXT NOT NULL DEFAULT '',
    slug_ficha TEXT NOT NULL DEFAULT '',
    url_ficha TEXT NOT NULL DEFAULT '',
    datos_ok INTEGER NOT NULL DEFAULT 0,
    fotos_ok INTEGER NOT NULL DEFAULT 0,
    enlace_ok INTEGER NOT NULL DEFAULT 0,
    notas TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tratos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id TEXT NOT NULL REFERENCES socios(id),
    modelo TEXT NOT NULL DEFAULT 'trueque',
    estado TEXT NOT NULL DEFAULT 'propuesto',
    trato TEXT NOT NULL DEFAULT '',
    condiciones_aceptadas TEXT NOT NULL DEFAULT '',
    contraprestacion TEXT NOT NULL DEFAULT '',
    precio_anual_cents INTEGER NOT NULL DEFAULT 0,
    inicio TEXT NOT NULL DEFAULT '',
    fin TEXT NOT NULL DEFAULT '',
    renovable INTEGER NOT NULL DEFAULT 0,
    etiquetado TEXT NOT NULL DEFAULT 'editorial',
    notas TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cobros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id TEXT NOT NULL REFERENCES socios(id),
    trato_id INTEGER,
    fecha TEXT NOT NULL,
    concepto TEXT NOT NULL,
    importe_cents INTEGER NOT NULL,
    facturado INTEGER NOT NULL DEFAULT 0,
    factura_ref TEXT NOT NULL DEFAULT '',
    cobrado INTEGER NOT NULL DEFAULT 0,
    fecha_cobro TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS medicion_mensual (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id TEXT NOT NULL,
    mes TEXT NOT NULL,
    visitas_ficha INTEGER NOT NULL DEFAULT 0,
    clics_web INTEGER NOT NULL DEFAULT 0,
    fuente TEXT NOT NULL DEFAULT 'umami-auto',
    calculado_en TEXT NOT NULL,
    UNIQUE (socio_id, mes)
  )`,
];

export type Tabla = "socios" | "tratos" | "cobros";

/** Columnas admitidas al CREAR una fila (lista blanca: nada más entra en SQL). */
export const INSERT_COLUMNS: Record<Tabla, readonly string[]> = {
  socios: [
    "id", "nombre", "tipo", "zona", "web", "contacto", "email", "telefono", "relacion",
    "tanda", "estado", "dijo", "fecha_primer_email", "fecha_seguimiento", "proxima_accion",
    "slug_ficha", "url_ficha", "datos_ok", "fotos_ok", "enlace_ok", "notas",
  ],
  tratos: [
    "socio_id", "modelo", "estado", "trato", "condiciones_aceptadas", "contraprestacion",
    "precio_anual_cents", "inicio", "fin", "renovable", "etiquetado", "notas",
  ],
  cobros: [
    "socio_id", "trato_id", "fecha", "concepto", "importe_cents", "facturado",
    "factura_ref", "cobrado", "fecha_cobro", "notas",
  ],
};

/** Columnas admitidas al ACTUALIZAR (el id nunca se toca; el histórico no se borra). */
export const UPDATE_COLUMNS: Record<Tabla, readonly string[]> = {
  socios: INSERT_COLUMNS.socios.filter((c) => c !== "id"),
  tratos: INSERT_COLUMNS.tratos.filter((c) => c !== "socio_id"),
  cobros: INSERT_COLUMNS.cobros.filter((c) => c !== "socio_id"),
};

type Row = Record<string, unknown>;
type Stmt = { sql: string; params: unknown[] };

/** INSERT con lista blanca + timestamps. null si no hay ninguna columna válida. */
export function insertInto(tabla: Tabla, datos: Row, nowIso: string): Stmt | null {
  const cols = INSERT_COLUMNS[tabla].filter((c) => datos[c] !== undefined);
  if (cols.length === 0) return null;
  const withTs = tabla === "cobros" ? [...cols, "creado_en"] : [...cols, "creado_en", "actualizado_en"];
  const params: unknown[] = cols.map((c) => datos[c]);
  params.push(nowIso);
  if (tabla !== "cobros") params.push(nowIso);
  const placeholders = withTs.map(() => "?").join(", ");
  return { sql: `INSERT INTO ${tabla} (${withTs.join(", ")}) VALUES (${placeholders})`, params };
}

/** UPDATE por id con lista blanca. null si no hay nada que actualizar. */
export function updateById(tabla: Tabla, id: unknown, datos: Row, nowIso: string): Stmt | null {
  const cols = UPDATE_COLUMNS[tabla].filter((c) => datos[c] !== undefined);
  if (cols.length === 0) return null;
  const sets = cols.map((c) => `${c} = ?`);
  const params: unknown[] = cols.map((c) => datos[c]);
  if (tabla !== "cobros") {
    sets.push("actualizado_en = ?");
    params.push(nowIso);
  }
  params.push(id);
  return { sql: `UPDATE ${tabla} SET ${sets.join(", ")} WHERE id = ?`, params };
}

export interface MedicionInput {
  socio_id: string;
  mes: string;
  visitas_ficha: number;
  clics_web: number;
  fuente: string;
}

/** Upsert de la foto mensual: rehacer un mes actualiza su fila, no duplica. */
export function upsertMedicion(row: MedicionInput, nowIso: string): Stmt {
  return {
    sql:
      "INSERT INTO medicion_mensual (socio_id, mes, visitas_ficha, clics_web, fuente, calculado_en) " +
      "VALUES (?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(socio_id, mes) DO UPDATE SET visitas_ficha = excluded.visitas_ficha, " +
      "clics_web = excluded.clics_web, fuente = excluded.fuente, calculado_en = excluded.calculado_en",
    params: [row.socio_id, row.mes, row.visitas_ficha, row.clics_web, row.fuente, nowIso],
  };
}

export const LIST_SQL = {
  socios: "SELECT * FROM socios ORDER BY nombre",
  tratos: "SELECT * FROM tratos ORDER BY socio_id, inicio DESC, id DESC",
  cobros: "SELECT * FROM cobros ORDER BY fecha DESC, id DESC",
  mediciones: "SELECT * FROM medicion_mensual ORDER BY mes DESC, socio_id",
} as const;
