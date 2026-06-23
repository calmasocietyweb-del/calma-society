/**
 * update-event-photos.mjs — parchea el campo `image` de las fichas de eventos
 * según un mapeo curado (tema acorde + sin repetir). NO toca el resto del JSON.
 *
 * Lee `src/data/agenda-fotos-map.json` = { "<translationKey>": "<nombre-foto>" }
 * y reescribe `image: "/uploads/<nombre-foto>.webp"` en `{key}-es.json` y `-en.json`.
 *
 * Uso:  node scripts/update-event-photos.mjs [ruta-map.json]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIR = resolve(ROOT, "src/content/eventos");
const MAP = resolve(ROOT, process.argv[2] || "src/data/agenda-fotos-map.json");

const map = JSON.parse(readFileSync(MAP, "utf8"));

// Índice translationKey → { es: archivo, en: archivo }. El nombre de archivo NO
// siempre coincide con el translationKey (eventos antiguos: festes-gracia → "gracia").
const index = {};
for (const f of readdirSync(DIR)) {
  if (!f.endsWith(".json")) continue;
  const o = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  const tk = o.translationKey;
  if (!tk) continue;
  (index[tk] ||= {})[o.lang] = f;
}

let patched = 0, missing = 0;
const used = new Map();

for (const [key, img] of Object.entries(map)) {
  const files = index[key];
  if (!files) { missing++; console.warn(`  ⚠ sin ficha para translationKey "${key}"`); continue; }
  if (!existsSync(resolve(ROOT, "public/uploads", `${img}.webp`)))
    console.warn(`  ⚠ falta la foto public/uploads/${img}.webp (para ${key})`);
  for (const lang of Object.keys(files)) {
    const file = join(DIR, files[lang]);
    const o = JSON.parse(readFileSync(file, "utf8"));
    o.image = `/uploads/${img}.webp`;
    writeFileSync(file, JSON.stringify(o, null, 2) + "\n");
  }
  patched++;
  used.set(img, (used.get(img) || 0) + 1);
}

const repes = [...used.entries()].filter(([, n]) => n > 1);
console.log(`✓ ${patched} eventos parcheados (${missing} claves sin ficha).`);
console.log(`  Fotos distintas: ${used.size}.` +
  (repes.length ? `  ⚠ REPETIDAS: ${repes.map(([k, n]) => `${k}×${n}`).join(", ")}` : "  Sin repeticiones ✓"));
