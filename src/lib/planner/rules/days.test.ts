/** Tests del PASO 1 — esqueleto de días. node --test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDaySkeleton, rankClusters } from "./days.ts";
import { normalizeSurvey } from "../survey.ts";
import type { Survey } from "../survey.ts";
import { DATASET, place } from "./test-fixtures.ts";

const s = (over: Partial<Survey>): Survey => normalizeSurvey(over);

test("5 días → llegada, 3 días plenos, salida", () => {
  const sk = buildDaySkeleton(s({ days: 5, interests: ["calas", "naturaleza"] }), "ciutadella", DATASET);
  assert.equal(sk.length, 5);
  assert.equal(sk[0].dayTypeKey, "dia-llegada");
  assert.equal(sk[4].dayTypeKey, "dia-salida");
  for (let i = 1; i <= 3; i++) assert.ok(sk[i].cluster, `el día ${i} debe tener cluster`);
});

test("no se repite zona en días plenos consecutivos", () => {
  const sk = buildDaySkeleton(s({ days: 7, interests: ["calas", "cultura", "naturaleza"] }), "ciutadella", DATASET);
  const full = sk.filter((d) => d.cluster);
  for (let i = 1; i < full.length; i++) {
    assert.notEqual(full[i].zone, full[i - 1].zone, `días plenos ${i - 1} y ${i} repiten zona`);
  }
});

test("1 día → un único día pleno (sin llegada/salida)", () => {
  const sk = buildDaySkeleton(s({ days: 1, interests: ["calas"] }), "ciutadella", DATASET);
  assert.equal(sk.length, 1);
  assert.ok(sk[0].cluster);
  assert.notEqual(sk[0].dayTypeKey, "dia-llegada");
});

test("3 días → llegada + 1 pleno + salida", () => {
  const sk = buildDaySkeleton(s({ days: 3, interests: ["calas"] }), "ciutadella", DATASET);
  assert.equal(sk.length, 3);
  assert.equal(sk[0].dayTypeKey, "dia-llegada");
  assert.ok(sk[1].cluster);
  assert.equal(sk[2].dayTypeKey, "dia-salida");
});

test("rankClusters: desde Ciutadella, cultura prioriza el cluster de interior (en el eje)", () => {
  // Empatan en afinidad cultural naveta y Maó, pero el interior del eje Me-1 está
  // más cerca de Ciutadella que cruzar al este → desempata por cercanía.
  const ranked = rankClusters(s({ interests: ["cultura"] }), "ciutadella", DATASET);
  assert.equal(ranked[0].cluster, "interior-cultura");
});

test("nunca repite zona en días plenos consecutivos aunque sobren clusters de la misma zona", () => {
  // 3 clusters sur-oeste + 1 norte: el motor debe meter un colchón antes que
  // poner dos días sur-oeste seguidos (bug del fallback que ignoraba la zona).
  const ds = [
    place({ id: "a", zone: "sur-oeste", cluster: "c1", plannerType: "cala", idealFor: ["naturaleza"] }),
    place({ id: "b", zone: "sur-oeste", cluster: "c2", plannerType: "cala", idealFor: ["naturaleza"] }),
    place({ id: "c", zone: "sur-oeste", cluster: "c3", plannerType: "cala", idealFor: ["naturaleza"] }),
    place({ id: "d", zone: "norte", cluster: "c4", plannerType: "cala", idealFor: ["naturaleza"] }),
  ];
  const sk = buildDaySkeleton(s({ days: 6, interests: ["calas", "naturaleza"] }), "ciutadella", ds);
  const full = sk.filter((x) => x.cluster);
  for (let i = 1; i < full.length; i++) {
    assert.notEqual(full[i].zone, full[i - 1].zone, `días plenos ${i - 1} y ${i} repiten zona`);
  }
});

test("determinismo: mismo input → mismo esqueleto", () => {
  const input: Partial<Survey> = { days: 6, interests: ["calas", "naturaleza"] };
  assert.deepEqual(
    buildDaySkeleton(s(input), "ciutadella", DATASET),
    buildDaySkeleton(s(input), "ciutadella", DATASET),
  );
});
