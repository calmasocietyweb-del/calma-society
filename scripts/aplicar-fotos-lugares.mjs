/**
 * aplicar-fotos-lugares.mjs — pone foto a las fichas de `lugares` que no la
 * tenían. Mismo criterio que la agenda (ver aplicar-fotos-agenda.mjs): la foto
 * es del SITIO real, y el `alt` DESCRIBE lo que se ve en lugar de afirmar.
 *
 * Cada foto se ha mirado en hoja de contactos y contrastado con el nombre del
 * fichero original de Commons, que nombra el lugar.
 *
 * El mapa vive en scripts/data/fotos-lugares.mjs para no mezclar datos y motor.
 *
 * Uso:  node scripts/aplicar-fotos-lugares.mjs [--solo tipo]
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { MAPA } from "./data/fotos-lugares.mjs";

const TMP = ".tmp_wiki/nuevas";
const OUT = "public/uploads";
const DIR = "src/content/lugares";
const WIDTHS = [1600, 960, 480];
const idx = JSON.parse(readFileSync(join(TMP, "_candidatas.json"), "utf8"));

// ── Índice translationKey → { lang: fichero } ────────────────────────────────
const index = {};
for (const f of readdirSync(DIR)) {
  if (!f.endsWith(".json")) continue;
  const o = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  if (o.translationKey) (index[o.translationKey] ||= {})[o.lang] = f;
}

function candidata(ref) {
  const m = ref.match(/^(.+)--(\d+)$/);
  if (!m) return null;
  const grupo = idx[m[1]];
  if (!grupo) return null;
  return grupo.candidatas.find((c) => c.local.startsWith(`${m[1]}--${m[2]}.`));
}

function credito(c) {
  const autor = (c.autor || "").replace(/\s+/g, " ").trim() || "autor no indicado";
  return `${autor} / Wikimedia Commons (${c.licencia})`;
}

mkdirSync(OUT, { recursive: true });
const creditsPath = "src/data/lugares-fotos-credits.json";
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {};

let hechas = 0;
const fallos = [];
for (const [key, cfg] of Object.entries(MAPA)) {
  const fichas = index[key];
  if (!fichas) { fallos.push(`${key}: sin ficha`); continue; }

  let ruta, cred = null;
  if (cfg.src.startsWith("/uploads/")) {
    ruta = cfg.src;
    if (!existsSync("public" + ruta)) { fallos.push(`${key}: no existe ${ruta}`); continue; }
  } else {
    const c = candidata(cfg.src);
    if (!c) { fallos.push(`${key}: candidata ${cfg.src} no encontrada`); continue; }
    const base = `lg-${key}`;
    try {
      for (const w of WIDTHS) {
        const nombre = w === 1600 ? `${base}.webp` : `${base}-${w}.webp`;
        await sharp(join(TMP, c.local)).rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 78 }).toFile(join(OUT, nombre));
      }
    } catch (e) { fallos.push(`${key}: sharp ${e.message}`); continue; }
    ruta = `/uploads/${base}.webp`;
    cred = credito(c);
    credits[key] = { archivo: c.archivo, autor: c.autor, licencia: c.licencia, pagina: c.pagina, fuente: "Wikimedia Commons" };
  }

  for (const [lang, fichero] of Object.entries(fichas)) {
    const p = join(DIR, fichero);
    const o = JSON.parse(readFileSync(p, "utf8"));
    o.images = [ruta];
    // El alt cae a la versión ES si falta el idioma: mejor un alt correcto en
    // otra lengua que un alt heredado del nombre, que es lo que AFIRMA de más.
    o.imageAlt = cfg[lang] ?? cfg.es;
    if (cred) o.imageCredit = cred; else if (cfg.credito) o.imageCredit = cfg.credito;
    writeFileSync(p, JSON.stringify(o, null, 2) + "\n");
  }
  hechas++;
}

writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + "\n");
console.log(`✓ ${hechas}/${Object.keys(MAPA).length} lugares con foto.`);
if (fallos.length) { console.log(`\n⚠ ${fallos.length} fallos:`); fallos.forEach((f) => console.log("  " + f)); }
