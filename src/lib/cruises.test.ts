/**
 * Del cálculo de estas horas depende que alguien no pierda el barco. Se prueba.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  barcosConPagina as calcular,
  cabe,
  hhmmAMin,
  pernocta,
  slugBarco,
  PLANES,
  DESEMBARQUE_MIN,
  MARGEN_VUELTA_MIN,
} from "./cruises.ts";

// Las escalas reales del año. El módulo es PURO: no importa el JSON, se lo pasamos.
const CALLS = JSON.parse(readFileSync("src/data/cruceros-menorca-2026.json", "utf8")).calls;
const barcosConPagina = () => calcular(CALLS);

test("las horas se leen bien", () => {
  assert.equal(hhmmAMin("09:00"), 540);
  assert.equal(hhmmAMin("16:30"), 990);
});

test("el tiempo útil descuenta el desembarque y el margen de vuelta", () => {
  // MSC Opera: 09:00 → 16:00 = 7 h. Menos 30 min de bajar y 60 de margen = 5 h 30.
  const msc = barcosConPagina().find((b) => b.ship === "MSC Opera");
  assert.ok(msc, "el MSC Opera debe tener página: 16 escalas y horas conocidas");
  assert.equal(msc!.escalaMin, 7 * 60);
  assert.equal(msc!.utilesMin, 7 * 60 - DESEMBARQUE_MIN - MARGEN_VUELTA_MIN);
  assert.equal(msc!.utilesMin, 330);
});

test("un plan cabe si caben su coche y su estancia", () => {
  const ciutadella = PLANES.find((p) => p.id === "ciutadella")!;
  // 90 min de coche (ida y vuelta) + 180 de estancia = 270 min
  assert.equal(cabe(ciutadella, 270), true);
  assert.equal(cabe(ciutadella, 269), false);
});

test("EL DATO QUE IMPORTA: con 5 h 30 útiles, Ciutadella sola cabe; Ciutadella + cala, NO", () => {
  const ciutadella = PLANES.find((p) => p.id === "ciutadella")!;
  const doble = PLANES.find((p) => p.id === "ciutadella-y-cala")!;
  // MSC Opera: 5 h 30 útiles = 330 min
  assert.equal(cabe(ciutadella, 330), true, "cruzar la isla y ver Ciutadella: sí");
  assert.equal(cabe(doble, 330), false, "encadenar Ciutadella y una cala del sur: NO da tiempo");
  // Con la escala larga del Wind Spirit (12 h 30 = 750 min) sí sale.
  assert.equal(cabe(doble, 750), true);
});

test("Maó a pie no se promete con menos de 2 h 30", () => {
  const mao = PLANES.find((p) => p.id === "mao-a-pie")!;
  assert.equal(cabe(mao, 150), true);
  assert.equal(cabe(mao, 149), false);
});

test("el que zarpa a las 21:00 llega al atardecer; el de las 16:00, no", () => {
  const barcos = barcosConPagina();
  const explora = barcos.find((b) => b.ship === "Explora I");
  const msc = barcos.find((b) => b.ship === "MSC Opera");
  assert.equal(explora?.llegaAlAtardecer, true, "Explora I zarpa a las 21:00");
  assert.equal(msc?.llegaAlAtardecer, false, "MSC Opera zarpa a las 16:00");
  assert.equal(msc?.daParaCenar, false);
});

test("el que zarpa a las 22:00 da para cenar en tierra", () => {
  const wind = barcosConPagina().find((b) => b.ship === "Wind Spirit");
  assert.equal(wind?.daParaCenar, true, "Wind Spirit zarpa a las 22:00");
});

test("una PERNOCTA no se toma por el día tipo del barco", () => {
  // El Wind Spirit atraca el 27-oct a las 08:00 y zarpa el 28 a las 17:00: duerme en Maó.
  // Si el cálculo la tomara por una escala normal, restaría 17:00 − 08:00 = 9 h y le
  // prometería al lector MENOS tiempo del que tiene. Peor aún sería lo contrario.
  const escala = CALLS.find(
    (c: { date: string; ship: string }) => c.date === "2026-10-27" && c.ship === "Wind Spirit",
  );
  assert.ok(escala, "la escala con pernocta debe seguir en el calendario");
  assert.equal(pernocta(escala), true);

  // El día tipo del Wind Spirit sale de una escala normal (agosto: 08:00–22:00), no de esta.
  const wind = barcosConPagina().find((b) => b.ship === "Wind Spirit");
  assert.ok(wind);
  assert.equal(wind.departure, "22:00");
  assert.ok(wind.escalaMin > 9 * 60, "no puede haber cogido las horas de la pernocta");
});

/**
 * Barcos que repiten escala pero de los que el puerto NO publica horas en
 * ninguna de ellas. Se calcula del dato real en vez de nombrar un barco
 * concreto: el registro del puerto se actualiza a diario, y una prueba que
 * decía «Emerald Sakara nunca tiene horas» se cayó sola el 21-ago-2026, en
 * cuanto el puerto publicó las suyas. El dato era correcto; la premisa de la
 * prueba había caducado. Lo que hay que proteger es la REGLA, no el ejemplo.
 */
const repitenSinHoras = () => {
  const porBarco = new Map<string, { arrival: string | null; departure: string | null }[]>();
  for (const c of CALLS as { ship: string; arrival: string | null; departure: string | null }[]) {
    if (!porBarco.has(c.ship)) porBarco.set(c.ship, []);
    porBarco.get(c.ship)!.push(c);
  }
  return [...porBarco.entries()]
    .filter(([, e]) => e.length >= 2 && !e.some((x) => x.arrival && x.departure))
    .map(([ship]) => ship);
};

test("una escala SIN horas no inventa un tiempo en tierra", () => {
  // Antes que estimar unas horas, no se publican: el barco sale en el calendario,
  // pero no puede sostener una página de "cuánto te da tiempo a ver".
  const sinHoras = repitenSinHoras();
  assert.ok(sinHoras.length > 0, "debe quedar algún barco que repita sin horas: es el caso límite");

  const conPagina = new Set(barcosConPagina().map((b) => b.ship));
  for (const ship of sinHoras) {
    assert.equal(
      conPagina.has(ship),
      false,
      `${ship} repite, pero sin horas no hay nada honesto que contarle al crucerista`,
    );
  }
});

test("solo tienen página los barcos que repiten Y tienen horas", () => {
  const barcos = barcosConPagina();
  assert.ok(barcos.length >= 10, "debe haber una decena larga de barcos con página");
  for (const b of barcos) {
    assert.ok(b.fechas.length >= 2, `${b.ship} debería repetir escala`);
    assert.ok(b.arrival && b.departure, `${b.ship} debería tener horas`);
    assert.ok(b.utilesMin > 0, `${b.ship} debería dejar tiempo útil`);
  }
});

test("cada barco dice lo que cabe y lo que no, sin solaparse", () => {
  for (const b of barcosConPagina()) {
    const ids = new Set([...b.caben, ...b.noCaben].map((p) => p.id));
    assert.equal(ids.size, PLANES.length, `${b.ship}: cada plan va o en «cabe» o en «no cabe»`);
    for (const p of b.caben) assert.ok(cabe(p, b.utilesMin));
    for (const p of b.noCaben) assert.ok(!cabe(p, b.utilesMin));
  }
});

test("las páginas NO son todas iguales: al barco corto le falta tiempo para algo", () => {
  const barcos = barcosConPagina();
  const msc = barcos.find((b) => b.ship === "MSC Opera")!;   // 5 h 30 útiles
  const wind = barcos.find((b) => b.ship === "Wind Spirit")!; // 12 h 30 útiles
  assert.ok(msc.noCaben.length > 0, "al MSC Opera debe faltarle tiempo para algo");
  assert.equal(wind.noCaben.length, 0, "al Wind Spirit le cabe todo");
  assert.notEqual(msc.caben.length, wind.caben.length, "sus páginas cuentan cosas distintas");
});

test("el slug del barco sirve para una URL", () => {
  assert.equal(slugBarco("MSC Opera"), "msc-opera");
  assert.equal(slugBarco("Ritz-Carlton Evrima"), "ritz-carlton-evrima");
  assert.equal(slugBarco("La Belle des Océans"), "la-belle-des-oceans");
});
