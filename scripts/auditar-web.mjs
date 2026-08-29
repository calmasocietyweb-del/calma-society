/**
 * Auditoría del sitio CONSTRUIDO (`dist/`): lo que ve el lector, no lo que dice el código.
 *
 * Nació de la auditoría del 29-ago-2026, que encontró dos fallos que ningún
 * verificador del proyecto cazaba: la firma del autor en inglés dentro de las
 * páginas alemanas, y 430 `<title>` que Google cortaba. `astro check` daba 0/0 y
 * los tests estaban verdes mientras ambos estaban en producción.
 *
 *   npm run auditar          (requiere haber hecho `npm run build` antes)
 *
 * Sale con código 1 si encuentra algo, para poder colgarlo de CI.
 *
 * ⚠️ Dos sesgos que costaron falsos positivos y que aquí ya están corregidos:
 *   - Las ENTIDADES HTML (`&#39;`) ocupan cinco caracteres en el atributo y uno en
 *     pantalla: hay que decodificar antes de medir longitudes.
 *   - Buscar "idioma colado" por prefijos comunes es traicionero: «Ver todos» es
 *     español Y portugués. Los marcadores deben ser cadenas inequívocas.
 */
import fs from "node:fs";
import path from "node:path";

const DIST = "dist";
const BASE = "https://calmasociety.com";

if (!fs.existsSync(DIST)) {
  console.error(`No existe ${DIST}/. Ejecuta antes: npm run build`);
  process.exit(1);
}

const paginas = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (e.name.endsWith(".html")) paginas.push(p);
  }
})(DIST);

/** Todo lo servible: páginas y ficheros estáticos. */
const existe = new Set();
for (const p of paginas) {
  const r = p.slice(DIST.length).split(path.sep).join("/").replace(/\/index\.html$/, "/");
  existe.add(r);
  if (r.endsWith("/") && r !== "/") existe.add(r.slice(0, -1));
  else if (r !== "/") existe.add(r + "/");
}
(function wa(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) wa(p);
    else if (!e.name.endsWith(".html")) existe.add(p.slice(DIST.length).split(path.sep).join("/"));
  }
})(DIST);

const rutaDe = (p) => p.slice(DIST.length).split(path.sep).join("/").replace(/\/index\.html$/, "/");
const dec = (t) =>
  t
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "’")
    .replace(/&nbsp;/g, " ");
const urlARuta = (u) => (u.startsWith(BASE) ? u.slice(BASE.length) : null);

/* Marcadores de idioma INEQUÍVOCOS: cadenas que no comparte ningún otro locale
   activo. Nada de prefijos ("Ver todos" vale en es y pt). */
const MARCA = {
  es: /(Cómo llegar|Ver todos los|Leer más|Información práctica|Sin previsión)/,
  en: /(Read more|View all|Where to eat|No forecast|Practical information)/,
};

const R = {
  rotos: new Map(), sinTitle: [], titlesLargos: [], sinCanonical: [], sinDesc: [],
  descLargas: [], imgSinAlt: [], multiH1: [], conUndefined: [], hreflangMal: [],
  noReciproco: [], canonicalRaro: [], langMal: [], jsonLdRoto: [], mezcla: [],
};
const hreflangs = {};

for (const p of paginas) {
  const html = fs.readFileSync(p, "utf8");
  const r = rutaDe(p);
  const esPanel = r.startsWith("/panel");
  const es404 = r === "/404.html";

  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const d = m[1];
    if (d.startsWith("//")) continue;
    if (existe.has(d) || existe.has(d.replace(/\/$/, "")) || existe.has(d + "/")) continue;
    if (!R.rotos.has(d)) R.rotos.set(d, []);
    if (R.rotos.get(d).length < 3) R.rotos.get(d).push(r);
  }

  const t = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!t || !t[1].trim()) R.sinTitle.push(r);
  else if (dec(t[1]).length > 65) R.titlesLargos.push(`${dec(t[1]).length}  ${r}`);

  if (!esPanel && !/rel="canonical"/.test(html)) R.sinCanonical.push(r);
  const d = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (!esPanel && !d) R.sinDesc.push(r);
  if (d && dec(d[1]).length > 160) R.descLargas.push(`${dec(d[1]).length}  ${r}`);

  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((x) => x[0]);
  const sinAlt = imgs.filter((i) => !/\balt=/.test(i)).length;
  if (sinAlt) R.imgSinAlt.push(`${sinAlt} img  ${r}`);

  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1 && !es404) R.multiH1.push(`h1=${h1}  ${r}`);

  const sinScripts = html.replace(/<script[\s\S]*?<\/script>/g, "");
  if (/>undefined<|"undefined"/.test(sinScripts)) R.conUndefined.push(r);

  const la = html.match(/<html[^>]*\blang="([^"]+)"/);
  const pref = r.match(/^\/(en|fr|de|it|pt)\//);
  const esperado = pref ? pref[1] : "es";
  if (!la) R.langMal.push(`${r} (sin lang)`);
  else if (!la[1].toLowerCase().startsWith(esperado)) R.langMal.push(`${r} lang="${la[1]}" esperado ${esperado}`);

  const c = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (c && !es404) {
    const dd = urlARuta(c[1]);
    if (dd !== r) R.canonicalRaro.push(`${r} -> ${dd ?? c[1]}`);
  }

  const alt = {};
  for (const m of html.matchAll(/hreflang="([a-z-]+)"\s+href="([^"]+)"/g)) alt[m[1]] = m[2];
  if (Object.keys(alt).length && !es404) hreflangs[r] = alt;

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { R.jsonLdRoto.push(r); }
  }

  if (pref && !esPanel) {
    for (const [otro, re] of Object.entries(MARCA)) {
      if (otro === pref[1]) continue;
      const mm = sinScripts.match(re);
      if (mm) R.mezcla.push(`${r}  [${otro}] «${mm[0]}»`);
    }
  }
}

for (const [r, alt] of Object.entries(hreflangs)) {
  for (const [lg, url] of Object.entries(alt)) {
    if (lg === "x-default") continue;
    const dest = urlARuta(url);
    if (!dest) continue;
    if (!existe.has(dest) && !existe.has(dest.replace(/\/$/, ""))) {
      R.hreflangMal.push(`${r} -> ${lg} ${dest} (no existe)`);
      continue;
    }
    const vuelta = hreflangs[dest];
    if (!vuelta) { R.noReciproco.push(`${r} -> ${dest} (destino sin hreflang)`); continue; }
    if (!Object.values(vuelta).some((u) => urlARuta(u) === r)) R.noReciproco.push(`${r} -> ${dest}`);
  }
}

const COMPROBACIONES = [
  ["enlaces internos rotos", R.rotos],
  ["páginas sin <title>", R.sinTitle],
  ["<title> de más de 65 caracteres", R.titlesLargos],
  ["sin canonical (fuera del panel)", R.sinCanonical],
  ["sin meta description (fuera del panel)", R.sinDesc],
  ["meta description de más de 160", R.descLargas],
  ["imágenes sin alt", R.imgSinAlt],
  ["páginas sin exactamente un <h1>", R.multiH1],
  ['"undefined" visible', R.conUndefined],
  ["hreflang a una URL inexistente", R.hreflangMal],
  ["hreflang no recíproco", R.noReciproco],
  ["canonical distinto de la URL propia", R.canonicalRaro],
  ["atributo lang incoherente con la ruta", R.langMal],
  ["JSON-LD que no parsea", R.jsonLdRoto],
  ["texto de otro idioma colado", R.mezcla],
];

console.log(`\nAuditoría de ${paginas.length} páginas construidas\n`);
let fallos = 0;
for (const [etq, col] of COMPROBACIONES) {
  const items = Array.isArray(col) ? col : [...col.keys()];
  const n = items.length;
  fallos += n;
  console.log(`${n === 0 ? "  ok " : "  >> "}${etq.padEnd(42)} ${n}`);
  items.slice(0, 6).forEach((x) => console.log(`        ${x}`));
  if (n > 6) console.log(`        … y ${n - 6} más`);
}

if (fallos === 0) {
  console.log("\n✓ Las 15 comprobaciones, a cero.\n");
  process.exit(0);
}
console.log(`\n✗ ${fallos} incidencias.\n`);
process.exit(1);
