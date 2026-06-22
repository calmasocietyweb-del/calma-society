/** Tests del PASO 5 — accesibilidad. node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedEfforts, isAccessible, filterAccessible, effectivePace } from "./accessibility.ts";
import { planTrip } from "../engine.ts";
import { normalizeSurvey } from "../survey.ts";
import { place, DATASET } from "./test-fixtures.ts";

test("niveles permitidos por necesidad", () => {
  assert.deepEqual(allowedEfforts("movilidad-reducida"), ["A1", "A2"]);
  assert.deepEqual(allowedEfforts("carrito"), ["A1", "A2", "B"]);
  assert.deepEqual(allowedEfforts("mayores"), ["A1", "A2", "B"]);
  assert.equal(allowedEfforts("ninguna").length, 5);
});

test("movilidad reducida: excluye C/D y playas no-A1, mantiene playa A1 y pueblo A2", () => {
  const calaC = place({ id: "c", zone: "sur-oeste", cluster: "x", plannerType: "cala", effortLevel: "C" });
  const playaA2 = place({ id: "a2", zone: "sur-este", cluster: "y", plannerType: "playa", effortLevel: "A2" });
  const playaA1 = place({ id: "a1", zone: "sur-centro", cluster: "z", plannerType: "playa", effortLevel: "A1" });
  const puebloA2 = place({ id: "p", zone: "este", cluster: "w", plannerType: "pueblo", effortLevel: "A2" });
  assert.equal(isAccessible(calaC, "movilidad-reducida"), false);
  assert.equal(isAccessible(playaA2, "movilidad-reducida"), false); // baño solo A1
  assert.equal(isAccessible(playaA1, "movilidad-reducida"), true);
  assert.equal(isAccessible(puebloA2, "movilidad-reducida"), true);
});

test("carrito permite B (con aviso), excluye C/D", () => {
  const b = place({ id: "b", zone: "sur-centro", cluster: "x", plannerType: "cala", effortLevel: "B" });
  const d = place({ id: "d", zone: "norte", cluster: "y", plannerType: "cala", effortLevel: "D" });
  assert.equal(isAccessible(b, "carrito"), true);
  assert.equal(isAccessible(d, "carrito"), false);
});

test("filterAccessible reduce el dataset; ninguna no filtra", () => {
  assert.equal(filterAccessible(DATASET, "ninguna").length, DATASET.length);
  const reduced = filterAccessible(DATASET, "movilidad-reducida");
  assert.ok(reduced.length < DATASET.length);
  assert.ok(reduced.every((p) => p.effortLevel === "A1" || p.effortLevel === "A2"));
});

test("'mayores' baja un escalón el ritmo", () => {
  assert.equal(effectivePace(normalizeSurvey({ accessibility: "mayores", pace: "intenso" })), "equilibrado");
  assert.equal(effectivePace(normalizeSurvey({ accessibility: "mayores", pace: "equilibrado" })), "relajado");
  assert.equal(effectivePace(normalizeSurvey({ accessibility: "ninguna", pace: "intenso" })), "intenso");
});

test("integración: plan con movilidad reducida no incluye lugares C/D", () => {
  const plan = planTrip({ days: 5, transport: "coche-alquiler", base: "recomiendame", accessibility: "movilidad-reducida", interests: ["calas"] }, DATASET);
  const byId = new Map(DATASET.map((p) => [p.id, p]));
  for (const d of plan.days) {
    for (const b of d.blocks) {
      if (!b.placeId) continue;
      const p = byId.get(b.placeId);
      assert.ok(p && (p.effortLevel === "A1" || p.effortLevel === "A2"), `${b.placeId} no debería estar (esfuerzo ${p?.effortLevel})`);
      if (p.plannerType === "cala" || p.plannerType === "playa") assert.equal(p.effortLevel, "A1");
    }
  }
  assert.ok(plan.globalNotices.find((n) => n.kind === "accesibilidad"));
});
