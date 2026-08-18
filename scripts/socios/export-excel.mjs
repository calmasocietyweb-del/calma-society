/**
 * Exporta el Excel de colaboraciones al seed del panel de socios (KAN-122).
 *
 * One-off LOCAL: lee `COLABORACIONES/Registro de colaboraciones - Calma
 * Society.xlsx` (hoja «Registro», cabeceras en la fila 2, datos desde la 3)
 * y genera en `COLABORACIONES/panel-seed/` (carpeta gitignorada — contactos
 * de empresas en un repo público, jamás):
 *
 *   - seed.sql          → para `wrangler d1 execute calma-db --remote --file=…`
 *   - socios-seed.json  → espejo legible para revisar antes de cargar
 *
 * Necesita `exceljs`, que NO es dependencia del proyecto (decisión §11 del
 * CLAUDE.md): instálalo sin tocar package.json con
 *     npm i --no-save exceljs
 * y ejecuta
 *     node scripts/socios/export-excel.mjs
 *
 * El seed es idempotente: socios con INSERT OR REPLACE (la PK es el slug) y
 * tratos con INSERT … WHERE NOT EXISTS (no duplica si se ejecuta dos veces).
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
let Excel;
try {
  Excel = require("exceljs");
} catch {
  console.error("Falta exceljs. Ejecuta antes:  npm i --no-save exceljs");
  process.exit(1);
}

const EXCEL = "COLABORACIONES/Registro de colaboraciones - Calma Society.xlsx";
const OUT_DIR = "COLABORACIONES/panel-seed";
const NOW = new Date().toISOString();
const NOTA_IMPORT = `importado-del-excel-${NOW.slice(0, 10)}`;

// ── Utilidades ───────────────────────────────────────────────────────────────

/** «Sa Pedrera des Pujol» → «sa-pedrera-des-pujol» (id estable del socio). */
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Escapado SQL: comillas simples dobladas. Solo strings; números van tal cual. */
const q = (s) => `'${String(s ?? "").replace(/'/g, "''")}'`;

const siNo = (v) => (/^s[ií]$/i.test(String(v ?? "").trim()) ? 1 : 0);
const limpio = (v) => {
  const s = String(v ?? "").trim();
  return s === "—" || s === "-" ? "" : s;
};

/** URL de la ficha → slug sin sufijo de idioma («…/lugar/restaurante-x-es/» → «restaurante-x»). */
const slugFicha = (url) => {
  const m = String(url ?? "").match(/\/lugar\/([^/?#]+?)\/?$/);
  if (!m) return "";
  return m[1].replace(/-es$/, "");
};

const ESTADOS = ["pendiente", "contactado", "respondio-si", "respondio-no", "descartado", "socio"];
const MODELOS = ["trueque", "cuota-directorio", "afiliacion", "branded", "otro"];

const mapEstado = (v) => {
  const s = limpio(v).toLowerCase();
  if (ESTADOS.includes(s)) return s;
  if (s === "sí" || s === "si" || s === "respondió-sí") return "respondio-si";
  if (s === "no" || s === "respondió-no") return "respondio-no";
  if (s === "") return "pendiente";
  console.warn(`  aviso: estado «${s}» fuera de catálogo → pendiente`);
  return "pendiente";
};

// ── Lectura del Excel ────────────────────────────────────────────────────────

const wb = new Excel.Workbook();
await wb.xlsx.readFile(EXCEL);
const ws = wb.getWorksheet("Registro") ?? wb.worksheets[0];

const socios = [];
const tratos = [];

ws.eachRow((row, n) => {
  if (n < 3) return; // fila 1 = bandas, fila 2 = cabeceras
  const c = (i) => limpio(row.getCell(i).text);
  const nombre = c(1);
  if (!nombre) return;

  const id = slugify(nombre);
  const estado = mapEstado(c(10));

  // Las notas de los 12 restaurantes decían «FICHA EN DRAFT», pero las fichas
  // están publicadas desde el 14-ago-2026 (KAN-117): se corrige al importar.
  let notas = c(30);
  if (/^FICHA EN DRAFT/i.test(notas)) {
    notas = notas.replace(/^FICHA EN DRAFT/i, "Ficha publicada desde 14-ago-2026 (KAN-117)");
  }

  socios.push({
    id,
    nombre,
    tipo: c(2).toLowerCase() || "otro",
    zona: c(3),
    web: c(4),
    contacto: c(5),
    email: c(6),
    telefono: c(7),
    relacion: c(8) || "captacion-ficha",
    tanda: c(9),
    estado,
    dijo: c(11),
    fecha_primer_email: c(12),
    fecha_seguimiento: c(13),
    proxima_accion: c(14),
    slug_ficha: slugFicha(c(29)),
    url_ficha: c(29),
    datos_ok: siNo(c(26)),
    fotos_ok: siNo(c(27)),
    enlace_ok: siNo(c(28)),
    notas,
  });

  // Trato vigente del Excel: hoy todos los no-descartados están en trueque
  // (ficha editorial gratuita por datos/fotos/enlace). Precio 0; el histórico
  // de cuotas nacerá en el panel cuando gerencia fije tarifa.
  const modelo = c(15).toLowerCase();
  if (estado !== "descartado" && MODELOS.includes(modelo)) {
    tratos.push({
      socio_id: id,
      modelo,
      estado: "activo",
      trato: c(16) || "Ficha editorial gratuita en la guía",
      condiciones_aceptadas: c(17),
      contraprestacion: c(18) || "Datos correctos, fotos y (cuando quieran) enlace",
      precio_anual_cents: 0,
      inicio: c(20),
      fin: c(21),
      renovable: siNo(c(22)),
      etiquetado: "editorial",
      notas: NOTA_IMPORT,
    });
  }
});

// ── Salidas ──────────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

const SOCIO_COLS = [
  "id", "nombre", "tipo", "zona", "web", "contacto", "email", "telefono", "relacion",
  "tanda", "estado", "dijo", "fecha_primer_email", "fecha_seguimiento", "proxima_accion",
  "slug_ficha", "url_ficha", "datos_ok", "fotos_ok", "enlace_ok", "notas",
];
const TRATO_COLS = [
  "socio_id", "modelo", "estado", "trato", "condiciones_aceptadas", "contraprestacion",
  "precio_anual_cents", "inicio", "fin", "renovable", "etiquetado", "notas",
];

const val = (v) => (typeof v === "number" ? String(v) : q(v));
const sql = [
  `-- Seed del panel de socios (KAN-122), generado el ${NOW} desde el Excel de`,
  `-- colaboraciones. Cargar con:`,
  `--   npx wrangler d1 execute calma-db --remote --file=COLABORACIONES/panel-seed/seed.sql`,
  `-- Idempotente: socios por INSERT OR REPLACE; tratos solo si no existen ya.`,
  "",
];
for (const s of socios) {
  sql.push(
    `INSERT OR REPLACE INTO socios (${SOCIO_COLS.join(", ")}, creado_en, actualizado_en) VALUES (${SOCIO_COLS.map((k) => val(s[k])).join(", ")}, ${q(NOW)}, ${q(NOW)});`,
  );
}
sql.push("");
for (const t of tratos) {
  sql.push(
    `INSERT INTO tratos (${TRATO_COLS.join(", ")}, creado_en, actualizado_en) SELECT ${TRATO_COLS.map((k) => val(t[k])).join(", ")}, ${q(NOW)}, ${q(NOW)} WHERE NOT EXISTS (SELECT 1 FROM tratos WHERE socio_id = ${q(t.socio_id)} AND modelo = ${q(t.modelo)});`,
  );
}
sql.push("");

writeFileSync(path.join(OUT_DIR, "seed.sql"), sql.join("\n"));
writeFileSync(
  path.join(OUT_DIR, "socios-seed.json"),
  JSON.stringify({ generado: NOW, socios, tratos }, null, 2),
);

const sinFicha = socios.filter((s) => !s.slug_ficha).map((s) => s.id);
console.log(`Socios: ${socios.length} · Tratos: ${tratos.length}`);
console.log(`Sin slug de ficha (no medibles en Umami): ${sinFicha.length ? sinFicha.join(", ") : "ninguno"}`);
console.log(`Escrito en ${OUT_DIR}/seed.sql y socios-seed.json`);
