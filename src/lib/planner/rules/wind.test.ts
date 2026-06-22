/** Tests del PASO 4 — regla del viento (FLEXIBLE). node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { coastOf, windAdvice } from "./wind.ts";
import { planTrip } from "../engine.ts";
import { normalizeSurvey } from "../survey.ts";
import { place, DATASET } from "./test-fixtures.ts";

const s = normalizeSurvey({ interests: ["calas", "naturaleza"] });

test("coastOf clasifica por costa", () => {
  assert.equal(coastOf("norte"), "norte");
  assert.equal(coastOf("sur-oeste"), "sur");
  assert.equal(coastOf("sur-este"), "sur");
  assert.equal(coastOf("este"), "mixto");
  assert.equal(coastOf("eje-me1"), "mixto");
});

test("día de playa en el norte → aviso de Tramontana + alternativa en el sur", () => {
  const norte = place({ id: "n", zone: "norte", cluster: "c", plannerType: "cala" });
  const out = windAdvice("norte", [norte], DATASET, s);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "viento");
  assert.match(out[0].text, /Tramontana/);
  assert.match(out[0].text, /sur/);
});

test("día de playa en el sur → aviso de Migjorn + alternativa en el norte", () => {
  const sur = place({ id: "s", zone: "sur-oeste", cluster: "c", plannerType: "cala" });
  const out = windAdvice("sur-oeste", [sur], DATASET, s);
  assert.equal(out.length, 1);
  assert.match(out[0].text, /Migjorn/);
});

test("día sin parada de costa (cultura) → sin aviso de viento", () => {
  const naveta = place({ id: "y", zone: "eje-me1", cluster: "c", plannerType: "yacimiento" });
  assert.equal(windAdvice("eje-me1", [naveta], DATASET, s).length, 0);
});

test("integración: un plan con días de playa lleva avisos de viento", () => {
  const plan = planTrip({ days: 7, transport: "coche-alquiler", base: "ciutadella", interests: ["calas", "naturaleza"] }, DATASET);
  const hasWind = plan.days.some((d) => d.notices.some((n) => n.kind === "viento"));
  assert.ok(hasWind, "debe haber al menos un aviso de viento en días de playa");
});
