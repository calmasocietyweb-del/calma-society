/**
 * TEXTURA DEL MAPA — pinta el relieve real de Menorca y de su mar.
 *
 * Toma la malla de `src/data/menorca-relieve.json` (GEBCO 2020: altitud y profundidad
 * reales) y genera la imagen de fondo del mapa del parte del mar:
 *   · el mar se oscurece con la profundidad (la plataforma costera se distingue del azul hondo);
 *   · la tierra se dora con la altura (del verde de la marina al ocre del Toro).
 * Encima, un sombreado de relieve (luz del noroeste, como en la cartografía clásica)
 * que da textura a los barrancos y a la plataforma submarina.
 *
 * Paleta de la marca (cálida, serena): nada de mapa físico chillón.
 *
 * Uso:  node scripts/relieve-png.mjs   →   public/uploads/menorca-relieve.webp
 * Solo hay que rehacerlo si cambia la malla o la paleta.
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const R = JSON.parse(readFileSync("src/data/menorca-relieve.json", "utf8"));
const { cols, filas, elev } = R;
const W = 1200, H = Math.round((W * filas) / cols); // raster de salida

const en = (c, f) => elev[Math.max(0, Math.min(filas - 1, f)) * cols + Math.max(0, Math.min(cols - 1, c))];
// Altura interpolada (bilineal) en cualquier punto del raster.
function alturaEn(px, py) {
  const gx = (px / (W - 1)) * (cols - 1);
  const gy = (py / (H - 1)) * (filas - 1);
  const c0 = Math.floor(gx), f0 = Math.floor(gy);
  const tx = gx - c0, ty = gy - f0;
  const a = en(c0, f0), b = en(c0 + 1, f0), c = en(c0, f0 + 1), d = en(c0 + 1, f0 + 1);
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

const mez = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
// Escalones de color. Mar: del turquesa de la orilla al azul hondo del talud. Tierra:
// del verde de la marina al ocre de las lomas. Tonos apagados, en la línea de la marca.
const MAR = [
  [0, [205, 228, 228]], [10, [186, 214, 217]], [30, [163, 197, 205]],
  [60, [141, 179, 192]], [120, [120, 160, 178]], [300, [101, 139, 161]],
  [700, [86, 120, 145]], [1800, [74, 104, 130]],
];
const TIERRA = [
  [0, [216, 224, 196]], [40, [208, 216, 182]], [90, [198, 204, 165]],
  [160, [188, 190, 146]], [240, [178, 172, 128]], [360, [170, 155, 113]],
];
function color(h, forzar) {
  const enTierra = forzar === "tierra" || (forzar !== "mar" && h >= 0);
  const tabla = enTierra ? TIERRA : MAR;
  const v = Math.abs(h);
  for (let i = 0; i < tabla.length - 1; i++) {
    const [h0, c0] = tabla[i], [h1, c1] = tabla[i + 1];
    if (v <= h1) return mez(c0, c1, (v - h0) / (h1 - h0));
  }
  return tabla[tabla.length - 1][1];
}

// Sombreado de relieve: luz del noroeste, 45° de altura (convención cartográfica).
const AZIMUT = (315 * Math.PI) / 180, ALTURA = (45 * Math.PI) / 180;
const EXAGERA_TIERRA = 6, EXAGERA_MAR = 3; // el relieve real es suave: se realza un poco
const metrosPorPixel = ((R.bbox.lngMax - R.bbox.lngMin) * 111320 * Math.cos((39.95 * Math.PI) / 180)) / W;

/* Se pintan DOS capas, y no una:
   La malla de GEBCO va a 450 m, así que su línea de costa es más burda que el contorno
   real de OpenStreetMap que dibuja el mapa. Si se pintara una sola imagen, asomaría
   tierra donde ya hay mar (y al revés) por todo el litoral. Con dos capas —el mar por
   debajo, y la tierra recortada por la silueta REAL— la costa cae siempre en su sitio. */
async function pintar(capa, salida) {
  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const h = alturaEn(x, y);
      // En la capa del mar, la tierra se pinta como agua de orilla (queda tapada por la
      // silueta); en la de tierra, el mar se pinta como loma baja. Así ningún borde canta.
      const hh = capa === "mar" ? Math.min(h, 0) : Math.max(h, 0);
      const [r, g, b] = color(hh, capa);
      const k = hh >= 0 ? EXAGERA_TIERRA : EXAGERA_MAR;
      const dzdx = ((alturaEn(x + 1, y) - alturaEn(x - 1, y)) * k) / (2 * metrosPorPixel);
      const dzdy = ((alturaEn(x, y + 1) - alturaEn(x, y - 1)) * k) / (2 * metrosPorPixel);
      const pendiente = Math.atan(Math.hypot(dzdx, dzdy));
      const aspecto = Math.atan2(dzdy, -dzdx);
      let luz =
        Math.sin(ALTURA) * Math.cos(pendiente) +
        Math.cos(ALTURA) * Math.sin(pendiente) * Math.cos(AZIMUT - aspecto);
      // Sombreado contenido: textura, no dramatismo (y sin quemar los claros).
      luz = 0.84 + 0.2 * Math.max(0, Math.min(1, luz));
      const i = (y * W + x) * 3;
      buf[i] = Math.max(0, Math.min(255, Math.round(r * luz)));
      buf[i + 1] = Math.max(0, Math.min(255, Math.round(g * luz)));
      buf[i + 2] = Math.max(0, Math.min(255, Math.round(b * luz)));
    }
  }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .blur(1.1) // disimula el escalón de la malla de 450 m sin comerse el relieve
    .webp({ quality: 82 })
    .toFile(salida);
  const st = await sharp(salida).metadata();
  const kb = (await sharp(salida).toBuffer()).length / 1024;
  console.log(`  ${salida} · ${st.width}×${st.height} · ${kb.toFixed(0)} KB`);
}

await pintar("mar", "public/uploads/menorca-relieve-mar.webp");
await pintar("tierra", "public/uploads/menorca-relieve-tierra.webp");
console.log(`Fuente: ${R.fuente}`);
