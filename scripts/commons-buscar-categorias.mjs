/**
 * commons-buscar-categorias.mjs — dado un fichero JSON { slug: "nombre a buscar" },
 * localiza la CATEGORÍA de Wikimedia Commons más plausible para cada uno.
 * Sirve para no adivinar nombres de categoría a mano.
 *
 * Uso: node scripts/commons-buscar-categorias.mjs <fichero.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
const UA = { "User-Agent": "CalmaSocietyBot/1.0 (https://calmasociety.com)" };
const lote = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = {};
for (const [slug, nombre] of Object.entries(lote)) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({ format: "json", action: "query", list: "search", srsearch: nombre, srnamespace: 14, srlimit: 4 })) u.searchParams.set(k, v);
  const r = await (await fetch(u, { headers: UA })).json();
  const cats = (r.query?.search || []).map((x) => x.title);
  out[slug] = cats;
  console.log(`${slug}  ->  ${cats.join(" | ") || "(nada)"}`);
}
writeFileSync(process.argv[2].replace(/\.json$/, "-cats.json"), JSON.stringify(out, null, 1));
