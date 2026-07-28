import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSubscribeInput, buildSubscriberPayload, mailerliteTimestamp } from "./subscribe.ts";

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
    { at: new Date("2026-07-28T09:05:03Z"), ip: "203.0.113.7" },
  );
  assert.deepEqual(payload, {
    email: "a@b.com",
    groups: ["1234567890"],
    status: "active",
    subscribed_at: "2026-07-28 09:05:03",
    opted_in_at: "2026-07-28 09:05:03",
    optin_ip: "203.0.113.7",
  });
});

// Sin esto, MailerLite deja el alta en "sin confirmar" y NO manda el correo de
// confirmación a las altas por API: el suscriptor no recibe nada y la bienvenida
// nunca se dispara. Es el fallo que dejó el proyecto a 0 suscriptores (28-jul-2026).
test("el alta se crea ACTIVA: si no, MailerLite no entrega nada", () => {
  const payload = buildSubscriberPayload(
    { email: "a@b.com", locale: "en", origen: "articulo" },
    "1",
    { at: new Date("2026-07-28T09:05:03Z") },
  );
  assert.equal(payload.status, "active");
});

test("sin IP no se inventa el campo (el consentimiento sigue fechado)", () => {
  const payload = buildSubscriberPayload(
    { email: "a@b.com", locale: "es", origen: "home" },
    "1",
    { at: new Date("2026-07-28T09:05:03Z") },
  );
  assert.equal("optin_ip" in payload, false);
  assert.equal(payload.opted_in_at, "2026-07-28 09:05:03");
});

test("mailerliteTimestamp usa el formato de MailerLite, no ISO", () => {
  assert.equal(mailerliteTimestamp(new Date("2026-01-05T23:59:09.842Z")), "2026-01-05 23:59:09");
});
