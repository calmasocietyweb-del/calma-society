// Optimiza las fotos de la flota con chófer (Menorca Bus) para la web.
// Origen: "COCHES Videos y fotos/" — carpeta ignorada por git (4,5 GB de material).
// Genera WebP responsive en public/uploads siguiendo la convención del sitio:
// base (1600), -960 y -480 para el srcset.
//
// Licencia: fotos propias / del fotógrafo de Menorca Bus, autorizadas por el
// dueño el 2026-07-16. Crédito: "Menorca Bus".
//
// Uso: node scripts/optimize-flota-fotos.mjs
import sharp from "sharp";

const SRC = "COCHES Videos y fotos/Fotos";
const OUT = "public/uploads";
const QUALITY = 78;
const WIDTHS = [1600, 960, 480];

const jobs = [
  // Exteriores: mandan sobre los interiores — anclan el coche EN Menorca,
  // que es lo que ningún competidor ni banco de imágenes puede replicar.
  { src: `${SRC}/Audi A8/Audi A8 Exterior.jpg`, out: "mb-audi-a8-cala" },
  { src: `${SRC}/Clase E/Mercedes clase E exterior 2.jpg`, out: "mb-clase-e-costa" },
  // Interiores: apoyo.
  { src: `${SRC}/Audi A8/AUDI INTERIOR.png`, out: "mb-audi-a8-interior" },
  { src: `${SRC}/Clase E/CLASE E INTERIOR 1.png`, out: "mb-clase-e-interior" },
];

for (const job of jobs) {
  const meta = await sharp(job.src).metadata();
  for (const w of WIDTHS) {
    // El base (1600) SIEMPRE se genera, aunque el original sea más pequeño:
    // si no, quedan variantes -960/-480 huérfanas y el <Figure> apunta a un
    // archivo que no existe. Las variantes mayores que el original sí se saltan.
    const isBase = w === 1600;
    if (!isBase && w > meta.width) continue;
    const suffix = isBase ? "" : `-${w}`;
    const dest = `${OUT}/${job.out}${suffix}.webp`;
    await sharp(job.src)
      .resize({ width: Math.min(w, meta.width), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);
    console.log(`  ${dest}`);
  }
}
console.log("OK");
