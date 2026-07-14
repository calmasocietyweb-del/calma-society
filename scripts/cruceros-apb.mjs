/**
 * EL ROBOT DEL PUERTO — vigila a diario que nuestro calendario de cruceros no mienta.
 *
 * El problema que resuelve: un calendario de escalas cambia solo (las navieras mueven
 * horas, añaden barcos, cancelan) y el nuestro dependía de que alguien se acordara de
 * refrescarlo. Estuvo 21 días sin tocar y con TRES datos falsos publicados, entre ellos
 * una hora de zarpa que regalaba hora y media de tierra que no existía. Y el tiempo en
 * tierra es LA promesa de las páginas por barco: si esa hora está mal, alguien pierde
 * su barco.
 *
 * Lo que hace, cada mañana:
 *   1. Lee el registro oficial de atraques de la Autoridad Portuaria de Baleares.
 *   2. Corrige SOLO las horas que no cuadran  → es dato oficial, objetivo y fechado
 *      (misma excepción que el parte del viento de AEMET: no es contenido editorial).
 *   3. AVISA, sin publicar, de lo que pide criterio: una escala nueva (necesita pasaje y
 *      naviera), una que desaparece (¿cancelada?), o dos cruceros el mismo día (uno puede
 *      tener que fondear, y entonces se desembarca en lancha y el tiempo en tierra cambia).
 *
 * LÍMITE HONESTO: el puerto solo ve unas semanas por delante. Esto no rellena la
 * temporada — para eso hacen falta los consignatarios. Hace que lo inminente sea CIERTO,
 * que es justo donde un dato falso hace daño: el crucerista mira la web la semana de su
 * escala, no en enero.
 *
 * Uso:  node scripts/cruceros-apb.mjs            (corrige y escribe avisos)
 *       node scripts/cruceros-apb.mjs --dry-run  (no toca nada, solo informa)
 *
 * La lógica del diff vive en src/lib/apb.ts, probada aparte: de ella depende que no se
 * publique una hora de atraque falsa.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { escalasDeMao, diffCalendario, ventanaDeCruceros, mismoBarco } from "../src/lib/apb.ts";

const FEED = "https://posidoniaweb.portsdebalears.com/docs/files/atraques.json";
const CALENDARIO = "src/data/cruceros-menorca-2026.json";
const AVISOS = "src/data/cruceros-avisos.json";
const DRY = process.argv.includes("--dry-run");

const hoy = new Date().toISOString().slice(0, 10);

/** El feed son ~2 MB. Si el puerto no responde, el robot calla: no rompe la web. */
async function descargar() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const res = await fetch(FEED, { signal: ctrl.signal, headers: { "User-Agent": "calma-society-bot" } });
    if (!res.ok) throw new Error(`el puerto respondió ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error("el feed no es una lista de atraques");
    return json;
  } finally {
    clearTimeout(t);
  }
}

const feed = await descargar();
const puerto = escalasDeMao(feed);
// La ventana la marcan los CRUCEROS del feed, no sus ferries (que llegan mucho mas
// lejos): si no, cada escala nuestra del mes siguiente pareceria cancelada.
const ventana = ventanaDeCruceros(puerto, hoy);
const cal = JSON.parse(readFileSync(CALENDARIO, "utf8"));

const { correcciones, confirmadas, nuevas, desaparecidas, dobles } = diffCalendario(puerto, cal.calls, ventana);

console.log(`Registro del puerto: ${feed.length} atraques · ${puerto.length} cruceros en Maó`);
console.log(`Ventana que alcanza a ver: ${ventana.desde} → ${ventana.hasta}\n`);

// --- LO QUE SE CORRIGE SOLO: las horas. Dato oficial, no opinión. -------------
for (const c of correcciones) {
  const call = cal.calls.find((x) => x.date === c.date && mismoBarco(x.ship, c.ship));
  if (!call) continue;
  call[c.campo] = c.ahora;
  call.confidence = "alta";
  call.sourceCount = 2;
  call.source = "https://www.portsdebalears.com/es/buques-en-puerto";
  console.log(`CORRIGE  ${c.date} ${c.ship}: ${c.campo} ${c.antes ?? "—"} → ${c.ahora}`);
}

// Una escala que el puerto avala deja de ser "prevista": es un hecho.
let subidas = 0;
for (const c of confirmadas) {
  const call = cal.calls.find((x) => x.date === c.date && mismoBarco(x.ship, c.ship));
  if (call && call.confidence !== "alta") {
    call.confidence = "alta";
    call.sourceCount = 2;
    call.source = "https://www.portsdebalears.com/es/buques-en-puerto";
    subidas++;
  }
}
if (subidas) console.log(`CONFIRMA ${subidas} escala(s) suben a fiabilidad "alta" (las avala el puerto)`);

// --- LO QUE SOLO SE AVISA: lo que pide criterio humano ------------------------
// Añadir un barco necesita capacidad de pasaje y la naviera bien escrita; retirar uno,
// estar seguro de que no es un hueco del feed. Eso no lo decide un robot.
const avisos = {
  updated: hoy,
  ventana,
  nuevas: nuevas.map((n) => ({
    date: n.date,
    ship: n.ship,
    arrival: n.arrival,
    departure: n.departure,
    departureDate: n.departureDate,
    muelle: n.muelle,
    consignatario: n.consignatario,
    escala: n.escala,
    nota: "El puerto la tiene y nosotros no. Falta capacidad de pasaje y naviera antes de publicarla.",
  })),
  desaparecidas: desaparecidas.map((d) => ({
    date: d.date,
    ship: d.ship,
    nota: "La publicamos y el puerto NO la tiene, estando dentro de su ventana. ¿Cancelada? Verificar antes de retirarla.",
  })),
  dobles: dobles.map((d) => ({
    ...d,
    nota: "Dos cruceros el mismo día. Si uno fondea, se desembarca en lancha y el tiempo real en tierra cambia.",
  })),
};

for (const n of avisos.nuevas) console.log(`AVISO+   ${n.date} ${n.ship} (${n.arrival ?? "sin hora"}) — el puerto la tiene, nosotros no`);
for (const d of avisos.desaparecidas) console.log(`AVISO-   ${d.date} ${d.ship} — la publicamos y el puerto no la tiene`);
for (const d of avisos.dobles) console.log(`AVISO=   ${d.date}: ${d.barcos.map((b) => `${b.ship} (${b.eslora} m)`).join(" + ")}`);

const pendientes = avisos.nuevas.length + avisos.desaparecidas.length;

if (DRY) {
  console.log("\n--dry-run: no se ha escrito nada.");
} else {
  if (correcciones.length || subidas) {
    cal.updated = hoy;
    writeFileSync(CALENDARIO, JSON.stringify(cal, null, 2) + "\n", "utf8");
  }
  writeFileSync(AVISOS, JSON.stringify(avisos, null, 2) + "\n", "utf8");
}

console.log(
  `\nRESUMEN: ${correcciones.length} hora(s) corregida(s) · ${subidas} confirmada(s) · ` +
    `${pendientes} aviso(s) por revisar · ${avisos.dobles.length} día(s) con dos barcos`,
);

// Para el resumen del job en GitHub (lo que se ve sin abrir logs).
if (process.env.GITHUB_STEP_SUMMARY) {
  const l = [`## Robot del puerto — ${hoy}`, ""];
  l.push(`Ventana del puerto: **${ventana.desde} → ${ventana.hasta}** · ${puerto.length} cruceros en Maó`, "");
  if (correcciones.length) {
    l.push("### Horas corregidas (publicadas)");
    for (const c of correcciones) l.push(`- **${c.date} ${c.ship}** — ${c.campo}: ${c.antes ?? "—"} → **${c.ahora}**`);
    l.push("");
  }
  if (pendientes) {
    l.push("### Pendiente de que una persona lo mire");
    for (const n of avisos.nuevas) l.push(`- ➕ **${n.date} ${n.ship}** (${n.arrival ?? "sin hora"}) — el puerto la tiene, nosotros no`);
    for (const d of avisos.desaparecidas) l.push(`- ➖ **${d.date} ${d.ship}** — la publicamos y el puerto no la tiene`);
    l.push("");
  }
  if (!correcciones.length && !pendientes) l.push("Sin novedades: el calendario coincide con el registro del puerto.");
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, l.join("\n"), { flag: "a" });
}
