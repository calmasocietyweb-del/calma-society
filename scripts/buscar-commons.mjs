/**
 * buscar-commons.mjs — busca en Wikimedia Commons fotos con licencia libre de
 * los SITIOS REALES donde ocurre cada evento de la agenda, y descarga candidatas
 * a .tmp_wiki/nuevas/ para curarlas MIRÁNDOLAS (lección KAN-119: el alt heredado
 * no es verificación; hay que abrir la foto).
 *
 * Uso:  node scripts/buscar-commons.mjs "<consulta>" <slug-destino> [n]
 *       node scripts/buscar-commons.mjs --lote <fichero-json>
 *
 * El fichero de lote es { "<slug>": "<consulta>", ... }.
 * Deja un índice con autor/licencia/URL en .tmp_wiki/nuevas/_candidatas.json
 */
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = ".tmp_wiki/nuevas";
mkdirSync(OUT, { recursive: true });
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "CalmaSocietyBot/1.0 (https://calmasociety.com; hola@calmasociety.com)";

const LIBRES = /^(cc[ -]?by([ -]sa)?([ -]\d(\.\d)?)?|cc0|public domain|pd-|dominio)/i;

async function api(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: "json", origin: "*", ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

/** Busca ficheros de imagen y devuelve metadatos (autor, licencia, url). */
async function buscar(consulta, n = 8) {
  const s = await api({ action: "query", list: "search", srsearch: `${consulta} filetype:bitmap`, srnamespace: 6, srlimit: n * 3 });
  const titulos = (s.query?.search || []).map((x) => x.title);
  if (!titulos.length) return [];
  const out = [];
  for (let i = 0; i < titulos.length; i += 10) {
    const info = await api({
      action: "query", titles: titulos.slice(i, i + 10).join("|"),
      prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: 1600,
    });
    for (const p of Object.values(info.query?.pages || {})) {
      const ii = p.imageinfo?.[0]; if (!ii) continue;
      const em = ii.extmetadata || {};
      const lic = (em.LicenseShortName?.value || "").replace(/<[^>]+>/g, "");
      if (!LIBRES.test(lic)) continue;
      if ((ii.width || 0) < 1100) continue;
      out.push({
        titulo: p.title,
        archivo: p.title.replace(/^File:/, ""),
        url: ii.thumburl || ii.url,
        urlFull: ii.url,
        pagina: em.DescriptionUrl?.value || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        autor: (em.Artist?.value || "").replace(/<[^>]+>/g, "").trim().slice(0, 120),
        licencia: lic,
        descripcion: (em.ImageDescription?.value || "").replace(/<[^>]+>/g, "").trim().slice(0, 200),
        ancho: ii.width, alto: ii.height,
      });
    }
  }
  return out.slice(0, n);
}

async function descargar(url, destino) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return false;
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length < 40000) return false;
  writeFileSync(destino, b);
  return true;
}

const idxPath = join(OUT, "_candidatas.json");
const idx = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, "utf8")) : {};

const args = process.argv.slice(2);
let lote;
if (args[0] === "--lote") lote = JSON.parse(readFileSync(args[1], "utf8"));
else lote = { [args[1]]: args[0] };
const N = Number(args[2]) || 6;

for (const [slug, consulta] of Object.entries(lote)) {
  try {
    const res = await buscar(consulta, N);
    const guardadas = [];
    let i = 0;
    for (const c of res) {
      const ext = (c.archivo.match(/\.(jpg|jpeg|png)$/i) || [".jpg"])[0].toLowerCase();
      const nombre = `${slug}--${i}${ext.replace("jpeg", "jpg")}`;
      if (await descargar(c.url, join(OUT, nombre))) { guardadas.push({ local: nombre, ...c }); i++; }
      if (i >= N) break;
    }
    idx[slug] = { consulta, candidatas: guardadas };
    console.log(`${slug}: ${guardadas.length} candidatas  (${consulta})`);
  } catch (e) {
    console.log(`${slug}: ERROR ${e.message}`);
    idx[slug] = { consulta, candidatas: [], error: e.message };
  }
}
writeFileSync(idxPath, JSON.stringify(idx, null, 1));
console.log(`\n→ índice en ${idxPath}`);
