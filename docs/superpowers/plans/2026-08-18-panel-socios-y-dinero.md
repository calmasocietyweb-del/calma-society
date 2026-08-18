# Panel de socios y dinero — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el sistema interno de registro de dinero y socios (D1 + `/api/socios` + panel en Vercel + foto mensual automática + seed desde el Excel), completo y APAGADO, listo para encender en ~10 minutos.

**Architecture:** Calca el patrón KAN-63 (reservas): lógica pura tipada y testeada en `src/lib/socios/`, una única función `functions/api/socios.ts` enrutada en `worker.js` (Cloudflare Worker + D1, binding `DB`, base `calma-db` compartida), panel SSR solo-Vercel con Basic auth que llama a la API, y un handler `scheduled` (cron día 2) que fotografía el mes anterior desde Umami a `medicion_mensual`.

**Tech Stack:** Astro 6 (SSR solo en Vercel) · TypeScript · Cloudflare Workers + D1 · node:test (type-stripping, imports con extensión `.ts`) · exceljs (solo one-off local, `--no-save`).

**Spec:** `docs/superpowers/specs/2026-08-18-panel-socios-y-dinero-design.md`

## Global Constraints

- Importes SIEMPRE en céntimos (`INTEGER`); nunca float. UI en `es-ES` («1.234,50 €»).
- D1: `prepare().run()` por sentencia; NUNCA `exec()` con SQL multilínea.
- Todos los métodos de la API exigen `x-admin-key` = `SOCIOS_ADMIN_KEY`. Sin `env.DB` → 503 JSON.
- Sin JS de cliente en el panel; formularios POST-redirect-GET (patrón `panel/reservas.astro`).
- Sin emojis en la UI; tokens del sistema de diseño (lino/arena/niebla/tinta/piedra/terracota/arcilla/oro).
- `wrangler.jsonc`: el binding `d1_databases` va COMENTADO (Workers Builds rompería con un id inexistente); el cron `triggers.crons` sí va activo.
- Comentarios y commits en español; identificadores en inglés no forzado (el dominio es en español: `socios`, `tratos` — coherente con `bookings` ya existente que usa inglés; aquí el dominio ES el término de negocio del dueño).
- No se toca nada público de la web; `/panel/` ya está `noindex` + fuera del sitemap.
- El repo es PÚBLICO: `COLABORACIONES/`, `NEGOCIO/`, `ESTRATEGIA/`, `_PANEL/` deben quedar gitignorados; el seed con contactos solo en `COLABORACIONES/panel-seed/` (ignorado).

---

### Task 0: Ficha Jira + rama de trabajo

**Files:** ninguno (tablero Jira + git).

- [ ] **Step 1:** Crear en Jira (proyecto KAN) la ficha «Panel de socios y dinero — registro interno (D1 + /api/socios + panel)» en **En curso**, épica de herramientas internas si existe. Anotar la clave (p. ej. `KAN-120`); todos los commits de este plan la llevan delante.
- [ ] **Step 2:** Trabajar en `main` directamente (convención del repo: commits pequeños a main con CI en push; no hay flujo de PR). Verificar `git status` limpio de cambios propios antes de empezar.

### Task 1: Librería `catalog` + `money` (constantes y dinero)

**Files:**
- Create: `src/lib/socios/catalog.ts`
- Create: `src/lib/socios/money.ts`
- Test: `src/lib/socios/money.test.ts`
- Modify: `package.json` (glob de tests)

**Interfaces (Produces):**
- `TIPOS_SOCIO`, `ESTADOS_SOCIO`, `MODELOS_TRATO`, `ESTADOS_TRATO`, `ETIQUETADOS` (readonly arrays) + `LABELS` (mapas para UI).
- `parseEuros(input: string): number | null` · `formatEuros(cents: number): string` · `mesAnterior(hoy: Date): string` · `mesRango(mes: string): { startAt: number; endAt: number } | null` · `mesLabel(mes: string): string`.

- [ ] **Step 1: Test que falla** — `src/lib/socios/money.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseEuros, formatEuros, mesAnterior, mesRango, mesLabel } from "./money.ts";

test("parseEuros: enteros, coma decimal y miles", () => {
  assert.equal(parseEuros("350"), 35000);
  assert.equal(parseEuros("350,5"), 35050);
  assert.equal(parseEuros("1.200,50"), 120050);
  assert.equal(parseEuros(" 250 € "), 25000);
  assert.equal(parseEuros(""), null);
  assert.equal(parseEuros("abc"), null);
  assert.equal(parseEuros("-5"), null);
});

test("formatEuros: es-ES con céntimos solo si hay", () => {
  assert.equal(formatEuros(35000), "350 €");
  assert.equal(formatEuros(35050), "350,50 €");
  assert.equal(formatEuros(120050), "1.200,50 €");
  assert.equal(formatEuros(0), "0 €");
});

test("mesAnterior y mesRango", () => {
  assert.equal(mesAnterior(new Date(Date.UTC(2026, 7, 18))), "2026-07"); // agosto → julio
  assert.equal(mesAnterior(new Date(Date.UTC(2026, 0, 2))), "2025-12"); // enero → diciembre
  const r = mesRango("2026-07");
  assert.ok(r);
  assert.equal(new Date(r.startAt).toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(new Date(r.endAt + 1).toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(mesRango("2026-13"), null);
  assert.equal(mesRango("julio"), null);
});

test("mesLabel", () => {
  assert.equal(mesLabel("2026-07"), "jul 2026");
});
```

- [ ] **Step 2: Ejecutar y ver el fallo** — `node --test src/lib/socios/money.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementación**

`src/lib/socios/catalog.ts`:

```ts
/**
 * Catálogo del registro de socios: los valores válidos de cada campo de estado
 * y sus etiquetas para el panel. Fuente única — la API valida contra esto y el
 * panel pinta con esto. Modelo de tarifa validado con el dueño el 15-jul-2026.
 */
export const TIPOS_SOCIO = [
  "restaurante", "agroturismo", "hotel", "beach-club", "bodega",
  "queseria", "comercio", "actividad", "otro",
] as const;
export type TipoSocio = (typeof TIPOS_SOCIO)[number];

export const ESTADOS_SOCIO = [
  "pendiente", "contactado", "respondio-si", "respondio-no", "descartado", "socio",
] as const;
export type EstadoSocio = (typeof ESTADOS_SOCIO)[number];

export const MODELOS_TRATO = [
  "trueque", "cuota-directorio", "afiliacion", "branded", "otro",
] as const;
export type ModeloTrato = (typeof MODELOS_TRATO)[number];

export const ESTADOS_TRATO = ["propuesto", "activo", "terminado", "rechazado"] as const;
export type EstadoTrato = (typeof ESTADOS_TRATO)[number];

export const ETIQUETADOS = ["editorial", "patrocinado"] as const;
export type Etiquetado = (typeof ETIQUETADOS)[number];

/** Etiquetas legibles para el panel (sin emojis, lujo tranquilo). */
export const LABELS: Record<string, string> = {
  pendiente: "Pendiente", contactado: "Contactado", "respondio-si": "Respondió sí",
  "respondio-no": "Respondió no", descartado: "Descartado", socio: "Socio",
  trueque: "Trueque", "cuota-directorio": "Cuota de directorio", afiliacion: "Afiliación",
  branded: "Branded content", otro: "Otro",
  propuesto: "Propuesto", activo: "Activo", terminado: "Terminado", rechazado: "Rechazado",
  editorial: "Editorial", patrocinado: "Patrocinado",
};
```

`src/lib/socios/money.ts`:

```ts
/**
 * Dinero y meses del registro de socios. Los importes viajan SIEMPRE en
 * céntimos (enteros): nunca coma flotante en dinero.
 */

/** "1.200,50" | "350" | "250 €" → céntimos. Inválido o negativo → null. */
export function parseEuros(input: string): number | null {
  const clean = input.trim().replace(/€/g, "").replace(/\s+/g, "");
  if (clean === "") return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(clean)) return null;
  const [entero, dec = ""] = clean.replace(/\./g, "").split(",");
  const cents = Number(entero) * 100 + Number((dec + "00").slice(0, 2));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Céntimos → "1.234,50 €" (es-ES); sin decimales si son ,00. */
export function formatEuros(cents: number): string {
  const euros = Math.trunc(cents / 100);
  const dec = Math.abs(cents % 100);
  const miles = euros.toLocaleString("es-ES");
  return dec === 0 ? `${miles} €` : `${miles},${String(dec).padStart(2, "0")} €`;
}

/** Mes anterior al de la fecha dada (UTC), como "YYYY-MM". */
export function mesAnterior(hoy: Date): string {
  const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

/** "YYYY-MM" → rango [startAt, endAt] en ms UTC (mes completo), o null si no es válido. */
export function mesRango(mes: string): { startAt: number; endAt: number } | null {
  const m = mes.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const startAt = Date.UTC(y, mo - 1, 1);
  const endAt = Date.UTC(y, mo, 1) - 1;
  return { startAt, endAt };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-07" → "jul 2026" (para la curva del panel). */
export function mesLabel(mes: string): string {
  const r = mesRango(mes);
  if (!r) return mes;
  return `${MESES[new Date(r.startAt).getUTCMonth()]} ${mes.slice(0, 4)}`;
}
```

En `package.json`, añadir el glob al script `test` (delante de los existentes):
`"test": "node --test \"src/lib/socios/**/*.test.ts\" \"src/lib/planner/**/*.test.ts\" …(resto igual)"`.

- [ ] **Step 4: Verificar en verde** — `node --test src/lib/socios/money.test.ts` → PASS; `npm test` → todos.
- [ ] **Step 5: Commit** — `git add src/lib/socios package.json && git commit -m "KAN-NN feat(socios): catálogo y dinero en céntimos del registro de socios"` (KAN-NN = clave de Task 0).

### Task 2: `sql.ts` — esquema de las 4 tablas y sentencias

**Files:**
- Create: `src/lib/socios/sql.ts`
- Create: `db/socios-schema.sql`
- Test: `src/lib/socios/sql.test.ts`

**Interfaces (Produces):**
- `SCHEMA_STATEMENTS: readonly string[]` (4 `CREATE TABLE IF NOT EXISTS`).
- `type Tabla = "socios" | "tratos" | "cobros"` · `INSERT_COLUMNS` / `UPDATE_COLUMNS: Record<Tabla, readonly string[]>`.
- `insertInto(tabla, datos, nowIso): { sql, params } | null` · `updateById(tabla, id, datos, nowIso): { sql, params } | null` · `upsertMedicion(row, nowIso): { sql, params }`.
- `LIST_SQL: Record<"socios"|"tratos"|"cobros"|"mediciones", string>`.

- [ ] **Step 1: Test que falla** — `src/lib/socios/sql.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { SCHEMA_STATEMENTS, insertInto, updateById, upsertMedicion, LIST_SQL } from "./sql.ts";

const NOW = "2026-08-18T10:00:00.000Z";

test("esquema: 4 tablas, una sentencia por tabla (D1 no admite exec multilínea)", () => {
  assert.equal(SCHEMA_STATEMENTS.length, 4);
  for (const s of SCHEMA_STATEMENTS) assert.match(s, /CREATE TABLE IF NOT EXISTS/);
  assert.ok(SCHEMA_STATEMENTS.some((s) => s.includes("medicion_mensual")));
  assert.ok(SCHEMA_STATEMENTS.some((s) => s.includes("UNIQUE (socio_id, mes)")));
});

test("insertInto: solo columnas de la lista blanca + timestamps", () => {
  const r = insertInto("socios", { id: "torralbenc", nombre: "Torralbenc", hack: "DROP TABLE" }, NOW);
  assert.ok(r);
  assert.match(r.sql, /INSERT INTO socios/);
  assert.ok(!r.sql.includes("hack"));
  assert.ok(r.sql.includes("creado_en"));
  assert.deepEqual(r.params.slice(0, 2), ["torralbenc", "Torralbenc"]);
  assert.equal(insertInto("socios", { hack: "x" }, NOW), null); // nada válido → null
});

test("updateById: set de columnas válidas y where por id", () => {
  const r = updateById("tratos", 3, { estado: "activo", hack: "x" }, NOW);
  assert.ok(r);
  assert.match(r.sql, /UPDATE tratos SET/);
  assert.match(r.sql, /WHERE id = \?/);
  assert.ok(!r.sql.includes("hack"));
  assert.equal(r.params.at(-1), 3);
  assert.equal(updateById("tratos", 3, {}, NOW), null);
});

test("upsertMedicion: ON CONFLICT actualiza la foto del mes", () => {
  const r = upsertMedicion({ socio_id: "torralbenc", mes: "2026-07", visitas_ficha: 12, clics_web: 4, fuente: "umami-auto" }, NOW);
  assert.match(r.sql, /ON CONFLICT\(socio_id, mes\) DO UPDATE/);
  assert.deepEqual(r.params, ["torralbenc", "2026-07", 12, 4, "umami-auto", NOW]);
});

test("LIST_SQL ordena estable", () => {
  assert.match(LIST_SQL.socios, /ORDER BY/);
  assert.match(LIST_SQL.mediciones, /ORDER BY mes/);
});
```

- [ ] **Step 2: Ejecutar y ver el fallo** — `node --test src/lib/socios/sql.test.ts` → FAIL.
- [ ] **Step 3: Implementación** — `src/lib/socios/sql.ts`:

```ts
/**
 * Esquema y sentencias D1 del registro de socios (4 tablas de la spec).
 * REGLA DE ORO del modelo: `cobros` es dinero RECIBIDO (lo escribe el dueño,
 * es la verdad); `medicion_mensual` es valor ENTREGADO (se calcula solo, es
 * el argumento). No se mezclan jamás.
 * OJO D1: una sentencia por prepare().run(); exec() trocea por saltos de línea.
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
  socios: ["id", "nombre", "tipo", "zona", "web", "contacto", "email", "telefono", "relacion",
    "tanda", "estado", "dijo", "fecha_primer_email", "fecha_seguimiento", "proxima_accion",
    "slug_ficha", "url_ficha", "datos_ok", "fotos_ok", "enlace_ok", "notas"],
  tratos: ["socio_id", "modelo", "estado", "trato", "condiciones_aceptadas", "contraprestacion",
    "precio_anual_cents", "inicio", "fin", "renovable", "etiquetado", "notas"],
  cobros: ["socio_id", "trato_id", "fecha", "concepto", "importe_cents", "facturado",
    "factura_ref", "cobrado", "fecha_cobro", "notas"],
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
  const params = cols.map((c) => datos[c]);
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
```

`db/socios-schema.sql`: el mismo esquema en SQL plano (4 sentencias separadas por `;`), con cabecera comentada «Copia ejecutable de src/lib/socios/sql.ts para wrangler d1 execute».

- [ ] **Step 4: Verde** — `node --test src/lib/socios/sql.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git add src/lib/socios db/socios-schema.sql && git commit -m "KAN-NN feat(socios): esquema D1 de las 4 tablas y sentencias con lista blanca"`.

### Task 3: `resumen.ts` — la composición del panel (puro y testeado)

**Files:**
- Create: `src/lib/socios/resumen.ts`
- Test: `src/lib/socios/resumen.test.ts`

**Interfaces (Produces):**
- Tipos fila: `SocioRow`, `TratoRow`, `CobroRow`, `MedicionRow` (campos según esquema Task 2).
- `tratoVigente(tratos: TratoRow[], socioId: string): TratoRow | null` — el trato `activo` más reciente por `inicio` (luego `id`).
- `resumenDinero(socios, tratos, cobros, mediciones, hoy: Date): ResumenDinero` con `{ anyo, cobradoAnyoCents, facturadoSinCobrarCents, comprometidoAnualCents, mesPasado, clicsMesPasado, visitasMesPasado, nSocios, nTratoActivo }`.
- `curvaMensual(cobros, mediciones, hoy: Date, nMeses = 12): { mes: string; cobradoCents: number; clics: number }[]` (ascendente, termina en el mes actual).
- `avisos(socios, tratos, cobros, hoy: Date): { renovaciones: { socio_id, fin, dias }[]; facturasSinCobrar: { socio_id, fecha, importe_cents, dias }[] }` (renovaciones = tratos activos con `fin` a ≤60 días; facturas `facturado=1 ∧ cobrado=0` de >30 días).
- `filasSocios(socios, tratos, cobros, mediciones, hoy: Date): FilaSocio[]` con `{ id, nombre, tipo, estado, modelo, precioAnualCents, cobradoAnyoCents, clicsMesPasado, visitasMesPasado }`, orden: trato activo primero, luego clics desc, luego nombre.

- [ ] **Step 1: Test que falla** — `src/lib/socios/resumen.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { tratoVigente, resumenDinero, curvaMensual, avisos, filasSocios } from "./resumen.ts";

const HOY = new Date(Date.UTC(2026, 7, 18)); // 18-ago-2026 → mes pasado = 2026-07
const socios: any[] = [
  { id: "torralbenc", nombre: "Torralbenc", tipo: "restaurante", estado: "socio" },
  { id: "smoix", nombre: "Smoix", tipo: "restaurante", estado: "pendiente" },
];
const tratos: any[] = [
  { id: 1, socio_id: "torralbenc", modelo: "trueque", estado: "terminado", precio_anual_cents: 0, inicio: "2026-07-01", fin: "", renovable: 0 },
  { id: 2, socio_id: "torralbenc", modelo: "cuota-directorio", estado: "activo", precio_anual_cents: 30000, inicio: "2026-08-01", fin: "2026-09-15", renovable: 1 },
];
const cobros: any[] = [
  { id: 1, socio_id: "torralbenc", fecha: "2026-08-05", importe_cents: 30000, facturado: 1, cobrado: 1, fecha_cobro: "2026-08-10" },
  { id: 2, socio_id: "torralbenc", fecha: "2026-06-01", importe_cents: 5000, facturado: 1, cobrado: 0, fecha_cobro: "" },
  { id: 3, socio_id: "smoix", fecha: "2025-12-20", importe_cents: 9900, facturado: 1, cobrado: 1, fecha_cobro: "2025-12-30" },
];
const mediciones: any[] = [
  { socio_id: "torralbenc", mes: "2026-07", visitas_ficha: 40, clics_web: 9, fuente: "umami-auto" },
  { socio_id: "smoix", mes: "2026-07", visitas_ficha: 10, clics_web: 2, fuente: "umami-auto" },
  { socio_id: "torralbenc", mes: "2026-06", visitas_ficha: 20, clics_web: 3, fuente: "umami-auto" },
];

test("tratoVigente elige el activo más reciente", () => {
  assert.equal(tratoVigente(tratos as any, "torralbenc")?.id, 2);
  assert.equal(tratoVigente(tratos as any, "smoix"), null);
});

test("resumenDinero: cobrado por fecha_cobro del año, facturado sin cobrar, compromiso y valor", () => {
  const r = resumenDinero(socios as any, tratos as any, cobros as any, mediciones as any, HOY);
  assert.equal(r.anyo, 2026);
  assert.equal(r.cobradoAnyoCents, 30000); // el de 2025 no cuenta
  assert.equal(r.facturadoSinCobrarCents, 5000);
  assert.equal(r.comprometidoAnualCents, 30000);
  assert.equal(r.mesPasado, "2026-07");
  assert.equal(r.clicsMesPasado, 11);
  assert.equal(r.visitasMesPasado, 50);
  assert.equal(r.nSocios, 2);
  assert.equal(r.nTratoActivo, 1);
});

test("curvaMensual: 12 meses ascendentes con cobros (por fecha_cobro) y clics", () => {
  const c = curvaMensual(cobros as any, mediciones as any, HOY, 12);
  assert.equal(c.length, 12);
  assert.equal(c.at(-1)?.mes, "2026-08");
  assert.equal(c.at(-1)?.cobradoCents, 30000);
  assert.equal(c.at(-2)?.mes, "2026-07");
  assert.equal(c.at(-2)?.clics, 11);
  assert.equal(c.at(-3)?.clics, 3); // 2026-06
});

test("avisos: renovación a ≤60 días y factura sin cobrar de >30", () => {
  const a = avisos(socios as any, tratos as any, cobros as any, HOY);
  assert.equal(a.renovaciones.length, 1);
  assert.equal(a.renovaciones[0].socio_id, "torralbenc");
  assert.equal(a.facturasSinCobrar.length, 1);
  assert.equal(a.facturasSinCobrar[0].importe_cents, 5000);
});

test("filasSocios: trato activo primero y datos compuestos", () => {
  const f = filasSocios(socios as any, tratos as any, cobros as any, mediciones as any, HOY);
  assert.equal(f[0].id, "torralbenc");
  assert.equal(f[0].modelo, "cuota-directorio");
  assert.equal(f[0].precioAnualCents, 30000);
  assert.equal(f[0].cobradoAnyoCents, 30000);
  assert.equal(f[0].clicsMesPasado, 9);
  assert.equal(f[1].id, "smoix");
  assert.equal(f[1].modelo, "");
});
```

- [ ] **Step 2: Ejecutar y ver el fallo.**
- [ ] **Step 3: Implementación** — `src/lib/socios/resumen.ts` (funciones puras; sin acceso a red ni D1):

```ts
/**
 * Composición del panel de socios: funciones PURAS que convierten las filas de
 * las 4 tablas en lo que se pinta (tarjetas de dinero, curva, avisos, tabla).
 * La regla de oro se aplica aquí: lo COBRADO sale solo de `cobros` con
 * cobrado=1 (por fecha_cobro); el compromiso y la medición nunca lo engordan.
 */
import { mesAnterior } from "./money.ts";

export interface SocioRow {
  id: string; nombre: string; tipo: string; estado: string;
  [k: string]: unknown;
}
export interface TratoRow {
  id: number; socio_id: string; modelo: string; estado: string;
  precio_anual_cents: number; inicio: string; fin: string; renovable: number;
  [k: string]: unknown;
}
export interface CobroRow {
  id: number; socio_id: string; fecha: string; importe_cents: number;
  facturado: number; cobrado: number; fecha_cobro: string;
  [k: string]: unknown;
}
export interface MedicionRow {
  socio_id: string; mes: string; visitas_ficha: number; clics_web: number; fuente: string;
}

export function tratoVigente(tratos: TratoRow[], socioId: string): TratoRow | null {
  const activos = tratos
    .filter((t) => t.socio_id === socioId && t.estado === "activo")
    .sort((a, b) => (b.inicio || "").localeCompare(a.inicio || "") || b.id - a.id);
  return activos[0] ?? null;
}

export interface ResumenDinero {
  anyo: number; cobradoAnyoCents: number; facturadoSinCobrarCents: number;
  comprometidoAnualCents: number; mesPasado: string; clicsMesPasado: number;
  visitasMesPasado: number; nSocios: number; nTratoActivo: number;
}

export function resumenDinero(
  socios: SocioRow[], tratos: TratoRow[], cobros: CobroRow[], mediciones: MedicionRow[], hoy: Date,
): ResumenDinero {
  const anyo = hoy.getUTCFullYear();
  const mesPasado = mesAnterior(hoy);
  const cobradoAnyoCents = cobros
    .filter((c) => c.cobrado === 1 && c.fecha_cobro.startsWith(String(anyo)))
    .reduce((n, c) => n + c.importe_cents, 0);
  const facturadoSinCobrarCents = cobros
    .filter((c) => c.facturado === 1 && c.cobrado !== 1)
    .reduce((n, c) => n + c.importe_cents, 0);
  const conActivo = new Set(tratos.filter((t) => t.estado === "activo").map((t) => t.socio_id));
  const comprometidoAnualCents = [...conActivo].reduce(
    (n, id) => n + (tratoVigente(tratos, id)?.precio_anual_cents ?? 0), 0);
  const delMes = mediciones.filter((m) => m.mes === mesPasado);
  return {
    anyo, cobradoAnyoCents, facturadoSinCobrarCents, comprometidoAnualCents, mesPasado,
    clicsMesPasado: delMes.reduce((n, m) => n + m.clics_web, 0),
    visitasMesPasado: delMes.reduce((n, m) => n + m.visitas_ficha, 0),
    nSocios: socios.length,
    nTratoActivo: conActivo.size,
  };
}

export function curvaMensual(
  cobros: CobroRow[], mediciones: MedicionRow[], hoy: Date, nMeses = 12,
): { mes: string; cobradoCents: number; clics: number }[] {
  const out: { mes: string; cobradoCents: number; clics: number }[] = [];
  const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  for (let i = 0; i < nMeses; i++) {
    const mes = d.toISOString().slice(0, 7);
    out.unshift({
      mes,
      cobradoCents: cobros
        .filter((c) => c.cobrado === 1 && c.fecha_cobro.startsWith(mes))
        .reduce((n, c) => n + c.importe_cents, 0),
      clics: mediciones.filter((m) => m.mes === mes).reduce((n, m) => n + m.clics_web, 0),
    });
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out;
}

const DIA_MS = 24 * 60 * 60 * 1000;
const dias = (desde: string, hasta: Date): number =>
  Math.floor((hasta.getTime() - new Date(`${desde}T00:00:00Z`).getTime()) / DIA_MS);

export function avisos(socios: SocioRow[], tratos: TratoRow[], cobros: CobroRow[], hoy: Date) {
  const renovaciones = tratos
    .filter((t) => t.estado === "activo" && t.fin !== "" && -dias(t.fin, hoy) <= 60)
    .map((t) => ({ socio_id: t.socio_id, fin: t.fin, dias: -dias(t.fin, hoy) }))
    .sort((a, b) => a.dias - b.dias);
  const facturasSinCobrar = cobros
    .filter((c) => c.facturado === 1 && c.cobrado !== 1 && dias(c.fecha, hoy) > 30)
    .map((c) => ({ socio_id: c.socio_id, fecha: c.fecha, importe_cents: c.importe_cents, dias: dias(c.fecha, hoy) }));
  return { renovaciones, facturasSinCobrar };
}

export interface FilaSocio {
  id: string; nombre: string; tipo: string; estado: string; modelo: string;
  precioAnualCents: number; cobradoAnyoCents: number; clicsMesPasado: number; visitasMesPasado: number;
}

export function filasSocios(
  socios: SocioRow[], tratos: TratoRow[], cobros: CobroRow[], mediciones: MedicionRow[], hoy: Date,
): FilaSocio[] {
  const anyo = String(hoy.getUTCFullYear());
  const mesPasado = mesAnterior(hoy);
  return socios
    .map((s) => {
      const t = tratoVigente(tratos, s.id);
      const m = mediciones.find((x) => x.socio_id === s.id && x.mes === mesPasado);
      return {
        id: s.id, nombre: s.nombre, tipo: s.tipo, estado: s.estado,
        modelo: t?.modelo ?? "",
        precioAnualCents: t?.precio_anual_cents ?? 0,
        cobradoAnyoCents: cobros
          .filter((c) => c.socio_id === s.id && c.cobrado === 1 && c.fecha_cobro.startsWith(anyo))
          .reduce((n, c) => n + c.importe_cents, 0),
        clicsMesPasado: m?.clics_web ?? 0,
        visitasMesPasado: m?.visitas_ficha ?? 0,
      };
    })
    .sort((a, b) => Number(b.modelo !== "") - Number(a.modelo !== "") ||
      b.clicsMesPasado - a.clicsMesPasado || a.nombre.localeCompare(b.nombre));
}
```

- [ ] **Step 4: Verde** — `node --test src/lib/socios/resumen.test.ts` y `npm test` completos.
- [ ] **Step 5: Commit** — `git commit -m "KAN-NN feat(socios): composición pura del panel (dinero, curva, avisos, filas)"`.

### Task 4: API `/api/socios` + cron en el Worker

**Files:**
- Create: `functions/api/socios.ts`
- Modify: `worker.js` (ruta `/api/socios` + handler `scheduled`)
- Modify: `wrangler.jsonc` (cron activo + bloque D1 comentado)

**Interfaces:**
- Consumes: Task 1 (`mesAnterior`, `mesRango`), Task 2 (`SCHEMA_STATEMENTS`, `insertInto`, `updateById`, `upsertMedicion`, `LIST_SQL`, `Tabla`), catálogo Task 1 para validar estados.
- Produces: `onRequest(ctx): Promise<Response>` (dispatch GET/POST) y `runSnapshot(env, mes): Promise<{ ok: boolean; mes: string; filas: number; eventData: boolean; motivo?: string }>` — lo importa `worker.js`.

- [ ] **Step 1: Implementación** (sin test unitario propio: es fontanería D1+fetch; la lógica de negocio ya está testeada en Tasks 1-3 y el criterio de hecho §6.2 de la spec se verifica en local):

```ts
/**
 * API del registro de socios y dinero (una sola función, decisión de la spec §2).
 * TODOS los métodos exigen x-admin-key = SOCIOS_ADMIN_KEY (no hay acceso público).
 * Sin base D1 creada responde 503: el sistema nace APAGADO (runbook
 * docs/PANEL-SOCIOS-DINERO.md). Acciones POST: crear | actualizar | snapshot | importar.
 */
import {
  SCHEMA_STATEMENTS, insertInto, updateById, upsertMedicion, LIST_SQL, type Tabla,
} from "../../src/lib/socios/sql.ts";
import { mesAnterior, mesRango } from "../../src/lib/socios/money.ts";
import { ESTADOS_SOCIO, ESTADOS_TRATO, MODELOS_TRATO } from "../../src/lib/socios/catalog.ts";

interface D1Result { results?: unknown[]; meta?: { changes?: number } }
interface D1PreparedStatement { bind(...p: unknown[]): D1PreparedStatement; run(): Promise<D1Result>; all(): Promise<D1Result> }
interface D1Database { prepare(sql: string): D1PreparedStatement }

export interface Env {
  DB?: D1Database;
  SOCIOS_ADMIN_KEY?: string;
  UMAMI_API_URL?: string;
  UMAMI_API_KEY?: string;
  UMAMI_WEBSITE_ID?: string;
}
type Ctx = { request: Request; env: Env };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

const adminOk = (request: Request, env: Env) =>
  !!env.SOCIOS_ADMIN_KEY && request.headers.get("x-admin-key") === env.SOCIOS_ADMIN_KEY;

async function ensureSchema(db: D1Database) {
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
  if (!env.DB) return json({ error: "base-no-creada", detalle: "Falta crear la base D1 calma-db y su binding (docs/PANEL-SOCIOS-DINERO.md)" }, 503);

  if (request.method === "GET") {
    await ensureSchema(env.DB);
    const [socios, tratos, cobros, mediciones] = await Promise.all([
      env.DB.prepare(LIST_SQL.socios).all(),
      env.DB.prepare(LIST_SQL.tratos).all(),
      env.DB.prepare(LIST_SQL.cobros).all(),
      env.DB.prepare(LIST_SQL.mediciones).all(),
    ]);
    return json({
      socios: socios.results ?? [], tratos: tratos.results ?? [],
      cobros: cobros.results ?? [], mediciones: mediciones.results ?? [],
    });
  }

  if (request.method !== "POST") return new Response("Método no permitido", { status: 405, headers: { allow: "GET, POST" } });

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
    const stmt = accion === "crear"
      ? insertInto(tabla, datos, now)
      : updateById(tabla, body.id, datos, now);
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
      await env.DB.prepare(stmt.sql.replace("INSERT INTO", "INSERT OR REPLACE INTO")).bind(...stmt.params).run();
      filas++;
    }
    for (const t of tratos) {
      const stmt = insertInto("tratos", t, now);
      if (stmt) { await env.DB.prepare(stmt.sql).bind(...stmt.params).run(); filas++; }
    }
    return json({ ok: true, filas });
  }

  return json({ error: "accion-no-valida" }, 400);
}

// ── Foto mensual desde Umami (la pieza nueva de la spec §2) ──────────────────
const SALIDA_EVENTS = ["click-salida-web", "planner-reserva", "planner-web-oficial"];
const FICHA_RE = /^\/(?:lugar|en\/place|fr\/lieu)\/(.+)-(?:es|en|fr)$/;
const cleanPath = (u: unknown) => String(u ?? "").split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

/** Calcula la foto de un mes (visitas + clics por socio) y la upserta en D1. */
export async function runSnapshot(
  env: Env, mes: string,
): Promise<{ ok: boolean; mes: string; filas: number; eventData: boolean; motivo?: string }> {
  if (!env.DB) return { ok: false, mes, filas: 0, eventData: false, motivo: "base-no-creada" };
  const apiUrl = (env.UMAMI_API_URL ?? "https://api.umami.is/v1").replace(/\/$/, "");
  if (!env.UMAMI_API_KEY || !env.UMAMI_WEBSITE_ID)
    return { ok: false, mes, filas: 0, eventData: false, motivo: "faltan-secretos-umami" };
  const rango = mesRango(mes);
  if (!rango) return { ok: false, mes, filas: 0, eventData: false, motivo: "mes-no-valido" };

  await ensureSchema(env.DB);
  const headers = { "x-umami-api-key": env.UMAMI_API_KEY, accept: "application/json" };
  const qs = `startAt=${rango.startAt}&endAt=${rango.endAt}`;
  const base = `${apiUrl}/websites/${env.UMAMI_WEBSITE_ID}`;

  // 1) Visitas por ficha (suma ES+EN+FR), misma regex que /panel/analitica (KAN-78).
  const urls = (await fetch(`${base}/metrics?type=url&${qs}&limit=1000`, { headers })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])) as { x?: unknown; y?: unknown }[];
  const visitas: Record<string, number> = {};
  for (const p of Array.isArray(urls) ? urls : []) {
    const m = cleanPath(p.x).match(FICHA_RE);
    if (m) visitas[m[1]] = (visitas[m[1]] ?? 0) + (Number(p.y) || 0);
  }

  // 2) Clics salientes por negocio (event-data; plan B si el plan de Umami no lo expone).
  const clics: Record<string, number> = {};
  let eventData = false;
  for (const name of SALIDA_EVENTS) {
    const lista = (await fetch(
      `${base}/event-data/values?${qs}&eventName=${encodeURIComponent(name)}&propertyName=negocio`,
      { headers },
    ).then((r) => (r.ok ? r.json() : null)).catch(() => null)) as { value?: unknown; x?: unknown; total?: unknown; y?: unknown }[] | null;
    if (!Array.isArray(lista)) continue;
    eventData = true;
    for (const row of lista) {
      const slug = String(row.value ?? row.x ?? "");
      if (slug) clics[slug] = (clics[slug] ?? 0) + (Number(row.total ?? row.y) || 0);
    }
  }

  // 3) Roster desde D1 (el Worker no tiene content collections) → upsert por socio.
  const roster = (await env.DB.prepare("SELECT id, slug_ficha FROM socios WHERE slug_ficha != ''").all())
    .results as { id: string; slug_ficha: string }[] | undefined;
  const now = new Date().toISOString();
  let filas = 0;
  for (const s of roster ?? []) {
    const stmt = upsertMedicion({
      socio_id: s.id, mes,
      visitas_ficha: visitas[s.slug_ficha] ?? 0,
      clics_web: clics[s.slug_ficha] ?? 0,
      fuente: eventData ? "umami-auto" : "umami-sin-eventdata",
    }, now);
    await env.DB.prepare(stmt.sql).bind(...stmt.params).run();
    filas++;
  }
  return { ok: true, mes, filas, eventData };
}
```

- [ ] **Step 2: Enrutar en `worker.js`** — añadir junto a `/api/suscribir`:

```js
import { onRequest as sociosRequest, runSnapshot } from "./functions/api/socios.ts";
// …dentro de fetch(), tras el bloque de /api/suscribir:
    // Registro de socios y dinero (panel interno). Todos los métodos con clave;
    // sin la base D1 creada responde 503 (docs/PANEL-SOCIOS-DINERO.md).
    if (pathname === "/api/socios") {
      return sociosRequest({ request, env });
    }
// …y como export adicional del objeto default:
  // Foto mensual del valor entregado a cada socio (cron del día 2, wrangler.jsonc).
  // Sin base o sin secretos de Umami no hace nada (el sistema nace apagado).
  async scheduled(_event, env) {
    const mes = new Date(new Date().setUTCDate(0)).toISOString().slice(0, 7);
    const r = await runSnapshot(env, mes).catch((e) => ({ ok: false, motivo: String(e) }));
    console.log("socios: foto mensual", JSON.stringify(r));
  },
```

- [ ] **Step 3: `wrangler.jsonc`** — añadir al objeto raíz:

```jsonc
  // Foto mensual del panel de socios: día 2 a las 04:23 UTC (mes anterior completo).
  // Sin la base D1 el handler no hace nada, así que es seguro desde el día 0.
  "triggers": { "crons": ["23 4 2 * *"] },
  // DESCOMENTAR AL ENCENDER (runbook docs/PANEL-SOCIOS-DINERO.md):
  // pegar el database_id que devuelva `npx wrangler d1 create calma-db`.
  // "d1_databases": [
  //   { "binding": "DB", "database_name": "calma-db", "database_id": "PEGAR-ID-AQUI" }
  // ],
```

- [ ] **Step 4: Verificación local** — `npx astro check` (0 errores) y arrancar `npx wrangler dev` un instante para confirmar que el Worker compila con la ruta nueva y responde 401 sin clave y 503 con clave sin D1: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8787/api/socios` → 401; con `-H "x-admin-key: test"` y `SOCIOS_ADMIN_KEY=test` en `.dev.vars` → 503. (Si `wrangler dev` no está disponible en el equipo, dejar constancia y cubrirlo en la revisión del despliegue.)
- [ ] **Step 5: Commit** — `git commit -m "KAN-NN feat(socios): API /api/socios (una función) + foto mensual programada en el Worker"`.

### Task 5: Panel — `/panel/` (índice) y `/panel/socios`

**Files:**
- Create: `src/pages/panel/index.astro`
- Create: `src/pages/panel/socios.astro`

**Interfaces (Consumes):** GET/POST de `/api/socios` (Task 4); `resumenDinero`, `curvaMensual`, `avisos`, `filasSocios`, `tratoVigente` (Task 3); `formatEuros`, `parseEuros`, `mesLabel`, `mesAnterior` (Task 1); `LABELS`, `ESTADOS_SOCIO`, `MODELOS_TRATO`, `ETIQUETADOS` (Task 1).

- [ ] **Step 1: `index.astro`** — página estática sin secretos (funciona en los dos despliegues), `noindex`, mismo lenguaje visual que analítica/reservas. Contenido: cabecera «Calma Society · Panel», 4 tarjetas enlazadas (`/keystatic` «Editor de artículos» · `/panel/analitica` «Analítica» · `/panel/socios` «Socios y dinero» · `/panel/reservas` «Reservas de transfers», esta con nota «apagado hasta la API de Menorca Bus») y una fila de enlaces externos (Umami `https://cloud.umami.is` · MailerLite `https://dashboard.mailerlite.com` · Search Console `https://search.google.com/search-console`). Cada tarjeta: título `font-display`, una línea de descripción, borde `border-niebla`, hover terracota.
- [ ] **Step 2: `socios.astro`** — estructura calcada de `reservas.astro` (`prerender = !process.env.VERCEL`, Basic auth, aviso estático fuera de Vercel, «falta configurar» si no hay `SOCIOS_ADMIN_KEY`). Frontmatter:
  - POST: leer `formData`; según `accion` (`snapshot` | `crear` | `actualizar`) montar el JSON y reenviar a `${SITE.url}/api/socios` con `x-admin-key`; mapear campos de formulario → `datos` por tabla (cobros: `fecha, concepto, importe→parseEuros→importe_cents, facturado, factura_ref, cobrado, fecha_cobro, notas, socio_id, trato_id`; tratos: `socio_id, modelo, trato, precio→precio_anual_cents, inicio, fin, renovable, etiquetado, notas, estado`; socios: `estado, proxima_accion, notas, dijo, fecha_seguimiento`); redirigir 303 a la misma URL con `?ok=1` o `?error=<detalle>`; si la API devuelve 503 → `?error=base-apagada`.
  - GET: `fetch` GET a la API; si 503 → tarjeta grande «Falta encender la base de datos» con los 6 pasos del runbook resumidos y enlace al archivo; si OK → componer con Task 3 y pintar las 5 secciones de la spec §3 (tarjetas Dinero · curva 12 meses con barras CSS `style={width:%}` sobre el máximo · avisos · tabla socios con filtro `?estado=` · botón «Hacer la foto del mes» con el mes anterior y la fecha de la última foto = max `calculado_en`).
  - Vista detalle `?socio=<id>`: ficha + formulario de estado (select con `ESTADOS_SOCIO` vía `LABELS`) + tratos del socio (tabla histórico; botones activar/terminar/rechazar = POST `actualizar` tratos con `estado`) + formulario «Nuevo trato» + cobros del socio + formulario «Registrar cobro» (leyenda: «Este formulario es el único origen de verdad del dinero») + tabla de medición mensual del socio + nota del argumento de venta («el socio lo ve en su analítica: calmasociety / referral»).
  - Estética: tokens Calma, tablas como reservas, importes con `formatEuros`, sin emojis, encabezado con migas «Panel → Socios y dinero» y enlace al índice.
- [ ] **Step 3: Verificación** — `npx astro check` limpio (leer TODA la salida, `grep -E "Result|error"`), `npm run build` completa y `dist/panel/socios/index.html` contiene el aviso estático (no secretos). Arrancar `npm run dev` y abrir `/panel/` y `/panel/socios` para revisar el render de los avisos.
- [ ] **Step 4: Commit** — `git commit -m "KAN-NN feat(socios): panel /panel/socios (dinero, curva, tratos, cobros) e índice /panel"`.

### Task 6: Seed desde el Excel + blindaje del repo público

**Files:**
- Create: `scripts/socios/export-excel.mjs`
- Create: `COLABORACIONES/panel-seed/seed.sql` + `socios-seed.json` (generados, NO committeados)
- Create: `COLABORACIONES/LEEME-el-registro-vivo-es-el-panel.txt`
- Modify: `.gitignore`

**Interfaces (Consumes):** columnas del Excel (fila 2 = cabeceras: Empresa·Tipo·Zona·Web·Contacto·Email·Teléfono·Relación·Tanda·Estado·¿Dijo?·Fecha 1er email·Fecha seguimiento·Próxima acción·Modelo·Trato acordado·Condiciones aceptadas·Contraprestación·Precio·Inicio·Fin/duración·¿Renovable?·¿Etiquetado?·Visitas/mes·Clics enviados/mes·Datos ✓·Fotos ✓·Enlace ✓·URL de la ficha·Notas). Esquema de Task 2.

- [ ] **Step 1: `.gitignore`** — añadir bloque (el repo es PÚBLICO; copia de seguridad = KAN-53, no git):

```gitignore
# Negocio y estrategia (contactos de empresas, tratos, dinero): NUNCA a un repo
# público. Su copia de seguridad es el script de respaldo (KAN-53), no git.
COLABORACIONES/
NEGOCIO/
ESTRATEGIA/
_PANEL/
```

- [ ] **Step 2: script** — `scripts/socios/export-excel.mjs`: cabecera explicando que es one-off local y que `exceljs` se instala con `npm i --no-save exceljs` (no entra en `package.json`). Lógica: leer hoja «Registro» desde la fila 3; `slugify(nombre)` (minúsculas, sin acentos/ñ→n, espacios→`-`); mapear columnas → fila `socios` (booleans `Sí/No`→1/0; `slug_ficha` = regex `/\/(?:lugar)\/(.+?)-es\/?$/` sobre col 29; tipo del Excel respetado y `comercio` se queda como está); corregir notas desfasadas: si la nota empieza por «FICHA EN DRAFT» y la tanda es T0, sustituir por «Ficha publicada desde 14-ago-2026 (KAN-117). » + resto; para cada socio con `estado != descartado` generar un trato `{modelo: col15 || "trueque", estado: "activo", precio_anual_cents: 0, etiquetado: "editorial", trato: col16, contraprestacion: col18, inicio: "2026-08-14"}` (la fecha en que las fichas quedaron publicadas); escapar `'`→`''` y emitir `seed.sql` (`INSERT OR REPLACE INTO socios …` + `INSERT INTO tratos …` con `creado_en`/`actualizado_en` = fecha de ejecución) y `socios-seed.json`. Salida por consola: nº socios, nº tratos, socios sin `slug_ficha`.
- [ ] **Step 3: Ejecutar** — `npm i --no-save exceljs && node scripts/socios/export-excel.mjs` → verificar: 22 socios, 21 tratos (Purobeach descartado sin trato), y revisar 3 filas del `seed.sql` a ojo (nombres con apóstrofes tipo «S'Amarador» bien escapados si los hay).
- [ ] **Step 4: LEEME** — `COLABORACIONES/LEEME-el-registro-vivo-es-el-panel.txt`: el Excel queda CONGELADO como histórico desde 18-ago-2026; el registro vivo es el panel (`…vercel.app/panel/socios`); cómo se dicta un cambio (en el chat, como siempre); dónde está el seed y el runbook.
- [ ] **Step 5: Verificar blindaje** — `git status --short` NO muestra ya `COLABORACIONES/` ni `NEGOCIO/` ni `ESTRATEGIA/` ni `_PANEL/`; `git check-ignore COLABORACIONES/panel-seed/seed.sql` responde la ruta.
- [ ] **Step 6: Commit** — `git add .gitignore scripts/socios && git commit -m "KAN-NN feat(socios): seed de los 22 socios desde el Excel + blindaje de carpetas de negocio en repo público"`.

### Task 7: Runbook de encendido + documentación

**Files:**
- Create: `docs/PANEL-SOCIOS-DINERO.md`
- Modify: `docs/RESERVAS-TRANSFERS.md` (§4, nota de la base única `calma-db`)

- [ ] **Step 1: runbook** — `docs/PANEL-SOCIOS-DINERO.md` con la estructura del de reservas: §1 Qué es (las 4 tablas y la regla de oro cobros/medición) · §2 Mapa de piezas (tabla archivo→qué hace, incluidos worker.js y el cron) · §3 Interruptor (la existencia del binding D1 ES el interruptor; sin base todo responde 503 y el panel avisa) · §4 Encendido en 6 pasos (login wrangler → `npx wrangler d1 create calma-db` → descomentar y pegar id en `wrangler.jsonc` + push → secretos Cloudflare `SOCIOS_ADMIN_KEY`/`UMAMI_API_KEY`/`UMAMI_WEBSITE_ID` → variable `SOCIOS_ADMIN_KEY` en Vercel → `npx wrangler d1 execute calma-db --remote --file=db/socios-schema.sql` y `--file=COLABORACIONES/panel-seed/seed.sql` → abrir el panel y pulsar «Hacer la foto del mes») · §5 Operativa mensual (foto sola el día 2; registrar cobros al recibirlos; renovaciones a la vista) · §6 Seguridad y privacidad (datos de empresas, API cerrada, carpetas gitignoradas) · §7 Qué NO hace la v1.
- [ ] **Step 2: nota en reservas** — en `docs/RESERVAS-TRANSFERS.md` §4 paso 1, añadir: «**Nota 2026-08-18:** la base es ahora ÚNICA para toda la casa: `calma-db` (binding `DB`), compartida con el registro de socios (`docs/PANEL-SOCIOS-DINERO.md`). Si ya existe por haber encendido el panel de socios, salta la creación y añade solo la tabla: `npx wrangler d1 execute calma-db --remote --file=db/reservas-schema.sql`.» (sustituyendo la referencia a `calma-reservas`).
- [ ] **Step 3: Commit** — `git commit -m "KAN-NN docs(socios): runbook de encendido del panel de socios y base D1 única calma-db"`.

### Task 8: Verificación final y cierre

- [ ] **Step 1:** `npm test` completo → todos en verde (incluye los 3 archivos nuevos).
- [ ] **Step 2:** `npx astro check` → leer la salida ENTERA (`grep -E "Result|error"`) → 0 errores 0 warnings nuevos.
- [ ] **Step 3:** `npm run build` → completa; nº de páginas coherente (+2 por `/panel/` y `/panel/socios`).
- [ ] **Step 4:** `node scripts/qa-lugares.mjs` → sin regresiones (lo corre también el CI).
- [ ] **Step 5:** Push a `main`; vigilar que el CI pase (KAN-52).
- [ ] **Step 6:** Jira: mover la ficha a **En revisión** (el encendido es del dueño); bitácora del vault el mismo día; actualizar memoria (`panel-socios-y-dinero.md`).

## Self-Review

- **Cobertura de la spec:** §1 tablas → Task 2 · §2 API/una función/cron/rescate KAN-78 → Task 4 · §3 pantallas + índice → Task 5 · §4 seed/congelación Excel/gitignore/runbook → Tasks 6-7 · §5 límites v1 → recogidos en Global Constraints · §6 criterios → Task 8. Sin huecos.
- **Placeholders:** el único texto variable es `KAN-NN` (clave real creada en Task 0, estado externo) y el `database_id` del encendido (lo genera Cloudflare; a propósito comentado).
- **Consistencia de tipos:** `insertInto/updateById` devuelven `{sql, params}|null` en Task 2 y así se consumen en Task 4; `runSnapshot` exportado en Task 4 e importado en worker.js con la misma firma; `resumen.ts` consume filas con los nombres de columna exactos del esquema (verificado campo a campo).
