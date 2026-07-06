# Reservas de transfers v1 — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistema de reservas de transfers que calca la fórmula de menorcabus.com, nace APAGADO y queda listo para enchufar la API de Menorca Bus (spec: `docs/superpowers/specs/2026-07-06-reservas-transfers-design.md`).

**Architecture:** Lógica pura y testeada en `src/lib/bookings/` (catálogo, validación, localizador, SQL) · API en Cloudflare Pages Functions (`functions/api/reservas.ts`) sobre D1 · formulario ES/EN como página estática de 3 secciones-paso sin JS · panel del dueño en el despliegue Vercel existente (`/panel/reservas`, Basic auth como `/panel/analitica`).

**Tech Stack:** Astro estático + Tailwind v4 (tokens de marca) · Cloudflare Pages Functions + D1 (sin dependencias nuevas: tipos D1 mínimos declarados a mano) · tests con `node --test` (patrón del planner).

## Global Constraints

- **Cero dependencias npm nuevas** (CLAUDE.md §11: preguntar antes; decidido no añadir).
- **Cero JavaScript de cliente** en las páginas nuevas (CLAUDE.md §3.5).
- **`bookings.enabled: false`**: página en `noindex`, fuera del sitemap, sin enlazar desde nada; la API responde 503 salvo `BOOKINGS_ENABLED === "true"` (variable de Cloudflare).
- Comentarios y copy en español (código e identificadores en inglés); copy EN nativo, no traducción literal.
- Tokens de marca SIEMPRE (lino/arena/niebla/tinta/piedra/terracota/arcilla/oro; Fraunces para titulares vía `font-display`).
- Los tests se ejecutan con `npm test` (glob de `node --test`); `npx astro check` y `npm run build` deben quedar a 0 errores.
- No tocar los CTAs existentes a menorcabus.com.

---

### Task 1: Catálogo de categorías de vehículo y extras

**Files:**
- Create: `src/lib/bookings/catalog.ts`
- Test: `src/lib/bookings/catalog.test.ts`
- Modify: `package.json` (script `test`)

**Interfaces:**
- Produces: `VehicleCategoryId`, `VehicleCategory`, `VEHICLE_CATEGORIES`, `categoryById(id)`, `ExtraId`, `EXTRAS`, `EXTRA_IDS`.

- [x] **Step 1: Ampliar el glob del script de test en `package.json`**

Cambiar la línea del script `test`:

```json
"test": "node --test \"src/lib/planner/**/*.test.ts\" \"src/lib/bookings/**/*.test.ts\""
```

- [x] **Step 2: Escribir el test que falla**

`src/lib/bookings/catalog.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { VEHICLE_CATEGORIES, categoryById, EXTRAS, EXTRA_IDS } from "./catalog";

test("hay 5 categorías con la fórmula de menorcabus.com", () => {
  assert.deepEqual(
    VEHICLE_CATEGORIES.map((c) => c.id),
    ["privado-3", "shuttle", "vip-2", "vip-2-superior", "vip-6"],
  );
});

test("cada categoría tiene capacidad y textos ES/EN completos", () => {
  for (const c of VEHICLE_CATEGORIES) {
    assert.ok(c.maxPax >= 2, c.id);
    assert.ok(c.name.es.length > 0 && c.name.en.length > 0, c.id);
    assert.ok(c.points.es.length >= 2 && c.points.en.length === c.points.es.length, c.id);
  }
});

test("categoryById devuelve la categoría o undefined", () => {
  assert.equal(categoryById("shuttle")?.maxPax, 50);
  assert.equal(categoryById("no-existe"), undefined);
});

test("hay 4 extras (fórmula de menorcabus.com) y EXTRA_IDS los lista", () => {
  assert.deepEqual(
    EXTRAS.map((e) => e.id),
    ["silla-nino", "maxicosi", "booster", "maleta-extra"],
  );
  assert.deepEqual(EXTRA_IDS, EXTRAS.map((e) => e.id));
});
```

- [x] **Step 3: Ejecutar y ver que falla**

Run: `npm test`
Expected: FAIL (`Cannot find module './catalog'`).

- [x] **Step 4: Implementar `src/lib/bookings/catalog.ts`**

```ts
/**
 * Catálogo de reserva de transfers — calca la fórmula del panel de
 * menorcabus.com (capturada el 2026-07-06). SIN precios: los precios
 * llegarán con la API de Menorca Bus (punto de enchufe nº1).
 */

export type VehicleCategoryId =
  | "privado-3"
  | "shuttle"
  | "vip-2"
  | "vip-2-superior"
  | "vip-6";

interface Localized {
  es: string;
  en: string;
}

export interface VehicleCategory {
  id: VehicleCategoryId;
  /** Plazas máximas (el shuttle es autocar compartido: sin límite práctico). */
  maxPax: number;
  badge: Localized;
  name: Localized;
  tagline: Localized;
  /** Puntos de la tarjeta, mismo orden ES/EN. */
  points: { es: string[]; en: string[] };
}

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = [
  {
    id: "privado-3",
    maxPax: 3,
    badge: { es: "Privado", en: "Private" },
    name: { es: "Privado · hasta 3 pasajeros", en: "Private · up to 3 passengers" },
    tagline: { es: "Traslado privado, directo y a tu hora", en: "A private, direct transfer on your schedule" },
    points: {
      es: [
        "Servicio exclusivo para tu reserva, hasta 3 pasajeros.",
        "Puerta a puerta: recogida y llegada directa al punto indicado.",
        "Conductor profesional durante todo el trayecto.",
      ],
      en: [
        "Exclusive service for your booking, up to 3 passengers.",
        "Door to door: direct pick-up and drop-off at your address.",
        "Professional driver for the whole journey.",
      ],
    },
  },
  {
    id: "shuttle",
    maxPax: 50,
    badge: { es: "Shuttle", en: "Shuttle" },
    name: { es: "Shuttle · traslado compartido", en: "Shuttle · shared transfer" },
    tagline: { es: "La opción económica, con paradas", en: "The budget option, with stops" },
    points: {
      es: [
        "Espera en el aeropuerto hasta completar la salida prevista.",
        "La hora definitiva de recogida se confirma 24 horas antes.",
        "El trayecto puede incluir paradas intermedias.",
        "Incluye 1 maleta mediana (hasta 20 kg) y equipaje de mano por pasajero.",
      ],
      en: [
        "Waits at the airport until the scheduled departure is complete.",
        "The final pick-up time is confirmed 24 hours in advance.",
        "The route may include intermediate stops.",
        "Includes 1 medium suitcase (up to 20 kg) and hand luggage per passenger.",
      ],
    },
  },
  {
    id: "vip-2",
    maxPax: 2,
    badge: { es: "VIP", en: "VIP" },
    name: { es: "VIP · 2 pasajeros", en: "VIP · 2 passengers" },
    tagline: { es: "Traslado privado en categoría premium", en: "A private transfer in premium class" },
    points: {
      es: [
        "Categoría premium: un nivel superior de confort frente al traslado estándar.",
        "Vehículos de alta gama seleccionados según disponibilidad.",
        "Servicio flexible si necesitas ajustar el trayecto o hacer una parada.",
      ],
      en: [
        "Premium class: a step up in comfort from the standard transfer.",
        "High-end vehicles selected subject to availability.",
        "Flexible service if you need to adjust the route or make a stop.",
      ],
    },
  },
  {
    id: "vip-2-superior",
    maxPax: 2,
    badge: { es: "Superior", en: "Superior" },
    name: { es: "VIP Superior · 2 pasajeros", en: "VIP Superior · 2 passengers" },
    tagline: { es: "Traslado premium de categoría superior", en: "A premium transfer, superior class" },
    points: {
      es: [
        "Máximo confort: una experiencia más exclusiva.",
        "Vehículos de representación seleccionados según disponibilidad.",
        "Atención personalizada en cada detalle del traslado.",
      ],
      en: [
        "Maximum comfort: a more exclusive experience.",
        "Executive vehicles selected subject to availability.",
        "Personalised care in every detail of the transfer.",
      ],
    },
  },
  {
    id: "vip-6",
    maxPax: 6,
    badge: { es: "VIP", en: "VIP" },
    name: { es: "VIP · hasta 6 pasajeros", en: "VIP · up to 6 passengers" },
    tagline: { es: "Traslado privado premium para grupos", en: "A premium private transfer for groups" },
    points: {
      es: [
        "Categoría premium con espacio para hasta 6 pasajeros.",
        "Vehículos de alta gama seleccionados según disponibilidad.",
        "Puerta a puerta, con conductor profesional.",
      ],
      en: [
        "Premium class with room for up to 6 passengers.",
        "High-end vehicles selected subject to availability.",
        "Door to door, with a professional driver.",
      ],
    },
  },
];

export function categoryById(id: string): VehicleCategory | undefined {
  return VEHICLE_CATEGORIES.find((c) => c.id === id);
}

export type ExtraId = "silla-nino" | "maxicosi" | "booster" | "maleta-extra";

export interface Extra {
  id: ExtraId;
  name: Localized;
}

export const EXTRAS: readonly Extra[] = [
  { id: "silla-nino", name: { es: "Silla de niño", en: "Child seat" } },
  { id: "maxicosi", name: { es: "Maxicosi", en: "Maxicosi" } },
  { id: "booster", name: { es: "Elevador (booster)", en: "Booster seat" } },
  { id: "maleta-extra", name: { es: "Maleta extra", en: "Extra suitcase" } },
];

export const EXTRA_IDS: readonly ExtraId[] = EXTRAS.map((e) => e.id);
```

- [x] **Step 5: Ejecutar los tests y ver que pasan**

Run: `npm test`
Expected: PASS (los 69 del planner + 4 nuevos).

- [x] **Step 6: Commit**

```bash
git add src/lib/bookings/catalog.ts src/lib/bookings/catalog.test.ts package.json
git commit -m "feat(reservas): catalogo de categorias de vehiculo y extras (formula menorcabus.com)"
```

---

### Task 2: Validación de la solicitud de reserva

**Files:**
- Create: `src/lib/bookings/validate.ts`
- Test: `src/lib/bookings/validate.test.ts`

**Interfaces:**
- Consumes: `categoryById`, `EXTRA_IDS`, `ExtraId`, `VehicleCategoryId` de `./catalog`.
- Produces: `BookingInput` (interfaz) y `validateBookingInput(raw: Record<string, string | undefined>): { ok: true; value: BookingInput } | { ok: false; errors: string[] }`.

- [x] **Step 1: Escribir el test que falla**

`src/lib/bookings/validate.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBookingInput } from "./validate";

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
```

- [x] **Step 2: Ejecutar y ver que falla**

Run: `npm test`
Expected: FAIL (`Cannot find module './validate'`).

- [x] **Step 3: Implementar `src/lib/bookings/validate.ts`**

```ts
/**
 * Validación de la solicitud de reserva de transfer (servidor).
 * Sin dependencias: la web no añade librerías para un conjunto fijo
 * de campos (CLAUDE.md §11). Devuelve la lista de campos con error
 * para que la API responda algo útil.
 */
import { categoryById, EXTRA_IDS, type ExtraId, type VehicleCategoryId } from "./catalog";

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
```

- [x] **Step 4: Ejecutar los tests y ver que pasan**

Run: `npm test`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/lib/bookings/validate.ts src/lib/bookings/validate.test.ts
git commit -m "feat(reservas): validacion de la solicitud de transfer (sin dependencias)"
```

---

### Task 3: Localizador y sentencias SQL de D1

**Files:**
- Create: `src/lib/bookings/ref.ts`
- Create: `src/lib/bookings/sql.ts`
- Create: `db/reservas-schema.sql`
- Test: `src/lib/bookings/ref.test.ts`
- Test: `src/lib/bookings/sql.test.ts`

**Interfaces:**
- Consumes: `BookingInput` de `./validate`.
- Produces: `makeBookingRef(date: Date, rand?: () => number): string` · `SCHEMA_SQL: string` · `BOOKING_STATUSES: readonly string[]` · `insertStatement(value: BookingInput, ref: string, createdAt: string): { sql: string; params: (string | number | null)[] }` · `LIST_SQL: string` · `UPDATE_STATUS_SQL: string`.

- [x] **Step 1: Escribir los tests que fallan**

`src/lib/bookings/ref.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeBookingRef } from "./ref";

test("formato CS-AAAA-XXXXXX sin caracteres ambiguos", () => {
  const ref = makeBookingRef(new Date("2026-08-15T10:00:00Z"), () => 0.42);
  assert.match(ref, /^CS-2026-[A-HJ-NP-Z2-9]{6}$/);
});

test("con azar distinto sale localizador distinto", () => {
  const a = makeBookingRef(new Date("2026-08-15"), () => 0.1);
  const b = makeBookingRef(new Date("2026-08-15"), () => 0.9);
  assert.notEqual(a, b);
});
```

`src/lib/bookings/sql.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SCHEMA_SQL, insertStatement, LIST_SQL, UPDATE_STATUS_SQL, BOOKING_STATUSES } from "./sql";
import type { BookingInput } from "./validate";

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
```

- [x] **Step 2: Ejecutar y ver que fallan**

Run: `npm test`
Expected: FAIL (módulos `./ref` y `./sql` no existen).

- [x] **Step 3: Implementar `src/lib/bookings/ref.ts`**

```ts
/** Localizador corto y legible por teléfono: CS-2026-XXXXXX (sin 0/O/1/I/L). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeBookingRef(date: Date, rand: () => number = Math.random): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  }
  return `CS-${date.getFullYear()}-${suffix}`;
}
```

- [x] **Step 4: Implementar `src/lib/bookings/sql.ts`**

```ts
/**
 * SQL de la tabla `bookings` en D1 (spec §4). El esquema también vive en
 * `db/reservas-schema.sql` (misma sentencia) como documentación del encendido.
 * `type` y `provider` son los enchufes del futuro (API de Menorca Bus).
 */
import type { BookingInput } from "./validate";

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
```

- [x] **Step 5: Crear `db/reservas-schema.sql`** con EXACTAMENTE la misma sentencia `CREATE TABLE` de `SCHEMA_SQL` (copiar el bloque) precedida del comentario:

```sql
-- Esquema de la tabla de reservas (D1). Fuente de verdad en código:
-- src/lib/bookings/sql.ts (SCHEMA_SQL). Este archivo documenta el encendido:
--   npx wrangler d1 create calma-reservas
--   npx wrangler d1 execute calma-reservas --file=db/reservas-schema.sql
```

- [x] **Step 6: Ejecutar los tests y ver que pasan**

Run: `npm test`
Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add src/lib/bookings/ref.ts src/lib/bookings/ref.test.ts src/lib/bookings/sql.ts src/lib/bookings/sql.test.ts db/reservas-schema.sql
git commit -m "feat(reservas): localizador CS-AAAA-XXXXXX y SQL de la tabla bookings (D1)"
```

---

### Task 4: Interruptor `bookings.enabled` y sitemap

**Files:**
- Modify: `src/config/site.ts` (junto al bloque `newsletter`)
- Modify: `astro.config.ts` (filtro del sitemap, patrón del lead magnet en líneas 36-37 y 62-69)

**Interfaces:**
- Produces: `SITE.bookings: { enabled: boolean }` (lo consumen las páginas de Task 5/6 y el filtro del sitemap).

- [x] **Step 1: Añadir el bloque en `src/config/site.ts`** (al mismo nivel que `newsletter`, con este comentario):

```ts
  /**
   * Reservas de transfers (v1 APAGADA — spec docs/superpowers/specs/
   * 2026-07-06-reservas-transfers-design.md). Mientras `enabled` sea false:
   * la página existe pero va en noindex, fuera del sitemap y sin enlazar;
   * la API de Cloudflare responde 503 (variable BOOKINGS_ENABLED aparte).
   * Encendido completo: docs/RESERVAS-TRANSFERS.md.
   */
  bookings: {
    enabled: false,
  },
```

- [x] **Step 2: Excluir del sitemap en `astro.config.ts`** — junto a `const lmLive` añadir:

```ts
// Reservas de transfers: misma mecánica que el imán (noindex + fuera del
// sitemap mientras el interruptor esté apagado).
const bookingsLive = SITE.bookings.enabled;
```

y dentro del `filter` del sitemap, tras la condición del imán, añadir:

```ts
        (bookingsLive ||
          (!page.includes("/reservar-traslado") && !page.includes("/book-transfer"))) &&
```

(colocada de forma que el `filter` siga devolviendo un único booleano con `&&`).

- [x] **Step 3: Verificar que compila**

Run: `npx astro check && npm run build`
Expected: 0 errores; build de 491+ páginas.

- [x] **Step 4: Commit**

```bash
git add src/config/site.ts astro.config.ts
git commit -m "feat(reservas): interruptor bookings.enabled (apagado) y exclusion del sitemap"
```

---

### Task 5: API de reservas (Cloudflare Pages Function)

**Files:**
- Create: `functions/api/reservas.ts`
- Create: `functions/tsconfig.json`

**Interfaces:**
- Consumes: `validateBookingInput` (Task 2), `makeBookingRef` (Task 3), `SCHEMA_SQL`/`insertStatement`/`LIST_SQL`/`UPDATE_STATUS_SQL`/`BOOKING_STATUSES` (Task 3).
- Produces: `POST /api/reservas` (form-data → 303 a la página de gracias con `?ref=`) · `GET /api/reservas?status=` (JSON, cabecera `x-admin-key`) · `PATCH /api/reservas` (JSON `{ref, status}`, cabecera `x-admin-key`). Lo consume el panel de Task 7.

- [x] **Step 1: Crear `functions/tsconfig.json`** (typecheck propio; las Functions no pasan por `astro check`):

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "lib": ["es2022", "webworker"],
    "types": [],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": false
  },
  "include": ["./**/*.ts", "../src/lib/bookings/**/*.ts"],
  "exclude": ["../src/lib/bookings/**/*.test.ts"]
}
```

- [x] **Step 2: Implementar `functions/api/reservas.ts`**

```ts
/**
 * API de reservas de transfers (Cloudflare Pages Functions + D1).
 * v1 = proveedor "manual": guarda la solicitud y el dueño la gestiona
 * desde /panel/reservas (Vercel). Puntos de enchufe de la futura API de
 * Menorca Bus: cotización (paso 2), vuelos (paso 1), cupón y pago (paso 3)
 * — ver docs/RESERVAS-TRANSFERS.md.
 *
 * Interruptores: BOOKINGS_ENABLED ("true" para aceptar POST) y
 * RESERVAS_ADMIN_KEY (cabecera x-admin-key para GET/PATCH del panel).
 */
import { validateBookingInput } from "../../src/lib/bookings/validate";
import { makeBookingRef } from "../../src/lib/bookings/ref";
import {
  SCHEMA_SQL,
  insertStatement,
  LIST_SQL,
  UPDATE_STATUS_SQL,
  BOOKING_STATUSES,
} from "../../src/lib/bookings/sql";

// Tipos mínimos de D1 (evitamos la dependencia @cloudflare/workers-types).
interface D1Result {
  results?: unknown[];
  meta?: { changes?: number };
}
interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all(): Promise<D1Result>;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

/**
 * Crea la tabla si no existe. OJO: se usa prepare().run() y NO exec()
 * porque exec() de D1 trocea por saltos de línea y rompe una sentencia
 * CREATE TABLE multilínea.
 */
async function ensureSchema(db: D1Database): Promise<void> {
  await db.prepare(SCHEMA_SQL).run();
}

interface Env {
  DB: D1Database;
  BOOKINGS_ENABLED?: string;
  RESERVAS_ADMIN_KEY?: string;
}

type Ctx = { request: Request; env: Env };

const THANKS_PATH: Record<string, string> = {
  es: "/reservar-traslado/gracias",
  en: "/en/book-transfer/thanks",
};

function adminOk(request: Request, env: Env): boolean {
  const key = env.RESERVAS_ADMIN_KEY ?? "";
  return key !== "" && request.headers.get("x-admin-key") === key;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** Alta de una solicitud (el formulario de la web envía form-data clásico). */
export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  if (env.BOOKINGS_ENABLED !== "true") {
    return new Response("Las reservas no están disponibles todavía.", { status: 503 });
  }
  const form = await request.formData();
  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const result = validateBookingInput(raw);
  if (!result.ok) {
    return new Response(`Revisa estos campos: ${result.errors.join(", ")}`, { status: 400 });
  }
  await ensureSchema(env.DB);
  const createdAt = new Date().toISOString();
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = makeBookingRef(new Date());
    const { sql, params } = insertStatement(result.value, ref, createdAt);
    try {
      await env.DB.prepare(sql).bind(...params).run();
      const path = THANKS_PATH[result.value.locale] ?? THANKS_PATH.es;
      const to = new URL(`${path}?ref=${encodeURIComponent(ref)}`, request.url);
      return Response.redirect(to.toString(), 303);
    } catch (e) {
      lastError = e; // choque de localizador (PRIMARY KEY): reintenta una vez
    }
  }
  console.error("reservas: insert fallido", lastError);
  return new Response("No se pudo registrar la reserva. Inténtalo de nuevo.", { status: 500 });
}

/** Listado para el panel (Vercel) — cabecera x-admin-key obligatoria. */
export async function onRequestGet({ request, env }: Ctx): Promise<Response> {
  if (!adminOk(request, env)) return new Response("No autorizado", { status: 401 });
  await ensureSchema(env.DB);
  const status = new URL(request.url).searchParams.get("status");
  const valid = status && (BOOKING_STATUSES as readonly string[]).includes(status) ? status : null;
  const { results } = await env.DB.prepare(LIST_SQL).bind(valid).all();
  return json({ bookings: results ?? [] });
}

/** Cambio de estado desde el panel: {ref, status} — x-admin-key obligatoria. */
export async function onRequestPatch({ request, env }: Ctx): Promise<Response> {
  if (!adminOk(request, env)) return new Response("No autorizado", { status: 401 });
  const body = (await request.json().catch(() => null)) as { ref?: string; status?: string } | null;
  const ref = body?.ref ?? "";
  const status = body?.status ?? "";
  if (!ref || !(BOOKING_STATUSES as readonly string[]).includes(status)) {
    return new Response("Petición no válida", { status: 400 });
  }
  const r = await env.DB.prepare(UPDATE_STATUS_SQL).bind(status, ref).run();
  if (!r.meta?.changes) return new Response("Reserva no encontrada", { status: 404 });
  return json({ ok: true });
}
```

- [x] **Step 3: Typecheck de las Functions**

Run: `npx tsc --noEmit -p functions/tsconfig.json`
Expected: sin errores.

- [x] **Step 4: Verificar que la web no se ve afectada**

Run: `npm test && npm run build`
Expected: tests PASS; build igual que antes (la carpeta `functions/` no entra en el build de Astro; Cloudflare Pages la recoge sola al desplegar).

- [x] **Step 5: Commit**

```bash
git add functions/api/reservas.ts functions/tsconfig.json
git commit -m "feat(reservas): API en Cloudflare Pages Functions sobre D1 (alta, listado y estado)"
```

---

### Task 6: Página de reserva ES + EN (3 secciones-paso, sin JS) y páginas de gracias

**Files:**
- Create: `src/pages/reservar-traslado/index.astro`
- Create: `src/pages/reservar-traslado/gracias.astro`
- Create: `src/pages/en/book-transfer/index.astro`
- Create: `src/pages/en/book-transfer/thanks.astro`

**Interfaces:**
- Consumes: `VEHICLE_CATEGORIES`, `EXTRAS` (Task 1), `SITE.bookings.enabled` (Task 4), `BaseLayout` (prop `noindex`, patrón de `src/pages/calas-tranquilas.astro`).
- Produces: formulario que hace `POST /api/reservas` con EXACTAMENTE los nombres de campo que espera `validateBookingInput` (Task 2): `locale, origin, destination, tripType, pickupDate, pickupTime, returnDate, returnTime, flightNumber, pickupTimeRequested, adults, children, infants, vehicleCategory, name, company, idDocument, email, phone, address, postalCode, city, country, coupon, comments, extra-silla-nino, extra-maxicosi, extra-booster, extra-maleta-extra, terms, marketingOptin, web` (honeypot).

- [x] **Step 1: Crear `src/pages/reservar-traslado/index.astro`**

Estructura obligatoria (los textos exactos pueden pulirse manteniendo la voz):

```astro
---
/**
 * Reserva de transfer (v1, APAGADA tras SITE.bookings.enabled — spec
 * docs/superpowers/specs/2026-07-06-reservas-transfers-design.md).
 * Calca la fórmula del panel de menorcabus.com en 3 secciones-paso
 * (la web es estática: un solo envío al final, sin JS de cliente).
 */
import BaseLayout from "../../layouts/BaseLayout.astro";
import { SITE } from "../../config/site";
import { VEHICLE_CATEGORIES, EXTRAS } from "../../lib/bookings/catalog";

const enabled = SITE.bookings.enabled;
const alternates = { es: "/reservar-traslado", en: "/en/book-transfer" };
---

<BaseLayout
  title="Reserva tu traslado en Menorca"
  description="Traslado privado o compartido en Menorca: aeropuerto, puerto y hotel, puerta a puerta y con precio cerrado."
  locale="es"
  alternates={alternates}
  noindex={!enabled}
>
  <section class="mx-auto max-w-prosa px-5 py-12 sm:px-8">
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-oro">Menorca, puerta a puerta</p>
    <h1 class="mt-2 font-display text-4xl text-tinta">Reserva tu traslado</h1>
    <p class="mt-4 text-piedra-suave">
      Cuéntanos el trayecto, elige el vehículo y deja tus datos: Menorca Bus te
      confirma la reserva y el precio cerrado por correo. Sin esperas y a tu hora.
    </p>

    <form method="POST" action="/api/reservas" class="mt-10 space-y-12">
      <input type="hidden" name="locale" value="es" />
      {/* Honeypot anti-spam: oculto para humanos, tentador para robots. */}
      <p class="hidden" aria-hidden="true">
        <label>No rellenes este campo <input type="text" name="web" tabindex="-1" autocomplete="off" /></label>
      </p>

      <!-- PASO 1 · El trayecto -->
      <fieldset class="space-y-4">
        <legend class="font-display text-2xl text-tinta">1 · El trayecto</legend>
        [campos: origin* y destination* (texto, placeholders «Aeropuerto de Menorca (MAH), puerto, hotel…» / «Zona, hotel o dirección»);
         tripType (radio «Solo ida» checked / «Ida y vuelta»);
         pickupDate* (date) + pickupTime* (time) con etiqueta «Fecha y hora de salida (o de llegada del vuelo)»;
         returnDate + returnTime (date/time, etiqueta «Regreso — solo ida y vuelta»);
         flightNumber (texto, «Número de vuelo (si llegas en avión)»);
         adults* (number 1-50, value 1) · children (number 0-50, value 0, «2-11 años») · infants (number 0-50, value 0, «0-2 años»)]
      </fieldset>

      <!-- PASO 2 · El vehículo (tarjetas radio, sin precios: llegarán con la API) -->
      <fieldset class="space-y-4">
        <legend class="font-display text-2xl text-tinta">2 · El vehículo</legend>
        <p class="text-sm text-piedra-suave">Precio cerrado: te lo confirma Menorca Bus al validar la reserva, sin sorpresas.</p>
        {VEHICLE_CATEGORIES.map((c, i) => (
          <label class="flex cursor-pointer gap-4 rounded-xl border border-niebla bg-white p-5 has-[:checked]:border-terracota has-[:checked]:bg-arena/40">
            <input type="radio" name="vehicleCategory" value={c.id} required checked={i === 0} class="mt-1 accent-terracota" />
            <span>
              <span class="flex items-center gap-2">
                <span class="font-display text-lg text-tinta">{c.name.es}</span>
                <span class="rounded-full bg-arena px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-piedra">{c.badge.es}</span>
              </span>
              <span class="mt-1 block text-sm text-piedra-suave">{c.tagline.es}</span>
              <ul class="mt-2 list-disc pl-5 text-sm text-piedra-suave">
                {c.points.es.map((p) => <li>{p}</li>)}
              </ul>
            </span>
          </label>
        ))}
      </fieldset>

      <!-- PASO 3 · Tus datos -->
      <fieldset class="space-y-4">
        <legend class="font-display text-2xl text-tinta">3 · Tus datos</legend>
        [campos titular (todos text salvo lo indicado): name* · company · idDocument* («DNI/NIF o pasaporte») ·
         email* (type=email) · phone* (type=tel) · address* · postalCode* · city* · country* ·
         coupon («Cupón — p. ej. CALMASOCIETY») · pickupTimeRequested (time, «Hora deseada de recogida») ·
         comments (textarea, «Indicaciones para el conductor: equipaje, horarios, necesidades especiales…»)]

        <div class="grid gap-3 sm:grid-cols-2">
          {EXTRAS.map((e) => (
            <label class="flex items-center justify-between rounded-lg border border-niebla bg-white px-4 py-3">
              <span class="text-sm text-piedra">{e.name.es}</span>
              <input type="number" name={`extra-${e.id}`} min="0" max="9" value="0" class="w-16 rounded border border-niebla px-2 py-1 text-center" />
            </label>
          ))}
        </div>

        <label class="flex items-start gap-3 text-sm text-piedra-suave">
          <input type="checkbox" name="marketingOptin" class="mt-0.5 accent-terracota" />
          Quiero recibir novedades y ofertas de Menorca Bus.
        </label>
        <label class="flex items-start gap-3 text-sm text-piedra">
          <input type="checkbox" name="terms" required class="mt-0.5 accent-terracota" />
          Acepto los términos y condiciones del servicio. *
        </label>
        <p class="text-xs text-piedra-suave">Cancelación gratuita hasta 24 horas antes de la hora prevista. La categoría del vehículo es orientativa: puede variar según disponibilidad manteniendo el nivel reservado.</p>
      </fieldset>

      <button type="submit" class="rounded-full bg-arcilla px-8 py-3 font-semibold text-crema hover:bg-terracota">
        Solicitar reserva
      </button>
    </form>

    [bloque de sellos de confianza: «Reservas gestionadas por Menorca Bus» ·
     «Atención 24/7» · «Cancelación flexible» · «Conductores profesionales»]
  </section>
</BaseLayout>
```

Los bloques `[campos: …]` se escriben como inputs reales con `label` visible cada uno
(accesibilidad: `for`/`id`, obligatorios con `required` y asterisco). Nombres de campo
EXACTOS a los de la interfaz de Task 2.

- [x] **Step 2: Crear `src/pages/reservar-traslado/gracias.astro`**

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
---

<BaseLayout
  title="Solicitud recibida"
  description="Tu solicitud de traslado está registrada."
  locale="es"
  alternates={{ es: "/reservar-traslado/gracias", en: "/en/book-transfer/thanks" }}
  noindex
>
  <section class="mx-auto max-w-prosa px-5 py-16 text-center sm:px-8">
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-oro">Reserva de traslado</p>
    <h1 class="mt-2 font-display text-4xl text-tinta">Solicitud recibida</h1>
    <p class="mt-4 text-piedra-suave">
      Menorca Bus revisará tu trayecto y te confirmará la reserva y el precio
      cerrado por correo. Guarda tu localizador: aparece en la dirección de esta
      página (ref=…) y te lo repetiremos en la confirmación.
    </p>
    <a href="/" class="mt-8 inline-block rounded-full bg-arcilla px-8 py-3 font-semibold text-crema hover:bg-terracota">Volver a la revista</a>
  </section>
</BaseLayout>
```

(El localizador llega por `?ref=`; al ser página estática se comunica en el texto
sin leer el parámetro — el correo de confirmación del dueño lo repetirá. NO añadir
JS para pintarlo.)

- [x] **Step 3: Crear las versiones EN** (`en/book-transfer/index.astro`, `en/book-transfer/thanks.astro`): misma estructura y mismos `name` de campo, `locale="en"` en el hidden y en el layout, textos EN nativos usando `c.name.en`, `c.points.en`, `e.name.en` (título «Book your transfer in Menorca», botón «Request booking», gracias «Request received»). `alternates` iguales a los de ES.

- [x] **Step 4: Verificar build, check y vista local**

Run: `npx astro check && npm run build`
Expected: 0 errores; el build incluye `/reservar-traslado/` y `/en/book-transfer/` y el sitemap NO los lista (interruptor apagado).
Run (manual, para la demo al dueño): `npm run dev` → abrir `http://localhost:4321/reservar-traslado`.

- [x] **Step 5: Commit**

```bash
git add src/pages/reservar-traslado src/pages/en/book-transfer
git commit -m "feat(reservas): pagina de reserva ES/EN en 3 secciones-paso (noindex, apagada)"
```

---

### Task 7: Panel del dueño en Vercel (`/panel/reservas`)

**Files:**
- Create: `src/pages/panel/reservas.astro` (patrón EXACTO de `src/pages/panel/analitica.astro`: `prerender = !process.env.VERCEL`, Basic auth `PANEL_USER`/`PANEL_PASS`, fallback estático con aviso en Cloudflare/local)

**Interfaces:**
- Consumes: `GET /api/reservas?status=` y `PATCH /api/reservas` (Task 5) con cabecera `x-admin-key` = `process.env.RESERVAS_ADMIN_KEY`; `SITE.url` como base de la API.

- [x] **Step 1: Implementar `src/pages/panel/reservas.astro`**

```astro
---
/**
 * Panel de reservas de transfers (junto a /panel/analitica, misma casa).
 * - SSR SOLO en Vercel (prerender = false allí); en Cloudflare/local se
 *   prerenderiza un aviso estático sin secretos.
 * - Basic auth con PANEL_USER / PANEL_PASS (mismas credenciales del panel).
 * - Lee la API de Cloudflare con RESERVAS_ADMIN_KEY (variable en Vercel).
 * - Confirmar/rechazar: el formulario hace POST a esta misma página, que
 *   reenvía el PATCH a la API y redirige (patrón POST-redirect-GET).
 */
export const prerender = !process.env.VERCEL;
import "../../styles/global.css";
import { SITE } from "../../config/site";
import { VEHICLE_CATEGORIES } from "../../lib/bookings/catalog";

const onVercel = !!process.env.VERCEL;
const USER = process.env.PANEL_USER ?? "";
const PASS = process.env.PANEL_PASS ?? "";
const ADMIN_KEY = process.env.RESERVAS_ADMIN_KEY ?? "";
const API = `${SITE.url}/api/reservas`;

if (onVercel && USER && PASS) {
  const auth = Astro.request.headers.get("authorization") ?? "";
  const b64 = auth.startsWith("Basic ") ? auth.slice(6) : "";
  let ok = false;
  if (b64) {
    const [u, p] = atob(b64).split(":");
    ok = u === USER && p === PASS;
  }
  if (!ok) {
    return new Response("Autenticación requerida", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Panel Calma Society"' },
    });
  }
}

// Acción confirmar/rechazar/cancelar (POST desde la propia tabla).
if (onVercel && Astro.request.method === "POST") {
  const form = await Astro.request.formData();
  const ref = String(form.get("ref") ?? "");
  const status = String(form.get("status") ?? "");
  if (ref && status) {
    await fetch(API, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-key": ADMIN_KEY },
      body: JSON.stringify({ ref, status }),
    });
  }
  return Astro.redirect(Astro.url.pathname + Astro.url.search, 303);
}

const filter = Astro.url.searchParams.get("status") ?? "";
const configured = onVercel && !!ADMIN_KEY && !!USER && !!PASS;
let bookings: any[] = [];
let error: string | null = null;
if (configured) {
  try {
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const r = await fetch(`${API}${qs}`, { headers: { "x-admin-key": ADMIN_KEY } });
    if (!r.ok) throw new Error(`API ${r.status}`);
    bookings = (await r.json()).bookings;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
}
const catName = (id: string) => VEHICLE_CATEGORIES.find((c) => c.id === id)?.name.es ?? id;
const ESTADOS = ["", "solicitada", "confirmada", "rechazada", "cancelada"];
---

[HTML del panel, sobrio y funcional (mismo estilo que analitica.astro):
 <meta name="robots" content="noindex, nofollow" /> ·
 título «Reservas de transfers» · filtro por estado (enlaces ?status=) ·
 si !onVercel: aviso «Este panel funciona en el despliegue de Vercel» ·
 si error: mostrarlo · tabla con columnas: localizador, creada, trayecto
 (origen → destino, fecha/hora, vuelo), pasajeros (A/N/B), vehículo
 (catName), titular (nombre, email, tel), cupón, extras (JSON legible),
 estado, y acciones: por fila un mini-form POST con hidden ref +
 botones name="status" value="confirmada" («Confirmar») /
 "rechazada" («Rechazar») / "cancelada" («Cancelar»).]
```

- [x] **Step 2: Verificar build y check**

Run: `npx astro check && npm run build`
Expected: 0 errores; en el build estático la página queda como aviso (sin datos ni secretos).

- [x] **Step 3: Commit**

```bash
git add src/pages/panel/reservas.astro
git commit -m "feat(reservas): panel del dueno en Vercel (/panel/reservas) sobre la API de Cloudflare"
```

---

### Task 8: Runbook de encendido + cierre

**Files:**
- Create: `docs/RESERVAS-TRANSFERS.md`

- [ ] **Step 1: Escribir `docs/RESERVAS-TRANSFERS.md`** con estas secciones (contenido completo, no esqueleto):

1. **Qué es** — resumen de la v1 y enlace a la spec.
2. **Mapa de piezas** — tabla: página ES/EN, API (`functions/api/reservas.ts`), librería (`src/lib/bookings/`), panel (`/panel/reservas` en Vercel), esquema (`db/reservas-schema.sql`).
3. **Interruptores** — `SITE.bookings.enabled` (visibilidad web) y `BOOKINGS_ENABLED` (API); explicar que son DOS y por qué.
4. **Pasos de encendido** (numerados, copiables):
   - `npx wrangler d1 create calma-reservas` y binding `DB` en el proyecto de Cloudflare Pages (Settings → Functions → D1 bindings).
   - `npx wrangler d1 execute calma-reservas --file=db/reservas-schema.sql`.
   - Variables: `BOOKINGS_ENABLED=true` y `RESERVAS_ADMIN_KEY=<clave larga>` en Cloudflare Pages; `RESERVAS_ADMIN_KEY` (la misma) en Vercel.
   - Elegir proveedor de aviso por email → `hola@calmasociety.com` (pendiente de elección; el panel funciona sin él).
   - Actualizar la política de privacidad (se guardan datos personales de reserva).
   - `bookings.enabled: true` en `site.ts` + decidir desde qué CTAs se enlaza.
5. **Puntos de enchufe de la API de Menorca Bus** — los 4 (cotización de precios en las tarjetas del paso 2, lista de vuelos reales en el paso 1, validación del cupón, pago al confirmar) y dónde tocaría cada uno (`catalog.ts` / página / `functions/api/reservas.ts` con `provider: "menorcabus"`).
6. **Modelo de datos** — referencia a `db/reservas-schema.sql` y estados (`solicitada → confirmada | rechazada | cancelada`).

- [ ] **Step 2: Verificación final completa**

Run: `npm test && npx astro check && npx tsc --noEmit -p functions/tsconfig.json && npm run build`
Expected: todo a 0 errores.

- [ ] **Step 3: Commit**

```bash
git add docs/RESERVAS-TRANSFERS.md
git commit -m "docs(reservas): runbook de encendido y puntos de enchufe de la API"
```

- [ ] **Step 4: Cierre de proyecto (lo hace el chat principal, no el ejecutor):** push a `main` tras el visto bueno del dueño con la demo local, ficha en Jira (épica Herramientas interactivas) y registro en el vault el mismo día.
