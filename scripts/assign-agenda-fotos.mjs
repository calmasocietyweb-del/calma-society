/**
 * assign-agenda-fotos.mjs — asignación GLOBAL sin repeticiones de fotos de agenda.
 * Lee los candidatos del workflow (.tmp_agenda-candidates.json) y elige UNA foto
 * distinta por evento (greedy, mejor candidato libre), respetando:
 *   - semilla `used` con las 7 imágenes ancla (fiestas nuevas ya resueltas);
 *   - prohibidas: anclas + sant-joan-jaleo/caixer (saturadas) para forzar frescura;
 *   - publicados primero (los que están en vivo cogen su mejor opción).
 * Stock → nombre de archivo `ag-<key>`; biblioteca → su propio nombre.
 *
 * Salidas:
 *   - src/data/agenda-fotos-map.json      { key: "<nombre-foto>" }  (lo aplica update-event-photos.mjs)
 *   - .tmp_agenda-stock-license.json      [{ key, assetId, name }]  (a licenciar/descargar/optimizar)
 *   - .tmp_agenda-exhausted.json          [key, ...]                (sin candidato libre → revisar)
 */
import { readFileSync, writeFileSync } from "node:fs";

const cands = JSON.parse(readFileSync(".tmp_agenda-candidates.json", "utf8"));
const work = JSON.parse(readFileSync(".tmp_agenda-fotos-work.json", "utf8"));
const metaByKey = Object.fromEntries(work.map((e) => [e.key, e]));
const candByKey = Object.fromEntries(cands.map((c) => [c.key, c]));

const ANCHORS = ["carnaval-menorca", "cabalgata-reyes", "caballos-jinetes", "jinetes-fiesta", "fiesta-caballos", "monte-toro", "fornells"];
const BANNED = new Set([...ANCHORS, "sant-joan-jaleo", "sant-joan-caixer",
  "399945867"]); // foto de la Guardia Civil a caballo: es policía, descuadra en una fiesta
// assetId de las 5 fotos de Stock ya licenciadas para las fiestas ancla:
// hay que bloquearlos para que ningún evento nuevo descargue la MISMA imagen.
const ANCHOR_STOCK_IDS = ["676011625", "573061026", "316855635", "510706254", "1239213075"];
// Overrides manuales (key → assetId stock o nombre de biblioteca) para arreglar
// encajes flojos del ranking automático. Se aplican con prioridad absoluta.
const OVERRIDES = {
  "carme": "354145637",                  // fiesta marinera del Carme → barca pesquera al atardecer (no procesión terrestre)
  "fira-sant-isidre-ferreries": "397579324", // feria agrícola con exposición de ganado → vaca premiada (no expo industrial aéreo)
  "sant-antoni-fornells": "826781589",   // caballo negro frisón (≈ caballo menorquín), no el pueblo de Fornells
  "sant-joan": "172334191",              // la fiesta insignia → caballos y multitud en plaza histórica (Palio), no charro mexicano
  "cova-den-xoroi-musica-atardecer": "cova-den-xoroi", // la propia Cova d'en Xoroi (biblioteca): sitio literal, Menorca auténtica
};
const used = new Set([...ANCHORS, ...ANCHOR_STOCK_IDS.map((id) => "stock:" + id)]);

// Orden: publicados primero, luego por categoría y clave (determinista).
const ordered = [...work].sort((a, b) => {
  const pa = a.status === "published" ? 0 : 1, pb = b.status === "published" ? 0 : 1;
  return pa - pb || a.category.localeCompare(b.category) || a.key.localeCompare(b.key);
});

const map = {};
const license = [];
const exhausted = [];
const report = [];

for (const ev of ordered) {
  const list = candByKey[ev.key]?.candidates || [];
  let chosen = null;
  // 0) Override manual (prioridad absoluta).
  if (OVERRIDES[ev.key]) {
    const ov = OVERRIDES[ev.key];
    const isLib = !/^\d+$/.test(ov); // los assetId son numéricos
    const found = list.find((c) => c.ref === ov);
    chosen = { kind: isLib ? "library" : "stock", ref: ov, name: found?.name || "(override)" };
  }
  for (const c of chosen ? [] : list) {
    if (!c || !c.ref) continue;
    if (c.kind === "library") {
      if (BANNED.has(c.ref) || used.has(c.ref)) continue;
      chosen = { kind: "library", ref: c.ref, name: c.name }; break;
    } else { // stock
      const k = "stock:" + c.ref;
      if (BANNED.has(c.ref) || used.has(k)) continue;
      chosen = { kind: "stock", ref: c.ref, name: c.name }; break;
    }
  }
  if (!chosen) { exhausted.push(ev.key); continue; }
  if (chosen.kind === "library") {
    used.add(chosen.ref);
    map[ev.key] = chosen.ref;
  } else {
    used.add("stock:" + chosen.ref);
    map[ev.key] = `ag-${ev.key}`;
    license.push({ key: ev.key, assetId: chosen.ref, name: chosen.name });
  }
  report.push(`  ${ev.status === "published" ? "PUB" : "pen"} ${ev.category.padEnd(11)} ${ev.key.padEnd(46)} ${chosen.kind === "library" ? "[lib] " + chosen.ref : "[stock] " + chosen.ref + " · " + (chosen.name || "").slice(0, 50)}`);
}

writeFileSync("src/data/agenda-fotos-map.json", JSON.stringify(map, null, 2) + "\n");
writeFileSync(".tmp_agenda-stock-license.json", JSON.stringify(license, null, 2) + "\n");
writeFileSync(".tmp_agenda-exhausted.json", JSON.stringify(exhausted, null, 2) + "\n");

console.log(report.join("\n"));
console.log(`\n✓ Asignados ${Object.keys(map).length}/${work.length}.  Stock a licenciar: ${license.length}.  Biblioteca: ${Object.keys(map).length - license.length}.`);
console.log(`  Fotos distintas garantizadas (used incluye 7 anclas): ${used.size - ANCHORS.length} nuevas.`);
if (exhausted.length) console.log(`  ⚠ SIN candidato libre (${exhausted.length}): ${exhausted.join(", ")}`);
