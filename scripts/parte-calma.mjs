/**
 * "DÓNDE EL MAR ESTÁ EN CALMA" — generador diario del parte por cala.
 * ==================================================================
 * Lee el viento de AEMET (por municipio, JSON estructurado), lo cruza con la
 * ORIENTACIÓN de cada cala (windExposure) y escribe src/data/parte-calma.json con:
 *   - ABRIGO del mar (banda alto/medio/bajo): predicción meteo objetiva (AEMET).
 *   - "Empuje del viento hacia la cala" (baja/media/alta): orientación de las
 *     CONDICIONES DE LLEGADA de medusas, NO presencia. Modelo aprobado (ver doc).
 *
 * El empuje necesita el viento de las ÚLTIMAS 48 h. AEMET solo da previsión, así
 * que acumulamos el viento horario en src/data/viento-historia.json a cada corrida
 * (el cron diario va rellenando la línea temporal). Hasta tener ≥60% de la ventana,
 * el empuje sale "sin-dato" (degradación honesta, nunca un "baja" falso).
 *
 * Convención geométrica CANÓNICA (no invertir al migrar de fuente):
 *   dirViento = dirección DESDE la que sopla; openingBearingDeg = dirección DESDE
 *   la que el viento entra de frente a la cala; onshore máximo cuando dir==opening.
 *
 * Ejecutar:  node scripts/parte-calma.mjs        (necesita AEMET_API_KEY en .env)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  calcularEmpuje, dirADeg, nombreViento, isoHour, FORMULA_VERSION_EMPUJE,
} from "./lib/empuje-medusas.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LUGARES_DIR = join(ROOT, "src", "content", "lugares");
const EXTRA_FILE = join(ROOT, "src", "data", "calas-extra.json");
const OUT_DIR = join(ROOT, "src", "data");
const OUT_FILE = join(OUT_DIR, "parte-calma.json");
const HIST_FILE = join(OUT_DIR, "viento-historia.json");

const FORMULA_VERSION = `abrigo-1.0 / ${FORMULA_VERSION_EMPUJE}`;
const ATRIBUCION = "AEMET";

// ---- Parámetros del ABRIGO (el empuje de medusas vive en lib/empuje-medusas.mjs) ----
const VENTANA_DIURNA = [10, 18]; // franja de baño para el ABRIGO
const ABRIGO_VMAX = 38; // km/h donde el viento onshore satura la penalización de abrigo

const rad = (d) => (d * Math.PI) / 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const onshoreCalma = (windFrom, op) => (1 + Math.cos(rad(windFrom - op))) / 2; // abrigo

const bandaAbrigo = (s) => (s >= 0.66 ? "alto" : s >= 0.4 ? "medio" : "bajo");

function leerEnv(clave) {
  try {
    const m = readFileSync(join(ROOT, ".env"), "utf8").match(new RegExp(`^${clave}=(.+)$`, "m"));
    return m ? m[1].trim() : null;
  } catch { return null; }
}
const KEY = process.env.AEMET_API_KEY || leerEnv("AEMET_API_KEY");

const BASE = "https://opendata.aemet.es/opendata/api";
async function aemetRaw(ruta) {
  const meta = await (await fetch(`${BASE}${ruta}?api_key=${KEY}`)).json();
  if (meta.estado && meta.estado !== 200) throw new Error(`estado ${meta.estado}`);
  if (!meta.datos) throw new Error("sin 'datos'");
  return (await fetch(meta.datos)).json();
}
// Reintento con espera ante 429 (límite por minuto) o caídas puntuales.
async function aemet(ruta) {
  for (let i = 0; ; i++) {
    try { return await aemetRaw(ruta); }
    catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 3500 * (i + 1))); }
  }
}

const pad = (n) => String(n).padStart(2, "0");

function cargarCalas() {
  const calas = [];
  for (const f of readdirSync(LUGARES_DIR).filter((f) => f.endsWith("-es.json"))) {
    const d = JSON.parse(readFileSync(join(LUGARES_DIR, f), "utf8"));
    if (d.type !== "cala" || !d.windExposure) continue;
    calas.push({
      id: f.replace("-es.json", ""), name: d.name, area: d.area,
      lat: d.coordinates.lat, lng: d.coordinates.lng, lugarSlug: f.replace("-es.json", ""),
      ...d.windExposure,
    });
  }
  try {
    for (const c of JSON.parse(readFileSync(EXTRA_FILE, "utf8"))) calas.push({ lugarSlug: null, ...c });
  } catch { /* sin registro extra */ }
  return calas;
}

/** Viento de hoy de un municipio: franja diurna (abrigo) + todas las horas (historia). */
function parseAemet(data) {
  const hoy = new Date().toISOString().slice(0, 10);
  const dias = data?.[0]?.prediccion?.dia ?? [];
  const dia = dias.find((d) => (d.fecha || "").slice(0, 10) === hoy)
    ?? dias.find((d) => (d.fecha || "").slice(0, 10) >= hoy) ?? dias[0];
  if (!dia) throw new Error("estructura inesperada");
  const fecha = (dia.fecha || "").slice(0, 10);
  const todas = (dia.vientoAndRachaMax || [])
    .filter((p) => p.direccion && p.velocidad && p.periodo && p.periodo.length === 2)
    .map((p) => ({ h: Number(p.periodo), iso: `${fecha}T${pad(Number(p.periodo))}:00`, dir: p.direccion[0], vel: Number(p.velocidad[0]) }));
  const diurnas = todas.filter((x) => x.h >= VENTANA_DIURNA[0] && x.h <= VENTANA_DIURNA[1]);
  return { diurnas: diurnas.length ? diurnas : todas, todas, fecha };
}

/** Mezcla el viento de hoy en la historia rodante del municipio (poda a 62 h). */
function mergeHistoria(hist, ine, todas, now) {
  const byIso = new Map((hist[ine] || []).map((r) => [r.iso, r]));
  for (const x of todas) byIso.set(x.iso, { iso: x.iso, dir: x.dir, vel: x.vel });
  const limite = now.getTime() - 62 * 3600e3;
  hist[ine] = [...byIso.values()]
    .filter((r) => new Date(r.iso).getTime() >= limite)
    .sort((a, b) => (a.iso < b.iso ? -1 : 1));
  return hist[ine];
}

function calcularAbrigo(op, diurnas) {
  let penal = 0, n = 0, sx = 0, sy = 0, sVel = 0;
  for (const x of diurnas) {
    const deg = dirADeg(x.dir);
    n += 1;
    if (deg == null || x.dir === "C") continue;
    penal += onshoreCalma(deg, op) * clamp01(x.vel / ABRIGO_VMAX);
    sx += Math.cos(rad(deg)); sy += Math.sin(rad(deg)); sVel += x.vel;
  }
  const k = n || 1;
  let dirMedia = (Math.atan2(sy, sx) * 180) / Math.PI; if (dirMedia < 0) dirMedia += 360;
  return {
    band: bandaAbrigo(clamp01(1 - penal / k)), score: Number(clamp01(1 - penal / k).toFixed(2)),
    viento: { nombre: nombreViento(dirMedia), kmh: Math.round(sVel / k) },
  };
}

async function main() {
  if (!KEY) { console.error("Falta AEMET_API_KEY en .env"); process.exit(1); }
  const now = new Date();
  const calas = cargarCalas();
  if (!calas.length) { console.error("No hay calas con windExposure"); process.exit(1); }

  const previo = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : null;
  const previoById = Object.fromEntries((previo?.calas || []).map((c) => [c.id, c]));
  const hist = existsSync(HIST_FILE) ? JSON.parse(readFileSync(HIST_FILE, "utf8")) : {};

  const municipios = [...new Set(calas.map((c) => c.municipioINE))];
  const parsed = {};
  let fallos = 0;
  for (const ine of municipios) {
    try {
      parsed[ine] = parseAemet(await aemet(`/prediccion/especifica/municipio/horaria/${ine}`));
      mergeHistoria(hist, ine, parsed[ine].todas, now);
    } catch (e) {
      fallos += 1;
      console.warn(`  ⚠ municipio ${ine}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 700));
  }

  if (fallos === municipios.length) {
    if (previo) {
      writeFileSync(OUT_FILE, JSON.stringify({ ...previo, stale: true }, null, 2));
      console.log("  AEMET no responde → conservado el parte previo (marcado obsoleto).");
      return;
    }
    console.error("  AEMET no responde y no hay parte previo. No se escribe nada.");
    process.exit(1);
  }
  writeFileSync(HIST_FILE, JSON.stringify(hist, null, 0));

  const resultado = [];
  for (const cala of calas) {
    const p = parsed[cala.municipioINE];
    if (!p) { if (previoById[cala.id]) resultado.push({ ...previoById[cala.id], stale: true }); continue; }
    resultado.push({
      id: cala.id, name: cala.name, area: cala.area,
      costa: (cala.area || "").split(" ")[0].toLowerCase(),
      lat: cala.lat, lng: cala.lng, lugarSlug: cala.lugarSlug,
      tieneVigilancia: !!cala.tieneVigilancia, tienePradera: !!cala.tienePradera,
      abrigo: calcularAbrigo(cala.openingBearingDeg, p.diurnas),
      medusas: calcularEmpuje(cala.openingBearingDeg, hist[cala.municipioINE] || [], now),
    });
  }

  // Fecha REAL del dato (la más antigua entre municipios), no un "hoy" forzado:
  // así el aviso de obsolescencia salta si AEMET sirviera un día pasado.
  const realFecha = Object.values(parsed).map((p) => p.fecha).filter(Boolean).sort()[0] || now.toISOString().slice(0, 10);
  const out = {
    generatedAt: now.toISOString(),
    forecastDate: realFecha,
    validityNote: "Previsión para la franja diurna (10–18 h). El viento puede rolar por la tarde.",
    sources: [ATRIBUCION],
    // Leyenda literal exigida por AEMET para productos derivados (verificado 17-jul-2026).
    attribution: `Fuente: ${ATRIBUCION}`,
    formulaVersion: FORMULA_VERSION,
    stale: fallos > 0,
    calas: resultado.sort((a, b) => b.abrigo.score - a.abrigo.score),
  };
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  const conDato = resultado.filter((c) => c.medusas.band !== "sin-dato").length;
  console.log(`  ✓ ${resultado.length} calas → parte-calma.json (${out.forecastDate}${out.stale ? ", parcial" : ""}); empuje con dato: ${conDato}/${resultado.length}`);
}

main();
