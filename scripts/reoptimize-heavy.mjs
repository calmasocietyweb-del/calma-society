/**
 * Re-comprime las fotos de `public/uploads` que se pasan de presupuesto (KAN-127).
 *
 * POR QUÉ HACE FALTA. `optimize-photos.mjs` genera todo a calidad fija 78, y eso
 * funciona para una foto normal pero no para las de mucho detalle (senderos,
 * follaje, multitudes, texturas): esas se van a 250-280 KB en la variante de
 * 960 px, cuando la mediana del sitio es 83 KB. Lighthouse lo señalaba como
 * "properly size images" con hasta 194 KB de sobra en una sola foto.
 *
 * QUÉ HACE. Recorre `public/uploads`, y para cada variante que se pase del
 * presupuesto de su ancho, la vuelve a generar DESDE LA BASE de 1600 px (que es
 * la de más calidad y está en el repo), bajando la calidad de 5 en 5 hasta que
 * entre. Así no depende de los originales: 25 de las 35 fotos pesadas vinieron
 * de otros flujos (Wikimedia, descargas) y su fuente ya no está.
 *
 * NO baja la calidad global: solo toca lo que se pasa, y solo lo justo.
 *
 * Uso:  node scripts/reoptimize-heavy.mjs          (aplica)
 *       node scripts/reoptimize-heavy.mjs --dry    (solo informa)
 */
import sharp from "sharp";
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/uploads";
const DRY = process.argv.includes("--dry");

/**
 * Presupuesto por ancho. El que de verdad importa es el de **960 px**: es la
 * variante que se lleva el móvil, y el móvil es donde el rendimiento estaba
 * flojo. La base de 1600 px solo la piden pantallas anchas por banda ancha
 * (en escritorio el sitio ya saca 100), así que ahí el tope es generoso: se
 * recorta al que se dispara, no se aprieta a todos.
 */
const BUDGET = { 1600: 500 * 1024, 960: 150 * 1024, 480: 60 * 1024 };

/**
 * Calidad de partida y SUELO por ancho. Esto es una revista de lujo: la foto es
 * el producto. Antes que dejar una imagen con artefactos se prefiere que se
 * pase de presupuesto, y el script lo dice para poder mirarla.
 * El suelo es más alto en la base de 1600 px, que es la que se ve grande.
 */
const Q_START = 78;
const Q_FLOOR = { 1600: 68, 960: 62, 480: 60 };
const Q_STEP = 4;

const kb = (b) => (b / 1024).toFixed(0).padStart(4);

/** Descompone "nombre-960.webp" → { base: "nombre", width: 960 }. */
function parse(file) {
  const m = file.match(/^(.*?)(?:-(480|960))?\.webp$/);
  if (!m) return null;
  return { base: m[1], width: m[2] ? Number(m[2]) : 1600 };
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".webp"));
const gordas = [];
for (const f of files) {
  const p = parse(f);
  if (!p) continue;
  const bytes = statSync(join(DIR, f)).size;
  if (bytes > BUDGET[p.width]) gordas.push({ file: f, ...p, bytes });
}
gordas.sort((a, b) => b.bytes - a.bytes);

console.log(`${files.length} .webp en ${DIR}; ${gordas.length} se pasan de presupuesto.`);
if (!gordas.length) process.exit(0);
if (DRY) {
  for (const g of gordas) console.log(`  ${kb(g.bytes)} KB  ${g.file}  (tope ${kb(BUDGET[g.width])} KB)`);
  process.exit(0);
}

let ahorro = 0;
let tocadas = 0;
const flojas = [];

for (const g of gordas) {
  // Origen: la base de 1600 px, que es la de más calidad disponible. Si la que
  // sobra ES la base, se re-encoda ella misma (una generación más, imperceptible).
  const origen = join(DIR, `${g.base}.webp`);
  if (!existsSync(origen)) {
    console.log(`  ! sin base de 1600 px: ${g.file} (se salta)`);
    continue;
  }

  // Se lee a memoria ANTES de escribir: en Windows, si el origen y el destino
  // son el mismo fichero (re-encodar la base), sharp lo mantiene abierto y el
  // borrado falla con EBUSY.
  const entrada = readFileSync(origen);
  const destino = join(DIR, g.file);
  const suelo = Q_FLOOR[g.width];
  let mejor = null;

  for (let q = Q_START; q >= suelo; q -= Q_STEP) {
    let img = sharp(entrada);
    if (g.width !== 1600) img = img.resize({ width: g.width, withoutEnlargement: true });
    const buf = await img.webp({ quality: q, effort: 6 }).toBuffer();
    mejor = { q, bytes: buf.length, buf };
    if (buf.length <= BUDGET[g.width]) break;
  }

  if (!mejor || mejor.bytes >= g.bytes) {
    console.log(`  = ${g.file}: no se gana nada, se deja como está`);
    continue;
  }

  writeFileSync(destino, mejor.buf);

  const dentro = mejor.bytes <= BUDGET[g.width];
  console.log(
    `  ${kb(g.bytes)} -> ${kb(mejor.bytes)} KB  q${mejor.q}  ${g.file}${dentro ? "" : "  (SIGUE por encima del tope: se prefiere eso a estropearla)"}`,
  );
  ahorro += g.bytes - mejor.bytes;
  tocadas++;
  if (mejor.q <= suelo) flojas.push(`${g.file} (q${mejor.q}, ${kb(mejor.bytes)} KB)`);
}

console.log(`\n${tocadas} imagen(es) re-comprimidas. Ahorro: ${(ahorro / 1024 / 1024).toFixed(2)} MB.`);
if (flojas.length) {
  console.log(
    `\n⚠️ Estas han bajado hasta el suelo de calidad; conviene MIRARLAS antes de publicar:\n   ${flojas.join("\n   ")}`,
  );
}
