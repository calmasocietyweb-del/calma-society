/**
 * BANCO DE PRUEBAS DEL EMPUJE DE MEDUSAS
 * ======================================
 * Pasa el modelo REAL (`lib/empuje-medusas.mjs`) por escenarios de viento
 * conocidos y enseña qué diría el mapa en cada uno. Existe porque el medidor
 * tiene cuatro piezas acopladas —intensidad, estacionalidad, umbrales y regla
 * de horas— y tocar una sola lo descuadra: hay que ver las cuatro a la vez.
 *
 * Los escenarios son deliberados, no aleatorios:
 *   - "sur fuerte" / "norte fuerte": el modelo debe separar costas.
 *   - "brisa floja": el caso que llenaba media isla de MODERADO. Debe callar.
 *   - "enero NO fuerte": el episodio REAL de Menorca (4-ene-2023, cientos de
 *     medusas en Son Parc y Arenal d'en Castell). El modelo v1 decía "baja".
 *   - "temporal": viento muy fuerte; debe avisar, pero el oleaje dispersa.
 *
 * Ejecutar:  node scripts/calibrar-medusas.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { calcularEmpuje, isoHour, fTransporte, factorMes } from "./lib/empuje-medusas.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LUGARES_DIR = join(ROOT, "src", "content", "lugares");
const EXTRA_FILE = join(ROOT, "src", "data", "calas-extra.json");

function cargarCalas() {
  const calas = [];
  for (const f of readdirSync(LUGARES_DIR).filter((f) => f.endsWith("-es.json"))) {
    const d = JSON.parse(readFileSync(join(LUGARES_DIR, f), "utf8"));
    if (d.type !== "cala" || !d.windExposure) continue;
    calas.push({ name: d.name, area: d.area, ...d.windExposure });
  }
  try {
    for (const c of JSON.parse(readFileSync(EXTRA_FILE, "utf8"))) calas.push(c);
  } catch { /* sin registro extra */ }
  return calas.filter((c) => c.openingBearingDeg != null);
}

/** Genera 63 h de viento sostenido de una dirección/velocidad dadas. */
function viento(dir, vel, now) {
  const rows = [];
  for (let k = 63; k >= 0; k--) {
    rows.push({ iso: isoHour(new Date(now.getTime() - k * 3600e3)), dir, vel });
  }
  return rows;
}

/** ¿Mira la cala al norte o al sur? (para comprobar que cada costa responde a su viento) */
const miraAl = (op) => (op > 270 || op < 90 ? "N" : "S");

const ESCENARIOS = [
  { etiqueta: "Migjorn (S) fuerte, 24 km/h", dir: "S", vel: 24, mes: 6, esperado: "sur ALTA · norte BAJA" },
  { etiqueta: "Tramuntana (N) fuerte, 26 km/h", dir: "N", vel: 26, mes: 6, esperado: "norte ALTA · sur BAJA" },
  { etiqueta: "Brisa floja del S, 11 km/h", dir: "S", vel: 11, mes: 6, esperado: "casi todo BAJA (era el ruido)" },
  { etiqueta: "Brisa floja del N, 13 km/h", dir: "N", vel: 13, mes: 6, esperado: "casi todo BAJA (era el ruido)" },
  { etiqueta: "4-ene-2023: NO fuerte, 25 km/h", dir: "NO", vel: 25, mes: 0, esperado: "norte al menos MEDIA (caso real)" },
  { etiqueta: "Temporal del S, 55 km/h", dir: "S", vel: 55, mes: 6, esperado: "sur ALTA (con matiz de oleaje)" },
  { etiqueta: "Calma total", dir: "C", vel: 0, mes: 6, esperado: "todo BAJA" },
];

const calas = cargarCalas();
console.log(`\nBanco de pruebas — ${calas.length} calas · modelo empuje-medusas (lib/empuje-medusas.mjs)\n`);
console.log("Curva de intensidad (km/h → peso):");
console.log("  " + [5, 10, 15, 18, 22, 28, 35, 50].map((v) => `${v}:${fTransporte(v).toFixed(2)}`).join("  "));
console.log("Gate estacional (ene→dic):");
console.log("  " + Array.from({ length: 12 }, (_, m) => factorMes(m).toFixed(2)).join(" "));

let fallos = 0;
for (const esc of ESCENARIOS) {
  // Día 15 del mes elegido, a mediodía, del año en curso: fecha estable y sin bordes.
  const now = new Date(new Date().getFullYear(), esc.mes, 15, 12, 0, 0);
  const hist = viento(esc.dir, esc.vel, now);
  const bandas = { alta: 0, media: 0, baja: 0, "sin-dato": 0 };
  const porCosta = { N: { alta: 0, media: 0, baja: 0 }, S: { alta: 0, media: 0, baja: 0 } };

  for (const c of calas) {
    const r = calcularEmpuje(c.openingBearingDeg, hist, now);
    bandas[r.band] = (bandas[r.band] || 0) + 1;
    if (r.band !== "sin-dato") porCosta[miraAl(c.openingBearingDeg)][r.band] += 1;
  }

  const total = calas.length;
  const pct = (n) => `${String(n).padStart(2)} (${String(Math.round((n / total) * 100)).padStart(2)}%)`;
  console.log(`\n── ${esc.etiqueta}`);
  console.log(`   esperado: ${esc.esperado}`);
  console.log(`   ALTA ${pct(bandas.alta)}   MEDIA ${pct(bandas.media)}   BAJA ${pct(bandas.baja)}`);
  console.log(`   mirando al N: ${porCosta.N.alta} alta / ${porCosta.N.media} media / ${porCosta.N.baja} baja`);
  console.log(`   mirando al S: ${porCosta.S.alta} alta / ${porCosta.S.media} media / ${porCosta.S.baja} baja`);

  // Comprobaciones duras: lo que NO puede pasar pase lo que pase.
  const avisa = (msg) => { console.log(`   ⚠ ${msg}`); fallos += 1; };
  if (esc.dir === "S" && esc.vel >= 20 && porCosta.N.alta > 0) avisa("viento del sur y hay calas del NORTE en ALTA");
  if (esc.dir === "N" && esc.vel >= 20 && porCosta.S.alta > 0) avisa("viento del norte y hay calas del SUR en ALTA");
  if (esc.vel <= 13 && esc.vel > 0 && bandas.alta > 0) avisa("brisa floja y alguna cala en ALTA");
  if (esc.dir === "C" && (bandas.alta || bandas.media)) avisa("calma total y alguna cala avisa");
  if (esc.mes === 0 && esc.vel >= 20 && porCosta.N.alta + porCosta.N.media === 0) {
    avisa("enero con viento fuerte del NO y NINGUNA cala del norte avisa (caso real 4-ene-2023)");
  }
}

// ---- El empate que denunció el brief científico ----------------------------
// Caso medido con datos reales del 17-jul-2026: la brisa floja del norte
// (11-18 km/h) puntuaba IGUAL que el viento fuerte del sur (15-21 km/h) —0,293
// contra 0,292— porque v1 premiaba lo flojo. La física los separa: por debajo de
// ~18 km/h el viento no mueve bien la superficie del agua. Si este cheque vuelve
// a empatar, la curva de intensidad se ha vuelto a torcer.
console.log("\n── El empate de v1 (datos reales 17-jul-2026)");
const nowEmpate = new Date(new Date().getFullYear(), 6, 17, 23, 0, 0);
/** Viento variable dentro de un rango, para imitar un día real. */
function vientoRango(dirs, vmin, vmax, now) {
  const rows = [];
  for (let k = 63; k >= 0; k--) {
    rows.push({
      iso: isoHour(new Date(now.getTime() - k * 3600e3)),
      dir: dirs[k % dirs.length],
      vel: vmin + (k % (vmax - vmin + 1)),
    });
  }
  return rows;
}
const sur = calcularEmpuje(195, vientoRango(["S", "SSO", "SO"], 15, 21, nowEmpate), nowEmpate); // Macarella
const norte = calcularEmpuje(340, vientoRango(["N", "NNO", "NO"], 11, 18, nowEmpate), nowEmpate); // Pregonda
console.log(`   Macarella (sur, S/SO 15-21 km/h): score ${sur.score} · ${sur.horasAfavor} h · ${sur.band.toUpperCase()}`);
console.log(`   Pregonda  (norte, N/NO 11-18 km/h): score ${norte.score} · ${norte.horasAfavor} h · ${norte.band.toUpperCase()}`);
console.log(`   separación: ${(sur.score - norte.score).toFixed(2)} (v1 era 0.00 — empataban)`);
if (sur.score - norte.score < 0.1) {
  console.log("   ⚠ el viento fuerte y la brisa floja vuelven a puntuar casi igual");
  fallos += 1;
}

console.log(fallos === 0 ? "\n✓ Sin contradicciones en los escenarios.\n" : `\n✗ ${fallos} contradicción(es).\n`);
process.exit(fallos === 0 ? 0 : 1);
