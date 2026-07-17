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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LUGARES_DIR = join(ROOT, "src", "content", "lugares");
const EXTRA_FILE = join(ROOT, "src", "data", "calas-extra.json");
const OUT_DIR = join(ROOT, "src", "data");
const OUT_FILE = join(OUT_DIR, "parte-calma.json");
const HIST_FILE = join(OUT_DIR, "viento-historia.json");

const FORMULA_VERSION = "abrigo-1.0 / empuje-medusas-1.0";
const ATRIBUCION = "AEMET";

// ---- Parámetros (constantes visibles; modelo aprobado, recalibrar tras 1 temporada) ----
const VENTANA_DIURNA = [10, 18]; // franja de baño para el ABRIGO
const ABRIGO_VMAX = 38; // km/h donde el viento onshore satura la penalización de abrigo
// Empuje de medusas: ventana 48 h con retardo 6 h, peso gaussiano centrado en 24 h.
const EMPUJE_DESDE = 6;
const EMPUJE_HASTA = 48;
const GAUSS_CENTRO = 24; // h (parámetro a calibrar, rango 18–30)
const GAUSS_SIGMA = 12; // h
const COBERTURA_MIN = 0.6; // si falta >40% de la ventana → "sin-dato"
// Gate estacional (fenología de Pelagia en Baleares; bloquea ALTA fuera de temporada).
const FACTOR_MES = [0.15, 0.15, 0.3, 0.55, 0.85, 1.0, 1.0, 0.95, 0.7, 0.4, 0.2, 0.15];

const DIR_DEG = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSO: 202.5, SO: 225, OSO: 247.5, O: 270, ONO: 292.5, NO: 315, NNO: 337.5,
};
const VIENTOS = [
  [22.5, "Tramuntana (N)"], [67.5, "Gregal (NE)"], [112.5, "Llevant (E)"],
  [157.5, "Xaloc (SE)"], [202.5, "Migjorn (S)"], [247.5, "Llebeig (SO)"],
  [292.5, "Ponent (O)"], [337.5, "Mestral (NO)"], [361, "Tramuntana (N)"],
];
const nombreViento = (deg) => (VIENTOS.find(([m]) => deg < m) ?? VIENTOS[0])[1];

const rad = (d) => (d * Math.PI) / 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const onshoreCalma = (windFrom, op) => (1 + Math.cos(rad(windFrom - op))) / 2; // abrigo
const onshorePos = (windFrom, op) => Math.max(0, Math.cos(rad(windFrom - op))); // empuje
const gaussW = (h) => Math.exp(-((h - GAUSS_CENTRO) ** 2) / (2 * GAUSS_SIGMA ** 2));

/** Peso por intensidad de viento (DECRECIENTE-desde-brisa). HIPÓTESIS no calibrada. */
function fBrisa(kmh) {
  if (kmh < 3) return 0.3;
  if (kmh < 12) return 0.3 + ((kmh - 3) / 9) * 0.7; // 0.3 → 1.0 (óptimo: brisa sostenida)
  if (kmh < 20) return 1.0 - ((kmh - 12) / 8) * 0.4; // 1.0 → 0.6
  if (kmh < 35) return 0.6 - ((kmh - 20) / 15) * 0.3; // 0.6 → 0.3
  return 0.2; // techo bajo, no 0 (prudencia)
}

const bandaAbrigo = (s) => (s >= 0.66 ? "alto" : s >= 0.4 ? "medio" : "bajo");
function bandaEmpuje(score, horasAfavor, gate) {
  const temporada = gate >= 0.5;
  if (score >= 0.45 && horasAfavor >= 12 && temporada) return "alta";
  if (score >= 0.18 || (horasAfavor >= 8 && temporada)) return "media";
  return "baja";
}

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
const isoHour = (t) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:00`;

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
    const deg = DIR_DEG[x.dir];
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

function calcularEmpuje(op, histMun, now) {
  const gate = FACTOR_MES[now.getMonth()];
  let psum = 0, wsum = 0, expected = 0, avail = 0, horasAfavor = 0;
  for (let k = EMPUJE_DESDE; k <= EMPUJE_HASTA; k++) {
    expected += 1;
    const rec = histMun.find((r) => r.iso === isoHour(new Date(now.getTime() - k * 3600e3)));
    if (!rec || rec.dir == null) continue;
    avail += 1;
    const w = gaussW(k);
    wsum += w;
    const deg = DIR_DEG[rec.dir];
    if (deg == null || rec.dir === "C") continue; // calma: empuje 0, pero cuenta como hora con dato
    const onsh = onshorePos(deg, op);
    psum += onsh * fBrisa(rec.vel) * w;
    if (onsh >= 0.3 && rec.vel >= 8) horasAfavor += 1;
  }
  const coverage = expected ? avail / expected : 0;
  if (coverage < COBERTURA_MIN) return { band: "sin-dato", coverage: Number(coverage.toFixed(2)) };
  const score = clamp01((wsum ? psum / wsum : 0) * gate);
  return { band: bandaEmpuje(score, horasAfavor, gate), score: Number(score.toFixed(2)), horasAfavor, coverage: Number(coverage.toFixed(2)) };
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
