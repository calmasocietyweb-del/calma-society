/**
 * El correo que se le manda a un cliente lleva nuestro nombre. Se prueba.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  huecosParaPresupuesto,
  componerPeticionDeInfo,
  mailtoHref,
  type BookingRow,
} from "./emails.ts";

const base: BookingRow = {
  ref: "CS-7K2M",
  locale: "es",
  origin: "Aeropuerto de Menorca (MAH)",
  destination: "Hotel Torralbenc, Alaior",
  trip_type: "ida",
  pickup_date: "2026-09-12",
  pickup_time: "14:30",
  flight_number: "IB3862",
  adults: 2,
  children: 0,
  infants: 0,
  vehicle_category: "privado-3",
  name: "maría del mar bonet",
  address: "Carretera de Maó a Cala en Porter, km 10",
  extras: { "silla-nino": 0, maxicosi: 0, booster: 0, "maleta-extra": 0 },
};
const con = (p: Partial<BookingRow>): BookingRow => ({ ...base, ...p });
const ids = (b: BookingRow) => huecosParaPresupuesto(b).map((h) => h.id);

describe("qué falta para presupuestar", () => {
  test("una solicitud completa no pide nada", () => {
    assert.deepEqual(ids(base), []);
  });

  test("aeropuerto sin número de vuelo lo pide", () => {
    assert.ok(ids(con({ flight_number: null })).includes("vuelo"));
    assert.ok(ids(con({ flight_number: "   " })).includes("vuelo"));
  });

  test("un trayecto que no toca aeropuerto ni puerto NO pide vuelo", () => {
    const b = con({ origin: "Hotel Can Faustino, Ciutadella", destination: "Cala Galdana", flight_number: null });
    assert.ok(!ids(b).includes("vuelo"));
  });

  test("el puerto también cuenta, y pide el barco", () => {
    const b = con({ origin: "Puerto de Ciutadella", destination: "Es Mercadal", flight_number: null });
    const h = huecosParaPresupuesto(b).find((x) => x.id === "vuelo");
    assert.ok(h);
    assert.match(h.motivo, /puerto/);
  });

  test("niños sin silla pedida: se preguntan edades y pesos", () => {
    assert.ok(ids(con({ children: 2 })).includes("sillas"));
    assert.ok(ids(con({ infants: 1 })).includes("sillas"));
  });

  test("si ya han pedido silla, no se vuelve a preguntar", () => {
    const b = con({ children: 2, extras: { "silla-nino": 2, maxicosi: 0, booster: 0, "maleta-extra": 0 } });
    assert.ok(!ids(b).includes("sillas"));
  });

  test("grupo de 4 o más sin equipaje declarado: se pregunta", () => {
    assert.ok(ids(con({ adults: 4, vehicle_category: "vip-6" })).includes("equipaje"));
    assert.ok(!ids(con({ adults: 2 })).includes("equipaje"));
  });

  test("dirección sin número: se pide un punto exacto", () => {
    const b = con({ origin: "Ciutadella", destination: "Cala Galdana", address: "Calle Mayor", flight_number: null });
    assert.ok(ids(b).includes("direccion"));
  });

  test("recogida en el aeropuerto: la dirección no se pregunta", () => {
    assert.ok(!ids(con({ address: "Calle Mayor" })).includes("direccion"));
  });

  test("`extras` en JSON (como viene de D1) se entiende igual", () => {
    const b = con({ children: 1, extras: JSON.stringify({ "silla-nino": 1 }) });
    assert.ok(!ids(b).includes("sillas"));
  });

  test("un `extras` corrupto no rompe nada", () => {
    assert.doesNotThrow(() => huecosParaPresupuesto(con({ extras: "{roto" })));
  });
});

describe("el correo que se redacta", () => {
  const b = con({ flight_number: null, children: 2, adults: 3 });
  const c = componerPeticionDeInfo(b, "cliente@example.com", "Calma Society");

  test("va en texto plano: ni una etiqueta HTML", () => {
    assert.ok(!/<[a-z/][^>]*>/i.test(c.cuerpo), "no debe haber marcado HTML");
    assert.ok(!/&nbsp;|&amp;|<br/i.test(c.cuerpo));
  });

  test("NO habla de dinero ni de condiciones (no es nuestro)", () => {
    assert.ok(!/€|EUR|precio|tarifa|coste|importe|cancelaci/i.test(c.cuerpo));
  });

  test("está personalizado: nombre de pila, localizador y trayecto", () => {
    assert.match(c.cuerpo, /Estimado\/a María:/);
    assert.match(c.cuerpo, /CS-7K2M/);
    assert.match(c.cuerpo, /Aeropuerto de Menorca/);
    assert.match(c.asunto, /CS-7K2M/);
  });

  test("pide SOLO lo que falta a esta solicitud", () => {
    assert.match(c.cuerpo, /vuelo/i);
    assert.match(c.cuerpo, /Edad y peso/);
    // 3 adultos + 2 niños = 5 pasajeros: también toca preguntar equipaje
    assert.match(c.cuerpo, /maletas grandes/);
    // La dirección era buena: no se pregunta
    assert.ok(!/Dirección exacta/.test(c.cuerpo));
  });

  test("las preguntas van numeradas y son tantas como huecos", () => {
    const num = c.cuerpo.match(/^ {2}\d+\. /gm) ?? [];
    assert.equal(num.length, c.huecos.length);
    assert.equal(c.huecos.length, 3);
  });

  test("responde en el idioma del cliente", () => {
    const en = componerPeticionDeInfo(con({ locale: "en", flight_number: null }), "x@example.com", "Calma Society");
    assert.match(en.cuerpo, /^Dear /);
    assert.match(en.cuerpo, /arrival flight or ferry number/);
    assert.match(en.asunto, /details missing/);
    assert.ok(!/Estimado/.test(en.cuerpo));
  });

  test("un locale desconocido cae a español", () => {
    const x = componerPeticionDeInfo(con({ locale: "de" }), "x@example.com", "Calma Society");
    assert.match(x.cuerpo, /^Estimado/);
  });

  test("firma con quien escribe", () => {
    assert.match(c.cuerpo, /Calma Society$/);
  });

  test("la ida y vuelta muestra la vuelta; la ida sola, no", () => {
    const iv = componerPeticionDeInfo(
      con({ trip_type: "ida-vuelta", return_date: "2026-09-19", return_time: "10:00", flight_number: null }),
      "x@example.com",
      "Calma Society",
    );
    assert.match(iv.cuerpo, /Vuelta: 2026-09-19 10:00/);
    assert.ok(!/Vuelta:/.test(c.cuerpo));
  });

  test("el mailto lleva destinatario, asunto y cuerpo codificados", () => {
    const h = mailtoHref(c);
    assert.ok(h.startsWith("mailto:cliente%40example.com?"));
    assert.match(h, /subject=/);
    assert.match(h, /body=/);
    // Los saltos de línea viajan codificados, no crudos: si no, se corta el cuerpo.
    assert.ok(!h.includes("\n"));
    assert.ok(h.includes("%0A"));
  });
});

test("el registro es de USTED de principio a fin, sin colarse un tuteo", () => {
  const b = con({ flight_number: null, children: 2, adults: 3, locale: "es" });
  const cuerpo = componerPeticionDeInfo(b, "x@example.com", "Calma Society").cuerpo;
  // Formas de vosotros/tú que romperían el tono a media carta.
  assert.ok(!/\b(lleváis|tenéis|sois|vuestro|vuestra|indícanos|dinos|puedes|tienes)\b/i.test(cuerpo), cuerpo);
  assert.match(cuerpo, /Estimado\/a/);
  assert.match(cuerpo, /Puede responder/);
});
