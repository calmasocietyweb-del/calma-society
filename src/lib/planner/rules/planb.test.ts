/** Tests del PASO 6 — plan-B de mal tiempo. node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlanB, weekdayForDay } from "./planb.ts";
import { planTrip } from "../engine.ts";
import { place, DATASET } from "./test-fixtures.ts";

test("weekdayForDay: 2026-06-22 es lunes; el día siguiente, martes", () => {
  assert.equal(weekdayForDay("2026-06-22", 0), "lun");
  assert.equal(weekdayForDay("2026-06-22", 1), "mar");
  assert.equal(weekdayForDay(undefined, 0), undefined);
});

const mercat = place({ id: "mercat", zone: "este", cluster: "mao", plannerType: "comida", isIndoor: true, weatherProof: "cubierto", openDays: ["mar", "mie", "jue", "vie", "sab"] });
const museu = place({ id: "museu", zone: "este", cluster: "mao", plannerType: "interior-cultural", isIndoor: true, weatherProof: "cubierto", openDays: ["mar", "mie", "jue", "vie", "sab", "dom"] });
const calaEste = place({ id: "cala", zone: "este", cluster: "mao", plannerType: "cala" }); // exterior, no entra
const DS = [mercat, museu, calaEste];

test("plan-B toma interiores de la zona (no exteriores) + comida ancla", () => {
  const pb = buildPlanB("este", DS, "mar");
  const ids = pb.blocks.filter((b) => b.placeId).map((b) => b.placeId);
  assert.ok(ids.includes("mercat") && ids.includes("museu"));
  assert.ok(!ids.includes("cala"));
  assert.equal(pb.blocks[0].slot, "comida"); // ancla central
});

test("filtro de LUNES: si todo cierra, avisa y propone alternativa", () => {
  const pb = buildPlanB("este", DS, "lun");
  assert.equal(pb.blocks.filter((b) => b.placeId).length, 0); // mercat y museu cierran lunes
  assert.ok(pb.notices.find((n) => n.text.includes("lunes")));
  assert.ok(pb.notices.find((n) => n.text.includes("Pocos interiores")));
});

test("siempre incluye la nota de calor extremo", () => {
  const pb = buildPlanB("sur-centro", DS);
  assert.ok(pb.notices.find((n) => n.text.includes("calor extremo")));
});

test("integración: los días plenos llevan plan-B", () => {
  const plan = planTrip({ days: 5, arrivalDate: "2026-06-22", transport: "coche-alquiler", base: "ciutadella", interests: ["calas", "naturaleza"] }, DATASET);
  const full = plan.days.filter((d) => d.cluster);
  assert.ok(full.length > 0 && full.every((d) => d.planB), "cada día pleno debe tener plan-B");
  assert.ok(full[0].planB.notices.find((n) => n.text.includes("calor extremo")));
});
