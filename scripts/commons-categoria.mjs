/**
 * commons-categoria.mjs — descarga candidatas desde CATEGORÍAS de Wikimedia
 * Commons (mucho más fiable que la búsqueda por texto para pueblos y sitios).
 *
 * Uso: node scripts/commons-categoria.mjs --lote <json>   // { slug: "Category:X" | ["Category:X","Category:Y"] }
 * Deja las fotos en .tmp_wiki/nuevas/ y los metadatos en _candidatas.json
 */
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = ".tmp_wiki/nuevas";
mkdirSync(OUT, { recursive: true });
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "CalmaSocietyBot/1.0 (https://calmasociety.com; hola@calmasociety.com)";
const LIBRES = /^(cc[ -]?by([ -]sa)?([ -]\d(\.\d)?)?|cc0|public domain|pd-|dominio)/i;
// Fuera lo que nunca ilustra un evento: mapas, escudos, planos, documentos.
const RUIDO = /(map|mapa|coat of arms|escut|escudo|flag|bandera|plan[ao]|diagram|logo|seal|blason|svg|chart|graph|satellite|aerial view of the island)/i;

async function api(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: "json", origin: "*", ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function ficherosDe(cat, limite = 60) {
  const out = [];
  const r = await api({ action: "query", list: "categorymembers", cmtitle: cat, cmtype: "file", cmlimit: limite });
  for (const m of r.query?.categorymembers || []) out.push(m.title);
  // una capa de subcategorías
  const sub = await api({ action: "query", list: "categorymembers", cmtitle: cat, cmtype: "subcat", cmlimit: 8 });
  for (const s of sub.query?.categorymembers || []) {
    if (out.length > limite) break;
    const rr = await api({ action: "query", list: "categorymembers", cmtitle: s.title, cmtype: "file", cmlimit: 20 });
    for (const m of rr.query?.categorymembers || []) out.push(m.title);
  }
  return [...new Set(out)];
}

async function meta(titulos) {
  const out = [];
  for (let i = 0; i < titulos.length; i += 10) {
    const info = await api({ action: "query", titles: titulos.slice(i, i + 10).join("|"), prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: 1600 });
    for (const p of Object.values(info.query?.pages || {})) {
      const ii = p.imageinfo?.[0]; if (!ii) continue;
      const em = ii.extmetadata || {};
      const lic = (em.LicenseShortName?.value || "").replace(/<[^>]+>/g, "");
      if (!LIBRES.test(lic)) continue;
      if ((ii.width || 0) < 1200 || (ii.width || 0) < (ii.height || 0)) continue; // horizontal y grande
      if (RUIDO.test(p.title)) continue;
      out.push({
        archivo: p.title.replace(/^File:/, ""), url: ii.thumburl || ii.url,
        pagina: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        autor: (em.Artist?.value || "").replace(/<[^>]+>/g, "").trim().slice(0, 120),
        licencia: lic,
        descripcion: (em.ImageDescription?.value || "").replace(/<[^>]+>/g, "").trim().slice(0, 180),
        ancho: ii.width, alto: ii.height,
      });
    }
  }
  return out;
}

async function descargar(url, destino) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return false;
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length < 40000) return false;
  writeFileSync(destino, b); return true;
}

const idxPath = join(OUT, "_candidatas.json");
const idx = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, "utf8")) : {};
const lote = JSON.parse(readFileSync(process.argv[3], "utf8"));
const N = Number(process.argv[4]) || 6;

for (const [slug, catsRaw] of Object.entries(lote)) {
  const cats = Array.isArray(catsRaw) ? catsRaw : [catsRaw];
  try {
    let titulos = [];
    for (const c of cats) titulos.push(...(await ficherosDe(c)));
    const m = await meta([...new Set(titulos)].slice(0, 70));
    m.sort((a, b) => b.ancho - a.ancho);
    const guardadas = []; let i = 0;
    for (const c of m) {
      const ext = (c.archivo.match(/\.(jpg|jpeg|png)$/i) || [".jpg"])[0].toLowerCase().replace("jpeg", "jpg");
      const nombre = `${slug}--${i}${ext}`;
      if (await descargar(c.url, join(OUT, nombre))) { guardadas.push({ local: nombre, ...c }); i++; }
      if (i >= N) break;
    }
    idx[slug] = { categorias: cats, candidatas: guardadas };
    console.log(`${slug}: ${guardadas.length}/${m.length} libres  [${cats.join(", ")}]`);
  } catch (e) { console.log(`${slug}: ERROR ${e.message}`); }
}
writeFileSync(idxPath, JSON.stringify(idx, null, 1));
