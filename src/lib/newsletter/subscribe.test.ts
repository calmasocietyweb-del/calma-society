import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSubscribeInput, buildSubscriberPayload } from "./subscribe.ts";

function base(): Record<string, string> {
  return { email: "Prueba@Example.com ", consent: "on", locale: "es", origen: "planificador", web: "" };
}

test("acepta un alta válida y normaliza email y locale", () => {
  const r = validateSubscribeInput(base());
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.email, "prueba@example.com"); // trim + minúsculas
  assert.equal(r.value.locale, "es");
  assert.equal(r.value.origen, "planificador");
});

test("acepta el consentimiento con el nombre heredado del gate (consentimiento)", () => {
  const raw = { ...base(), consent: "", consentimiento: "on" };
  assert.equal(validateSubscribeInput(raw).ok, true);
});

test("rechaza el honeypot relleno (bot)", () => {
  const r = validateSubscribeInput({ ...base(), web: "http://spam" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "bot");
});

test("rechaza email inválido", () => {
  const r = validateSubscribeInput({ ...base(), email: "no-es-email" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "email");
});

test("rechaza si falta el consentimiento", () => {
  const r = validateSubscribeInput({ ...base(), consent: "", consentimiento: "" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "consent");
});

test("locale desconocido cae a es", () => {
  const r = validateSubscribeInput({ ...base(), locale: "de" });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.locale, "es");
});

test("buildSubscriberPayload mete el email y el grupo", () => {
  const payload = buildSubscriberPayload(
    { email: "a@b.com", locale: "es", origen: "popup" },
    "1234567890",
  );
  assert.deepEqual(payload, { email: "a@b.com", groups: ["1234567890"] });
});
