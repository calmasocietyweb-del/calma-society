/**
 * Guardián del mapa de componentes MDX (1-sep-2026).
 *
 * EL FALLO QUE LO TRAE. Cada ruta de idioma declaraba su propio mapa de
 * componentes inyectados y las seis copias habían derivado: al francés le
 * faltaba `FlotaChofer`, al alemán `NightlifeMap`, y a italiano y portugués los
 * dos. No se vio durante semanas porque **un artículo en `draft` no se
 * renderiza**: la mina solo estalla el día que alguien lo publica. Y estalló —
 * la build se cayó en el momento exacto de publicar los 76 artículos franceses.
 *
 * El arreglo de fondo es `src/components/mdxComponents.ts`, una fuente única.
 * Este test cubre lo que esa fuente única NO puede evitar: que alguien escriba
 * `<ComponenteNuevo />` en un `.mdx` y olvide añadirlo al mapa. Mira TODOS los
 * artículos, publicados y en borrador, que es justo donde el build no llega.
 *
 * Es un test de TEXTO a propósito: `node --test` no sabe importar `.astro`.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..", "..");
const MAPA = path.join(RAIZ, "src", "components", "mdxComponents.ts");
const ARTICULOS = path.join(RAIZ, "src", "content", "articulos");
const PAGINAS = path.join(RAIZ, "src", "pages");

/** Nombres que exporta el mapa compartido. */
function componentesDelMapa(): Set<string> {
  const src = fs.readFileSync(MAPA, "utf8");
  const bloque = src.slice(src.indexOf("export const mdxComponents"));
  const llaves = bloque.slice(bloque.indexOf("{") + 1, bloque.indexOf("}"));
  return new Set(
    llaves
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Componentes que un `.mdx` usa en su cuerpo y NO importa él mismo. */
function componentesInyectados(fichero: string): string[] {
  const txt = fs.readFileSync(fichero, "utf8");
  // El frontmatter va entre los dos primeros `---`; el cuerpo, después.
  const fin = txt.indexOf("---", 3);
  const cuerpo = fin < 0 ? txt : txt.slice(fin + 3);
  const usados = new Set(
    [...cuerpo.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)].map((m) => m[1]),
  );
  const propios = new Set(
    [...cuerpo.matchAll(/^import\s+(?:\{([^}]*)\}|([A-Za-z0-9_]+))/gm)].flatMap(
      (m) => (m[1] ? m[1].split(",").map((s) => s.trim().split(" ")[0]) : [m[2]]),
    ),
  );
  return [...usados].filter((c) => !propios.has(c));
}

function mdxDeArticulos(): string[] {
  return fs
    .readdirSync(ARTICULOS)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(ARTICULOS, f));
}

/** Las seis rutas `[slug]` de artículo, una por idioma. */
function rutasDeArticulo(): string[] {
  const out: string[] = [];
  const visita = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) visita(p);
      else if (e.name === "[slug].astro" && /(articulo|article|artikel|articolo|artigo)/.test(dir))
        out.push(p);
    }
  };
  visita(PAGINAS);
  return out;
}

describe("mapa de componentes MDX", () => {
  it("todo componente usado en un artículo está en el mapa (también en los borradores)", () => {
    const mapa = componentesDelMapa();
    const huerfanos: string[] = [];
    for (const f of mdxDeArticulos()) {
      for (const c of componentesInyectados(f)) {
        if (!mapa.has(c)) huerfanos.push(`${path.basename(f)} usa <${c}>`);
      }
    }
    assert.deepEqual(
      huerfanos,
      [],
      `Componentes usados en un .mdx y ausentes del mapa compartido:\n  ${huerfanos.join("\n  ")}\n` +
        `Añádelos a src/components/mdxComponents.ts (los tendrán los seis idiomas a la vez).`,
    );
  });

  it("ninguna ruta de idioma vuelve a declarar su propio mapa", () => {
    const rutas = rutasDeArticulo();
    assert.ok(rutas.length >= 6, `Se esperaban al menos 6 rutas de artículo, hay ${rutas.length}`);
    const culpables = rutas.filter((p) =>
      /const\s+mdxComponents\s*=/.test(fs.readFileSync(p, "utf8")),
    );
    assert.deepEqual(
      culpables.map((p) => path.relative(RAIZ, p)),
      [],
      "Una ruta ha vuelto a declarar su propio mapa: es exactamente como derivaron las seis copias.",
    );
  });

  it("las seis rutas importan el mapa compartido", () => {
    const sinImportar = rutasDeArticulo().filter(
      (p) => !/from\s+"[^"]*components\/mdxComponents"/.test(fs.readFileSync(p, "utf8")),
    );
    assert.deepEqual(
      sinImportar.map((p) => path.relative(RAIZ, p)),
      [],
      "Estas rutas de artículo no usan el mapa compartido.",
    );
  });
});
