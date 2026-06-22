/** Tests del PASO 3 — secuencia intradía y no-saturar. node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { sequenceDay } from "./intraday.ts";
import type { DayInput } from "./intraday.ts";
import { normalizeSurvey } from "../survey.ts";
import { place } from "./test-fixtures.ts";

// Cluster con 3 candidatos: cala (mañana), mirador (atardecer), pueblo (tarde).
const CLUSTER = [
  place({ id: "cala-x", zone: "sur-oeste", cluster: "c", plannerType: "cala", idealFor: ["naturaleza"], durationMin: 150, carAccess: "coche-mas-caminata" }),
  place({ id: "mirador-x", zone: "sur-oeste", cluster: "c", plannerType: "mirador", idealFor: ["parejas"], durationMin: 60 }),
  place({ id: "pueblo-x", zone: "sur-oeste", cluster: "c", plannerType: "pueblo", idealFor: ["cultura"], durationMin: 90 }),
];

const input = (over: Partial<DayInput>): DayInput => ({
  base: "ciutadella",
  cluster: "c",
  zone: "sur-oeste",
  places: CLUSTER,
  travelFromBaseMin: 15,
  pace: "equilibrado",
  survey: normalizeSurvey({ interests: ["calas", "naturaleza"], boatSunset: true }),
  ...over,
});

const anchors = (r: { blocks: { placeId?: string }[] }) => r.blocks.filter((b) => b.placeId);

test("la mañana (ancla principal) siempre está", () => {
  const r = sequenceDay(input({ pace: "relajado" }));
  assert.ok(r.blocks.find((b) => b.slot === "manana" && b.placeId === "cala-x"));
});

test("relajado no supera el máximo de paradas y avisa de lo que deja fuera", () => {
  const r = sequenceDay(input({ pace: "relajado" }));
  assert.ok(anchors(r).length <= 2);
  assert.ok(r.notices.find((n) => n.kind === "logistica"), "debe avisar del ritmo");
});

test("intenso encadena al menos tantas paradas como relajado", () => {
  const rel = anchors(sequenceDay(input({ pace: "relajado" }))).length;
  const ten = anchors(sequenceDay(input({ pace: "intenso" }))).length;
  assert.ok(ten >= rel);
});

test("siempre hay desayuno, comida y cena", () => {
  const r = sequenceDay(input({}));
  for (const slot of ["desayuno", "comida", "cena"]) {
    assert.ok(r.blocks.find((b) => b.slot === slot), `falta ${slot}`);
  }
});

test("cala con cierre estival → aviso de parking/lanzadera (no de madrugar)", () => {
  const macarella = place({ id: "macarella", zone: "sur-oeste", cluster: "c", plannerType: "cala", durationMin: 120, carAccessClosedSummer: true, shuttleInfo: "Bus lanzadera desde Ciutadella." });
  const r = sequenceDay(input({ places: [macarella], pace: "relajado" }));
  assert.ok(r.notices.find((n) => n.kind === "parking"));
  assert.ok(!r.notices.find((n) => n.kind === "madrugar"));
});

test("lugar de esfuerzo D → avisos de esfuerzo y de agua/sombra", () => {
  const pregonda = place({ id: "pregonda", zone: "norte", cluster: "c", plannerType: "cala", durationMin: 120, effortLevel: "D", effortNote: "30 min a pie por el Camí de Cavalls" });
  const r = sequenceDay(input({ places: [pregonda], pace: "equilibrado", zone: "norte" }));
  assert.ok(r.notices.find((n) => n.kind === "esfuerzo"));
  assert.ok(r.notices.find((n) => n.kind === "agua-sombra"));
});

test("needsReservation → aviso de reserva", () => {
  const xoroi = place({ id: "xoroi", zone: "sur-centro", cluster: "c", plannerType: "atardecer", durationMin: 90, needsReservation: true, officialUrl: "https://example.com" });
  const r = sequenceDay(input({ places: [xoroi] }));
  assert.ok(r.notices.find((n) => n.kind === "reserva"));
  assert.ok(r.notices.find((n) => n.kind === "confirma-horario"));
});

test("determinismo", () => {
  assert.deepEqual(sequenceDay(input({})), sequenceDay(input({})));
});
