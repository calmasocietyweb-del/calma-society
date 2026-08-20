/**
 * hoja-contactos-multi.mjs — hoja de contactos COMPUESTA: una fila por grupo
 * (lugar), con sus candidatas numeradas y el nombre del grupo al margen.
 * Permite revisar de un vistazo muchos lugares sin abrir una imagen por lugar.
 *
 * Uso: node scripts/hoja-contactos-multi.mjs <salida.jpg> <prefijo> [filasPorHoja]
 *      node scripts/hoja-contactos-multi.mjs .tmp_wiki/contactos/calas L- 6
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const DIR = ".tmp_wiki/nuevas";
const idx = JSON.parse(readFileSync(join(DIR, "_candidatas.json"), "utf8"));
const salidaBase = process.argv[2];
const prefijo = process.argv[3] || "";
const FILAS = Number(process.argv[4]) || 6;
const CELDA = 420, GAP = 6, ETIQ = 300;

mkdirSync(dirname(salidaBase), { recursive: true });

const grupos = Object.keys(idx)
  .filter((s) => s.startsWith(prefijo) && idx[s]?.candidatas?.length);

for (let h = 0; h * FILAS < grupos.length; h++) {
  const tanda = grupos.slice(h * FILAS, (h + 1) * FILAS);
  const cols = Math.max(...tanda.map((s) => idx[s].candidatas.length));
  const W = ETIQ + cols * (CELDA + GAP) + GAP;
  const H = tanda.length * (CELDA + GAP) + GAP;
  const capas = [];

  for (let f = 0; f < tanda.length; f++) {
    const slug = tanda[f];
    const y = GAP + f * (CELDA + GAP);
    const nombre = slug.replace(prefijo, "");
    capas.push({
      input: Buffer.from(
        `<svg width="${ETIQ}" height="${CELDA}"><rect width="${ETIQ}" height="${CELDA}" fill="#17150F"/>` +
        `<text x="14" y="${CELDA / 2}" font-family="Arial" font-size="26" fill="#F4ECDC">${nombre.slice(0, 22)}</text></svg>`
      ), left: 0, top: y,
    });
    for (let i = 0; i < idx[slug].candidatas.length; i++) {
      const x = ETIQ + GAP + i * (CELDA + GAP);
      try {
        const buf = await sharp(join(DIR, idx[slug].candidatas[i].local))
          .resize(CELDA, CELDA, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
        capas.push({ input: buf, left: x, top: y });
        capas.push({
          input: Buffer.from(
            `<svg width="56" height="40"><rect width="56" height="40" fill="#17150F" opacity="0.88"/>` +
            `<text x="28" y="30" font-family="Arial" font-size="28" fill="#F4ECDC" text-anchor="middle">${i}</text></svg>`
          ), left: x, top: y,
        });
      } catch { /* candidata ilegible: se salta */ }
    }
  }
  const dest = `${salidaBase}-${h}.jpg`;
  await sharp({ create: { width: W, height: H, channels: 3, background: "#DED4C4" } })
    .composite(capas).jpeg({ quality: 78 }).toFile(dest);
  console.log(`${dest}  (${tanda.join(", ")})`);
}
