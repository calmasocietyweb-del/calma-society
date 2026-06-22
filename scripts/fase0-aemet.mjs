/**
 * FASE 0 (BLOQUEANTE) — Verificación de la fuente AEMET OpenData.
 * ------------------------------------------------------------------
 * Comprueba con la API key real (en .env, no en git) que AEMET nos da
 * DIRECCIÓN e INTENSIDAD de viento USABLES para Menorca. Es el go/no-go
 * del MVP de "Dónde el mar está en calma".
 *
 * Prueba el producto MUNICIPIO HORARIA (JSON estructurado, viento por hora),
 * que mapea cada cala a su municipio costero:
 *   - Ciutadella (07015) → Macarella, Turqueta, Son Saura…  (sur/oeste)
 *   - Ferreries  (07021) → Mitjana, Galdana, Trebalúger     (sur)
 *   - Es Mercadal(07037) → Pregonda, Cavalleria, Fornells   (norte)
 *   - Maó        (07032) → este
 *
 * Ejecutar:  node scripts/fase0-aemet.mjs
 */
import { readFileSync } from "node:fs";

// --- Carga de la clave desde .env (sin dependencias) ---
function leerEnv(clave) {
  try {
    const txt = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const m = txt.match(new RegExp(`^${clave}=(.+)$`, "m"));
    return m ? m[1].trim() : null;
  } catch { return null; }
}
const KEY = process.env.AEMET_API_KEY || leerEnv("AEMET_API_KEY");
if (!KEY) { console.error("Falta AEMET_API_KEY en .env"); process.exit(1); }

const BASE = "https://opendata.aemet.es/opendata/api";

/** AEMET responde en 2 pasos: 1) un JSON con la URL 'datos'; 2) los datos. */
async function aemet(ruta) {
  const r1 = await fetch(`${BASE}${ruta}?api_key=${KEY}`);
  const meta = await r1.json();
  if (meta.estado && meta.estado !== 200) {
    throw new Error(`AEMET estado ${meta.estado}: ${meta.descripcion}`);
  }
  if (!meta.datos) throw new Error(`Sin campo 'datos': ${JSON.stringify(meta)}`);
  const r2 = await fetch(meta.datos);
  return r2.json();
}

const MUNICIPIOS = [
  { cod: "07015", nombre: "Ciutadella (sur/oeste)" },
  { cod: "07021", nombre: "Ferreries (sur)" },
  { cod: "07037", nombre: "Es Mercadal (norte)" },
  { cod: "07032", nombre: "Maó (este)" },
];

async function vientoHoy(cod) {
  const data = await aemet(`/prediccion/especifica/municipio/horaria/${cod}`);
  const dia = data?.[0]?.prediccion?.dia?.[0];
  if (!dia) throw new Error("estructura inesperada");
  // El viento horario viene en 'vientoAndRachaMax' (periodos = horas).
  const horas = (dia.vientoAndRachaMax || [])
    .filter((p) => p.direccion && p.velocidad && p.periodo && p.periodo.length <= 2)
    .map((p) => ({ h: p.periodo, dir: p.direccion[0], vel: Number(p.velocidad[0]) }));
  return { fecha: dia.fecha, horas };
}

console.log(`\n  FASE 0 — ¿AEMET sirve como motor? (clave …${KEY.slice(-6)})\n`);
let ok = true;
for (const m of MUNICIPIOS) {
  try {
    const { fecha, horas } = await vientoHoy(m.cod);
    const muestra = horas.filter((x) => ["09", "12", "15", "18"].includes(x.h));
    const txt = (muestra.length ? muestra : horas.slice(0, 4))
      .map((x) => `${x.h}h ${x.dir} ${x.vel}km/h`)
      .join("  ·  ");
    console.log(`  ✓ ${m.nombre.padEnd(22)} ${txt}`);
  } catch (e) {
    ok = false;
    console.log(`  ✗ ${m.nombre.padEnd(22)} ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 600)); // cortesía con el rate limit
}

// Cross-check: boletín marítimo costero de Baleares (estado de la mar por zona).
try {
  const mar = await aemet(`/prediccion/maritima/costera/costa/62`);
  const txt = JSON.stringify(mar).slice(0, 180);
  console.log(`\n  ✓ Marítima costera Baleares (muestra): ${txt}…`);
} catch (e) {
  console.log(`\n  · Marítima costera: ${e.message} (probaré otro código si hace falta)`);
}

console.log(
  `\n  ${ok ? "GO ✅" : "REVISAR ⚠"}  — si hay dirección+velocidad por hora, el motor funciona con AEMET.\n`
);
