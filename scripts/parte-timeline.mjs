/**
 * parte-timeline.mjs — genera la PREVISIÓN MULTI-DÍA por franjas para la línea
 * temporal del mapa de calas. Usa AEMET (predicción DIARIA por municipio, que da
 * viento por periodos) y escribe src/data/parte-timeline.json con:
 *   - calas:  [{ id, ine, op }]  → para que el cliente calcule la banda de cada cala.
 *   - frames: [{ id, day, period, fecha, startHour, rep:{name,deg,kmh}, winds:{INE:{d,v}} }]
 *
 * El cliente (ParteCalmaMap.astro) recalcula el ABRIGO de cada cala en cada frame
 * con la misma fórmula que el parte de hoy. Pieza separada del parte diario
 * (parte-calma.mjs sigue intacto, con su histórico de viento para medusas).
 *
 * Ejecutar:  node scripts/parte-timeline.mjs   (necesita AEMET_API_KEY en .env)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LUGARES_DIR = join(ROOT, "src", "content", "lugares");
const EXTRA_FILE = join(ROOT, "src", "data", "calas-extra.json");
const OUT_FILE = join(ROOT, "src", "data", "parte-timeline.json");

const DAYS = 5; // próximos días a cubrir

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
const degDe = (d) => (d == null || d === "" || d === "C" ? null : DIR_DEG[d] ?? null);

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
// Reintento con espera ante 429 (límite por minuto) o caídas puntuales de AEMET.
async function aemet(ruta) {
  for (let i = 0; ; i++) {
    try { return await aemetRaw(ruta); }
    catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 3500 * (i + 1))); }
  }
}

// Mismas calas que el parte diario (fichas con windExposure + calas-extra).
function cargarCalas() {
  const calas = [];
  for (const f of readdirSync(LUGARES_DIR).filter((f) => f.endsWith("-es.json"))) {
    const d = JSON.parse(readFileSync(join(LUGARES_DIR, f), "utf8"));
    if (d.type !== "cala" || !d.windExposure) continue;
    calas.push({ id: f.replace("-es.json", ""), ine: d.windExposure.municipioINE, op: d.windExposure.openingBearingDeg });
  }
  try {
    for (const c of JSON.parse(readFileSync(EXTRA_FILE, "utf8"))) calas.push({ id: c.id, ine: c.municipioINE, op: c.openingBearingDeg });
  } catch { /* sin extra */ }
  return calas;
}

const findPer = (dia, key) => (dia.viento || []).find((v) => (v.periodo || "") === key);

// Define el calendario de frames a partir de un día (qué periodos hay disponibles).
function framesDeDia(dia, idx) {
  const fecha = (dia.fecha || "").slice(0, 10);
  const tiene = (k) => !!findPer(dia, k);
  const dayLabel = idx === 0 ? "Hoy" : idx === 1 ? "Mañana" : new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short" });
  const out = [];
  if (tiene("06-12") || tiene("12-18")) {
    out.push({ fecha, key: "06-12", day: dayLabel, period: "Mañana", startHour: 6 });
    out.push({ fecha, key: "12-18", day: dayLabel, period: "Tarde", startHour: 12 });
  } else if (tiene("00-12") || tiene("12-24")) {
    out.push({ fecha, key: "00-12", day: dayLabel, period: "Mañana", startHour: 0 });
    out.push({ fecha, key: "12-24", day: dayLabel, period: "Tarde", startHour: 12 });
  } else {
    out.push({ fecha, key: "00-24", day: dayLabel, period: "Todo el día", startHour: 0 });
  }
  return out;
}

// Viento de un municipio para un (fecha,key), con descensos de granularidad.
// SEGURIDAD: si no hay NINGÚN dato, devuelve noData (NUNCA un 0/calma falso).
// Distingue calma medida (direccion vacía/C con velocidad leída → d:"C") de "sin dato".
function vientoMun(diasMun, fecha, key) {
  const dia = diasMun.find((d) => (d.fecha || "").slice(0, 10) === fecha);
  if (!dia) return { d: null, v: null, noData: true };
  const hayVel = (e) => e && e.velocidad != null && e.velocidad !== "";
  const pref = key === "06-12" ? ["06-12", "00-12", "00-24"]
    : key === "12-18" ? ["12-18", "12-24", "00-24"]
    : key === "00-12" ? ["00-12", "00-24"]
    : key === "12-24" ? ["12-24", "00-24"]
    : ["00-24"];
  for (const k of pref) {
    const e = findPer(dia, k);
    if (hayVel(e)) return { d: e.direccion || "C", v: Number(e.velocidad) || 0 };
  }
  // Fallback: cualquier entrada con velocidad (p.ej. el periodo sin etiqueta del día +N).
  const any = (dia.viento || []).find(hayVel);
  if (any) return { d: any.direccion || "C", v: Number(any.velocidad) || 0 };
  return { d: null, v: null, noData: true };
}

function repViento(winds) {
  let sx = 0, sy = 0, sv = 0, n = 0;
  for (const w of Object.values(winds)) {
    const deg = degDe(w.d);
    if (deg == null) continue;
    sx += Math.cos((deg * Math.PI) / 180);
    sy += Math.sin((deg * Math.PI) / 180);
    sv += w.v;
    n += 1;
  }
  if (!n) return { name: "Calma", deg: 0, kmh: 0 };
  let deg = (Math.atan2(sy, sx) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return { name: nombreViento(deg), deg: Math.round(deg), kmh: Math.round(sv / n) };
}

// ---- Cielo y temperatura por franja (para el indicador "tiempo + temperatura") ----
// AEMET da estadoCielo (código + descripción), temperatura (máx/mín + dato horario) y
// probPrecipitacion por periodos, igual que el viento. Resumimos la ISLA (como "Viento
// general"): categoría de cielo más frecuente (empate → la peor) y temperatura media.
const CIELO_RANK = { sol: 0, poco: 1, nubes: 2, lluvia: 3, tormenta: 4 };
// Códigos AEMET de estadoCielo → categoría simple. Quitamos el sufijo 'n' (noche).
const cieloCat = (code) => {
  const n = parseInt(String(code ?? "").replace(/n$/, ""), 10);
  if (!n) return null;                                   // "" o no numérico → sin dato
  if (n <= 11) return "sol";                             // 11 Despejado
  if (n === 12 || n === 13 || n === 17) return "poco";   // poco nuboso / intervalos / nubes altas
  if (n === 14 || n === 15 || n === 16) return "nubes";  // nuboso / muy nuboso / cubierto
  if (n >= 51 && n <= 64) return "tormenta";             // con tormenta
  if (n >= 23) return "lluvia";                          // 23–46 con lluvia (la nieve, irrelevante en verano)
  return "nubes";
};
// Elige la entrada del periodo pedido con descenso de granularidad (como el viento).
const pickPer = (arr, key) => {
  const pref = key === "06-12" ? ["06-12", "00-12", "00-24"]
    : key === "12-18" ? ["12-18", "12-24", "00-24"]
    : key === "00-12" ? ["00-12", "00-24"]
    : key === "12-24" ? ["12-24", "00-24"]
    : ["00-24"];
  for (const k of pref) {
    const e = (arr || []).find((x) => (x.periodo || "") === k && x.value !== "" && x.value != null);
    if (e) return e;
  }
  return null;
};
// Temperatura representativa del día/franja: el dato horario diurno si existe; si no,
// la máxima (la herramienta es para el baño diurno). Para días futuros AEMET solo da máx/mín.
const tempMun = (dia, key) => {
  const t = dia.temperatura || {};
  const hora = key.startsWith("12") ? 18 : 12;
  const d = (t.dato || []).find((x) => Number(x.hora) === hora && Number(x.value) > 0);
  if (d) return Number(d.value);
  if (t.maxima != null && t.maxima !== "") return Number(t.maxima);
  return null;
};
function repTiempo(dias, key) {
  const cats = [], temps = [];
  let pop = 0;
  for (const dia of dias) {
    const c = cieloCat((pickPer(dia.estadoCielo, key) || {}).value);
    if (c) cats.push(c);
    const t = tempMun(dia, key);
    if (t != null) temps.push(t);
    const p = pickPer(dia.probPrecipitacion, key);
    if (p) pop = Math.max(pop, Number(p.value) || 0);
  }
  let cat = null;
  if (cats.length) {
    const freq = {};
    for (const c of cats) freq[c] = (freq[c] || 0) + 1;
    cat = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || CIELO_RANK[b] - CIELO_RANK[a])[0];
  }
  const temp = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null;
  return { sky: cat, temp, pop };
}

async function main() {
  if (!KEY) { console.error("Falta AEMET_API_KEY en .env"); process.exit(1); }
  const calas = cargarCalas();
  const municipios = [...new Set(calas.map((c) => c.ine))].filter(Boolean);
  const diasPorMun = {};
  let fallos = 0;
  for (const ine of municipios) {
    try {
      const d = await aemet(`/prediccion/especifica/municipio/diaria/${ine}`);
      diasPorMun[ine] = d?.[0]?.prediccion?.dia || [];
    } catch (e) {
      fallos++;
      console.warn(`  ⚠ municipio ${ine}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
  const ok = Object.keys(diasPorMun);
  const keepPrev = (msg) => {
    const prev = JSON.parse(readFileSync(OUT_FILE, "utf8"));
    writeFileSync(OUT_FILE, JSON.stringify({ ...prev, stale: true }, null, 0));
    console.log("  " + msg);
  };
  if (!ok.length) {
    if (existsSync(OUT_FILE)) { keepPrev("AEMET no responde → conservado el timeline previo (stale)."); return; }
    console.error("  AEMET no responde y no hay timeline previo."); process.exit(1);
  }
  // Degradación SAGRADA: si falta ALGÚN municipio, no publicamos datos parciales
  // (mostrarían "calma" falsa en las calas de ese municipio). Conservamos el último
  // timeline bueno, marcado como obsoleto. Mejor un dato de ayer que uno engañoso.
  if (fallos > 0 && existsSync(OUT_FILE)) {
    keepPrev(`⚠ ${municipios.length - ok.length} municipio(s) sin dato → conservado el timeline previo (stale), para no mostrar calma falsa.`);
    return;
  }

  // Calendario de frames a partir del primer municipio disponible.
  const ref = diasPorMun[ok[0]].slice(0, DAYS);
  const def = ref.flatMap((dia, i) => framesDeDia(dia, i));

  const frames = def.map((f) => {
    const winds = {};
    for (const ine of ok) winds[ine] = vientoMun(diasPorMun[ine], f.fecha, f.key);
    // Cielo + temperatura de la isla para esta franja (a partir del día de cada municipio).
    const diasFranja = ok.map((ine) => (diasPorMun[ine] || []).find((d) => (d.fecha || "").slice(0, 10) === f.fecha)).filter(Boolean);
    const t = repTiempo(diasFranja, f.key);
    return {
      id: `${f.fecha}-${f.key}`,
      day: f.day, period: f.period, fecha: f.fecha, startHour: f.startHour,
      rep: repViento(winds),
      sky: t.sky, temp: t.temp, pop: t.pop,
      winds,
    };
  });

  // Descarta frames sin NINGÚN dato de viento (no pintar calma falsa por viento vacío).
  const usable = frames.filter((fr) => Object.values(fr.winds).some((w) => !w.noData));
  if (!usable.length) {
    if (existsSync(OUT_FILE)) { keepPrev("⚠ ningún frame con datos → conservado el timeline previo (stale)."); return; }
    console.error("  Sin datos de previsión y sin previo."); process.exit(1);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    formulaVersion: "abrigo-1.0",
    abrigoVmax: 38,
    calas,
    frames: usable,
    stale: fallos > 0,
  };
  writeFileSync(OUT_FILE, JSON.stringify(out, null, 0));
  console.log(`  ✓ ${usable.length}/${frames.length} frames (${DAYS} días), ${calas.length} calas, ${ok.length}/${municipios.length} municipios → parte-timeline.json`);
  console.log("    " + usable.map((f) => `${f.day}·${f.period}[${f.rep.name} ${f.rep.kmh}]`).join("  "));
}

main();
