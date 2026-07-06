import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBookingInput } from "./validate.ts";

/** Solicitud válida de base para mutar en cada test. */
function base(): Record<string, string> {
  return {
    locale: "es",
    origin: "Aeropuerto de Menorca (MAH)",
    destination: "Hotel Artiem, Fornells",
    tripType: "ida",
    pickupDate: "2026-08-15",
    pickupTime: "12:30",
    flightNumber: "VY3715",
    pickupTimeRequested: "13:00",
    adults: "2",
    children: "1",
    infants: "0",
    vehicleCategory: "vip-6",
    name: "Nombre Prueba",
    idDocument: "00000000T",
    email: "prueba@example.com",
    phone: "+34 600 000 000",
    address: "Calle Falsa 1",
    postalCode: "07700",
    city: "Maó",
    country: "España",
    coupon: "CALMASOCIETY",
    comments: "Equipaje voluminoso",
    "extra-silla-nino": "1",
    "extra-maleta-extra": "2",
    terms: "on",
    marketingOptin: "on",
    web: "", // honeypot vacío = humano
  };
}

test("acepta una solicitud completa y normaliza tipos", () => {
  const r = validateBookingInput(base());
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.adults, 2);
  assert.equal(r.value.extras["silla-nino"], 1);
  assert.equal(r.value.extras["maxicosi"], 0);
  assert.equal(r.value.marketingOptin, true);
  assert.equal(r.value.returnDate, null);
});

test("rechaza si faltan obligatorios y lista los campos", () => {
  const raw = base();
  delete raw.name;
  raw.email = "no-es-email";
  const r = validateBookingInput(raw);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.includes("name"));
  assert.ok(r.errors.includes("email"));
});

test("ida y vuelta exige fecha y hora de regreso", () => {
  const raw = { ...base(), tripType: "ida-vuelta" };
  const r = validateBookingInput(raw);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.includes("returnDate"));
  assert.ok(r.errors.includes("returnTime"));
});

test("la capacidad de la categoría manda (2 adultos + 1 niño no caben en vip-2)", () => {
  const raw = { ...base(), vehicleCategory: "vip-2" };
  const r = validateBookingInput(raw);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.includes("vehicleCategory"));
});

test("sin aceptar términos no hay reserva", () => {
  const raw = base();
  delete raw.terms;
  const r = validateBookingInput(raw);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.includes("terms"));
});

test("honeypot relleno = spam", () => {
  const r = validateBookingInput({ ...base(), web: "http://spam" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.deepEqual(r.errors, ["spam"]);
});
