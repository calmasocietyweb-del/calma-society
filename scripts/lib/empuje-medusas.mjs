/**
 * EMPUJE DE MEDUSAS — modelo puro (sin red, sin ficheros).
 * ========================================================
 * Estima las CONDICIONES DE LLEGADA de medusas a una cala (nunca su presencia)
 * cruzando la orientación de la cala con el viento de las últimas 48 h.
 *
 * Vive aparte de `parte-calma.mjs` para que el banco de pruebas
 * (`scripts/calibrar-medusas.mjs`) mida ESTE código y no una copia que se
 * desincronice: el modelo se calibra midiendo, y medir una copia es no medir.
 *
 * Convención geométrica CANÓNICA (no invertir al migrar de fuente):
 *   dirViento = dirección DESDE la que sopla; openingBearingDeg = dirección DESDE
 *   la que el viento entra de frente a la cala; onshore máximo cuando dir==opening.
 *
 * VERSIÓN 2.0 (20-jul-2026) — recalibrado contra literatura científica; el
 * porqué de cada número está en `.tmp_research/2026-07-17-medusas-viento-fisica.md`
 * y el resumen para humanos en `docs/DONDE-EL-MAR-ESTA-EN-CALMA.md`.
 */

export const FORMULA_VERSION_EMPUJE = "empuje-medusas-2.0";

// ---- Ventana temporal: LA PIEZA MEJOR CALIBRADA. No tocar sin fuente nueva. ----
// Tres fuentes independientes convergen en 24-48 h (ICM-CSIC 24-48 h; Berline
// 2013 retardo de 1 día; Keesing 2016 ~2 días).
export const EMPUJE_DESDE = 6;
export const EMPUJE_HASTA = 48;
const GAUSS_CENTRO = 24; // h
const GAUSS_SIGMA = 12; // h
export const COBERTURA_MIN = 0.6; // si falta >40% de la ventana → "sin-dato"

// ---- Intensidad: umbral físico de acoplamiento viento-corriente ----
// El viento NO empuja a la medusa como a una vela: mueve el AGUA, y el agua
// lleva la medusa (partícula pasiva). Mover agua exige energía, y por debajo de
// ~18 km/h el acoplamiento es débil.
const V_INEFICAZ = 8; // km/h — por debajo: recirculación local, no llegada (D'Ambra 2025)
const V_UMBRAL = 18; // km/h — «able to significantly impact the surface current» (Berline 2013)
const V_PLENO = 28; // km/h — transporte franco (el mayor varamiento medido: 21,8; Mghili 2021)
const V_TEMPORAL = 45; // km/h — a partir de aquí el oleaje daña y dispersa (Berline; Bergamasco)

// ---- Estacionalidad: modula la PRESENCIA en el agua, no el empuje ----
// Suelo alto a propósito: «onshore arrivals are not restricted to the summer»
// (Berline 2013) y en el Tirreno los varamientos son MÁXIMOS en invierno-primavera
// (Bergamasco 2022). El episodio real de Menorca fue el 4-ene-2023: con el gate
// antiguo (ene = 0,15) lo habríamos llamado "baja" el día que cientos de medusas
// cubrían Son Parc.
const FACTOR_MES = [0.5, 0.5, 0.6, 0.75, 0.9, 1.0, 1.0, 1.0, 0.85, 0.7, 0.55, 0.5];

// ---- Umbrales de banda ----
// Calibrados A LA VEZ que la curva de intensidad y la regla de horas: tocar uno
// solo descuadra el medidor (ver `calibrar-medusas.mjs`).
const CORTE_ALTA = 0.4;
const CORTE_MEDIA = 0.18;
const HORAS_ALTA = 10;
const HORAS_MEDIA = 5;
// Una hora "cuenta a favor" si el viento entra de frente Y tiene fuerza para
// mover agua. Antes bastaban 8 km/h: por eso media isla salía en MODERADO.
const ONSHORE_MIN = 0.5;
const V_MIN_HORA = V_UMBRAL;

const DIR_DEG = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSO: 202.5, SO: 225, OSO: 247.5, O: 270, ONO: 292.5, NO: 315, NNO: 337.5,
};
const VIENTOS = [
  [22.5, "Tramuntana (N)"], [67.5, "Gregal (NE)"], [112.5, "Llevant (E)"],
  [157.5, "Xaloc (SE)"], [202.5, "Migjorn (S)"], [247.5, "Llebeig (SO)"],
  [292.5, "Ponent (O)"], [337.5, "Mestral (NO)"], [361, "Tramuntana (N)"],
];

export const nombreViento = (deg) => (VIENTOS.find(([m]) => deg < m) ?? VIENTOS[0])[1];
export const dirADeg = (dir) => DIR_DEG[dir];

const rad = (d) => (d * Math.PI) / 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;
const onshorePos = (windFrom, op) => Math.max(0, Math.cos(rad(windFrom - op)));
const gaussW = (h) => Math.exp(-((h - GAUSS_CENTRO) ** 2) / (2 * GAUSS_SIGMA ** 2));

const pad = (n) => String(n).padStart(2, "0");
export const isoHour = (t) =>
  `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:00`;

/**
 * Peso por intensidad del viento: CRECIENTE CON UMBRAL.
 * Invierte la hipótesis v1 ("la brisa arrima más"), que el propio código
 * declaraba sin calibrar y que la literatura contradice: hace falta ≥18 km/h
 * para mover la superficie del agua. Nunca baja a 0 en temporal (prudencia:
 * el oleaje dispersa y daña, pero no garantiza que no llegue nada).
 */
export function fTransporte(kmh) {
  if (kmh < V_INEFICAZ) return 0.05;
  if (kmh < V_UMBRAL) return lerp(0.05, 0.45, (kmh - V_INEFICAZ) / (V_UMBRAL - V_INEFICAZ));
  if (kmh < V_PLENO) return lerp(0.45, 1, (kmh - V_UMBRAL) / (V_PLENO - V_UMBRAL));
  if (kmh < V_TEMPORAL) return 1;
  return 0.85;
}

export const factorMes = (mes) => FACTOR_MES[mes];

export function bandaEmpuje(score, horasAfavor) {
  if (score >= CORTE_ALTA && horasAfavor >= HORAS_ALTA) return "alta";
  if (score >= CORTE_MEDIA && horasAfavor >= HORAS_MEDIA) return "media";
  return "baja";
}

/**
 * Empuje hacia una cala a partir del histórico horario de su municipio.
 * @param {number} op  openingBearingDeg de la cala
 * @param {Array<{iso:string,dir:string,vel:number}>} histMun
 * @param {Date} now
 */
export function calcularEmpuje(op, histMun, now) {
  const gate = FACTOR_MES[now.getMonth()];
  let psum = 0, wsum = 0, expected = 0, avail = 0, horasAfavor = 0;
  // Vector medio del viento SOLO en las horas a favor: dice de QUÉ viento vino el
  // empuje. Sin este dato la página enseñaba el viento de AHORA junto a un empuje de
  // 48 h atrás y parecía contradecirse (p. ej. «Tramuntana» con medusas en el sur,
  // cuando lo que las arrimó fue el Migjorn de anteayer).
  let fx = 0, fy = 0;
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
    psum += onsh * fTransporte(rec.vel) * w;
    if (onsh >= ONSHORE_MIN && rec.vel >= V_MIN_HORA) {
      horasAfavor += 1;
      fx += Math.cos(rad(deg)); fy += Math.sin(rad(deg));
    }
  }
  const coverage = expected ? avail / expected : 0;
  if (coverage < COBERTURA_MIN) return { band: "sin-dato", coverage: Number(coverage.toFixed(2)) };
  const score = clamp01((wsum ? psum / wsum : 0) * gate);
  let vientoEmpuje = null;
  if (horasAfavor > 0) {
    let d = (Math.atan2(fy, fx) * 180) / Math.PI;
    if (d < 0) d += 360;
    vientoEmpuje = nombreViento(d);
  }
  return {
    band: bandaEmpuje(score, horasAfavor), score: Number(score.toFixed(2)),
    horasAfavor, vientoEmpuje, ventanaH: EMPUJE_HASTA, coverage: Number(coverage.toFixed(2)),
  };
}
