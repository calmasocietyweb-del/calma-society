/**
 * PRUEBA DE CONCEPTO — "Empuje del viento hacia la cala" (modelo aprobado v1).
 * ------------------------------------------------------------------
 * Demuestra el baremo de medusas APROBADO (fBrisa decreciente-desde-brisa +
 * ventana 48 h con peso gaussiano centrado en 24 h + gate estacional) usando
 * Open-Meteo past_days (SOLO dev: su plan gratuito es no comercial). En
 * producción el mismo modelo se alimenta de la historia de viento de AEMET.
 *
 * NO afirma presencia: estima CONDICIONES DE LLEGADA. Empareja con MedusApp.
 *
 * Ejecutar:  node scripts/posibilidad-medusas.poc.mjs
 */
const CALAS = [
  { name: "Cala Macarella", area: "Sur",   lat: 39.9356, lng: 3.9286, op: 195 },
  { name: "Cala Turqueta",  area: "Sur",   lat: 39.9268, lng: 3.913,  op: 200 },
  { name: "Cala Mitjana",   area: "Sur",   lat: 39.9355, lng: 3.9686, op: 195 },
  { name: "Cala Pregonda",  area: "Norte", lat: 40.0489, lng: 4.0512, op: 340 },
];

const EMPUJE_DESDE = 6, EMPUJE_HASTA = 48, GAUSS_CENTRO = 24, GAUSS_SIGMA = 12, COBERTURA_MIN = 0.6;
const FACTOR_MES = [0.15, 0.15, 0.3, 0.55, 0.85, 1.0, 1.0, 0.95, 0.7, 0.4, 0.2, 0.15];

const rad = (d) => (d * Math.PI) / 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const onshorePos = (windFrom, op) => Math.max(0, Math.cos(rad(windFrom - op)));
const gaussW = (h) => Math.exp(-((h - GAUSS_CENTRO) ** 2) / (2 * GAUSS_SIGMA ** 2));
function fBrisa(kmh) {
  if (kmh < 3) return 0.3;
  if (kmh < 12) return 0.3 + ((kmh - 3) / 9) * 0.7;
  if (kmh < 20) return 1.0 - ((kmh - 12) / 8) * 0.4;
  if (kmh < 35) return 0.6 - ((kmh - 20) / 15) * 0.3;
  return 0.2;
}
function banda(score, horasAfavor, gate) {
  const temp = gate >= 0.5;
  if (score >= 0.45 && horasAfavor >= 12 && temp) return "ALTA";
  if (score >= 0.18 || (horasAfavor >= 8 && temp)) return "MEDIA";
  return "BAJA";
}

async function getJSON(u) { const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

async function empujeCala(c, now) {
  const fc = await getJSON(
    `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}` +
      `&hourly=wind_speed_10m,wind_direction_10m&timezone=Europe%2FMadrid&past_days=3&forecast_days=1`
  );
  const idx = new Map(fc.hourly.time.map((t, i) => [t.slice(0, 13), i])); // "YYYY-MM-DDTHH"
  const gate = FACTOR_MES[now.getMonth()];
  let psum = 0, wsum = 0, expected = 0, avail = 0, horasAfavor = 0;
  for (let k = EMPUJE_DESDE; k <= EMPUJE_HASTA; k++) {
    expected++;
    const t = new Date(now.getTime() - k * 3600e3);
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}T${String(t.getHours()).padStart(2, "0")}`;
    const i = idx.get(key);
    if (i == null) continue;
    const dir = fc.hourly.wind_direction_10m[i], vel = fc.hourly.wind_speed_10m[i];
    if (dir == null || vel == null) continue;
    avail++;
    const w = gaussW(k); wsum += w;
    const onsh = onshorePos(dir, c.op);
    psum += onsh * fBrisa(vel) * w;
    if (onsh >= 0.3 && vel >= 8) horasAfavor++;
  }
  const cob = expected ? avail / expected : 0;
  if (cob < COBERTURA_MIN) return { ...c, band: "sin-dato", cob };
  const score = clamp01((wsum ? psum / wsum : 0) * gate);
  return { ...c, band: banda(score, horasAfavor, gate), score, horasAfavor, cob };
}

const now = new Date();
console.log(`\n  «EMPUJE DEL VIENTO HACIA LA CALA» — modelo aprobado v1 (${now.toLocaleDateString("es-ES")})\n`);
const out = [];
for (const c of CALAS) { try { out.push(await empujeCala(c, now)); } catch (e) { console.log(`  ⚠ ${c.name}: ${e.message}`); } }
out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
for (const r of out) {
  const det = r.band === "sin-dato" ? `cobertura ${Math.round(r.cob * 100)}%` : `score ${r.score.toFixed(2)}, ${r.horasAfavor} h a favor`;
  console.log("  " + r.name.padEnd(16) + r.area.padEnd(7) + r.band.padEnd(9) + det);
}
console.log(`\n  Estima CONDICIONES DE LLEGADA por viento; NO presencia. Empareja con MedusApp.\n`);
