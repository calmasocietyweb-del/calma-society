/**
 * Corrección puntual de bugs de datos detectados en la auditoría (one-off, idempotente).
 *
 * Punto clave: A1 (accesible-asistido) es una LISTA CURADA de las playas con
 * servicio de baño real (silla anfibia + personal, 1 may–31 oct) según la
 * investigación de accesibilidad del blueprint. NO se auto-asigna por heurística.
 * Cualquier cala/playa marcada A1 que NO esté en la lista y no tenga servicio
 * baja a B (no prometer accesibilidad inexistente).
 */
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";

// Servicio de baño asistido estándar (ventana 1 may–31 oct).
const A1_SERVICE = { amphibiousChair: true, adaptedToilet: true, reservedParking: true, staff: true, seasonWindow: { from: "05-01", to: "10-31" }, certainty: "alta" };

// Playas accesibles A1 reales (blueprint, "INVENTARIO DE PLAYAS ACCESIBLES A1").
// `extra` = correcciones añadidas de acceso para esa ficha.
const A1_BEACHES = {
  "son-bou": {},
  "cala-galdana": {},
  "platja-de-sant-tomas": {},
  "punta-prima": {},
  "cala-en-porter": { carAccess: "coche-directo" }, // el servicio está en la playa; tiene parking
  "es-grau": {},
  "cala-santandria": {},
};

// 1) Duplicados físicos / fichas falsas → borrar (se conservan las curadas).
for (const k of ["playa-de-cavalleria", "playa-de-es-grau", "binibeca"]) {
  const f = join(DIR, `${k}-es.json`);
  if (existsSync(f)) { rmSync(f); console.log("borrada (duplicado/falso):", k); }
}

// 2) Correcciones concretas no relacionadas con A1.
const FIX = {
  "faro-de-punta-nati": (p) => { p.durationMin = 90; },   // 300 min era absurdo para un faro
  "cala-del-pilar": (p) => { p.effortLevel = "D"; },        // cala virgen, caminata exigente
  "cala-de-biniancolla": (p) => { p.effortLevel = "B"; },   // 500 m llanos, no C
  "lithica": (p) => { delete p.indoorAlternativeOf; },      // es al aire libre: no vale para lluvia
};
for (const [k, fn] of Object.entries(FIX)) {
  const f = join(DIR, `${k}-es.json`);
  if (!existsSync(f)) { console.log("• no existe, omito:", k); continue; }
  const j = JSON.parse(readFileSync(f, "utf8"));
  if (j.planner) { fn(j.planner); writeFileSync(f, JSON.stringify(j, null, 2) + "\n"); console.log("corregida:", k); }
}

// 3) A1 CURADO: confirma las playas accesibles reales (A1 + servicio), ES y EN.
for (const [k, extra] of Object.entries(A1_BEACHES)) {
  for (const lang of ["es", "en"]) {
    const f = join(DIR, `${k}-${lang}.json`);
    if (!existsSync(f)) continue;
    const j = JSON.parse(readFileSync(f, "utf8"));
    if (!j.planner) continue;
    j.planner.effortLevel = "A1";
    j.planner.accessibleService = j.planner.accessibleService || { ...A1_SERVICE };
    Object.assign(j.planner, extra);
    writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
    console.log("A1 confirmado:", `${k}-${lang}`);
  }
}

// 4) Barrido de A1 FALSOS: A1 fuera de la lista y sin servicio → B.
let swept = 0;
for (const file of readdirSync(DIR).filter((x) => x.endsWith("-es.json"))) {
  const f = join(DIR, file);
  const j = JSON.parse(readFileSync(f, "utf8"));
  const p = j.planner;
  if (p && (p.plannerType === "cala" || p.plannerType === "playa") && p.effortLevel === "A1" &&
      !p.accessibleService && !A1_BEACHES[j.translationKey]) {
    p.effortLevel = "B";
    writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
    console.log("A1→B (falso, sin servicio):", j.translationKey);
    swept++;
  }
}
console.log(`\nHecho. A1 falsos corregidos: ${swept}.`);
