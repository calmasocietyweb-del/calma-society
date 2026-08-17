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

// ── Invariantes de la auditoría 2026-08-11 (riqueza y variedad) ──────────────
// Lo que se protege aquí es la PROMESA: "un plan a medida", no un formulario que
// devuelve siempre lo mismo. Cada test fija un fallo medido en producción.

/** Todas las paradas con lugar real de un plan, día a día. */
const placeIdsByDay = (plan: ReturnType<typeof planTrip>): string[][] =>
  plan.days.map((d) => d.blocks.map((b) => b.placeId).filter((x): x is string => !!x));

test("INVARIANTE: ningún día del plan se queda sin una sola parada real (1…21 días)", () => {
  for (const days of [1, 2, 3, 4, 5, 7, 10, 14, 21]) {
    const plan = planTrip(s({ days }), DATASET, "es");
    placeIdsByDay(plan).forEach((ids, i) => {
      assert.ok(ids.length > 0, `viaje de ${days} días: el día ${i} ("${plan.days[i].label}") no propone ni un lugar`);
    });
  }
});

test("INVARIANTE: las visitas de un día no se repiten entre sí", () => {
  // Las COMIDAS sí pueden caer en un lugar ya visitado: cenar en el pueblo por el
  // que pasaste ("Cena en el pueblo tras la jornada, sin desplazamientos") es la
  // decisión buena, y el motor lo dice con ese texto. Lo que nunca debe pasar es
  // que la tarde te mande a la misma cala de la mañana.
  const VISITAS = new Set(["manana", "tarde", "atardecer"]);
  for (const days of [3, 5, 7, 10, 14, 21]) {
    for (const d of planTrip(s({ days }), DATASET, "es").days) {
      const ids = d.blocks.filter((b) => VISITAS.has(b.slot) && b.placeId).map((b) => b.placeId!);
      assert.equal(new Set(ids).size, ids.length, `viaje de ${days} días, día "${d.label}": repite visita → ${ids.join(", ")}`);
    }
  }
});

test("INVARIANTE: en estancias normales (≤10 días) no se repite lugar en TODO el viaje", () => {
  for (const days of [3, 5, 7, 10]) {
    const all = placeIdsByDay(planTrip(s({ days, interests: ["calas", "gastronomia"] }), DATASET, "es")).flat();
    assert.equal(new Set(all).size, all.length, `viaje de ${days} días: repite lugar entre días`);
  }
});

test("variantes: 'otra versión' cambia el plan, y cada variante es estable", () => {
  const base: Partial<Survey> = { days: 6, interests: ["calas", "cultura"], arrivalDate: "2026-07-20" };
  const v = [0, 1, 2].map((variant) => planTrip(s({ ...base, variant }), DATASET, "es"));
  assert.notDeepEqual(v[0], v[1], "la variante 1 devuelve el mismo plan que la 0");
  assert.notDeepEqual(v[1], v[2], "la variante 2 devuelve el mismo plan que la 1");
  // …pero cada una sigue siendo determinista (el plan se comparte por URL).
  assert.deepEqual(planTrip(s({ ...base, variant: 1 }), DATASET, "es"), v[1]);
});

test("variantes: una variante fuera de rango se acota en vez de romper el plan", () => {
  const ok = planTrip(s({ days: 5, variant: 1 }), DATASET, "es");
  assert.deepEqual(planTrip(s({ days: 5, variant: 4 } as Partial<Survey>), DATASET, "es"), ok, "4 debe caer en 1 (mód 3)");
  assert.equal(planTrip(s({ days: 5, variant: -1 } as Partial<Survey>), DATASET, "es").days.length, 5);
  assert.equal(planTrip(s({ days: 5, variant: NaN } as Partial<Survey>), DATASET, "es").days.length, 5);
});

test("INVARIANTE: los días de llegada y salida nombran un lugar real (no solo 'un paseo')", () => {
  const plan = planTrip(s({ days: 5, arrivalFlightTime: "09:30" }), DATASET, "es");
  const llegada = placeIdsByDay(plan)[0];
  const salida = placeIdsByDay(plan)[plan.days.length - 1];
  assert.ok(llegada.length > 0, "el día de llegada no propone ningún lugar con nombre");
  assert.ok(salida.length > 0, "el día de salida no propone ningún lugar con nombre");
});

test("riqueza: los días plenos ofrecen recambios y 'también cerca'", () => {
  const plan = planTrip(s({ days: 6, interests: ["calas", "gastronomia"] }), DATASET, "es");
  const plenos = plan.days.filter((d) => d.cluster);
  assert.ok(plenos.length > 0);
  for (const d of plenos) {
    assert.ok((d.alsoNearby?.length ?? 0) > 0, `el día "${d.label}" no ofrece nada más de la zona`);
  }
  const conRecambio = plenos.filter((d) => d.blocks.some((b) => b.alternatives?.length));
  assert.ok(conRecambio.length > 0, "ningún día ofrece un recambio de parada");
});

test("recambios: nunca proponen un lugar que ya está en el plan de ese día", () => {
  const plan = planTrip(s({ days: 7, interests: ["calas", "naturaleza"] }), DATASET, "es");
  for (const d of plan.days) {
    const enElDia = new Set(d.blocks.map((b) => b.placeId).filter(Boolean));
    for (const b of d.blocks) {
      for (const alt of b.alternatives ?? []) {
        assert.ok(!enElDia.has(alt.placeId), `"${alt.name}" se ofrece como recambio y ya está en el día "${d.label}"`);
      }
    }
  }
});

// ── Coste orientativo (auditoría 2026-08-11) ─────────────────────────────────
// La encuesta preguntaba el presupuesto desde el primer día y el motor apenas lo
// usaba: elegir "ajustado" o "alto" daba casi el mismo plan.

/** Paradas con lugar real y su banda de coste. */
const bandsOf = (plan: ReturnType<typeof planTrip>) =>
  plan.days.flatMap((d) => d.blocks).filter((b) => b.placeId && b.costBand).map((b) => b.costBand!);

test("INVARIANTE: todo lugar del dataset lleva banda de coste", () => {
  const sin = DATASET.filter((p) => !p.costBand);
  assert.equal(sin.length, 0, `${sin.length} lugares sin coste: ${sin.slice(0, 5).map((p) => p.name).join(", ")}`);
  const validas = new Set(["gratis", "€", "€€", "€€€"]);
  for (const p of DATASET) assert.ok(validas.has(p.costBand!), `banda inválida en ${p.name}: ${p.costBand}`);
});

test("INVARIANTE: una cala o playa pública nunca se marca de pago", () => {
  for (const p of DATASET.filter((x) => x.plannerType === "cala" || x.plannerType === "playa")) {
    assert.equal(p.costBand, "gratis", `${p.name} (${p.plannerType}) sale como ${p.costBand}`);
  }
});

test("el presupuesto AJUSTADO evita lo caro y se apoya en el acceso libre", () => {
  const bandas = bandsOf(planTrip(s({ days: 7, budget: "ajustado", interests: ["calas", "cultura"] }), DATASET, "es"));
  assert.ok(bandas.length > 0);
  const caras = bandas.filter((b) => b === "€€€").length;
  const libres = bandas.filter((b) => b === "gratis").length;
  assert.equal(caras, 0, `con presupuesto ajustado se colaron ${caras} paradas de banda alta`);
  assert.ok(libres > bandas.length / 2, `solo ${libres} de ${bandas.length} paradas son de acceso libre`);
});

test("el presupuesto ALTO sí propone las experiencias de pago", () => {
  const bandas = bandsOf(planTrip(s({ days: 7, budget: "alto", interests: ["calas", "cultura"] }), DATASET, "es"));
  const pago = bandas.filter((b) => b === "€€" || b === "€€€").length;
  assert.ok(pago >= 3, `con presupuesto alto solo aparecen ${pago} paradas de pago`);
});

test("ajustado y alto NO devuelven el mismo viaje", () => {
  const base: Partial<Survey> = { days: 7, interests: ["calas", "gastronomia", "cultura"] };
  const ids = (budget: Survey["budget"]) =>
    new Set(planTrip(s({ ...base, budget }), DATASET, "es").days.flatMap((d) => d.blocks).map((b) => b.placeId).filter(Boolean));
  const a = ids("ajustado");
  const b = ids("alto");
  const solape = [...a].filter((x) => b.has(x)).length / new Set([...a, ...b]).size;
  assert.ok(solape < 0.5, `ajustado y alto comparten el ${Math.round(solape * 100)}% de las paradas`);
});

test("cada día informa de su coste, y el plan lleva su descargo", () => {
  const plan = planTrip(s({ days: 5, budget: "medio" }), DATASET, "es");
  for (const d of plan.days) {
    assert.equal(typeof d.paidStops, "number", `el día "${d.label}" no dice cuántas paradas se pagan`);
  }
  const coste = plan.globalNotices.filter((n) => n.kind === "coste");
  assert.ok(coste.length >= 2, "faltan los avisos de coste (qué ha hecho el presupuesto + descargo)");
  assert.ok(
    coste.some((n) => /orientativa/i.test(n.text)),
    "el descargo debe dejar claro que el coste es una banda orientativa, no una tarifa",
  );
});

test("EN: los textos de coste van localizados", () => {
  const dsEn: PlannerPlace[] = JSON.parse(
    readFileSync(new URL("../../data/planner-data.en.json", import.meta.url), "utf8"),
  );
  const plan = planTrip(s({ days: 5, budget: "ajustado" }), dsEn, "en");
  const textos = plan.globalNotices.filter((n) => n.kind === "coste").map((n) => n.text).join(" ¶ ");
  assert.ok(/indicative BAND/.test(textos), `descargo sin traducir: ${textos.slice(0, 160)}`);
  assert.ok(!/orientativa|presupuesto/.test(textos), `fuga de español en EN: ${textos.slice(0, 160)}`);
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
