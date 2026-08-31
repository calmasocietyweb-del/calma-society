/**
 * google-referencias.mjs — baja a disco las fotos cosechadas de Google Imágenes
 * para usarlas como FONDO e INSPIRACIÓN dentro de Higgsfield. No se publican.
 *
 * Por qué existe pudiendo usar pinterest-referencias.mjs: en Pinterest el fichero
 * es un hash sin significado y se PIERDE el verificador barato (mirar el nombre).
 * Aquí la foto viene de una búsqueda POR EL NOMBRE DEL SITIO («Cala Pregonda
 * Menorca»), así que el fichero se nombra con ese sitio y el _origen.json guarda
 * el título y la página de donde sale. El nombre vuelve a decir qué es la foto.
 *
 * Aun así: el nombre es una PISTA, no una prueba. Hay que mirar la hoja de
 * contactos antes de dar el banco por bueno.
 *
 * Uso: node scripts/google-referencias.mjs <cosecha.json> [n-por-tema]
 *      cosecha.json = { "TEMA": [{ u: url, t: titulo, q: busqueda }, ...] }
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const RAIZ = join('MATERIAL FOTOS RRSS', 'Menorca', '_referencias-google');
const CABECERAS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*',
};

// El sitio que se buscó, para nombrar el fichero: «Cala Pregonda Menorca» -> cala-pregonda
const mote = (q) => q
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(menorca|de|la|el|los|las|en|playa|puerto|foto|hotel)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'menorca';

// Hosts de banco de imagenes: sirven la foto CON marca de agua encima. El nombre
// de fichero puede decir "shutterstock" sin problema (es una copia licenciada en
// la web del cliente); lo que delata la marca de agua es el HOST.
const AGUA = /(^|\.)(dreamstime|shutterstock|alamy|istockphoto|gettyimages|123rf|depositphotos|stock\.adobe)\.com$|ftcdn\.net$/i;

async function bajar(url) {
  try { if (AGUA.test(new URL(url).hostname)) return null; } catch { return null; }
  try {
    const r = await fetch(url, { headers: CABECERAS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 40000) return null;                       // miniaturas y placeholders
    const meta = await sharp(b).metadata();                   // además valida que ES una imagen
    if (!meta.width || meta.width < 750) return null;
    return { buffer: b, meta };
  } catch { return null; }
}

const cosecha = JSON.parse(await import('node:fs').then((m) => m.readFileSync(process.argv[2], 'utf8')));
const N = Number(process.argv[3]) || 10;
let total = 0;

for (const [tema, fotos] of Object.entries(cosecha)) {
  const dir = join(RAIZ, tema);
  mkdirSync(dir, { recursive: true });
  const guardadas = [];
  const porSitio = new Map();                                 // reparto a vueltas: ningún sitio se come el tema
  for (const f of fotos) {
    const k = f.q || '';
    if (!porSitio.has(k)) porSitio.set(k, []);
    porSitio.get(k).push(f);
  }
  const colas = [...porSitio.values()];
  const orden = [];
  for (let i = 0; colas.some((c) => c[i]); i++) for (const c of colas) if (c[i]) orden.push(c[i]);

  for (const f of orden) {
    if (guardadas.length >= N) break;
    const r = await bajar(f.u);
    if (!r) continue;
    const nombre = `${String(guardadas.length + 1).padStart(2, '0')}-${mote(f.q)}.jpg`;
    writeFileSync(join(dir, nombre), r.buffer);
    guardadas.push({
      local: nombre, busqueda: f.q, titulo: f.t, url: f.u,
      px: `${r.meta.width}x${r.meta.height}`, kb: Math.round(r.buffer.length / 1024),
    });
  }
  writeFileSync(join(dir, '_origen.json'), JSON.stringify({
    tema,
    fuente: 'Google Imagenes, buscando POR EL NOMBRE de cada sitio de Menorca',
    uso: 'SOLO referencia interna para Higgsfield. No se publica ninguna de estas fotos tal cual.',
    aviso: 'Son fotos de terceros con derechos. Sirven de fondo e inspiracion, nunca de contenido publicado.',
    fotos: guardadas,
  }, null, 1));
  console.log(`${tema.padEnd(26)} ${String(guardadas.length).padStart(2)}/${fotos.length}`);
  total += guardadas.length;
}
console.log(`\n${total} foto(s) en ${RAIZ}`);
