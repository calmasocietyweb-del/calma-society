import { test } from "node:test";
import assert from "node:assert/strict";
import { VEHICLE_CATEGORIES, categoryById, EXTRAS, EXTRA_IDS } from "./catalog.ts";

test("hay 5 categorías con la fórmula de menorcabus.com", () => {
  assert.deepEqual(
    VEHICLE_CATEGORIES.map((c) => c.id),
    ["privado-3", "shuttle", "vip-2", "vip-2-superior", "vip-6"],
  );
});

test("cada categoría tiene capacidad y textos ES/EN completos", () => {
  for (const c of VEHICLE_CATEGORIES) {
    assert.ok(c.maxPax >= 2, c.id);
    assert.ok(c.name.es.length > 0 && c.name.en.length > 0, c.id);
    assert.ok(c.points.es.length >= 2 && c.points.en.length === c.points.es.length, c.id);
  }
});

test("categoryById devuelve la categoría o undefined", () => {
  assert.equal(categoryById("shuttle")?.maxPax, 50);
  assert.equal(categoryById("no-existe"), undefined);
});

test("hay 4 extras (fórmula de menorcabus.com) y EXTRA_IDS los lista", () => {
  assert.deepEqual(
    EXTRAS.map((e) => e.id),
    ["silla-nino", "maxicosi", "booster", "maleta-extra"],
  );
  assert.deepEqual(EXTRA_IDS, EXTRAS.map((e) => e.id));
});
