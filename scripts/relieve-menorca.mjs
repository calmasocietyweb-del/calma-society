/**
 * RELIEVE DE MENORCA — malla real de altitud y profundidad.
 *
 * Descarga una malla de elevación/batimetría sobre Menorca y su mar, y la guarda en
 * `src/data/menorca-relieve.json`. De ahí sale la textura del mapa del parte del mar:
 * el mar se oscurece con la profundidad y la tierra se aclara con la altura.
 *
 * FUENTE: GEBCO 2020 (malla global de batimetría y topografía), servida por
 * opentopodata.org. GEBCO es de uso libre con atribución:
 *   "GEBCO Compilation Group (2020) GEBCO 2020 Grid".
 * Resolución de GEBCO: 15 segundos de arco (≈ 450 m). Bastante para una textura de
 * fondo; NO es una carta náutica y no debe usarse para navegar.
 *
 * Uso:  node scripts/relieve-menorca.mjs
 * Tarda unos minutos (la API pública admite 100 puntos por llamada, 1 por segundo).
 * Solo hay que volver a ejecutarlo si se cambia la malla: el JSON se commitea.
 */
import { writeFileSync } from "node:fs";

// Menorca + un margen de mar alrededor (para que la batimetría no acabe en seco).
const BBOX = { latMin: 39.74, latMax: 40.13, lngMin: 3.71, lngMax: 4.42 };
const COLS = 150; // ≈ 400 m por celda
const FILAS = 95;
const POR_LLAMADA = 100;
const API = "https://api.opentopodata.org/v1/gebco2020";

const puntos = [];
for (let f = 0; f < FILAS; f++) {
  for (let c = 0; c < COLS; c++) {
    puntos.push({
      lat: BBOX.latMax - (f / (FILAS - 1)) * (BBOX.latMax - BBOX.latMin),
      lng: BBOX.lngMin + (c / (COLS - 1)) * (BBOX.lngMax - BBOX.lngMin),
    });
  }
}
console.log(`Malla de ${COLS}×${FILAS} = ${puntos.length} puntos · ${Math.ceil(puntos.length / POR_LLAMADA)} llamadas`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const elev = new Array(puntos.length).fill(null);

for (let i = 0; i < puntos.length; i += POR_LLAMADA) {
  const lote = puntos.slice(i, i + POR_LLAMADA);
  const locations = lote.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
  let ok = false;
  for (let intento = 0; intento < 4 && !ok; intento++) {
    try {
      const res = await fetch(`${API}?locations=${locations}`);
      if (res.status === 429) { await sleep(4000); continue; } // demasiadas llamadas: esperar
      const j = await res.json();
      if (j.status !== "OK") throw new Error(j.error || "respuesta no OK");
      j.results.forEach((r, k) => { elev[i + k] = r.elevation; });
      ok = true;
    } catch (e) {
      console.error(`  reintento ${intento + 1} en el lote ${i / POR_LLAMADA}: ${e.message}`);
      await sleep(2500);
    }
  }
  if (!ok) throw new Error(`No se pudo descargar el lote que empieza en ${i}`);
  const hechos = i / POR_LLAMADA + 1;
  const total = Math.ceil(puntos.length / POR_LLAMADA);
  if (hechos % 10 === 0 || hechos === total) console.log(`  ${hechos}/${total} lotes`);
  await sleep(1100); // la API pide 1 llamada por segundo
}

const sinDato = elev.filter((e) => e == null).length;
if (sinDato) throw new Error(`${sinDato} puntos sin dato: no guardo una malla con agujeros`);

const salida = {
  fuente: "GEBCO Compilation Group (2020) GEBCO 2020 Grid",
  licencia: "Uso libre con atribución. No es una carta náutica.",
  via: "opentopodata.org",
  descargado: new Date().toISOString().slice(0, 10),
  bbox: BBOX,
  cols: COLS,
  filas: FILAS,
  // Metros: positivo = altura sobre el mar; negativo = profundidad.
  elev: elev.map((e) => Math.round(e)),
};
writeFileSync("src/data/menorca-relieve.json", JSON.stringify(salida));
const mar = elev.filter((e) => e < 0);
const tierra = elev.filter((e) => e >= 0);
console.log(`\nGuardado en src/data/menorca-relieve.json`);
console.log(`  mar:    ${mar.length} celdas · la más honda: ${Math.min(...mar)} m`);
console.log(`  tierra: ${tierra.length} celdas · la más alta: ${Math.max(...tierra)} m (el Toro son 358 m)`);
