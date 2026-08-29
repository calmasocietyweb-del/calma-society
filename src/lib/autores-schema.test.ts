/**
 * Guardián del fichero de autores (auditoría del 29-ago-2026).
 *
 * El fallo que motiva este test: el schema Zod de `autores` declaraba solo
 * es/en/fr. Zod DESCARTA en silencio las claves que no declara, así que la bio
 * alemana escrita en el JSON nunca llegaba a la página y `pick()` caía al
 * inglés — la firma del autor salía en inglés en las páginas de autor de
 * de/it/pt y en los 81 artículos alemanes. No hubo ningún error de compilación.
 *
 * Aquí se comprueba lo que el compilador NO puede: que los datos reales cubren
 * todos los locales activos. Si mañana se activa un idioma nuevo, este test
 * falla y recuerda las dos cosas que hay que tocar: el JSON y el schema.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LOCALE_CODES as LOCALES } from "../config/site.ts";

const DIR = "src/content/autores";
const ficheros = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));

/* Campos que el lector VE o que van a la <meta>. `seoDescription` es opcional
   como campo, pero si está debe estar completo. */
const CAMPOS_OBLIGATORIOS = ["name", "role", "bio"] as const;

describe("autores: textos completos en los seis locales activos", () => {
  it("hay al menos un autor", () => {
    assert.ok(ficheros.length > 0, "no se encontró ningún autor en " + DIR);
  });

  for (const f of ficheros) {
    const datos = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));

    for (const campo of CAMPOS_OBLIGATORIOS) {
      it(`${f} → ${campo} cubre los ${LOCALES.length} idiomas`, () => {
        const valor = datos[campo];
        assert.ok(valor && typeof valor === "object", `${campo} no existe o no es un objeto`);
        const faltan = LOCALES.filter((l) => !valor[l] || !String(valor[l]).trim());
        assert.deepEqual(
          faltan,
          [],
          `${campo} no tiene texto en: ${faltan.join(", ")}. Añádelo al JSON Y comprueba que ` +
            `el schema de src/content.config.ts declara ese idioma (si no, Zod lo tira sin avisar).`,
        );
      });
    }

    it(`${f} → seoDescription, si existe, también los cubre`, () => {
      if (!datos.seoDescription) return;
      const faltan = LOCALES.filter((l) => !datos.seoDescription[l]);
      assert.deepEqual(faltan, [], `seoDescription no tiene texto en: ${faltan.join(", ")}`);
    });

    it(`${f} → ningún idioma repite literalmente el texto inglés`, () => {
      /* Si de/it/pt tienen exactamente la cadena inglesa, es que se copió sin
         traducir — el síntoma exacto del fallo original. */
      const repetidos: string[] = [];
      for (const campo of CAMPOS_OBLIGATORIOS) {
        const v = datos[campo];
        for (const l of LOCALES) {
          if (l === "en") continue;
          if (v?.[l] && v[l] === v.en) repetidos.push(`${campo}.${l}`);
        }
      }
      assert.deepEqual(repetidos, [], `copiados del inglés sin traducir: ${repetidos.join(", ")}`);
    });
  }
});
