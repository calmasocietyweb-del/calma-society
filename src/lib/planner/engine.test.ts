/** Tests de integración del motor completo (planTrip). node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { planTrip } from "./engine.ts";
import type { Survey } from "./engine.ts";
import { DATASET, place } from "./rules/test-fixtures.ts";

test("5 días con coche desde Ciutadella → plan completo y coherente", () => {
  const plan = planTrip({ days: 5, transport: "coche-alquiler", base: "ciutadella", interests: ["calas", "naturaleza"] }, DATASET);
  assert.equal(plan.days.length, 5);
  assert.equal(plan.days[0].dayTypeKey, "dia-llegada");
  assert.equal(plan.days[4].dayTypeKey, "dia-salida");
  assert.ok(plan.baseReason.length > 0);
  assert.ok(plan.globalNotices.find((n) => n.kind === "reserva"), "debe avisar de reservar coche");
  for (let i = 1; i <= 3; i++) assert.ok(plan.days[i].blocks.length > 0, `el día ${i} debe tener bloques`);
});

test("sin coche → base Maó/Ciutadella + enganche de transfer aeropuerto", () => {
  const plan = planTrip({ days: 4, transport: "sin-coche", base: "recomiendame", interests: ["cultura"] }, DATASET);
  assert.ok(["mao", "ciutadella"].includes(plan.base));
  assert.ok(plan.menorcaBusHooks.find((h) => h.type === "transfer-aeropuerto"));
  assert.ok(plan.globalNotices.find((n) => n.text.includes("Sin coche")));
});

test("no se repite zona en días plenos consecutivos", () => {
  const plan = planTrip({ days: 7, transport: "coche-alquiler", base: "ciutadella", interests: ["calas", "cultura", "naturaleza"] }, DATASET);
  const full = plan.days.filter((d) => d.cluster);
  for (let i = 1; i < full.length; i++) assert.notEqual(full[i].zone, full[i - 1].zone);
});

test("llegada de noche → solo logística (sin parada de tarde)", () => {
  const plan = planTrip({ days: 3, transport: "coche-alquiler", base: "ciutadella", arrivalFlightTime: "21:00" }, DATASET);
  assert.equal(plan.days[0].dayTypeKey, "dia-llegada");
  assert.ok(!plan.days[0].blocks.find((b) => b.slot === "tarde"));
});

test("salida desde Ciutadella con vuelo de mañana → aviso de cruce de isla", () => {
  const plan = planTrip({ days: 4, transport: "coche-alquiler", base: "ciutadella", departureFlightTime: "09:00" }, DATASET);
  const salida = plan.days[plan.days.length - 1];
  assert.ok(salida.notices.find((n) => n.text.includes("cruce de isla")));
});

test("viaje de 2 días: aunque un día caiga en colchón, conserva logística de llegada/salida y transfer", () => {
  // El único lugar (esfuerzo D) se filtra por movilidad reducida → días colchón,
  // pero los avisos de llegada/salida y los enganches de transfer deben seguir.
  const onlyHard = [place({ id: "hard", zone: "norte", cluster: "x", plannerType: "cala", effortLevel: "D" })];
  const plan = planTrip({ days: 2, transport: "sin-coche", base: "mao", accessibility: "movilidad-reducida", interests: ["calas"] }, onlyHard);
  assert.ok(plan.days[0].notices.some((n) => n.text.includes("Hora útil")), "falta el aviso de llegada");
  assert.ok(plan.days[plan.days.length - 1].notices.some((n) => n.text.toLowerCase().includes("aeropuerto")), "falta el aviso de salida");
  assert.ok(plan.menorcaBusHooks.some((h) => h.type === "transfer-aeropuerto"), "falta el enganche de transfer");
});

test("determinismo: mismo input → mismo plan", () => {
  const input: Partial<Survey> = { days: 5, transport: "coche-alquiler", base: "ciutadella", interests: ["calas", "naturaleza"] };
  assert.deepEqual(planTrip({ ...input }, DATASET), planTrip({ ...input }, DATASET));
});
