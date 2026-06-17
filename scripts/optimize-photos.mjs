// Optimiza fotos para la web: genera WebP responsive en public/uploads.
// Para cada imagen crea 3 anchos: base (1600), -960 y -480, para servir al
// móvil una versión ligera (srcset). El hero se recorta apaisado (cover) para
// que pese mucho menos. Uso: node scripts/optimize-photos.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = "MATERIAL FOTOS RRSS/Menorca";
const OUT = "public/uploads";
const QUALITY = 78;
const WIDTHS = [1600, 960, 480]; // base + variantes responsive

// jobs: { src, out, cover? }  — cover fuerza recorte apaisado (para heroes).
const jobs = [
  { src: `${SRC}/_web_CC/Menorca_Cala_Macarella_Menorca_02.jpg`, out: "cala-macarella" },
  { src: `${SRC}/_web_CC/Menorca_Cala_Turqueta_Menorca_06.jpg`, out: "cala-turqueta" },
  { src: `${SRC}/Cala-Mitjana-desde-el-Aire.jpg`, out: "cala-mitjana" },
  { src: `${SRC}/cala pregonda.jpg`, out: "cala-pregonda" },
  { src: `${SRC}/pelayo-arbues-OYUj4l3FoPQ-unsplash.jpg`, out: "menorca-hero", cover: { w: 1600, h: 1000 } },
  { src: `${SRC}/pelayo-arbues-B1gDa1LjMG4-unsplash.jpg`, out: "cala-macarelleta" },
  { src: `${SRC}/pelayo-arbues-CkZ1gMcK-iE-unsplash.jpg`, out: "cami-de-cavalls" },
  { src: `${SRC}/ciuta.avif`, out: "ciutadella" },
  // Fotos de Adobe Stock (licenciadas).
  { src: `${SRC}/_stock/fine-dining.jpg`, out: "fine-dining" },
  { src: `${SRC}/_stock/queso-curacion.jpg`, out: "queso-curacion" },
  { src: `${SRC}/_stock/casa-piedra.jpg`, out: "casa-piedra" },
  { src: `${SRC}/_stock/menorca-punta-nati.jpg`, out: "menorca-punta-nati" },
  { src: `${SRC}/_stock/puerto-mao.jpg`, out: "puerto-mao" },
  { src: `${SRC}/_stock/fornells.jpg`, out: "fornells" },
  { src: `${SRC}/_stock/faro-artrutx.jpg`, out: "faro-artrutx" },
  { src: `${SRC}/_stock/gin-menorca.jpg`, out: "gin-menorca" },
  { src: `${SRC}/_stock/villa-menorca.jpg`, out: "villa-menorca" },
  // Entradas nuevas (jun 2026).
  { src: `${SRC}/_stock/mao-puerto.jpg`, out: "mao-puerto", cover: { w: 1600, h: 1000 } }, // origen vertical → recorte apaisado
  { src: `${SRC}/_stock/binibeca.jpg`, out: "binibeca" },
  { src: `${SRC}/_stock/atardecer-menorca.jpg`, out: "atardecer-menorca" },
  { src: `${SRC}/_stock/navegar-menorca.jpg`, out: "navegar-menorca" },
  { src: `${SRC}/_stock/calma-menorca.jpg`, out: "calma-menorca" },
  // s'Albufera des Grau — Wikimedia Commons (Nicolas G. Mertens, CC BY-SA 4.0).
  { src: `${SRC}/_stock/albufera-des-grau.jpg`, out: "albufera-des-grau" },
  // Guía de productos de Menorca (Adobe Stock, licenciadas — jun 2026).
  { src: `${SRC}/_stock/productos-menorca.jpg`, out: "productos-menorca" },
  { src: `${SRC}/_stock/avarcas-menorca.jpg`, out: "avarcas-menorca" },
  { src: `${SRC}/_stock/vino-menorca.jpg`, out: "vino-menorca" },
  { src: `${SRC}/_stock/embutidos-menorca.jpg`, out: "embutidos-menorca" },
  { src: `${SRC}/_stock/dulces-menorca.jpg`, out: "dulces-menorca" },
  // Clúster de movilidad / transporte (Adobe Stock, licenciadas — jun 2026).
  { src: `${SRC}/_stock/crucero-menorca.jpg`, out: "crucero-menorca", cover: { w: 1600, h: 1000 } },
  { src: `${SRC}/_stock/transfer-menorca.jpg`, out: "transfer-menorca" },
  // Fotos REALES de Menorca Bus (web propia, mismo grupo; crédito "Menorca Bus").
  { src: `${SRC}/_stock/mb-movilidad.webp`, out: "mb-movilidad" },
  { src: `${SRC}/_stock/mb-aeropuerto.webp`, out: "mb-aeropuerto" },
  { src: `${SRC}/_stock/mb-excursiones.webp`, out: "mb-excursiones" },
  { src: `${SRC}/_stock/mb-cruceros.webp`, out: "mb-cruceros" },
];

mkdirSync(OUT, { recursive: true });

for (const j of jobs) {
  for (const w of WIDTHS) {
    // base = "nombre.webp"; variantes = "nombre-960.webp", "nombre-480.webp"
    const name = w === 1600 ? `${j.out}.webp` : `${j.out}-${w}.webp`;
    try {
      let img = sharp(j.src).rotate();
      if (j.cover) {
        // Recorte apaisado proporcional al ancho.
        const h = Math.round((j.cover.h / j.cover.w) * w);
        img = img.resize({ width: w, height: h, fit: "cover" });
      } else {
        img = img.resize({ width: w, withoutEnlargement: true });
      }
      const info = await img.webp({ quality: QUALITY }).toFile(join(OUT, name));
      console.log(`✓ ${name}  ${Math.round(info.size / 1024)} KB  ${info.width}x${info.height}`);
    } catch (e) {
      console.log(`✗ ${name}: ${e.message}`);
    }
  }
}
