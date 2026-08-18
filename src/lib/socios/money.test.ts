// Tests de dinero y meses del registro de socios (KAN-122).
// Regla del proyecto: los importes viajan SIEMPRE en céntimos (enteros).
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
