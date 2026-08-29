/**
 * Tests del recorte de <title> (KAN-129 + auditoría del 29-ago-2026).
 *
 * El caso de las comillas alemanas está aquí porque una primera versión de
 * `cerrarHuerfanos` SÍ rompió cinco fichas de lugar: leía el “ de cierre alemán
 * como una apertura inglesa huérfana y dejaba «Cova des Coloms (».
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recortar, elegirTitulo, limpiarFinal, MAX_TITULO } from "./seo-title.ts";

describe("recortar", () => {
  it("deja intacto lo que ya cabe", () => {
    const corto = "Festes de Gràcia";
    assert.equal(recortar(corto), corto);
  });

  it("nunca devuelve más del máximo", () => {
    const largo = "Conciertos de órgano en la iglesia de Santa Maria de Maó durante todo el verano";
    assert.ok(recortar(largo).length <= MAX_TITULO);
  });

  it("corta por frontera de palabra, no a mitad", () => {
    const out = recortar("Música al atardecer en la Cova d'en Xoroi de Alaior con vistas");
    assert.ok(!out.endsWith("-"));
    assert.ok(out.split(" ").every((p) => p.length > 0));
  });

  it("no deja un paréntesis abierto", () => {
    const out = recortar("Ruta guiada por el sur de la isla (salida desde Ciutadella a primera hora)");
    const abre = (out.match(/\(/g) ?? []).length;
    const cierra = (out.match(/\)/g) ?? []).length;
    assert.equal(abre, cierra);
  });

  it("respeta las comillas alemanas „…“ y no las confunde con las inglesas", () => {
    // El fallo original: quedaba «Cova des Coloms (».
    const out = recortar("Cova des Coloms („die Kathedrale“) durch den Barranc de Binigaus");
    assert.ok(!out.endsWith("("), "no puede acabar en un paréntesis abierto");
    assert.ok(out.startsWith("Cova des Coloms"), "conserva el nombre del lugar");
    if (out.includes("„")) assert.ok(out.includes("“"), "si abre comilla alemana, la cierra");
  });

  it("no deja comillas inglesas abiertas", () => {
    const out = recortar("“Directionless” at Hauser & Wirth Menorca — until 25 October 2026");
    const abre = (out.match(/“/g) ?? []).length;
    const cierra = (out.match(/”/g) ?? []).length;
    assert.equal(abre, cierra);
  });

  it("no deja preposiciones ni artículos colgando al final", () => {
    const colgantes = ["de", "del", "la", "der", "die", "do", "della", "the", "of"];
    const out = recortar("Excursión en llaüt menorquín por la costa norte de la reserva marina");
    const ultima = out.split(" ").at(-1)!.toLowerCase();
    assert.ok(!colgantes.includes(ultima), `acabó en «${ultima}»`);
  });

  it("no deja un clasificador geográfico solo", () => {
    const out = recortar("Sendero circular hasta el Cap de Favàritx y su faro por el litoral");
    assert.notEqual(out.split(" ").at(-1)!.toLowerCase(), "cap");
  });
});

describe("elegirTitulo", () => {
  it("coge el primer candidato que cabe entero", () => {
    const out = elegirTitulo(["Festes de Gràcia — Agenda de Menorca", "Festes de Gràcia"]);
    assert.equal(out, "Festes de Gràcia — Agenda de Menorca");
  });

  it("baja al candidato corto cuando el largo no cabe", () => {
    const largo = "Cranc Illa de Menorca Festival — What's on in Menorca";
    const corto = "Cranc Illa de Menorca Festival";
    assert.equal(elegirTitulo([largo, corto]), corto);
  });

  it("recorta el último candidato si ninguno cabe", () => {
    const out = elegirTitulo([
      "Un título larguísimo que no cabe de ninguna manera en el presupuesto — Agenda de Menorca",
      "Un título larguísimo que no cabe de ninguna manera en el presupuesto",
    ]);
    assert.ok(out.length <= MAX_TITULO);
  });

  it("ignora candidatos vacíos", () => {
    assert.equal(elegirTitulo(["", "  ", "Fira del Formatge"]), "Fira del Formatge");
  });
});

describe("limpiarFinal", () => {
  it("quita la puntuación huérfana del final", () => {
    assert.equal(limpiarFinal("Mercat de Maó —"), "Mercat de Maó");
    assert.equal(limpiarFinal("Mercat de Maó,"), "Mercat de Maó");
  });
});
