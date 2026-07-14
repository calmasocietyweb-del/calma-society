/**
 * El robot corrige horas de atraque SOLO. Si se equivoca, publica una hora falsa y
 * alguien pierde el barco. Por eso el diff se prueba antes de dejarlo suelto.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { escalasDeMao, diffCalendario, mismoBarco, ventanaDeCruceros } from "./apb.ts";

// Lo que el puerto alcanza a ver EN CRUCEROS: de hoy a su última escala cargada.
const VENTANA = { desde: "2026-07-14", hasta: "2026-07-30" };

// Un registro del feed real de la APB, tal cual viene (mayúsculas, fecha dd/mm/aaaa).
const reg = (over: Record<string, unknown> = {}) => ({
  codpue: "M",
  destipbuq: "CRUCEROS TURISTICOS",
  nombuq: "MSC OPERA",
  gt: 65591,
  eslora: 274.9,
  fecatr: "20/07/2026 09:00",
  fecsal: "20/07/2026 16:00",
  desmue: "MUELLE CRUCEROS",
  nomcsg: "FEDERICO CARDONA TREMOL",
  escala: "M202600123",
  estatr: "S",
  ...over,
});

test("del feed de toda Baleares solo salen los cruceros de Maó", () => {
  const feed = [
    reg(),
    reg({ codpue: "P", nombuq: "OTRO EN PALMA" }), // otro puerto
    reg({ destipbuq: "FERRYS CARGA/PASAJE", nombuq: "ABEL MATUTES" }), // ferry
  ];
  const r = escalasDeMao(feed);
  assert.equal(r.length, 1);
  assert.equal(r[0].ship, "MSC OPERA");
});

test("un barquito de excursión local NO es un crucero", () => {
  // El tipo "CRUCEROS TURISTICOS" del puerto incluye barcos de paseo. Un crucero de
  // verdad no baja de las 1.000 toneladas; el SeaDream I, boutique de 112 pax, tiene 4.333.
  const feed = [reg({ nombuq: "GOLONDRINA DEL PUERTO", gt: 120 }), reg({ nombuq: "SEADREAM I", gt: 4333 })];
  const r = escalasDeMao(feed);
  assert.deepEqual(r.map((e) => e.ship), ["SEADREAM I"]);
});

test("la fecha del puerto (dd/mm/aaaa hh:mm) se lee como fecha y hora", () => {
  const [e] = escalasDeMao([reg()]);
  assert.equal(e.date, "2026-07-20");
  assert.equal(e.arrival, "09:00");
  assert.equal(e.departure, "16:00");
  assert.equal(e.departureDate, null); // mismo día: no es pernocta
});

test("si zarpa OTRO día, el robot lo ve: es una pernocta", () => {
  const [e] = escalasDeMao([
    reg({ nombuq: "WIND SPIRIT", gt: 5350, fecatr: "27/10/2026 08:00", fecsal: "28/10/2026 17:00" }),
  ]);
  assert.equal(e.date, "2026-10-27");
  assert.equal(e.departureDate, "2026-10-28");
});

test("el mismo barco se reconoce aunque el puerto lo escriba a su manera", () => {
  assert.equal(mismoBarco("AIDASTELLA", "AIDAstella"), true);
  assert.equal(mismoBarco("MSC OPERA", "MSC Opera"), true);
  assert.equal(mismoBarco("RITZ-CARLTON ILMA", "Ritz-Carlton Ilma"), true);
  assert.equal(mismoBarco("MSC OPERA", "MSC Orchestra"), false);
});

test("EL CASO SILVER MUSE: si la hora publicada no cuadra con la del puerto, se corrige", () => {
  const feed = [reg({ fecsal: "20/07/2026 17:30" })]; // el puerto dice 17:30
  const calendario = [
    { date: "2026-07-20", ship: "MSC Opera", line: "MSC", pax: 2150, arrival: "09:00", departure: "16:00", confidence: "media" },
  ];
  const { correcciones, nuevas, desaparecidas } = diffCalendario(escalasDeMao(feed), calendario, VENTANA);
  assert.equal(correcciones.length, 1);
  assert.equal(correcciones[0].campo, "departure");
  assert.equal(correcciones[0].antes, "16:00");
  assert.equal(correcciones[0].ahora, "17:30");
  assert.equal(nuevas.length, 0);
  assert.equal(desaparecidas.length, 0);
});

test("si las horas ya cuadran, no se toca nada (pero la escala queda confirmada)", () => {
  const calendario = [
    { date: "2026-07-20", ship: "MSC Opera", line: "MSC", pax: 2150, arrival: "09:00", departure: "16:00", confidence: "media" },
  ];
  const { correcciones, confirmadas } = diffCalendario(escalasDeMao([reg()]), calendario, VENTANA);
  assert.equal(correcciones.length, 0);
  assert.equal(confirmadas.length, 1); // sube a "alta": la avala el registro del puerto
});

test("una escala que el puerto tiene y nosotros NO se AVISA, no se publica sola", () => {
  // Fue el caso del Marella Explorer: los tres agregadores se lo dejaron. Añadirla pide
  // capacidad de pasaje y naviera normalizada: eso lo mira una persona.
  const feed = [reg({ nombuq: "MARELLA EXPLORER", gt: 76998, fecatr: "26/07/2026 11:00", fecsal: "26/07/2026 18:00" })];
  const { nuevas, correcciones } = diffCalendario(escalasDeMao(feed), [], VENTANA);
  assert.equal(correcciones.length, 0, "nunca se publica sola");
  assert.equal(nuevas.length, 1);
  assert.equal(nuevas[0].ship, "MARELLA EXPLORER");
  assert.equal(nuevas[0].arrival, "11:00");
});

test("una escala nuestra que el puerto NO tiene se AVISA (¿cancelada?), no se borra", () => {
  const calendario = [
    { date: "2026-07-20", ship: "MSC Opera", line: "MSC", pax: 2150, arrival: "09:00", departure: "16:00", confidence: "media" },
    { date: "2026-07-22", ship: "Barco Fantasma", line: "X", pax: 100, arrival: "09:00", departure: "18:00", confidence: "media" },
  ];
  const { desaparecidas } = diffCalendario(escalasDeMao([reg()]), calendario, VENTANA);
  assert.equal(desaparecidas.length, 1);
  assert.equal(desaparecidas[0].ship, "Barco Fantasma");
});

test("fuera de la ventana del feed NO se avisa de nada: el puerto no lo sabe aún", () => {
  // El feed solo ve unas semanas. Una escala nuestra de octubre no es "desaparecida":
  // es que el puerto todavía no la tiene. Avisar de ella sería una falsa alarma diaria.
  const calendario = [
    { date: "2026-07-20", ship: "MSC Opera", line: "MSC", pax: 2150, arrival: "09:00", departure: "16:00", confidence: "media" },
    { date: "2026-10-15", ship: "Oceania Sirena", line: "Oceania", pax: 684, arrival: "09:00", departure: "18:00", confidence: "media" },
  ];
  const { desaparecidas } = diffCalendario(escalasDeMao([reg()]), calendario, VENTANA);
  assert.equal(desaparecidas.length, 0, "octubre cae fuera de la ventana del feed");
});

test("LA TRAMPA: la ventana la marcan los CRUCEROS, no los ferries del feed", () => {
  // El puerto carga los ferries con meses de antelación y los cruceros no. Si la ventana
  // saliera del feed entero (hasta el 11-ago por los ferries), TODAS nuestras escalas de
  // crucero de agosto parecerían canceladas cuando lo único que pasa es que el puerto
  // todavía no las tiene. Serían 7 falsas alarmas al día.
  const feed = [
    reg({ destipbuq: "FERRYS CARGA/PASAJE", fecatr: "11/08/2026 06:00" }), // el ferry llega lejos
    reg({ fecatr: "20/07/2026 09:00" }),
    reg({ fecatr: "30/07/2026 09:00" }), // el último crucero que el puerto tiene
    reg({ fecatr: "10/07/2026 08:50" }), // ya pasó
  ];
  const v = ventanaDeCruceros(escalasDeMao(feed), "2026-07-14");
  assert.deepEqual(v, { desde: "2026-07-14", hasta: "2026-07-30" });
});

test("el pasado no se toca: el puerto da ahí la hora REAL, no la prevista", () => {
  // Un barco que atracó a las 08:50 en vez de las 09:00 previstas no es una corrección
  // útil: nadie va a coger ese barco ya. Reescribir el histórico solo mete ruido.
  const feed = [reg({ fecatr: "10/07/2026 08:50", fecsal: "10/07/2026 16:00" })]; // ya pasó
  const calendario = [
    { date: "2026-07-10", ship: "MSC Opera", line: "MSC", pax: 2150, arrival: "09:00", departure: "16:00", confidence: "media" },
  ];
  const { correcciones, desaparecidas } = diffCalendario(escalasDeMao(feed), calendario, VENTANA);
  assert.equal(correcciones.length, 0, "el 10-jul cae antes de la ventana: no se toca");
  assert.equal(desaparecidas.length, 0);
});

test("dos cruceros grandes el mismo día: se avisa (uno puede tener que fondear)", () => {
  // Pasa el 19-ago con MSC Opera y AIDAstella. Si uno fondea, se desembarca en lancha y
  // el tiempo real en tierra cambia — justo el dato que vendemos.
  const feed = [
    reg({ nombuq: "MSC OPERA", eslora: 274.9, fecatr: "19/08/2026 09:00", fecsal: "19/08/2026 16:00" }),
    reg({ nombuq: "AIDASTELLA", eslora: 253.3, fecatr: "19/08/2026 09:30", fecsal: "19/08/2026 19:00" }),
  ];
  // Ventana propia: el aviso solo tiene sentido cuando el puerto YA tiene esas escalas.
  const { dobles } = diffCalendario(escalasDeMao(feed), [], { desde: "2026-08-01", hasta: "2026-08-31" });
  assert.equal(dobles.length, 1);
  assert.equal(dobles[0].date, "2026-08-19");
  assert.equal(dobles[0].barcos.length, 2);
});
