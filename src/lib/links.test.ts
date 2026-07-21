/**
 * Enlaces salientes a negocios colaboradores (KAN-78): el UTM debe llegar
 * intacto (es lo que el negocio ve en SU analítica y justifica la cuota) sin
 * romper la URL original de su web.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { partnerUrl } from "./links.ts";

test("partnerUrl añade los UTM de calmasociety a una URL limpia", () => {
  const u = new URL(partnerUrl("https://ivettemenorca.com", "atardeceres"));
  assert.equal(u.searchParams.get("utm_source"), "calmasociety");
  assert.equal(u.searchParams.get("utm_medium"), "referral");
  assert.equal(u.searchParams.get("utm_campaign"), "atardeceres");
  assert.equal(u.hostname, "ivettemenorca.com");
});

test("partnerUrl conserva la ruta y la query existente del negocio", () => {
  const u = new URL(partnerUrl("https://www.esbruc.restaurant/carta?mesa=3", "ficha"));
  assert.equal(u.pathname, "/carta");
  assert.equal(u.searchParams.get("mesa"), "3");
  assert.equal(u.searchParams.get("utm_campaign"), "ficha");
});

test("partnerUrl con una URL inválida devuelve el enlace tal cual (no rompe la build)", () => {
  assert.equal(partnerUrl("no-es-una-url", "ficha"), "no-es-una-url");
});
