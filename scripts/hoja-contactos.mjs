/**
 * hoja-contactos.mjs — monta una hoja de contactos (grid numerado) por cada
 * grupo de candidatas de .tmp_wiki/nuevas/, para poder MIRARLAS de verdad antes
 * de publicarlas. La foto se elige viéndola, nunca por su nombre de fichero
 * (lección KAN-83 y KAN-119: el metadato miente, el ojo no).
 *
 * Uso: node scripts/hoja-contactos.mjs [slug1 slug2 ...]   (sin args = todos)
 */
import sharp from "sharp";
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = ".tmp_wiki/nuevas";
const OUT = ".tmp_wiki/contactos";
mkdirSync(OUT, { recursive: true });
const CELDA = 460, COLS = 4, GAP = 6;

const idx = JSON.parse(readFileSync(join(DIR, "_candidatas.json"), "utf8"));
const pedidos = process.argv.slice(2);
const slugs = (pedidos.length ? pedidos : Object.keys(idx)).filter((s) => idx[s]?.candidatas?.length);

for (const slug of slugs) {
  const cands = idx[slug].candidatas;
  const filas = Math.ceil(cands.length / COLS);
  const W = COLS * CELDA + (COLS + 1) * GAP;
  const H = filas * CELDA + (filas + 1) * GAP;
  const capas = [];
  for (let i = 0; i < cands.length; i++) {
    const x = GAP + (i % COLS) * (CELDA + GAP);
    const y = GAP + Math.floor(i / COLS) * (CELDA + GAP);
    try {
      const buf = await sharp(join(DIR, cands[i].local))
        .resize(CELDA, CELDA, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
      capas.push({ input: buf, left: x, top: y });
      // número grande en la esquina, para poder citar la elegida sin ambigüedad
      const etq = Buffer.from(
        `<svg width="70" height="46"><rect width="70" height="46" fill="#17150F" opacity="0.88"/>` +
        `<text x="35" y="34" font-family="Arial" font-size="32" fill="#F4ECDC" text-anchor="middle">${i}</text></svg>`
      );
      capas.push({ input: etq, left: x, top: y });
    } catch (e) { console.log(`  ⨯ ${cands[i].local}: ${e.message}`); }
  }
  const dest = join(OUT, `${slug}.jpg`);
  await sharp({ create: { width: W, height: H, channels: 3, background: "#DED4C4" } })
    .composite(capas).jpeg({ quality: 80 }).toFile(dest);
  console.log(`${slug}: ${cands.length} → ${dest}`);
}
