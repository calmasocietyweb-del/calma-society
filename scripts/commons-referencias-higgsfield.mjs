/**
 * commons-referencias-higgsfield.mjs — banco de fotos REALES de Menorca para usarlas
 * como FONDO e INSPIRACIÓN dentro de Higgsfield (no se publican tal cual).
 *
 * Se apoya en lo aprendido en KAN-125: en Wikimedia Commons hay que buscar por
 * CATEGORÍA (la búsqueda por texto es flojísima), Commons hace throttling en
 * silencio (si un grupo da 0 hay que reintentar), y el nombre del fichero original
 * es el verificador más barato de que la foto es de donde dice ser.
 *
 * Se diferencia de `commons-categoria.mjs` en tres cosas:
 *   · acepta VERTICALES además de horizontales (una referencia sirve igual, y un
 *     faro o una fachada piden vertical),
 *   · organiza por TEMA en carpetas, no en un montón plano,
 *   · deja `_creditos.json` en cada carpeta con autor, licencia y enlace de origen.
 *
 * ⛔ CATEGORÍAS QUE NO SIRVEN, comprobadas: `Category:Albarcas` son los zuecos de
 * Cantabria (la buena es `Category:Avarca`); `Category:Llaüt` es un tipo de barca de
 * todo el Mediterráneo catalán y devuelve Calafell y Port de la Selva; y
 * `Category:Dry stone walls in Spain` devuelve Galicia y Cáceres.
 *
 * Uso: node scripts/commons-referencias-higgsfield.mjs <lote.json> [n-por-tema]
 *      lote.json = { "TEMA": ["Category:X", "Category:Y"], ... }
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join('MATERIAL FOTOS RRSS', 'Menorca', '_referencias-higgsfield');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'CalmaSocietyBot/1.0 (https://calmasociety.com; hola@calmasociety.com)';

const LIBRES = /^(cc[ -]?by([ -]sa)?([ -]\d(\.\d)?)?|cc0|public domain|pd-|dominio)/i;
/** Lo que nunca sirve de referencia visual: mapas, escudos, planos, documentos. */
const RUIDO = /(map|mapa|coat of arms|escut|escudo|flag|bandera|plan|plan[ao]|plan du|diagram|logo|seal|blason|svg|chart|graph|satellite|schema|plànol|btv1b|gallica|engraving|gravure|lithograph|carte |stamp|sello|unsplash|setmana del llibre|llibre en català|book week|portrait of|selfie)/i;
// «Unsplash» en el nombre delata una subida de banco generico sin relacion con el
// sitio: en la categoria de pueblos colo un «Lakeside grass Unsplash» que no es
// Menorca, y en agosto colo una modelo de stock en la categoria de Alaior.
/**
 * Trampas comprobadas: Commons mezcla sitios homónimos de fuera de Menorca.
 * «Port Mahon» hay en Oxford y en París; «Ferreries» también es un barrio de
 * Tortosa; «La Mola» es más famosa en Formentera; y hay categorías de Mallorca
 * e Ibiza que caen en las mismas búsquedas.
 */
const FUERA_DE_MENORCA = /(oxford|paris|tortosa|formentera|mallorca|majorca|ibiza|eivissa|cartagena|galicia|valencia|collioure|lisboa|lisbon|portugal|bacalhau|picos de europa|cantabria|cabuerniga|asturias|massalfassar|philippines|canary|navarre|catalonia|cáceres|caceres|calafell|tarragona|levantina|vela latina|port de la selva|girona|costa brava)/i;

/** Lo que identifica a Menorca por nombre: pueblos, calas y gentilicios. */
const MENORCA = /(menorca|minorca|menorqu|maó|mao|mahón|mahon|ciutadella|alaior|mercadal|ferreries|sant lluís|sant lluis|es castell|migjorn|fornells|binib|macarel|turqueta|galdana|pregonda|cavalleria|artrutx|talaiot|talayot|xoriguer|albufera des grau)/i;

async function api(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: 'json', origin: '*', ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function ficherosDe(cat, limite = 60) {
  const out = [];
  const r = await api({ action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: 'file', cmlimit: limite });
  for (const m of r.query?.categorymembers || []) out.push(m.title);
  // Una capa de subcategorías: muchas categorías de pueblo cuelgan las fotos ahí.
  //
  // ⚠️ PERO SOLO si la subcategoría habla de Menorca. Sin este filtro, «Cuisine of
  // Menorca» bajaba por sus subcategorías hasta platos de bacalao genéricos y
  // devolvió un «Bolinho de Bacalhau» portugués y unas albóndigas de Massalfassar.
  // Si la categoría raíz ya es de un sitio menorquín concreto, se acepta igual.
  const raizEsMenorquina = MENORCA.test(cat);
  const sub = await api({ action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: 'subcat', cmlimit: 8 });
  for (const s of sub.query?.categorymembers || []) {
    if (out.length > limite) break;
    if (FUERA_DE_MENORCA.test(s.title)) continue;
    if (!raizEsMenorquina && !MENORCA.test(s.title)) continue;
    const rr = await api({ action: 'query', list: 'categorymembers', cmtitle: s.title, cmtype: 'file', cmlimit: 20 });
    for (const m of rr.query?.categorymembers || []) out.push(m.title);
  }
  return [...new Set(out)];
}

async function meta(titulos) {
  const out = [];
  for (let i = 0; i < titulos.length; i += 10) {
    const info = await api({
      action: 'query', titles: titulos.slice(i, i + 10).join('|'),
      prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: 2000,
    });
    for (const p of Object.values(info.query?.pages || {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const em = ii.extmetadata || {};
      const lic = (em.LicenseShortName?.value || '').replace(/<[^>]+>/g, '');
      if (!LIBRES.test(lic)) continue;
      if ((ii.width || 0) < 1200 && (ii.height || 0) < 1200) continue; // grande, da igual la orientación
      if (RUIDO.test(p.title) || FUERA_DE_MENORCA.test(p.title)) continue;
      out.push({
        archivo: p.title.replace(/^File:/, ''),
        url: ii.thumburl || ii.url,
        pagina: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        autor: (em.Artist?.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 120),
        licencia: lic,
        descripcion: (em.ImageDescription?.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 200),
        ancho: ii.width, alto: ii.height,
        orientacion: (ii.width || 0) >= (ii.height || 0) ? 'horizontal' : 'vertical',
      });
    }
  }
  return out;
}

async function descargar(url, destino) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return false;
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length < 60000) return false; // miniaturas y basura
  writeFileSync(destino, b);
  return true;
}

const lote = JSON.parse((await import('node:fs')).readFileSync(process.argv[2], 'utf8'));
const N = Number(process.argv[3]) || 6;
const resumen = [];

for (const [tema, catsRaw] of Object.entries(lote)) {
  const cats = Array.isArray(catsRaw) ? catsRaw : [catsRaw];
  const dir = join(RAIZ, tema);
  mkdirSync(dir, { recursive: true });
  try {
    // Se resuelve CADA CATEGORÍA POR SEPARADO y luego se reparte a vueltas entre
    // ellas. Juntándolas en un montón único, un sitio muy fotografiado se llevaba
    // el tema entero: la primera prueba dio 5 de 6 «calas» que eran Cala Macarella.
    const porCategoria = [];
    for (const c of cats) {
      // Commons hace throttling EN SILENCIO: si una categoría da 0, se reintenta.
      let m = [];
      for (let intento = 1; intento <= 2 && m.length === 0; intento++) {
        const titulos = await ficherosDe(c);
        m = await meta([...new Set(titulos)].slice(0, 40));
        if (m.length === 0 && intento === 1) await new Promise((r) => setTimeout(r, 1200));
      }
      // Dentro de cada categoría, alternar orientación para que el tema tenga de las dos.
      const h = m.filter((x) => x.orientacion === 'horizontal').sort((a, b) => b.ancho - a.ancho);
      const v = m.filter((x) => x.orientacion === 'vertical').sort((a, b) => b.alto - a.alto);
      const mezcla = [];
      while (h.length || v.length) { if (h.length) mezcla.push(h.shift()); if (v.length) mezcla.push(v.shift()); }
      if (mezcla.length) porCategoria.push(mezcla);
    }
    const candidatas = porCategoria.flat();
    // Reparto a vueltas: una de cada categoría antes de repetir ninguna.
    const orden = [];
    const vistos = new Set();
    for (let vuelta = 0; orden.length < candidatas.length; vuelta++) {
      let algo = false;
      for (const lista of porCategoria) {
        const c = lista[vuelta];
        if (c && !vistos.has(c.archivo)) { orden.push(c); vistos.add(c.archivo); algo = true; }
      }
      if (!algo) break;
    }

    const guardadas = [];
    for (const c of orden) {
      if (guardadas.length >= N) break;
      const ext = (c.archivo.match(/\.(jpg|jpeg|png)$/i) || ['.jpg'])[0].toLowerCase().replace('jpeg', 'jpg');
      // El nombre lleva el ORIGINAL de Commons: es el verificador más barato de
      // que la foto es de donde dice, y delata las que no lo son.
      const limpio = c.archivo.replace(/\.[^.]+$/, '').replace(/[^\w\sáéíóúñçàèòï-]/gi, '').slice(0, 70).trim();
      const nombre = `${String(guardadas.length + 1).padStart(2, '0')} - ${limpio}${ext}`;
      if (await descargar(c.url, join(dir, nombre))) guardadas.push({ local: nombre, ...c });
    }
    writeFileSync(join(dir, '_creditos.json'), JSON.stringify({ tema, categorias: cats, fotos: guardadas }, null, 1));
    console.log(`${tema.padEnd(26)} ${String(guardadas.length).padStart(2)}/${candidatas.length} libres   [${cats.join(', ')}]`);
    resumen.push({ tema, guardadas: guardadas.length, candidatas: candidatas.length });
  } catch (e) {
    console.log(`${tema.padEnd(26)} ERROR ${e.message}`);
    resumen.push({ tema, error: e.message });
  }
}

const total = resumen.reduce((s, r) => s + (r.guardadas || 0), 0);
console.log(`\n${total} foto(s) en ${RAIZ}`);
const vacios = resumen.filter((r) => !r.guardadas);
if (vacios.length) console.log(`⚠️  Sin resultados: ${vacios.map((r) => r.tema).join(', ')}`);
