/**
 * Guardián de las exclusiones del sitemap (1-sep-2026).
 *
 * EL FALLO QUE LO TRAE. El `filter` del sitemap listaba las rutas a mano y se
 * había quedado con los idiomas de entonces: excluía la página de bienvenida en
 * `es`, `en` y `fr`, pero **anunciaba a Google las versiones alemana, italiana y
 * portuguesa**, que van con `noindex`. Un sitemap que declara una página
 * noindex le manda a Google dos señales opuestas sobre la misma URL. Nadie lo
 * vio porque no había nada que lo mirase: `astro check` y los tests pasaban.
 *
 * La regla que se comprueba aquí es sencilla y no depende de acordarse:
 * **toda página que se renderiza SIEMPRE con `noindex` tiene que estar excluida
 * del sitemap.** Si mañana alguien crea `/it/prenota-un-transfer`, este test
 * falla hasta que la ruta entre en su lista.
 *
 * Es un test de TEXTO a propósito: `astro.config.ts` no se puede importar desde
 * `node --test` (arrastra integraciones de Astro).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..", "..");
const CONFIG = path.join(RAIZ, "astro.config.ts");
const PAGES = path.join(RAIZ, "src", "pages");

/** Saca una lista de cadenas declarada como `const NOMBRE = [ "…", "…" ];`. */
function lista(nombre: string): string[] {
  const src = fs.readFileSync(CONFIG, "utf8");
  const m = src.match(new RegExp(`const ${nombre}(?::[^=]+)? = \\[([\\s\\S]*?)\\];`));
  assert.ok(m, `No se encuentra la lista ${nombre} en astro.config.ts`);
  return [...m![1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

/** Todas las páginas .astro con su ruta pública. */
function paginas(): { ruta: string; src: string; file: string }[] {
  const out: { ruta: string; src: string; file: string }[] = [];
  const visita = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) visita(p);
      else if (e.name.endsWith(".astro")) {
        const rel = path.relative(PAGES, p).replace(/\\/g, "/");
        const ruta = "/" + rel.replace(/\.astro$/, "").replace(/\/index$/, "");
        out.push({ ruta, src: fs.readFileSync(p, "utf8"), file: rel });
      }
    }
  };
  visita(PAGES);
  return out;
}

/**
 * ¿La página va SIEMPRE con noindex? Se busca el atributo suelto (`noindex`)
 * en las props del layout, no la forma condicional `noindex={!enabled}`: esa
 * depende de un interruptor y tiene su propia lista.
 */
function noindexSiempre(src: string): boolean {
  return /\n\s*noindex\s*\n/.test(src);
}

/** ¿La página lleva noindex condicional (detrás de un interruptor)? */
function noindexCondicional(src: string): boolean {
  return /noindex=\{/.test(src);
}

describe("exclusiones del sitemap", () => {
  const TODAS = [...lista("NOINDEX_SIEMPRE"), ...lista("RUTAS_LEAD_MAGNET"), ...lista("RUTAS_RESERVAS")];

  it("toda página con noindex fijo está excluida del sitemap", () => {
    const huerfanas = paginas()
      .filter((p) => noindexSiempre(p.src))
      .filter((p) => !TODAS.some((r) => p.ruta.includes(r)))
      .map((p) => `${p.ruta}  (${p.file})`);
    assert.deepEqual(
      huerfanas,
      [],
      "Estas páginas van con noindex pero SÍ se anuncian en el sitemap.\n" +
        "Añade su ruta a la lista que corresponda en astro.config.ts:\n  " +
        huerfanas.join("\n  "),
    );
  });

  it("toda página con noindex condicional está en una lista de interruptor", () => {
    const conFlag = [...lista("RUTAS_LEAD_MAGNET"), ...lista("RUTAS_RESERVAS")];
    const huerfanas = paginas()
      .filter((p) => noindexCondicional(p.src))
      .filter((p) => !conFlag.some((r) => p.ruta.includes(r)))
      .map((p) => `${p.ruta}  (${p.file})`);
    assert.deepEqual(huerfanas, [], "Páginas con noindex tras un interruptor y sin lista:\n  " + huerfanas.join("\n  "));
  });

  it("el hreflang del sitemap se deriva de SITE.locales, no se escribe a mano", () => {
    const src = fs.readFileSync(CONFIG, "utf8");
    const i18n = src.slice(src.indexOf("i18n: {", src.indexOf("sitemap(")));
    assert.ok(
      /SITE\.locales\.map/.test(i18n),
      "El bloque i18n del sitemap vuelve a listar los idiomas a mano: así se quedó fuera el alemán.",
    );
    assert.ok(
      !/locales:\s*\{\s*es:/.test(i18n),
      "Hay un mapa de idiomas escrito a mano en el sitemap.",
    );
  });

  it("las tres listas cubren los idiomas de cada familia de rutas", () => {
    // La reserva existe en 4 idiomas: su lista tiene que tener 4 entradas.
    assert.equal(lista("RUTAS_RESERVAS").length, 4);
    // La bienvenida existe en los 6, más el panel interno.
    assert.ok(lista("NOINDEX_SIEMPRE").length >= 7);
  });
});
