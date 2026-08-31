/**
 * pinterest-referencias.mjs — baja a disco los pines cosechados del navegador,
 * para usarlos como FONDO e INSPIRACIÓN dentro de Higgsfield. No se publican.
 *
 * Las rutas las cosecha Claude conduciendo el Chrome del dueño (Pinterest no
 * tiene API de búsqueda ni es dueño de las fotos: es un índice). Aquí solo se
 * descargan.
 *
 * i.pinimg.com sirve la misma foto en varios tamaños cambiando un segmento de la
 * URL. `originals` es la máxima calidad pero devuelve 403 en bastantes pines;
 * `736x` no falla nunca y a 736 px sobra para una referencia. Se intenta el
 * original y se cae a 736x.
 *
 * ⚠️ A diferencia de Wikimedia, el nombre del fichero es un hash sin significado:
 * NO se puede verificar de qué es la foto leyendo el nombre. Hay que MIRARLAS.
 *
 * Uso: node scripts/pinterest-referencias.mjs <cosecha.json> [n-por-tema]
 *      cosecha.json = { "TEMA": ["aa/bb/cc/hash.jpg", ...] }
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join('MATERIAL FOTOS RRSS', 'Menorca', '_referencias-pinterest');
const CABECERAS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  Referer: 'https://www.pinterest.com/',
};

async function bajar(ruta) {
  for (const tamano of ['originals', '736x']) {
    const url = `https://i.pinimg.com/${tamano}/${ruta}`;
    try {
      const r = await fetch(url, { headers: CABECERAS });
      if (!r.ok) continue;
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length < 45000) continue; // miniaturas y placeholders
      return { buffer: b, url, tamano };
    } catch { /* siguiente tamaño */ }
  }
  return null;
}

const cosecha = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const N = Number(process.argv[3]) || 6;
let total = 0;

for (const [tema, rutas] of Object.entries(cosecha)) {
  const dir = join(RAIZ, tema);
  mkdirSync(dir, { recursive: true });
  const guardadas = [];
  for (const ruta of rutas) {
    if (guardadas.length >= N) break;
    const r = await bajar(ruta);
    if (!r) continue;
    const nombre = `${String(guardadas.length + 1).padStart(2, '0')}.jpg`;
    writeFileSync(join(dir, nombre), r.buffer);
    guardadas.push({ local: nombre, url: r.url, tamano: r.tamano, kb: Math.round(r.buffer.length / 1024) });
  }
  writeFileSync(join(dir, '_origen.json'), JSON.stringify({
    tema,
    fuente: 'Pinterest (i.pinimg.com), cosechado del navegador del dueño',
    uso: 'SOLO referencia interna para Higgsfield. No se publica ninguna de estas fotos tal cual.',
    aviso: 'Son fotos de terceros con derechos. Sirven de fondo e inspiracion, nunca de contenido publicado.',
    fotos: guardadas,
  }, null, 1));
  console.log(`${tema.padEnd(26)} ${String(guardadas.length).padStart(2)}/${rutas.length}`);
  total += guardadas.length;
}
console.log(`\n${total} foto(s) en ${RAIZ}`);
