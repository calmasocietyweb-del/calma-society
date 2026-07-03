/** Tests de afinidad — el TIPO pedido manda (fix del plan "calas sin calas"). node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { affinity, targetTypes } from "./interests.ts";
import { normalizeSurvey } from "../survey.ts";
import type { Survey } from "../survey.ts";
import { place } from "./test-fixtures.ts";

const s = (over: Partial<Survey>): Survey => normalizeSurvey(over);

test("pedir 'calas' hace que una cala gane a una actividad etiquetada naturaleza", () => {
  // Antes del fix, una visita apícola (idealFor naturaleza+familias) empataba o
  // superaba a Macarella para quien pedía calas. El tipo literal debe dominar.
  const cala = place({ id: "macarella", zone: "sur-oeste", cluster: "c", plannerType: "cala", idealFor: ["naturaleza", "parejas"] });
  const apicola = place({ id: "apicola", zone: "sur-oeste", cluster: "c", plannerType: "excursion", idealFor: ["naturaleza", "familias"] });
  const survey = s({ interests: ["calas"] });
  assert.ok(
    affinity(cala, survey) > affinity(apicola, survey),
    "la cala debe puntuar por encima de la actividad",
  );
});

test("pedir 'cultura' hace que un yacimiento gane a un pueblo genérico", () => {
  const naveta = place({ id: "naveta", zone: "eje-me1", cluster: "c", plannerType: "yacimiento", idealFor: ["cultura"] });
  const pueblo = place({ id: "pueblo", zone: "eje-me1", cluster: "c", plannerType: "pueblo", idealFor: ["cultura", "gastronomia"] });
  const survey = s({ interests: ["cultura"] });
  assert.ok(affinity(naveta, survey) > affinity(pueblo, survey));
});

test("sin coche: lo alcanzable en bus gana a lo solo-coche", () => {
  const enBus = place({ id: "bus", zone: "oeste", cluster: "c", plannerType: "cala", idealFor: ["naturaleza"], busServed: true });
  const soloCoche = place({ id: "coche", zone: "oeste", cluster: "c", plannerType: "cala", idealFor: ["naturaleza"] });
  const survey = s({ interests: ["calas"], transport: "sin-coche" });
  assert.ok(affinity(enBus, survey) > affinity(soloCoche, survey));
  // Con coche no hay penalización: empatan.
  const conCoche = s({ interests: ["calas"], transport: "coche-alquiler" });
  assert.equal(affinity(enBus, conCoche), affinity(soloCoche, conCoche));
});

test("la lanzadera de verano cuenta como alcanzable sin coche (Macarella)", () => {
  const lanzadera = place({
    id: "macarella", zone: "sur-oeste", cluster: "c", plannerType: "cala",
    idealFor: ["naturaleza"], carAccess: "solo-bus-lanzadera", carAccessClosedSummer: true, busServed: true,
  });
  const survey = s({ interests: ["calas"], transport: "sin-coche" });
  assert.ok(affinity(lanzadera, survey) > 2.5, "no debe recibir la penalización de solo-coche");
});

test("targetTypes refleja los intereses (y lujo-tranquilo no impone tipo)", () => {
  const tt = targetTypes(s({ interests: ["calas", "nautica", "lujo-tranquilo"] }));
  assert.ok(tt.has("cala") && tt.has("playa") && tt.has("actividad-acuatica"));
  assert.equal(tt.size, 3);
});
