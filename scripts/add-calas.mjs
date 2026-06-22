/**
 * add-calas.mjs — integra calas nuevas en src/data/calas-extra.json calculando su
 * ORIENTACIÓN (openingBearingDeg) a partir de la línea de costa REAL de Menorca
 * (src/data/menorca-outline.json).
 *
 * Método (validado contra las 14 calas ya curadas):
 *   1) Se simplifica la costa a ~42 vértices (trazado MACRO, sin recovecos): la
 *      normal de ese trazado que mira al mar = hacia dónde ABRE la cala.
 *   2) "Candado por costa": si la geometría se desvía >70° de la orientación típica
 *      de esa costa, o la cala es bahía-cerrada (punto muy interior, geometría poco
 *      fiable), se usa la orientación típica de la costa. Evita errores en bahías.
 * Deriva shelteredFrom / exposedTo de esa orientación. Datos geométricos, NO inventados.
 *
 * Uso:  node scripts/add-calas.mjs [ruta-json-calas-nuevas]
 *   Entrada: array (o {calas:[...]}) de:
 *   { id, name, municipio, municipioINE, costa, lat, lng, tienePradera, tieneVigilancia, embayment }
 * Conserva las calas presentes; solo AÑADE las nuevas (dedup por id).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUTLINE = resolve(ROOT, "src/data/menorca-outline.json");
const EXTRA = resolve(ROOT, "src/data/calas-extra.json");
const INPUT = resolve(ROOT, process.argv[2] || "src/data/_calas-nuevas.json");

const outline = JSON.parse(readFileSync(OUTLINE, "utf8"));
const FINE = outline.ring; // [[lng,lat],...]
const LAT_REF = (outline.bbox.latMin + outline.bbox.latMax) / 2;
const KX = Math.cos((LAT_REF * Math.PI) / 180);

// ---- Costa gruesa (~42 vértices): orientación MACRO, sin recovecos ----
function perpD(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  if (!l2) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function rdp(pts, e) {
  if (pts.length < 3) return pts.slice();
  let idx = -1, mx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpD(pts[i], pts[0], pts.at(-1));
    if (d > mx) { mx = d; idx = i; }
  }
  if (mx > e) return rdp(pts.slice(0, idx + 1), e).slice(0, -1).concat(rdp(pts.slice(idx), e));
  return [pts[0], pts.at(-1)];
}
function simplifyTo(ring, n) {
  let lo = 0.0001, hi = 0.05, best = ring;
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2, s = rdp(ring, m);
    if (s.length > n) lo = m; else hi = m;
    best = s;
    if (Math.abs(s.length - n) <= 4) break;
  }
  return best;
}
const COARSE = simplifyTo(FINE, 42);
const cLng = COARSE.reduce((s, p) => s + p[0], 0) / COARSE.length;
const cLat = COARSE.reduce((s, p) => s + p[1], 0) / COARSE.length;

function inside(lat, lng) {
  let c = false;
  for (let i = 0, j = COARSE.length - 1; i < COARSE.length; j = i++) {
    const xi = COARSE[i][0], yi = COARSE[i][1], xj = COARSE[j][0], yj = COARSE[j][1];
    const hit = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (hit) c = !c;
  }
  return c;
}

// Bearing (0-360) de la normal de la costa gruesa que mira al MAR.
function geoBearing(lat, lng) {
  const px = lng * KX, py = lat;
  let bestD = Infinity, bx = px, by = py, segdx = 1, segdy = 0;
  for (let i = 0; i < COARSE.length - 1; i++) {
    const ax = COARSE[i][0] * KX, ay = COARSE[i][1];
    const cx2 = COARSE[i + 1][0] * KX, cy2 = COARSE[i + 1][1];
    const dx = cx2 - ax, dy = cy2 - ay, len2 = dx * dx + dy * dy || 1e-12;
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const sx = ax + t * dx, sy = ay + t * dy;
    const d = (px - sx) ** 2 + (py - sy) ** 2;
    if (d < bestD) { bestD = d; bx = sx; by = sy; segdx = dx; segdy = dy; }
  }
  let seaward = null;
  for (const [nx, ny] of [[segdy, -segdx], [-segdy, segdx]]) {
    const len = Math.hypot(nx, ny) || 1e-12, ux = nx / len, uy = ny / len;
    if (!inside(by + 0.004 * uy, (bx + 0.004 * ux) / KX)) { seaward = [ux, uy]; break; }
  }
  if (!seaward) {
    const vx = (lng - cLng) * KX, vy = lat - cLat, len = Math.hypot(vx, vy) || 1e-12;
    seaward = [vx / len, vy / len];
  }
  let deg = (Math.atan2(seaward[0], seaward[1]) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg);
}

const angDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const COAST_CENTER = { norte: 350, sur: 190, este: 90, oeste: 270 };

// Orientación final con "candado por costa".
function openingBearing(lat, lng, costa, embayment) {
  const center = COAST_CENTER[costa];
  const geo = geoBearing(lat, lng);
  if (center == null) return { op: geo, fix: false };
  if (embayment === "bahia-cerrada" || angDist(geo, center) > 70) return { op: center, fix: true };
  return { op: geo, fix: false };
}

const WINDS = [
  [0, "Tramuntana (N)"], [45, "Gregal (NE)"], [90, "Llevant (E)"], [135, "Xaloc (SE)"],
  [180, "Migjorn (S)"], [225, "Llebeig (SO)"], [270, "Ponent (O)"], [315, "Mestral (NO)"],
];
function exposedSheltered(op) {
  const byNear = [...WINDS].sort((a, b) => angDist(a[0], op) - angDist(b[0], op));
  return { exposedTo: byNear.slice(0, 3).map((w) => w[1]), shelteredFrom: byNear.slice(-3).reverse().map((w) => w[1]) };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function main() {
  const raw = JSON.parse(readFileSync(INPUT, "utf8"));
  const nuevas = Array.isArray(raw) ? raw : raw.calas || [];
  const existentes = JSON.parse(readFileSync(EXTRA, "utf8"));
  const idsExist = new Set(existentes.map((c) => c.id));
  const idsLugar = new Set(["cala-macarella", "cala-mitjana", "cala-pregonda", "cala-turqueta"]);

  let add = 0;
  for (const c of nuevas) {
    if (idsExist.has(c.id) || idsLugar.has(c.id)) { console.log(`  · omitida (dup): ${c.id}`); continue; }
    const { op, fix } = openingBearing(c.lat, c.lng, c.costa, c.embayment);
    const { exposedTo, shelteredFrom } = exposedSheltered(op);
    existentes.push({
      id: c.id,
      name: c.name,
      area: `${cap(c.costa)} (${c.municipio})`,
      lat: Number(c.lat.toFixed(4)),
      lng: Number(c.lng.toFixed(4)),
      municipioINE: c.municipioINE,
      openingBearingDeg: op,
      embayment: c.embayment || "abierta",
      shelteredFrom,
      exposedTo,
      tienePradera: !!c.tienePradera,
      tieneVigilancia: !!c.tieneVigilancia,
    });
    idsExist.add(c.id);
    add++;
    console.log(`  + ${c.id.padEnd(24)} ${`${cap(c.costa)} (${c.municipio})`.padEnd(24)} abre→${String(op).padStart(3)}°${fix ? " (candado costa)" : ""}`);
  }
  writeFileSync(EXTRA, JSON.stringify(existentes, null, 2) + "\n");
  console.log(`✓ Añadidas ${add} calas. calas-extra.json ahora tiene ${existentes.length}.`);
}

main();
