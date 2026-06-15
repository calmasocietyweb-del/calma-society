// Optimiza fotos para la web: redimensiona y convierte a WebP en public/uploads.
// Uso: node scripts/optimize-photos.mjs
// (edita la lista `jobs` o pásalo a un patrón cuando haya más fotos)
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = "MATERIAL FOTOS RRSS/Menorca";
const OUT = "public/uploads";
const WIDTH = 1600;
const QUALITY = 80;

const jobs = [
  { src: `${SRC}/_web_CC/Menorca_Cala_Macarella_Menorca_02.jpg`, out: "cala-macarella.webp" },
  { src: `${SRC}/_web_CC/Menorca_Cala_Turqueta_Menorca_06.jpg`, out: "cala-turqueta.webp" },
  { src: `${SRC}/Cala-Mitjana-desde-el-Aire.jpg`, out: "cala-mitjana.webp" },
  { src: `${SRC}/cala pregonda.jpg`, out: "cala-pregonda.webp" },
  { src: `${SRC}/pelayo-arbues-OYUj4l3FoPQ-unsplash.jpg`, out: "menorca-hero.webp" },
  { src: `${SRC}/pelayo-arbues-B1gDa1LjMG4-unsplash.jpg`, out: "cala-macarelleta.webp" },
  { src: `${SRC}/pelayo-arbues-CkZ1gMcK-iE-unsplash.jpg`, out: "cami-de-cavalls.webp" },
  { src: `${SRC}/ciuta.avif`, out: "ciutadella.webp" },
];

mkdirSync(OUT, { recursive: true });

for (const j of jobs) {
  try {
    const info = await sharp(j.src)
      .rotate()
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(join(OUT, j.out));
    console.log(`✓ ${j.out}  ${Math.round(info.size / 1024)} KB  ${info.width}x${info.height}`);
  } catch (e) {
    console.log(`✗ ${j.out}: ${e.message}`);
  }
}
