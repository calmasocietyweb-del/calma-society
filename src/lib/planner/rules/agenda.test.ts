/** Tests del PASO 2 — cruce con la agenda. node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { addDaysISO, eventsOnDate, agendaForDay, humanDate } from "./agenda.ts";
import type { PlannerEvent } from "./agenda.ts";
import { planTrip } from "../engine.ts";
import { DATASET } from "./test-fixtures.ts";

const EVENTS: PlannerEvent[] = [
  { translationKey: "sant-joan", title: "Sant Joan", startDate: "2026-06-23", endDate: "2026-06-24", zone: "oeste", category: "fiesta" },
  { translationKey: "gracia", title: "Festes de Gràcia", startDate: "2026-09-07", zone: "este", category: "fiesta" },
];

test("addDaysISO suma cruzando meses y bisiestos", () => {
  assert.equal(addDaysISO("2026-06-23", 1), "2026-06-24");
  assert.equal(addDaysISO("2026-06-30", 1), "2026-07-01");
  assert.equal(addDaysISO("2024-02-28", 1), "2024-02-29"); // 2024 bisiesto
  assert.equal(addDaysISO("2026-02-28", 1), "2026-03-01"); // 2026 no
});

test("eventsOnDate respeta el rango start/end", () => {
  assert.equal(eventsOnDate(EVENTS, "2026-06-23").length, 1);
  assert.equal(eventsOnDate(EVENTS, "2026-06-24").length, 1); // dentro del rango
  assert.equal(eventsOnDate(EVENTS, "2026-06-25").length, 0);
});

test("fiesta en la zona del día → aviso de día; en otra zona → otherZone", () => {
  const a = agendaForDay("oeste", "2026-06-23", EVENTS);
  assert.equal(a.dayNotices.length, 1);
  assert.equal(a.dayNotices[0].kind, "fiesta");
  assert.equal(a.otherZone.length, 0);

  const b = agendaForDay("norte", "2026-06-23", EVENTS);
  assert.equal(b.dayNotices.length, 0);
  assert.equal(b.otherZone.length, 1); // Sant Joan (oeste) cae en otra zona
});

test("integración: viaje en Sant Joan → aviso de fiesta (día o global)", () => {
  const plan = planTrip({ days: 5, transport: "coche-alquiler", base: "ciutadella", arrivalDate: "2026-06-22", interests: ["calas", "cultura"] }, DATASET, "es", EVENTS);
  const anyDay = plan.days.some((d) => d.notices.some((n) => n.kind === "fiesta"));
  const anyGlobal = plan.globalNotices.some((n) => n.kind === "fiesta");
  assert.ok(anyDay || anyGlobal, "el plan debe avisar de Sant Joan (cae el 23-24, día 2-3 del viaje)");
});

test("sin eventos no rompe nada", () => {
  const plan = planTrip({ days: 4, transport: "coche-alquiler", base: "ciutadella", arrivalDate: "2026-06-22" }, DATASET);
  assert.ok(plan.days.length === 4);
});

test("addDaysISO con fecha malformada NO cuelga y devuelve la entrada (bug crítico)", () => {
  assert.equal(addDaysISO("2026-6-x", 3), "2026-6-x");
  assert.equal(addDaysISO("not-a-date", 1), "not-a-date");
  assert.equal(addDaysISO("2026-13-45", 1), "2026-13-45");
  assert.equal(addDaysISO("2026-02-28", 1), "2026-03-01"); // válida sigue funcionando
});

test("los avisos de fiesta NUNCA enseñan una fecha ISO (auditoría 2026-08-11)", () => {
  // Producción mostraba: "El 2026-07-24 hay Festes de Sant Jaume (este)".
  for (const lang of ["es", "en"] as const) {
    const a = agendaForDay("oeste", "2026-06-23", EVENTS, lang);
    const b = agendaForDay("norte", "2026-06-23", EVENTS, lang);
    const textos = [...a.dayNotices, ...b.otherZone.map((o) => o.notice)].map((n) => n.text);
    assert.ok(textos.length > 0);
    for (const t of textos) {
      assert.ok(!/\d{4}-\d{2}-\d{2}/.test(t), `[${lang}] fecha ISO cruda en: ${t}`);
      assert.ok(/23/.test(t), `[${lang}] la fecha desapareció del aviso: ${t}`);
    }
    // La zona tampoco puede salir como enum ("oeste" a secas / "norte").
    const zonaCruda = b.otherZone[0].notice.text;
    assert.ok(!/\(oeste\)/.test(zonaCruda), `[${lang}] zona en crudo: ${zonaCruda}`);
  }
});

test("humanDate localiza y deja pasar lo que no es una fecha", () => {
  assert.equal(humanDate("2026-07-24", "es"), "24 de julio");
  assert.equal(humanDate("2026-07-24", "en"), "24 July");
  assert.equal(humanDate("no-es-fecha", "es"), "no-es-fecha");
  assert.equal(humanDate("2026-13-01", "es"), "2026-13-01"); // mes imposible → sin inventar
});

test("planTrip NO se cuelga con arrivalDate malformada + eventos", () => {
  const plan = planTrip({ days: 5, transport: "coche-alquiler", base: "ciutadella", arrivalDate: "2026-6-x", interests: ["calas"] }, DATASET, "es", EVENTS);
  assert.equal(plan.days.length, 5); // termina y produce plan (no entra en bucle infinito)
});
