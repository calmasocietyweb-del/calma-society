// =============================================================================
// Importador de AGENDA — la "máquina propone, el humano dispone".
//
// Lee un feed iCal (.ics) —el formato estándar de calendarios oficiales— y crea
// eventos en la colección `eventos` con status "draft". NADA se publica: todo
// queda pendiente de tu aprobación (ver docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md).
//
// Uso:
//   node scripts/import-agenda.mjs <URL_o_ruta.ics> [es|en]
//
// Ejemplo:
//   node scripts/import-agenda.mjs https://ejemplo.org/agenda.ics es
// =============================================================================
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const source = process.argv[2];
const lang = process.argv[3] === "en" ? "en" : "es";
const outDir = join(process.cwd(), "src", "content", "eventos");

if (!source) {
  console.error("Uso: node scripts/import-agenda.mjs <URL_o_ruta.ics> [es|en]");
  process.exit(1);
}

/** Quita tildes y deja un slug seguro para nombre de archivo. */
function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** Desdobla líneas iCal (las que empiezan por espacio continúan la anterior). */
function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}

/** Convierte una fecha iCal (YYYYMMDD[THHMMSS[Z]]) a ISO YYYY-MM-DD. */
function parseDate(value) {
  const m = value.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Extrae los VEVENT de un texto iCal. */
function parseEvents(ics) {
  const lines = unfold(ics).split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur) events.push(cur);
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).split(";")[0]; // ignora parámetros (;TZID=…)
      const val = line.slice(idx + 1).trim();
      cur[key] = val;
    }
  }
  return events;
}

async function readSource(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status} al leer ${src}`);
    return res.text();
  }
  return readFileSync(src, "utf8");
}

const raw = await readSource(source);
const vevents = parseEvents(raw);

mkdirSync(outDir, { recursive: true });

let created = 0;
let skipped = 0;

for (const ev of vevents) {
  const title = ev.SUMMARY;
  const start = ev.DTSTART && parseDate(ev.DTSTART);
  if (!title || !start) {
    skipped++;
    continue;
  }
  const end = ev.DTEND ? parseDate(ev.DTEND) : undefined;
  const base = slugify(title) || "evento";
  const slug = `${base}-${lang}-auto`;
  const file = join(outDir, `${slug}.json`);

  // No sobrescribir: si ya existe (quizá ya revisado), se respeta.
  if (existsSync(file)) {
    skipped++;
    continue;
  }

  const data = {
    title,
    lang,
    translationKey: base,
    startDate: start,
    ...(end && end !== start ? { endDate: end } : {}),
    location: ev.LOCATION || "Menorca",
    category: "otro",
    description: ev.DESCRIPTION || title,
    ...(ev.URL ? { sourceUrl: ev.URL } : {}),
    status: "draft", // ← cortafuegos: NO se publica hasta tu aprobación
    source: "auto-agenda",
  };

  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  created++;
}

console.log(`\nAgenda importada desde: ${source}`);
console.log(`  Eventos creados (en BORRADOR): ${created}`);
console.log(`  Omitidos (sin fecha/título o ya existentes): ${skipped}`);
console.log(`\nRevisa y aprueba los borradores antes de publicar.\n`);
