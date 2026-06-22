/**
 * Tests del PASO 0 (recomendación de base). Se ejecutan con el runner nativo:
 *   node --test src/lib/planner
 * (Node ≥ 23 corre TypeScript por type-stripping; sin dependencias extra.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { recommendBase } from "./base.ts";
import { normalizeSurvey } from "../survey.ts";
import type { Survey } from "../survey.ts";

const s = (over: Partial<Survey>): Survey => normalizeSurvey(over);

test("sin coche + vida nocturna → Ciutadella (hub oeste)", () => {
  const r = recommendBase(s({ transport: "sin-coche", base: "recomiendame", interests: ["vida-nocturna"] }));
  assert.equal(r.base, "ciutadella");
  assert.equal(r.splitBase, undefined); // sin coche no se cambia de base
});

test("sin coche + cultura/gastronomía → Maó (bus a todo + aeropuerto)", () => {
  const r = recommendBase(s({ transport: "sin-coche", base: "recomiendame", interests: ["cultura", "gastronomia"] }));
  assert.equal(r.base, "mao");
});

test("coche + familia + calas (presupuesto medio) → Cala Galdana", () => {
  const r = recommendBase(s({ transport: "coche-alquiler", base: "recomiendame", interests: ["calas"], kids: { has: true, ages: ["4-8"] }, budget: "medio" }));
  assert.equal(r.base, "cala-galdana");
});

test("coche + familia + calas + presupuesto ajustado → Son Bou", () => {
  const r = recommendBase(s({ transport: "coche-alquiler", base: "recomiendame", interests: ["calas"], kids: { has: true }, budget: "ajustado" }));
  assert.equal(r.base, "son-bou");
});

test("coche + náutica → Fornells (bahía protegida)", () => {
  const r = recommendBase(s({ transport: "coche-alquiler", base: "recomiendame", interests: ["nautica"] }));
  assert.equal(r.base, "fornells");
});

test("ferry con coche por Ciutadella → base Ciutadella", () => {
  const r = recommendBase(s({ transport: "coche-propio-ferry", ferryPort: "ciutadella", base: "recomiendame" }));
  assert.equal(r.base, "ciutadella");
});

test("base elegida explícitamente se respeta", () => {
  const r = recommendBase(s({ base: "son-bou", transport: "coche-alquiler" }));
  assert.equal(r.base, "son-bou");
});

test("8 días, coche, intereses amplios → base central + split sugerido", () => {
  const r = recommendBase(s({ days: 8, transport: "coche-alquiler", base: "recomiendame", interests: ["calas", "cultura", "naturaleza"] }));
  assert.equal(r.base, "es-mercadal");
  assert.ok(r.splitBase, "con 8 días e intereses amplios debe sugerir 2ª base");
});

test("3 días nunca propone split", () => {
  const r = recommendBase(s({ days: 3, transport: "coche-alquiler", base: "recomiendame", interests: ["calas", "cultura", "naturaleza"] }));
  assert.equal(r.splitBase, undefined);
});

test("determinismo: mismo input → mismo output", () => {
  const input: Partial<Survey> = { days: 5, transport: "coche-alquiler", base: "recomiendame", interests: ["calas", "gastronomia"] };
  assert.deepEqual(recommendBase(s(input)), recommendBase(s(input)));
});
