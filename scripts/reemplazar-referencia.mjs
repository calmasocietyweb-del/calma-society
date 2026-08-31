/**
 * reemplazar-referencia.mjs — cambia UNA foto del banco por otra, manteniendo el
 * hueco y actualizando su _origen.json. Es lo que se usa cuando la hoja de
 * contactos caza una intrusa: un rotulo pintado encima, un sitio que no es
 * Menorca, o dos fotos casi iguales.
 *
 * Uso: node scripts/reemplazar-referencia.mjs <raiz> <tema> <n> <url> <busqueda> <titulo> <motivo>
 */
import { writeFileSync, readFileSync, renameSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const [raiz, tema, n, url, busqueda, titulo, motivo] = process.argv.slice(2);
const dir = join(raiz, tema);
const idx = Number(n);

const r = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' },
  redirect: 'follow', signal: AbortSignal.timeout(25000),
});
if (!r.ok) { console.error('no se pudo bajar: ' + r.status); process.exit(1); }
const buf = Buffer.from(await r.arrayBuffer());
const meta = await sharp(buf).metadata();

const mote = (q) => q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(menorca|de|la|el|los|las|en|playa|puerto|foto|hotel)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'menorca';

const viejo = readdirSync(dir).find((f) => f.startsWith(String(idx).padStart(2, '0') + '-'));
const nuevo = `${String(idx).padStart(2, '0')}-${mote(busqueda)}.jpg`;
writeFileSync(join(dir, nuevo), buf);
if (viejo && viejo !== nuevo) renameSync(join(dir, viejo), join(dir, '_descartada-' + viejo));

const o = JSON.parse(readFileSync(join(dir, '_origen.json'), 'utf8'));
const antes = o.fotos[idx - 1];
o.fotos[idx - 1] = { local: nuevo, busqueda, titulo, url, px: `${meta.width}x${meta.height}`, kb: Math.round(buf.length / 1024) };
o.descartadas = o.descartadas || [];
o.descartadas.push({ ...antes, motivo });
writeFileSync(join(dir, '_origen.json'), JSON.stringify(o, null, 1));
console.log(`${tema} ${idx}: ${viejo} -> ${nuevo}  (${meta.width}x${meta.height})  motivo: ${motivo}`);
