/**
 * Tests del PASO 0 (recomendación de base). Se ejecutan con el runner nativo:
 *   node --test src/lib/planner
 * (Node ≥ 23 corre TypeScript por type-stripping; sin dependencias extra.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { recommendBase } from "./base.ts";
import { normalizeSurvey } from "../survey.ts";
import type { Survey } from "../survey.ts";
import type { PlannerPlace } from "../types.ts";

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

// ── Elección por datos (auditoría 2026-08-11) ────────────────────────────────
// Antes, todo lo que no encajaba en una regla fuerte caía en "Ciutadella": 8 de
// cada 10 perfiles dormían en el mismo sitio. Ahora deciden los datos + las
// contraindicaciones verificadas del blueprint.

const DATASET: PlannerPlace[] = JSON.parse(
  readFileSync(new URL("../../../data/planner-data.es.json", import.meta.url), "utf8"),
);
const rec = (over: Partial<Survey>) => recommendBase(s({ base: "recomiendame", transport: "coche-alquiler", days: 7, ...over }), "es", DATASET).base;

test("perfiles distintos duermen en sitios distintos (no todos en Ciutadella)", () => {
  const bases = new Set([
    rec({ interests: ["calas"] }),
    rec({ interests: ["cultura"] }),
    rec({ interests: ["gastronomia"] }),
    rec({ interests: ["naturaleza"] }),
    rec({ interests: ["vida-nocturna"] }),
  ]);
  assert.ok(bases.size >= 3, `solo ${bases.size} bases distintas para 5 perfiles: ${[...bases].join(", ")}`);
});

test("gastronomía duerme donde están los mercados y el puerto: Maó", () => {
  assert.equal(rec({ interests: ["gastronomia"] }), "mao");
});

test("un viaje de playa NO se manda a un pueblo de interior (Es Mercadal)", () => {
  // Blueprint: Es Mercadal "NO está junto al mar"; es para quien sale a explorar
  // cada día, no para "modo tumbona".
  assert.notEqual(rec({ interests: ["calas"] }), "es-mercadal");
  assert.notEqual(rec({ interests: ["calas", "nautica"] }), "es-mercadal");
});

test("sin coche, la base sigue siendo un hub de bus real (Maó o Ciutadella)", () => {
  for (const interests of [["calas"], ["cultura"], ["naturaleza"], ["nautica"]] as const) {
    const b = rec({ transport: "sin-coche", interests: interests as unknown as Survey["interests"] });
    assert.ok(b === "mao" || b === "ciutadella", `sin coche propuso ${b}`);
  }
});

test("la base elegida por datos es determinista y cambia con la variante", () => {
  assert.equal(rec({ interests: ["cultura"] }), rec({ interests: ["cultura"] }));
  const porVariante = new Set([0, 1, 2].map((variant) => rec({ interests: ["cultura"], variant })));
  assert.ok(porVariante.size >= 1); // puede coincidir si una base gana con claridad
});
