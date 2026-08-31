/**
 * hoja-contactos-banco.mjs — hoja de contactos de un banco de referencias.
 * Una hoja por tema, con cada foto numerada y su nombre debajo, para poder
 * MIRARLAS todas de un vistazo. Es el único verificador que caza a las intrusas:
 * ni la licencia, ni el tamaño, ni el nombre del fichero las detectan.
 *
 * Uso: node scripts/hoja-contactos-banco.mjs <carpeta-raiz> [columnas]
 */
import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.argv[2];
const COLS = Number(process.argv[3]) || 5;
const CELDA = 620, GAP = 8, PIE = 42;

const temas = readdirSync(RAIZ).filter((d) => statSync(join(RAIZ, d)).isDirectory());

for (const tema of temas) {
  const dir = join(RAIZ, tema);
  // Los ficheros que empiezan por _ son descartes (los guarda reemplazar-referencia.mjs
  // como prueba de por que se cayeron): no entran en la hoja.
  const fotos = readdirSync(dir).filter((f) => !f.startsWith('_') && /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (!fotos.length) continue;
  const filas = Math.ceil(fotos.length / COLS);
  const W = COLS * (CELDA + GAP) + GAP;
  const H = filas * (CELDA + PIE + GAP) + GAP;
  const capas = [];

  for (let i = 0; i < fotos.length; i++) {
    const x = GAP + (i % COLS) * (CELDA + GAP);
    const y = GAP + Math.floor(i / COLS) * (CELDA + PIE + GAP);
    const buf = await sharp(join(dir, fotos[i]))
      .resize(CELDA, CELDA, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
    capas.push({ input: buf, left: x, top: y });
    const etiqueta = `${String(i + 1).padStart(2, '0')}  ${fotos[i].replace(/^\d+-|\.jpg$/g, '')}`;
    capas.push({
      input: Buffer.from(
        `<svg width="${CELDA}" height="${PIE}"><rect width="${CELDA}" height="${PIE}" fill="#141414"/>` +
        `<text x="8" y="28" font-family="monospace" font-size="22" fill="#e8e2d6">${etiqueta.replace(/[<&]/g, '')}</text></svg>`
      ),
      left: x, top: y + CELDA,
    });
  }

  const salida = join(RAIZ, `_HOJA-${tema}.jpg`);
  await sharp({ create: { width: W, height: H, channels: 3, background: '#141414' } })
    .composite(capas).jpeg({ quality: 86 }).toFile(salida);
  console.log(`${tema.padEnd(28)} ${fotos.length} fotos -> ${salida}`);
}
