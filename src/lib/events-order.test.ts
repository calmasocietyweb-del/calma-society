/**
 * Orden de la agenda (KAN-126).
 *
 * El fallo original: `getEvents()` ordenaba por `startDate` y nunca miraba
 * `endDate`, así que un festival que empezó en julio y termina en septiembre
 * contaba como "pasado" y caía al fondo de la agenda estando en marcha. El
 * 21-ago-2026 había 18 eventos EN CURSO enterrados detrás de 40 terminados.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareEvents } from "./events-order.ts";

/** Fecha sin hora, en el calendario local (como la que usa `getEvents`). */
const hoy = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
/** Fecha de contenido: se guarda como AAAA-MM-DD, o sea medianoche UTC. */
const fecha = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const evento = (start: string, end?: string) => ({
  startDate: fecha(start),
  ...(end ? { endDate: fecha(end) } : {}),
});

/** Ordena como lo hace `getEvents` y devuelve los índices originales. */
const ordenar = (evs: ReturnType<typeof evento>[], dia: string) =>
  evs.map((e, i) => ({ e, i })).sort((a, b) => compareEvents(a.e, b.e, hoy(dia))).map((x) => x.i);

const HOY = "2026-08-21";

describe("orden de la agenda", () => {
  it("un evento largo EN CURSO va antes que uno futuro que aún no ha empezado", () => {
    const enCurso = evento("2026-07-03", "2026-08-26"); // 53è Festival de Música de Maó
    const futuro = evento("2026-08-25", "2026-08-29"); // Vela Clásica
    assert.ok(compareEvents(enCurso, futuro, hoy(HOY)) < 0);
    assert.ok(compareEvents(futuro, enCurso, hoy(HOY)) > 0);
  });

  it("el caso real que destapó el fallo: Ukalari acaba mañana y NO puede ir el último", () => {
    const ukalari = evento("2026-08-12", "2026-08-22");
    const reyes = evento("2027-01-05"); // ya pasó en 2026; su próxima cita es enero
    const orden = ordenar([reyes, ukalari], HOY);
    assert.deepEqual(orden, [1, 0], "Ukalari (en curso) debe salir antes que Reyes");
  });

  it("entre dos en curso, primero el que antes se acaba", () => {
    const acabaPronto = evento("2026-06-01", "2026-08-24");
    const acabaTarde = evento("2026-06-21", "2026-10-25"); // Hauser & Wirth
    assert.deepEqual(ordenar([acabaTarde, acabaPronto], HOY), [1, 0]);
  });

  it("un evento de un solo día cuenta como en curso ese mismo día", () => {
    const hoyMismo = evento("2026-08-21");
    const dentroDeUnMes = evento("2026-09-21");
    assert.deepEqual(ordenar([dentroDeUnMes, hoyMismo], HOY), [1, 0]);
  });

  it("el que terminó AYER ya no está en curso", () => {
    const terminado = evento("2026-08-08", "2026-08-20");
    const proximo = evento("2026-08-23");
    assert.deepEqual(ordenar([terminado, proximo], HOY), [1, 0]);
  });

  it("los que no están en curso siguen ordenados por próxima cita anual", () => {
    const septiembre = evento("2026-09-08");
    const enero = evento("2026-01-05"); // su próxima cita es enero del año que viene
    const octubre = evento("2026-10-11");
    assert.deepEqual(ordenar([enero, octubre, septiembre], HOY), [2, 1, 0]);
  });

  it("da la vuelta al año: en noviembre, diciembre va antes que enero", () => {
    const diciembre = evento("2026-12-05");
    const enero = evento("2026-01-17");
    assert.deepEqual(ordenar([enero, diciembre], "2026-11-10"), [1, 0]);
  });

  it("es determinista: ordenar dos veces da el mismo resultado", () => {
    const evs = [
      evento("2026-07-03", "2026-10-11"),
      evento("2026-08-25", "2026-08-29"),
      evento("2026-01-05"),
      evento("2026-08-12", "2026-08-22"),
      evento("2026-09-08"),
    ];
    assert.deepEqual(ordenar(evs, HOY), ordenar(evs, HOY));
  });
});
