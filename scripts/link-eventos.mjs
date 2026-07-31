/**
 * Enlaza cada evento de la agenda HACIA DENTRO de la web (KAN-110).
 *
 * Problema que resuelve: las 168 páginas de detalle (KAN-102) solo sabían
 * enlazar a la web oficial del evento — es decir, su único camino llevaba al
 * lector FUERA. La agenda es la 2ª página más vista y en temporada alta recibe
 * el pico del año: cada visita que rebota es una que no vuelve.
 *
 * Escribe dos campos en los JSON de `src/content/eventos`:
 *   - `locationRef`      → ficha de `lugares`, solo cuando el evento ocurre en
 *                          un sitio concreto que tenemos fichado (Lithica, La
 *                          Mola, Cova d'en Xoroi, Illa del Rei, Monte Toro).
 *                          Los pueblos NO son fichas de lugar: van por artículo.
 *   - `relatedArticles`  → hasta 3 artículos nuestros que dan contexto: el
 *                          pueblo donde ocurre, la tradición que celebra, el
 *                          producto que se feria.
 *
 * REGLA DE ORO: es preferible un evento sin enlaces que un enlace de relleno.
 * Si una regla no encaja de verdad, no se fuerza (ver los eventos que quedan
 * deliberadamente vacíos en la salida).
 *
 * El evento ES apunta a artículos ES y el EN a artículos EN: la pareja se
 * resuelve por `translationKey`, no por nombre de fichero.
 *
 * Uso:  node scripts/link-eventos.mjs [--escribir]
 *       Sin --escribir solo enseña lo que haría (repaso antes de tocar nada).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ESCRIBIR = process.argv.includes("--escribir");
const DIR_EVENTOS = "src/content/eventos";
const DIR_ARTICULOS = "src/content/articulos";
const DIR_LUGARES = "src/content/lugares";

// ── Inventario ───────────────────────────────────────────────────────────────
const frontmatter = (raw, campo) => {
  const m = (raw.split("---")[1] || "").match(new RegExp(`^${campo}:\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

const articulos = readdirSync(DIR_ARTICULOS)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => {
    const raw = readFileSync(join(DIR_ARTICULOS, f), "utf8");
    return {
      id: f.replace(/\.mdx$/, ""),
      lang: frontmatter(raw, "lang"),
      tk: frontmatter(raw, "translationKey"),
      status: frontmatter(raw, "status"),
    };
  })
  .filter((a) => a.status === "published");

const lugares = readdirSync(DIR_LUGARES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ id: f.replace(/\.json$/, ""), ...JSON.parse(readFileSync(join(DIR_LUGARES, f), "utf8")) }))
  .filter((l) => l.status === "published");

/** id del artículo con ese translationKey en ese idioma (o null si no existe). */
const articulo = (tk, lang) => articulos.find((a) => a.tk === tk && a.lang === lang)?.id ?? null;
/** id de la ficha de lugar con ese translationKey en ese idioma. */
const lugar = (tk, lang) => lugares.find((l) => l.translationKey === tk && l.lang === lang)?.id ?? null;

// ── Reglas ───────────────────────────────────────────────────────────────────

/** Sitios concretos con ficha propia: translationKey del evento → t.key del lugar. */
const LUGAR_DEL_EVENTO = {
  "fosquets-de-lithica": "lithica",
  "festival-pedra-viva-lithica": "lithica",
  "pedra-viva-tancarville-la-mola": "fortaleza-de-la-mola",
  "cova-den-xoroi-musica-atardecer": "cova-den-xoroi",
  "hauser-wirth-directionless": "illa-del-rei",
  "mare-de-deu-del-toro": "monte-toro",
};

// Se compara SIN acentos y en minúsculas. Sin esto, `\bmaó\b` no encuentra Maó
// nunca (la "ó" no es carácter de palabra para el motor de regex, así que el
// límite no cae donde uno espera) y, peor, `\bmar\b` sí encuentra "mar" dentro
// de "María" y "Marítim" — así es como un concierto de flamenco acabó enlazado
// al artículo del pescado en la primera pasada.
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const texto = (e) => norm([e.location, ...(e.tags || []), e.title].join(" · "));
/** ¿Aparece alguna de estas palabras como palabra entera? */
const tiene = (e, ...palabras) =>
  palabras.some((p) => new RegExp(`(^|[^a-z0-9])${p}([^a-z0-9]|$)`).test(texto(e)));

/** Municipio detectado en `location`/`tags` → artículo del pueblo. */
const PUEBLOS = [
  ["mao", ["mao", "llucmacanes", "sant climent"]],
  ["ciutadella", ["ciutadella"]],
  ["es-mercadal", ["es mercadal", "monte toro"]],
  ["es-castell", ["es castell", "cales fonts"]],
  ["es-migjorn", ["es migjorn"]],
  ["ferreries", ["ferreries"]],
  ["fornells", ["fornells"]],
  ["alaior", ["alaior", "cala.?n porter", "son bou"]],
  // Sant Lluís no tiene artículo propio todavía: se queda sin enlace de pueblo.
];

/**
 * Tema del evento → artículo. Cada regla exige una palabra ESPECÍFICA del tema:
 * las genéricas ("patrimonio", "cata", "mar") enlazaban cosas que no venían a
 * cuento. Ante la duda, la regla no dispara.
 */
const TEMAS = [
  [(e) => e.translationKey === "sant-joan", "sant-joan"],
  [(e) => tiene(e, "caballos", "jaleo", "caixers"), "caballo-menorqui"],
  [(e) => tiene(e, "queso", "formatge") || /dop mahon/.test(texto(e)), "queso"],
  // "cata" fuera: casaba dentro de "patí català" y colaba vino en una regata.
  [(e) => tiene(e, "vino") || /vi de la terra|bodegas/.test(texto(e)), "vino-menorca"],
  [(e) => /cami de cavalls/.test(texto(e)) || tiene(e, "trail"), "cami"],
  // Navegar es para vela y remo, no para nadar ni pedalear.
  [
    (e) =>
      (tiene(e, "vela", "regata", "nautica") || /pati catala/.test(texto(e))) &&
      !tiene(e, "natacion", "triatlon"),
    "navegar",
  ],
  // "patrimonio" a secas enlazaba conciertos de órgano con la Menorca talayótica.
  [(e) => tiene(e, "talayotica", "yacimientos") || /menorca talayotica/.test(texto(e)), "talayotica"],
  // "mar" fuera (ver `norm` arriba): solo pesca de verdad.
  [(e) => tiene(e, "pescadores", "pesca", "llonja"), "pescado-menorca"],
  // Solo si la travesía pasa REALMENTE por Macarella, no por ser natación.
  [(e) => /macarella/.test(norm(e.location)), "macarella"],
  [(e) => e.category === "mercado" || tiene(e, "feria", "km0") || /producto local/.test(texto(e)), "productos-menorca"],
  [(e) => /berenar pages|vedella vermella/.test(texto(e)) || tiene(e, "brou"), "platos-de-casa-menorca"],
];

/** Devuelve los translationKey de artículo para un evento, en orden de cercanía. */
function articulosPara(e) {
  const out = [];
  const sitio = LUGAR_DEL_EVENTO[e.translationKey];
  // El artículo del propio sitio va primero cuando existe (Lithica, La Mola…).
  if (sitio && articulo(sitio === "fortaleza-de-la-mola" ? "la-mola" : sitio === "cova-den-xoroi" ? "cova-xoroi" : sitio === "illa-del-rei" ? "illa-rei" : sitio === "monte-toro" ? "es-mercadal" : sitio, "es")) {
    out.push(sitio === "fortaleza-de-la-mola" ? "la-mola" : sitio === "cova-den-xoroi" ? "cova-xoroi" : sitio === "illa-del-rei" ? "illa-rei" : sitio === "monte-toro" ? "es-mercadal" : sitio);
  }
  for (const [tk, palabras] of PUEBLOS) {
    if (tiene(e, ...palabras)) out.push(tk);
  }
  for (const [test, tk] of TEMAS) if (test(e)) out.push(tk);
  return [...new Set(out)].filter((tk) => articulo(tk, "es")).slice(0, 3);
}

// ── Aplicación ───────────────────────────────────────────────────────────────
const ficheros = readdirSync(DIR_EVENTOS).filter((f) => f.endsWith(".json"));
const eventos = ficheros.map((f) => ({ f, ...JSON.parse(readFileSync(join(DIR_EVENTOS, f), "utf8")) }));
const porClave = new Map();
for (const e of eventos.filter((x) => x.lang === "es")) porClave.set(e.translationKey, articulosPara(e));

let tocados = 0;
const vacios = [];
for (const e of eventos) {
  if (e.status !== "published") continue;
  const tks = porClave.get(e.translationKey) ?? [];
  const ids = tks.map((tk) => articulo(tk, e.lang)).filter(Boolean);
  const sitioTk = LUGAR_DEL_EVENTO[e.translationKey];
  const sitioId = sitioTk ? lugar(sitioTk, e.lang) : null;

  if (e.lang === "es") {
    const marca = sitioId ? `[lugar: ${sitioTk}] ` : "";
    if (ids.length === 0) vacios.push(e.translationKey);
    console.log(`${e.translationKey.padEnd(46)} ${marca}${tks.join(", ") || "— sin enlaces —"}`);
  }

  const json = JSON.parse(readFileSync(join(DIR_EVENTOS, e.f), "utf8"));
  const antes = JSON.stringify(json);
  if (sitioId) json.locationRef = sitioId;
  else delete json.locationRef;
  if (ids.length) json.relatedArticles = ids;
  else delete json.relatedArticles;
  if (JSON.stringify(json) !== antes) {
    tocados++;
    if (ESCRIBIR) writeFileSync(join(DIR_EVENTOS, e.f), JSON.stringify(json, null, 2) + "\n");
  }
}

console.log(`\nFicheros con cambios: ${tocados}${ESCRIBIR ? " (escritos)" : " (simulación — usa --escribir)"}`);
console.log(`Eventos sin ningún enlace (${vacios.length}): ${vacios.join(", ") || "ninguno"}`);
