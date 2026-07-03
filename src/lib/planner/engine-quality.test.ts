/**
 * Tests de CALIDAD EDITORIAL del plan sobre el dataset REAL (invariantes).
 * Protegen la promesa del producto, no un detalle de implementación:
 *  - pides calas → hay calas (el bug que motivó el fix de afinidad);
 *  - con fechas → fecha por día, atardecer real y cierres respetados;
 *  - día de llegada legible (slot "llegada", no un desayuno a las 13:00);
 *  - EN sin fugas de español.
 * node --test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planTrip } from "./engine.ts";
import { sequenceDay } from "./rules/intraday.ts";
import { normalizeSurvey } from "./survey.ts";
import type { Survey } from "./survey.ts";
import type { PlannerPlace } from "./types.ts";
import { place } from "./rules/test-fixtures.ts";

const DATASET: PlannerPlace[] = JSON.parse(
  readFileSync(new URL("../../data/planner-data.es.json", import.meta.url), "utf8"),
);
const s = (over: Partial<Survey>): Survey => normalizeSurvey(over);

/** Anclas de mañana (bloques con lugar real) de los días plenos del plan. */
function morningAnchors(plan: ReturnType<typeof planTrip>): PlannerPlace[] {
  const byId = new Map(DATASET.map((p) => [p.id, p]));
  return plan.days
    .filter((d) => d.cluster)
    .map((d) => d.blocks.find((b) => b.slot === "manana"))
    .map((b) => (b?.placeId ? byId.get(b.placeId) : undefined))
    .filter((p): p is PlannerPlace => !!p);
}

test("INVARIANTE: pedir calas (5 días, julio) produce al menos una mañana de cala/playa", () => {
  const plan = planTrip(
    s({ days: 5, interests: ["calas", "gastronomia"], arrivalDate: "2026-07-20", departureDate: "2026-07-24" }),
    DATASET, "es",
  );
  const tipos = morningAnchors(plan).map((p) => p.plannerType);
  assert.ok(
    tipos.some((t) => t === "cala" || t === "playa"),
    `pides calas y no hay ni una: mañanas = ${tipos.join(", ")}`,
  );
});

test("INVARIANTE: pedir cultura produce al menos una mañana de yacimiento/interior", () => {
  const plan = planTrip(s({ days: 5, interests: ["cultura"] }), DATASET, "es");
  const tipos = morningAnchors(plan).map((p) => p.plannerType);
  assert.ok(
    tipos.some((t) => t === "yacimiento" || t === "interior-cultural"),
    `pides cultura y no aparece: mañanas = ${tipos.join(", ")}`,
  );
});

test("con fechas, cada día lleva su fecha ISO consecutiva", () => {
  const plan = planTrip(s({ days: 4, arrivalDate: "2026-07-20" }), DATASET, "es");
  assert.equal(plan.days[0].date, "2026-07-20");
  assert.equal(plan.days[3].date, "2026-07-23");
  const sinFechas = planTrip(s({ days: 4 }), DATASET, "es");
  assert.equal(sinFechas.days[0].date, undefined);
});

test("con fechas de julio, el atardecer usa la hora real del sol (~21:0x), no 19:30", () => {
  const plan = planTrip(
    s({ days: 5, interests: ["calas"], boatSunset: true, arrivalDate: "2026-07-20" }),
    DATASET, "es",
  );
  const atardeceres = plan.days
    .flatMap((d) => d.blocks)
    .filter((b) => b.slot === "atardecer" && b.timeHint);
  assert.ok(atardeceres.length > 0, "el plan debe tener algún bloque de atardecer");
  for (const b of atardeceres) {
    assert.ok(b.timeHint! >= "20:30", `atardecer de julio a las ${b.timeHint} (esperado tras 20:30)`);
  }
});

test("día de llegada: el primer bloque es 'llegada' (no un desayuno a las 13:00)", () => {
  const plan = planTrip(s({ days: 5 }), DATASET, "es");
  assert.equal(plan.days[0].dayTypeKey, "dia-llegada");
  assert.equal(plan.days[0].blocks[0].slot, "llegada");
});

test("openDays × día real: lo cerrado ese día no se ancla y se avisa", () => {
  // Domingo 2026-07-26 (día pleno índice 1 con llegada el 25). La quesería top
  // cierra en domingo → debe caer al segundo candidato y avisar del cierre.
  const ds = [
    place({ id: "queseria", zone: "centro", cluster: "c", plannerType: "interior-cultural", idealFor: ["gastronomia", "cultura"], openDays: ["lun", "mar", "mie", "jue", "vie", "sab"] }),
    place({ id: "yacimiento-abierto", zone: "centro", cluster: "c", plannerType: "yacimiento", idealFor: ["cultura"] }),
  ];
  const r = sequenceDay({
    base: "es-mercadal", cluster: "c", zone: "centro", places: ds,
    travelFromBaseMin: 12, pace: "equilibrado",
    survey: s({ interests: ["cultura", "gastronomia"] }), lang: "es", weekday: "dom",
  });
  const manana = r.blocks.find((b) => b.slot === "manana");
  assert.equal(manana?.placeId, "yacimiento-abierto");
  assert.ok(
    r.notices.some((n) => n.text.includes("queseria") && n.text.includes("domingo")),
    "debe avisar de que la quesería cierra ese día",
  );
});

test("EN: el aviso de ritmo va localizado (relaxed), sin fugar el enum español", () => {
  const dsEn: PlannerPlace[] = JSON.parse(
    readFileSync(new URL("../../data/planner-data.en.json", import.meta.url), "utf8"),
  );
  const plan = planTrip(s({ days: 6, pace: "relajado", interests: ["calas", "cultura", "naturaleza"] }), dsEn, "en");
  const textos = plan.days.flatMap((d) => d.notices).map((n) => n.text).join(" ¶ ");
  assert.ok(!textos.includes("relajado"), `fuga de español en EN: ${textos.slice(0, 200)}`);
});

test("determinismo: mismo input (con fechas) → mismo plan", () => {
  const input = s({ days: 5, interests: ["calas"], arrivalDate: "2026-07-20" });
  assert.deepEqual(planTrip(input, DATASET, "es"), planTrip(input, DATASET, "es"));
});

test("querystring hostil: intereses/enums desconocidos no revientan el motor (AHORA-1)", () => {
  const hostil = {
    days: 5,
    interests: ["<script>", "calas", "no-existe"] as any,
    transport: "teletransporte" as any,
    pace: "yolo" as any,
    budget: "infinito" as any,
    accessibility: "x" as any,
    base: "atlantis" as any,
    ferryPort: "gibraltar" as any,
  };
  const plan = planTrip(hostil as any, DATASET, "es");
  assert.ok(plan.days.length === 5, "debe generar un plan de 5 días con la encuesta saneada");
});
