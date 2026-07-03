/**
 * Repara las descripciones ES TRUNCADAS de `src/content/lugares` (KAN-54):
 * el seed cortó ~39 descripciones a media frase, pero el texto COMPLETO vive
 * en los JSON de investigación (.tmp_research/*.json). Para cada ficha cuya
 * descripción no termina en puntuación, busca en la investigación una cadena
 * que EMPIECE por ese texto (comparación insensible a tildes, porque la
 * investigación llegó en ASCII) y, si la encuentra, restaura la versión
 * completa. No inventa nada: solo recupera el original verificado.
 *
 * Después de esto, correr `node scripts/fix-tildes-lugares.mjs` para
 * re-acentuar el texto restaurado. Uso: [--dry]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
const RESEARCH = ".tmp_research";
const dry = process.argv.includes("--dry");

// Normaliza para comparar: sin tildes, minúsculas, espacios colapsados.
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

// Recolecta TODAS las cadenas largas de la investigación (candidatas a descripción).
const candidatas = [];
for (const file of readdirSync(RESEARCH).filter((f) => f.endsWith(".json"))) {
  let data;
  try { data = JSON.parse(readFileSync(join(RESEARCH, file), "utf8")); } catch { continue; }
  const walk = (node) => {
    if (typeof node === "string") { if (node.length > 100) candidatas.push(node); return; }
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") Object.values(node).forEach(walk);
  };
  walk(data);
}
console.log(`Investigación: ${candidatas.length} textos candidatos.`);

let reparadas = 0, sinFuente = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith("-es.json"))) {
  const path = join(DIR, file);
  const ficha = JSON.parse(readFileSync(path, "utf8"));
  const d = (ficha.description ?? "").trim();
  if (!d || /[.!?…»")]$/.test(d)) continue; // no truncada

  // La ficha truncada debe ser PREFIJO de la candidata (con margen de 1 char
  // por si el corte cayó dentro de una palabra con tilde restaurada).
  const objetivo = norm(d).slice(0, -1);
  const match = candidatas
    .filter((c) => norm(c).startsWith(objetivo) && c.length > d.length)
    .sort((a, b) => a.length - b.length)[0]; // la más corta que encaje (la original)

  if (match) {
    reparadas++;
    console.log(`${dry ? "(dry) " : "✓ "}${file}  (+${match.length - d.length} chars)`);
    if (!dry) {
      ficha.description = match.trim();
      writeFileSync(path, JSON.stringify(ficha, null, 2) + "\n");
    }
  } else {
    sinFuente.push(file);
  }
}

console.log(`\n${dry ? "SIMULACIÓN" : "Hecho"}: ${reparadas} reparadas.`);
if (sinFuente.length) {
  console.log(`SIN fuente encontrada (${sinFuente.length}) — completar A MANO desde la versión EN:`);
  sinFuente.forEach((f) => console.log("  ", f));
}
