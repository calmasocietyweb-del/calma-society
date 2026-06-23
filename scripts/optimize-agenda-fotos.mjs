/**
 * optimize-agenda-fotos.mjs — optimiza las fotos de la agenda descargadas de
 * Adobe Stock (MATERIAL FOTOS RRSS/Menorca/_stock/ag-*.jpg) a WebP responsive
 * en public/uploads (base 1600 + variantes 960 y 480), igual que optimize-photos.mjs.
 *
 * Uso:  node scripts/optimize-agenda-fotos.mjs
 */
import sharp from "sharp";
import { readdirSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "MATERIAL FOTOS RRSS/Menorca/_stock";
const OUT = "public/uploads";
const QUALITY = 78;
const WIDTHS = [1600, 960, 480];

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter((f) => /^ag-.+\.jpg$/i.test(f));

let ok = 0, skipped = 0;
for (const f of files) {
  const src = join(SRC, f);
  if (statSync(src).size < 50000) { console.log(`⨯ ${f} demasiado pequeño (descarga incompleta), salto`); skipped++; continue; }
  const base = f.replace(/\.jpg$/i, "");
  let okAll = true;
  for (const w of WIDTHS) {
    const name = w === 1600 ? `${base}.webp` : `${base}-${w}.webp`;
    try {
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(join(OUT, name));
    } catch (e) { console.log(`✗ ${name}: ${e.message}`); okAll = false; }
  }
  if (okAll) { ok++; } else { skipped++; }
}
console.log(`\n✓ ${ok} fotos de agenda optimizadas (${files.length} fuentes encontradas, ${skipped} con problemas).`);
