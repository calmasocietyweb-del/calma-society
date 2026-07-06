/**
 * SQL de la tabla `bookings` en D1 (spec §4). El esquema también vive en
 * `db/reservas-schema.sql` (misma sentencia) como documentación del encendido.
 * `type` y `provider` son los enchufes del futuro (API de Menorca Bus).
 */
import type { BookingInput } from "./validate.ts";

export const BOOKING_STATUSES = ["solicitada", "confirmada", "rechazada", "cancelada"] as const;

export const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS bookings (
  ref TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitada',
  type TEXT NOT NULL DEFAULT 'transfer',
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_ref TEXT,
  provider_status TEXT,
  quoted_price TEXT,
  locale TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  trip_type TEXT NOT NULL,
  pickup_date TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  return_date TEXT,
  return_time TEXT,
  flight_number TEXT,
  pickup_time_requested TEXT,
  adults INTEGER NOT NULL,
  children INTEGER NOT NULL,
  infants INTEGER NOT NULL,
  vehicle_category TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  id_document TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  coupon TEXT,
  comments TEXT,
  extras TEXT NOT NULL,
  marketing_optin INTEGER NOT NULL,
  terms_accepted_at TEXT NOT NULL
);`;

export function insertStatement(
  value: BookingInput,
  ref: string,
  createdAt: string,
): { sql: string; params: (string | number | null)[] } {
  const sql = `INSERT INTO bookings (
    ref, created_at, locale, origin, destination, trip_type,
    pickup_date, pickup_time, return_date, return_time,
    flight_number, pickup_time_requested,
    adults, children, infants, vehicle_category,
    name, company, id_document, email, phone,
    address, postal_code, city, country,
    coupon, comments, extras, marketing_optin, terms_accepted_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params: (string | number | null)[] = [
    ref,
    createdAt,
    value.locale,
    value.origin,
    value.destination,
    value.tripType,
    value.pickupDate,
    value.pickupTime,
    value.returnDate,
    value.returnTime,
    value.flightNumber,
    value.pickupTimeRequested,
    value.adults,
    value.children,
    value.infants,
    value.vehicleCategory,
    value.name,
    value.company,
    value.idDocument,
    value.email,
    value.phone,
    value.address,
    value.postalCode,
    value.city,
    value.country,
    value.coupon,
    value.comments,
    JSON.stringify(value.extras),
    value.marketingOptin ? 1 : 0,
    createdAt,
  ];
  return { sql, params };
}

/** Listado del panel: ?1 = estado o NULL (todos). Límite sano para la v1. */
export const LIST_SQL =
  "SELECT * FROM bookings WHERE (?1 IS NULL OR status = ?1) ORDER BY created_at DESC LIMIT 200";

export const UPDATE_STATUS_SQL = "UPDATE bookings SET status = ?1 WHERE ref = ?2";
