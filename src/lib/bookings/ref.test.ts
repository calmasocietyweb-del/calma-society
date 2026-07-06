import { test } from "node:test";
import assert from "node:assert/strict";
import { makeBookingRef } from "./ref.ts";

test("formato CS-AAAA-XXXXXX sin caracteres ambiguos", () => {
  const ref = makeBookingRef(new Date("2026-08-15T10:00:00Z"), () => 0.42);
  assert.match(ref, /^CS-2026-[A-HJ-NP-Z2-9]{6}$/);
});

test("con azar distinto sale localizador distinto", () => {
  const a = makeBookingRef(new Date("2026-08-15"), () => 0.1);
  const b = makeBookingRef(new Date("2026-08-15"), () => 0.9);
  assert.notEqual(a, b);
});
