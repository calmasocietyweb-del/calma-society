import { test } from "node:test";
import assert from "node:assert/strict";
import { SCHEMA_SQL, insertStatement, LIST_SQL, UPDATE_STATUS_SQL, BOOKING_STATUSES } from "./sql.ts";
import type { BookingInput } from "./validate.ts";

const value: BookingInput = {
  locale: "es",
  origin: "Aeropuerto de Menorca (MAH)",
  destination: "Fornells",
  tripType: "ida",
  pickupDate: "2026-08-15",
  pickupTime: "12:30",
  returnDate: null,
  returnTime: null,
  flightNumber: "VY3715",
  pickupTimeRequested: null,
  adults: 2,
  children: 0,
  infants: 0,
  vehicleCategory: "privado-3",
  name: "Nombre Prueba",
  company: null,
  idDocument: "00000000T",
  email: "prueba@example.com",
  phone: "+34 600 000 000",
  address: "Calle Falsa 1",
  postalCode: "07700",
  city: "Maó",
  country: "España",
  coupon: null,
  comments: null,
  extras: { "silla-nino": 0, maxicosi: 0, booster: 0, "maleta-extra": 1 },
  marketingOptin: false,
};

test("insertStatement: tantos parámetros como interrogantes, ref primero", () => {
  const { sql, params } = insertStatement(value, "CS-2026-ABC234", "2026-07-06T10:00:00.000Z");
  const holes = (sql.match(/\?/g) ?? []).length;
  assert.equal(params.length, holes);
  assert.equal(params[0], "CS-2026-ABC234");
  assert.ok(sql.startsWith("INSERT INTO bookings"));
});

test("extras viajan como JSON y los booleanos como 0/1", () => {
  const { params } = insertStatement(value, "CS-2026-ABC234", "2026-07-06T10:00:00.000Z");
  assert.ok(params.includes(JSON.stringify(value.extras)));
  assert.ok(params.includes(0)); // marketingOptin false → 0
});

test("el esquema crea la tabla y las consultas usan estados válidos", () => {
  assert.ok(SCHEMA_SQL.includes("CREATE TABLE IF NOT EXISTS bookings"));
  assert.ok(LIST_SQL.includes("ORDER BY created_at DESC"));
  assert.ok(UPDATE_STATUS_SQL.includes("UPDATE bookings SET status"));
  assert.deepEqual(BOOKING_STATUSES, ["solicitada", "confirmada", "rechazada", "cancelada"]);
});
