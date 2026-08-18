// Tests del esquema y sentencias D1 del registro de socios (KAN-122).
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
  const r = upsertMedicion(
    { socio_id: "torralbenc", mes: "2026-07", visitas_ficha: 12, clics_web: 4, fuente: "umami-auto" },
    NOW,
  );
  assert.match(r.sql, /ON CONFLICT\(socio_id, mes\) DO UPDATE/);
  assert.deepEqual(r.params, ["torralbenc", "2026-07", 12, 4, "umami-auto", NOW]);
});

test("LIST_SQL ordena estable", () => {
  assert.match(LIST_SQL.socios, /ORDER BY/);
  assert.match(LIST_SQL.mediciones, /ORDER BY mes/);
});
