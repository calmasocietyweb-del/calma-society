/**
 * PRUEBA DE CONCEPTO — "Dónde el mar está en calma"
 * ------------------------------------------------------------------
 * Demuestra el MOTOR del indicador de ABRIGO frente al viento, por cala,
 * derivado de la dirección/intensidad del viento de HOY cruzada con la
 * ORIENTACIÓN editorial de cada cala (openingBearingDeg).
 *
 * Fuente de datos: Open-Meteo (SOLO para desarrollo — su plan gratuito es
 * no comercial). En producción se sustituye por AEMET (marítima costera por
 * zona, comercial-OK con atribución). Aquí solo validamos que la FÓRMULA
 * produce un ranking sensato y fiel al conocimiento local.
 *
 * Ejecutar:  node scripts/donde-el-mar-esta-en-calma.poc.mjs
 */

// --- IP editorial: orientación de cada cala (medida a ojo sobre satélite;
//     en el proyecto real vivirá en windExposure dentro de cada lugar) ---
const CALAS = [
  { name: "Cala Macarella", area: "Sur (Ciutadella)", lat: 39.9356, lng: 3.9286, openingBearingDeg: 190, embayment: "encajonada" },
  { name: "Cala Turqueta",  area: "Sur (Ciutadella)", lat: 39.9295, lng: 3.9134, openingBearingDeg: 200, embayment: "encajonada" },
  { name: "Cala Mitjana",   area: "Sur (Ferreries)",  lat: 39.9345, lng: 3.9786, openingBearingDeg: 195, embayment: "encajonada" },
  { name: "Cala Pregonda",  area: "Norte (Es Mercadal)", lat: 40.0453, lng: 4.0852, openingBearingDeg: 335, embayment: "abierta" },
];

// Pesos del MVP: VIENTO-first (el oleaje entra como modificador menor).
const PESO_VIENTO = 0.7;
const PESO_OLA = 0.3;

// Ventana de baño que miramos (horas locales): media de la franja diurna.
const HORA_INI = 10;
const HORA_FIN = 18;

const VIENTOS = [
  { max: 22.5, n: "Tramuntana (N)" }, { max: 67.5, n: "Gregal (NE)" },
  { max: 112.5, n: "Llevant (E)" },   { max: 157.5, n: "Xaloc (SE)" },
  { max: 202.5, n: "Migjorn (S)" },   { max: 247.5, n: "Llebeig (SO)" },
  { max: 292.5, n: "Ponent (O)" },    { max: 337.5, n: "Mestral (NO)" },
];
const nombreViento = (deg) => (VIENTOS.find((v) => deg < v.max) ?? VIENTOS[0]).n;

const rad = (d) => (d * Math.PI) / 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** 1 si el viento entra de frente a la cala (peor); 0 si viene de tierra. */
const onshore = (windFromDeg, openingDeg) => (1 + Math.cos(rad(windFromDeg - openingDeg))) / 2;

/** Normaliza intensidad: viento en km/h, oleaje en m. */
const normViento = (kmh) => clamp01(kmh / 38);
const normOla = (m) => clamp01(m / 1.6);

function banda(abrigo) {
  if (abrigo >= 0.66) return { etiqueta: "ALTO",  frase: "respira en calma" };
  if (abrigo >= 0.4)  return { etiqueta: "MEDIO", frase: "aguanta, con algo de movimiento" };
  return { etiqueta: "BAJO", frase: "hoy mejor evitarla" };
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { "User-Agent": "calma-society-poc" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return r.json();
}

/** Media de un array de pares [hora, valor] dentro de la franja diurna. */
function mediaDiurna(times, values) {
  const sel = times
    .map((t, i) => ({ h: new Date(t).getHours(), v: values[i] }))
    .filter((x) => x.h >= HORA_INI && x.h <= HORA_FIN && x.v != null);
  if (!sel.length) return null;
  return sel.reduce((a, x) => a + x.v, 0) / sel.length;
}

/** Media circular para direcciones (grados). */
function mediaDireccion(times, dirs) {
  const sel = times
    .map((t, i) => ({ h: new Date(t).getHours(), d: dirs[i] }))
    .filter((x) => x.h >= HORA_INI && x.h <= HORA_FIN && x.d != null);
  if (!sel.length) return null;
  let sx = 0, sy = 0;
  for (const x of sel) { sx += Math.cos(rad(x.d)); sy += Math.sin(rad(x.d)); }
  return (Math.atan2(sy, sx) * 180) / Math.PI + (sy < 0 || sx < 0 ? 360 : 0) % 360;
}

async function condicionesCala(c) {
  const fc = await getJSON(
    `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}` +
      `&hourly=wind_speed_10m,wind_direction_10m&timezone=Europe%2FMadrid&forecast_days=1`
  );
  const windSpeed = mediaDiurna(fc.hourly.time, fc.hourly.wind_speed_10m);
  const windDir = mediaDireccion(fc.hourly.time, fc.hourly.wind_direction_10m);

  // Oleaje (modificador). Si la API marina no cubre el punto, el viento manda solo.
  let waveH = null, waveDir = null;
  try {
    const mar = await getJSON(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${c.lat}&longitude=${c.lng}` +
        `&hourly=wave_height,wave_direction&timezone=Europe%2FMadrid&forecast_days=1`
    );
    waveH = mediaDiurna(mar.hourly.time, mar.hourly.wave_height);
    waveDir = mediaDireccion(mar.hourly.time, mar.hourly.wave_direction);
  } catch { /* sin oleaje: el motor sigue funcionando solo con viento */ }

  const onVi = onshore(windDir, c.openingBearingDeg);
  const penalVi = PESO_VIENTO * onVi * normViento(windSpeed);

  let penalOla = 0, pesoOlaEf = PESO_OLA;
  if (waveH != null && waveDir != null) {
    penalOla = PESO_OLA * onshore(waveDir, c.openingBearingDeg) * normOla(waveH);
  } else {
    pesoOlaEf = 0; // sin dato de ola, reescalamos: el viento pesa 1.0
  }
  const pesoTotal = PESO_VIENTO + pesoOlaEf;
  const abrigo = clamp01(1 - (penalVi + penalOla) / pesoTotal);

  return { ...c, windSpeed, windDir, waveH, abrigo, banda: banda(abrigo) };
}

const tabla = (s) => (s == null ? " —" : String(s));

console.log(`\n  «DÓNDE EL MAR ESTÁ EN CALMA» — prueba de motor (datos de hoy, Open-Meteo dev)\n`);
const resultados = [];
for (const c of CALAS) {
  try {
    resultados.push(await condicionesCala(c));
  } catch (e) {
    console.log(`  ⚠  ${c.name}: ${e.message}`);
  }
}
resultados.sort((a, b) => b.abrigo - a.abrigo);

console.log(`  ${"CALA".padEnd(16)}${"COSTA".padEnd(18)}${"VIENTO".padEnd(20)}${"ABRIGO".padEnd(8)}FRASE`);
console.log("  " + "-".repeat(82));
for (const r of resultados) {
  const viento = `${nombreViento(r.windDir)} ${Math.round(r.windSpeed)}km/h`;
  console.log(
    "  " +
      tabla(r.name).padEnd(16) +
      tabla(r.area).padEnd(18) +
      viento.padEnd(20) +
      `${r.banda.etiqueta} (${Math.round(r.abrigo * 100)})`.padEnd(8) +
      `el ${r.name.replace("Cala ", "")} ${r.banda.frase}`
  );
}
console.log(
  `\n  Nota: indicador de ABRIGO del viento (estimación editorial), no aviso de seguridad.\n` +
    `  En producción: AEMET por zona. Hoy: ${new Date().toLocaleDateString("es-ES")}.\n`
);
