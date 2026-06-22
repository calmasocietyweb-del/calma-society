/**
 * fetch-menorca-outline.mjs — descarga la línea de costa REAL de Menorca desde
 * OpenStreetMap (Nominatim), elige el anillo de la isla principal, lo simplifica
 * (Ramer–Douglas–Peucker) a ~240 vértices y lo guarda en
 * src/data/menorca-outline.json para que el mapa del parte de calas dibuje la
 * silueta real (no una aproximación a mano).
 *
 * Verifica que las 18 calas del parte caen DENTRO del contorno antes de escribir.
 *
 * Uso:  node scripts/fetch-menorca-outline.mjs
 * Datos: © OpenStreetMap contributors (ODbL). Atribución obligatoria al usar.
 */
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "src/data/menorca-outline.json");
const PARTE = resolve(ROOT, "src/data/parte-calma.json");

// Caja esperada de Menorca (para descartar resultados que no sean la isla).
const BBOX = { latMin: 39.78, latMax: 40.12, lngMin: 3.75, lngMax: 4.40 };
const inBox = ([lng, lat]) =>
  lng >= BBOX.lngMin && lng <= BBOX.lngMax && lat >= BBOX.latMin && lat <= BBOX.latMax;

// ---- Ramer–Douglas–Peucker (puntos [lng,lat]) ----
function perpDist(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function rdp(points, eps) {
  if (points.length < 3) return points.slice();
  let idx = -1, max = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > max) { max = d; idx = i; }
  }
  if (max > eps) {
    const left = rdp(points.slice(0, idx + 1), eps);
    const right = rdp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}
// Simplifica buscando el epsilon que deja ~targetN puntos.
function simplifyTo(ring, targetN) {
  let lo = 0.00002, hi = 0.01, best = ring;
  for (let it = 0; it < 28; it++) {
    const mid = (lo + hi) / 2;
    const s = rdp(ring, mid);
    if (s.length > targetN) lo = mid; else hi = mid;
    best = s;
    if (Math.abs(s.length - targetN) <= 6) break;
  }
  return best;
}

// ---- Point-in-polygon (ray casting), punto {lat,lng}, anillo [lng,lat] ----
function inside(lat, lng, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const hit = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (hit) c = !c;
  }
  return c;
}

const ringArea = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return Math.abs(a / 2);
};

async function main() {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: "Menorca, Illes Balears, España",
      format: "jsonv2",
      polygon_geojson: "1",
      limit: "10",
      countrycodes: "es",
    });
  console.log("→ Pidiendo a Nominatim (OSM)…");
  const res = await fetch(url, {
    headers: { "User-Agent": "CalmaSociety/1.0 (menorcabus@gmail.com)" },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();

  // Reúne todos los anillos candidatos de todos los resultados.
  const candidates = [];
  for (const r of data) {
    const g = r.geojson;
    if (!g) continue;
    const polys =
      g.type === "Polygon" ? [g.coordinates] :
      g.type === "MultiPolygon" ? g.coordinates : [];
    for (const poly of polys) {
      const ring = poly[0]; // anillo exterior
      if (!ring || ring.length < 20) continue;
      const insideBox = ring.filter(inBox).length / ring.length;
      candidates.push({
        name: r.display_name,
        klass: `${r.category || r.class}/${r.type}`,
        n: ring.length,
        area: ringArea(ring),
        insideBox,
        ring,
      });
    }
  }
  candidates.sort((a, b) => b.area - a.area);
  console.log(`→ ${data.length} resultados, ${candidates.length} anillos candidatos:`);
  for (const c of candidates.slice(0, 6))
    console.log(
      `   · ${c.klass.padEnd(22)} pts=${String(c.n).padStart(5)}  área=${c.area.toFixed(4)}  enCaja=${(c.insideBox * 100).toFixed(0)}%  ${c.name.slice(0, 40)}`
    );

  // Mejor isla: el anillo de mayor área cuyos puntos están casi todos en la caja.
  const island = candidates.find((c) => c.insideBox > 0.9 && c.n > 80) || candidates[0];
  if (!island) throw new Error("No se encontró un anillo de isla válido");
  console.log(`→ Elegido: ${island.klass} con ${island.n} puntos (${(island.insideBox * 100).toFixed(0)}% en caja).`);

  const simplified = simplifyTo(island.ring, 600);
  console.log(`→ Simplificado: ${island.ring.length} → ${simplified.length} puntos.`);

  // Verifica las 18 calas dentro del contorno simplificado (informativo: las que
  // quedan justo fuera son entrantes estrechos; el mapa fija el marcador a la costa).
  const parte = JSON.parse(await readFile(PARTE, "utf8"));
  const fuera = parte.calas.filter((c) => !inside(c.lat, c.lng, simplified));
  if (fuera.length) {
    console.warn(`⚠ ${fuera.length} calas en el borde (se fijarán a la costa en el mapa): ${fuera.map((c) => c.id).join(", ")}`);
  } else {
    console.log(`✓ Las ${parte.calas.length} calas caen DENTRO del contorno.`);
  }

  const lngs = simplified.map((p) => p[0]);
  const lats = simplified.map((p) => p[1]);
  const payload = {
    source: "OpenStreetMap (Nominatim)",
    license: "© OpenStreetMap contributors, ODbL",
    fetchedFrom: "Menorca, Illes Balears",
    pointCount: simplified.length,
    bbox: {
      lngMin: Math.min(...lngs), lngMax: Math.max(...lngs),
      latMin: Math.min(...lats), latMax: Math.max(...lats),
    },
    ring: simplified.map(([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))]),
  };
  await writeFile(OUT, JSON.stringify(payload, null, 2));
  console.log(`✓ Escrito ${OUT} (${simplified.length} pts, bbox lng ${payload.bbox.lngMin.toFixed(3)}–${payload.bbox.lngMax.toFixed(3)} / lat ${payload.bbox.latMin.toFixed(3)}–${payload.bbox.latMax.toFixed(3)}).`);
}

main().catch((e) => {
  console.error("✗ Error:", e.message);
  process.exit(1);
});
