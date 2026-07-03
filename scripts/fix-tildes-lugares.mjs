/**
 * Restaura tildes/eñes perdidas en las fichas ES de `src/content/lugares`
 * (KAN-54): parte del seed llegó en ASCII plano ("mas pequeno", "nucleo",
 * "Mao"). Opera sobre el JSON PARSEADO y solo en CAMPOS DE PROSA (whitelist):
 * nunca toca claves del schema ni enums/slugs/URLs (un regex sobre el texto
 * crudo convertía la clave `"area"` en `"área"` y rompía todas las fichas).
 *
 * Diccionario CURADO de palabras inequívocas en este corpus, con límites de
 * palabra Unicode; informa de cada sustitución para revisión humana antes de
 * commitear. Idempotente.
 *
 * Uso:  node scripts/fix-tildes-lugares.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
const dry = process.argv.includes("--dry");

// des-acentuada → correcta. SOLO formas cuya versión sin tilde no es una
// palabra española válida en este contexto (o cuyo uso aquí es inequívoco).
const DICT = {
  mas: "más", tambien: "también", despues: "después", aqui: "aquí", alli: "allí",
  asi: "así", todavia: "todavía", segun: "según", ademas: "además", quiza: "quizá",
  facil: "fácil", dificil: "difícil", unico: "único", unica: "única",
  tipico: "típico", tipica: "típica", tipicos: "típicos", tipicas: "típicas",
  ultimo: "último", ultima: "última", proximo: "próximo", proxima: "próxima",
  rapida: "rápida", rapido: "rápido",
  nucleo: "núcleo", epoca: "época", linea: "línea",
  dia: "día", dias: "días", kilometro: "kilómetro", kilometros: "kilómetros",
  numero: "número", panoramica: "panorámica", panoramicas: "panorámicas",
  historico: "histórico", historica: "histórica", historicos: "históricos", historicas: "históricas",
  arqueologico: "arqueológico", arqueologica: "arqueológica",
  talayotico: "talayótico", talayotica: "talayótica", talayoticos: "talayóticos",
  botanico: "botánico", autentico: "auténtico", autentica: "auténtica",
  mediterraneo: "mediterráneo", mediterranea: "mediterránea",
  pequeno: "pequeño", pequena: "pequeña", pequenos: "pequeños", pequenas: "pequeñas",
  bano: "baño", banos: "baños", montana: "montaña", montanas: "montañas",
  nino: "niño", ninos: "niños", nina: "niña", ninas: "niñas",
  cabana: "cabaña", cabanas: "cabañas", senal: "señal", senalizado: "señalizado",
  senalizada: "señalizada", espanol: "español", espanola: "española",
  Espana: "España",
  anos: "años", banarse: "bañarse", rincon: "rincón", ano: "año",
  ningun: "ningún", Cami: "Camí",
  bahia: "bahía", audioguia: "audioguía", fotografia: "fotografía",
  arqueologia: "arqueología", galeria: "galería", pedania: "pedanía", vacia: "vacía",
  poblacion: "población",
  // topónimos ("Menorca" no lleva tilde y no se toca; "manana"/"via"/"area"
  // fuera del diccionario: ambiguas o coinciden con claves/valores del schema;
  // los catalanes "Cavalleria", "Santa Maria", "Sa Cudia", "Santandria" se
  // quedan como están — su grafía correcta es la catalana)
  Mao: "Maó",
};

// Sufijos UNIVERSALES del español: toda palabra terminada en -cion/-sion
// (singular) lleva tilde (población, excursión, inmersión…). El plural
// -ciones/-siones va SIN tilde y el límite \b lo respeta.
const SUFFIX_RULES = [
  [/(\p{L}{2,})cion(?![\p{L}])/gu, "$1ción", "-cion→-ción"],
  [/(\p{L}{2,})sion(?![\p{L}])/gu, "$1sión", "-sion→-sión"],
];

const conteo = {};
function fixTexto(s) {
  let out = s;
  for (const [plain, fixed] of Object.entries(DICT)) {
    // Cubre también la forma Capitalizada a inicio de frase ("Pequena cala…"),
    // preservando la mayúscula en el reemplazo.
    const cap = plain[0].toUpperCase() + plain.slice(1);
    const capFixed = fixed[0].toUpperCase() + fixed.slice(1);
    const re = new RegExp(`(?<![\\p{L}])(${plain}|${cap})(?![\\p{L}])`, "gu");
    out = out.replace(re, (m) => {
      conteo[`${plain}→${fixed}`] = (conteo[`${plain}→${fixed}`] ?? 0) + 1;
      return m === cap ? capFixed : fixed;
    });
  }
  for (const [re, repl, label] of SUFFIX_RULES) {
    out = out.replace(re, (...args) => {
      conteo[label] = (conteo[label] ?? 0) + 1;
      return `${args[1]}${repl.slice(2)}`;
    });
  }
  return out;
}

// Campos de PROSA donde sí se corrige (todo lo demás queda intacto).
function fixFicha(f) {
  if (typeof f.name === "string") f.name = fixTexto(f.name);
  if (typeof f.description === "string") f.description = fixTexto(f.description);
  if (typeof f.area === "string") f.area = fixTexto(f.area); // valor visible ("Maó")
  if (f.practicalInfo) {
    for (const k of Object.keys(f.practicalInfo)) {
      if (typeof f.practicalInfo[k] === "string") f.practicalInfo[k] = fixTexto(f.practicalInfo[k]);
    }
  }
  if (f.seo) {
    if (typeof f.seo.title === "string") f.seo.title = fixTexto(f.seo.title);
    if (typeof f.seo.description === "string") f.seo.description = fixTexto(f.seo.description);
  }
  if (f.planner) {
    const p = f.planner;
    if (Array.isArray(p.highlights)) p.highlights = p.highlights.map((h) => (typeof h === "string" ? fixTexto(h) : h));
    for (const k of ["effortNote", "shuttleInfo", "seasonalHours"]) {
      if (typeof p[k] === "string") p[k] = fixTexto(p[k]);
    }
  }
  // Bloque editorial (ficha-artículo): prosa anidada {lead, sections[{title, body}]…}
  if (f.editorial) {
    const walk = (node) => {
      if (typeof node === "string") return fixTexto(node);
      if (Array.isArray(node)) return node.map(walk);
      if (node && typeof node === "object") {
        for (const k of Object.keys(node)) node[k] = walk(node[k]);
      }
      return node;
    };
    f.editorial = walk(f.editorial);
  }
  return f;
}

let filesTouched = 0;
for (const file of readdirSync(DIR).filter((f) => f.endsWith("-es.json"))) {
  const path = join(DIR, file);
  const original = readFileSync(path, "utf8");
  const ficha = fixFicha(JSON.parse(original));
  const nuevo = JSON.stringify(ficha, null, 2) + "\n";
  // Compara semánticamente (reserializado) para detectar cambios reales.
  const antes = JSON.stringify(JSON.parse(original), null, 2) + "\n";
  if (nuevo !== antes) {
    filesTouched++;
    if (!dry) writeFileSync(path, nuevo);
    console.log(`${dry ? "(dry) " : "✓ "}${file}`);
  }
}

console.log(`\n${dry ? "SIMULACIÓN" : "Hecho"}: ${filesTouched} archivo(s) con cambios.`);
console.log("Sustituciones:", JSON.stringify(conteo, null, 1));
