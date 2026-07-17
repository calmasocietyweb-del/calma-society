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
const MUELLE = "COCHES Videos y fotos/Cruceros";
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
  // Muelle de cruceros de Maó (2026-07-17, flota esperando al AIDAstella).
  // Los crops NO son estéticos sino de honestidad de marca: dejan fuera del
  // encuadre los autocares/minibuses rotulados que salen en los originales
  // (posicionamiento «para quien no se sube a un autobús de cincuenta»).
  { src: `${MUELLE}/menorcabus10.jpg`, out: "mb-clase-v-muelle", crop: { left: 250, top: 2650, width: 2450, height: 1633 } },
  { src: `${MUELLE}/menorcabus26.jpg`, out: "mb-clase-e-muelle", crop: { left: 1520, top: 2780, width: 2420, height: 1613 } },
  { src: `${MUELLE}/menorcabus10.jpg`, out: "mb-flota-muelle", crop: { left: 950, top: 2750, width: 3050, height: 2033 } },
  // Vertical 2:3 SIN crop: el AIDAstella entero con los coches esperando.
  // Solo se usa en /crucero/aidastella/ — es el único barco donde decir
  // «tu coche esperando a tu barco» es verdad (límite acordado 2026-07-17).
  { src: `${MUELLE}/menorcabus05.jpg`, out: "mb-flota-aidastella" },
];

// Con argumentos, solo procesa esos `out` (evita re-encodear lo ya publicado):
//   node scripts/optimize-flota-fotos.mjs mb-clase-v-muelle mb-flota-aidastella
const solo = process.argv.slice(2);
const pendientes = solo.length ? jobs.filter((j) => solo.includes(j.out)) : jobs;

for (const job of pendientes) {
  const meta = await sharp(job.src).metadata();
  const anchoReal = job.crop?.width ?? meta.width;
  for (const w of WIDTHS) {
    // El base (1600) SIEMPRE se genera, aunque el original sea más pequeño:
    // si no, quedan variantes -960/-480 huérfanas y el <Figure> apunta a un
    // archivo que no existe. Las variantes mayores que el original sí se saltan.
    const isBase = w === 1600;
    if (!isBase && w > anchoReal) continue;
    const suffix = isBase ? "" : `-${w}`;
    const dest = `${OUT}/${job.out}${suffix}.webp`;
    let img = sharp(job.src).rotate(); // respeta la orientación EXIF antes del crop
    if (job.crop) img = img.extract(job.crop);
    await img
      .resize({ width: Math.min(w, anchoReal), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);
    console.log(`  ${dest}`);
  }
}
console.log("OK");
