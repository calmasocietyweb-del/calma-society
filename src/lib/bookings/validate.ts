/**
 * Validación de la solicitud de reserva de transfer (servidor).
 * Sin dependencias: la web no añade librerías para un conjunto fijo
 * de campos (CLAUDE.md §11). Devuelve la lista de campos con error
 * para que la API responda algo útil.
 */
import { categoryById, EXTRA_IDS, type ExtraId, type VehicleCategoryId } from "./catalog.ts";

export interface BookingInput {
  locale: "es" | "en";
  origin: string;
  destination: string;
  tripType: "ida" | "ida-vuelta";
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM (hora de salida o de llegada del vuelo)
  returnDate: string | null;
  returnTime: string | null;
  flightNumber: string | null;
  pickupTimeRequested: string | null; // «hora deseada de recogida»
  adults: number;
  children: number;
  infants: number;
  vehicleCategory: VehicleCategoryId;
  name: string;
  company: string | null;
  idDocument: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  coupon: string | null;
  comments: string | null;
  extras: Record<ExtraId, number>;
  marketingOptin: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUIRED_TEXT = [
  "origin",
  "destination",
  "name",
  "idDocument",
  "phone",
  "address",
  "postalCode",
  "city",
  "country",
] as const;

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

function optional(v: string | undefined): string | null {
  const s = clean(v);
  return s === "" ? null : s;
}

function intIn(v: string | undefined, min: number, max: number): number | null {
  const s = clean(v);
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

export function validateBookingInput(
  raw: Record<string, string | undefined>,
): { ok: true; value: BookingInput } | { ok: false; errors: string[] } {
  // Honeypot: un humano deja el campo oculto vacío.
  if (clean(raw.web) !== "") return { ok: false, errors: ["spam"] };

  const errors: string[] = [];

  for (const field of REQUIRED_TEXT) {
    if (clean(raw[field]) === "") errors.push(field);
  }

  const locale = raw.locale === "en" ? "en" : "es";

  const email = clean(raw.email);
  if (!EMAIL_RE.test(email)) errors.push("email");

  const tripType = raw.tripType === "ida-vuelta" ? "ida-vuelta" : raw.tripType === "ida" ? "ida" : null;
  if (!tripType) errors.push("tripType");

  const pickupDate = clean(raw.pickupDate);
  if (!DATE_RE.test(pickupDate)) errors.push("pickupDate");
  const pickupTime = clean(raw.pickupTime);
  if (!TIME_RE.test(pickupTime)) errors.push("pickupTime");

  let returnDate: string | null = null;
  let returnTime: string | null = null;
  if (tripType === "ida-vuelta") {
    returnDate = clean(raw.returnDate);
    returnTime = clean(raw.returnTime);
    if (!DATE_RE.test(returnDate)) errors.push("returnDate");
    if (!TIME_RE.test(returnTime)) errors.push("returnTime");
  }

  const pickupTimeRequested = optional(raw.pickupTimeRequested);
  if (pickupTimeRequested !== null && !TIME_RE.test(pickupTimeRequested)) {
    errors.push("pickupTimeRequested");
  }

  const adults = intIn(raw.adults, 1, 50);
  const children = intIn(raw.children, 0, 50);
  const infants = intIn(raw.infants, 0, 50);
  if (adults === null) errors.push("adults");
  if (children === null) errors.push("children");
  if (infants === null) errors.push("infants");

  const category = categoryById(clean(raw.vehicleCategory));
  if (!category) {
    errors.push("vehicleCategory");
  } else if (adults !== null && children !== null && infants !== null) {
    if (adults + children + infants > category.maxPax) errors.push("vehicleCategory");
  }

  const extras = {} as Record<ExtraId, number>;
  for (const id of EXTRA_IDS) {
    const n = raw[`extra-${id}`] === undefined ? 0 : intIn(raw[`extra-${id}`], 0, 9);
    if (n === null) {
      errors.push(`extra-${id}`);
      extras[id] = 0;
    } else {
      extras[id] = n;
    }
  }

  if (raw.terms !== "on") errors.push("terms");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      locale,
      origin: clean(raw.origin),
      destination: clean(raw.destination),
      tripType: tripType as "ida" | "ida-vuelta",
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      flightNumber: optional(raw.flightNumber),
      pickupTimeRequested,
      adults: adults as number,
      children: children as number,
      infants: infants as number,
      vehicleCategory: (category as NonNullable<ReturnType<typeof categoryById>>).id,
      name: clean(raw.name),
      company: optional(raw.company),
      idDocument: clean(raw.idDocument),
      email,
      phone: clean(raw.phone),
      address: clean(raw.address),
      postalCode: clean(raw.postalCode),
      city: clean(raw.city),
      country: clean(raw.country),
      coupon: optional(raw.coupon),
      comments: optional(raw.comments),
      extras,
      marketingOptin: raw.marketingOptin === "on",
    },
  };
}
