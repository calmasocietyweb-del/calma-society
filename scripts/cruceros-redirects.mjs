/**
 * Cierra el agujero que abrió KAN-100: cuando un barco deja de repetir escala,
 * su página desaparece y su URL se queda en 404 con Google pidiéndola durante
 * semanas. Pasó con `azamara-onward` y se arregló a mano, un barco a mano —
 * pero `barcosConPagina()` es dinámico y esto vuelve a pasar solo.
 *
 * Qué hace:
 *   1. Calcula qué barcos tienen página HOY, con la MISMA función que usa la
 *      web (`barcosConPagina`), no con una copia que se puede desincronizar.
 *   2. Los apunta en un registro histórico (`cruceros-slugs-historicos.json`).
 *   3. Para cada slug del registro que ya NO tiene página, escribe su 301 en
 *      un bloque automático de `public/_redirects` — en los SEIS idiomas.
 *
 * El bloque automático está delimitado y se regenera entero: NO editarlo a
 * mano. Las reglas escritas a mano viven fuera de él y no se tocan.
 *
 * Uso: node scripts/cruceros-redirects.mjs
 * Lo lanza el robot del puerto (.github/workflows/cruceros-apb.yml) justo
 * después de refrescar el calendario.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { barcosConPagina } from "../src/lib/cruises.ts";

const CALENDARIO = "src/data/cruceros-menorca-2026.json";
const REGISTRO = "src/data/cruceros-slugs-historicos.json";
const REDIRECTS = "public/_redirects";

/**
 * A dónde mandamos a quien buscaba un barco retirado: la guía de escala de SU
 * idioma, que sigue viva. Una entrada por idioma con página de barco: cuando el
 * clúster se abrió en FR y DE (y luego en IT y PT) nadie amplió esta lista, así
 * que sus URLs se habrían quedado en 404 — justo el agujero que cerró KAN-100.
 * Regla: si añades un idioma a las rutas `/<lang>/<prefijo>/<slug>`, lo añades aquí.
 */
const IDIOMAS = [
  { barco: "/crucero", guia: "/articulo/cruceros-en-menorca-2026/" },
  { barco: "/en/cruise", guia: "/en/article/cruises-in-menorca-2026/" },
  { barco: "/fr/croisiere", guia: "/fr/article/escale-croisiere-mao-minorque/" },
  { barco: "/de/kreuzfahrt", guia: "/de/artikel/kreuzfahrten-menorca-2026/" },
  { barco: "/it/crociera", guia: "/it/articolo/crociere-a-minorca-2026/" },
  { barco: "/pt/cruzeiro", guia: "/pt/artigo/cruzeiros-em-menorca-2026/" },
];
/**
 * Alinea la columna de origen sin llegar a pegarla al destino: Cloudflare separa
 * origen y destino por espacios, así que un `padEnd` a un ancho fijo que un slug
 * largo alcanzara exactamente dejaría CERO espacios y la regla quedaría rota
 * («/de/kreuzfahrt/ritz-carlton-evrima//de/artikel/…»). Se calcula sobre los
 * orígenes reales de esta pasada y siempre sobra un hueco.
 */
const alinear = (origenes) => {
  const ancho = Math.max(...origenes.map((o) => o.length)) + 2;
  return (origen) => origen.padEnd(ancho);
};

const INICIO = "# >>> AUTO — barcos retirados (scripts/cruceros-redirects.mjs). NO EDITAR A MANO.";
const FIN = "# <<< AUTO";

/** Fecha de hoy en ISO corto, sin depender de la zona horaria del runner. */
const hoy = new Date().toISOString().slice(0, 10);

// ── 1. Barcos con página hoy ────────────────────────────────────────────────
const calendario = JSON.parse(readFileSync(CALENDARIO, "utf8"));
const actuales = new Map(barcosConPagina(calendario.calls).map((b) => [b.slug, b.ship]));

// ── 2. Registro histórico ───────────────────────────────────────────────────
let registro = {};
try {
  registro = JSON.parse(readFileSync(REGISTRO, "utf8")).barcos ?? {};
} catch {
  // Primera ejecución: el registro aún no existe.
}

// OJO: nada de sellar una fecha "visto hoy" en cada pasada. Eso haría que el
// fichero cambiara TODOS los días y el robot del puerto commitearía ruido a
// diario. Solo se escribe cuando la flota cambia de verdad: entra un barco
// nuevo o desaparece uno.
let nuevos = 0;
let recuperados = 0;
for (const [slug, ship] of actuales) {
  if (!registro[slug]) {
    registro[slug] = { ship, desde: hoy };
    nuevos++;
  } else {
    registro[slug].ship = ship; // por si el puerto corrige la grafía del nombre
    // Un barco puede volver al calendario: si vuelve a tener página, deja de
    // estar retirado y su 301 desaparece (si no, taparíamos su propia página).
    if (registro[slug].retiradoDesde) {
      delete registro[slug].retiradoDesde;
      recuperados++;
    }
  }
}

// ── 3. Retirados = están en el registro pero ya no tienen página ────────────
let bajas = 0;
for (const [slug, datos] of Object.entries(registro)) {
  if (!actuales.has(slug) && !datos.retiradoDesde) {
    datos.retiradoDesde = hoy;
    bajas++;
  }
}
const retirados = Object.entries(registro)
  .filter(([slug]) => !actuales.has(slug))
  .sort(([a], [b]) => a.localeCompare(b));

const registroNuevo =
  JSON.stringify(
    {
      _comentario:
        "Registro histórico de barcos que han tenido página. Lo mantiene scripts/cruceros-redirects.mjs. Sirve para que un barco retirado conserve su 301 en vez de dejar un 404 (KAN-100).",
      barcos: registro,
    },
    null,
    2,
  ) + "\n";
let registroOriginal = "";
try {
  registroOriginal = readFileSync(REGISTRO, "utf8");
} catch {
  /* primera ejecución */
}
if (registroNuevo !== registroOriginal) writeFileSync(REGISTRO, registroNuevo);

// ── 4. Regenerar el bloque automático de _redirects ─────────────────────────
const redirectsOriginal = readFileSync(REDIRECTS, "utf8");

const lineas = [];
if (retirados.length) {
  lineas.push(INICIO);
  lineas.push(
    "# Barcos que dejaron de repetir escala: su página ya no se genera, pero Google",
    "# sigue pidiendo la URL. Se manda a la guía de escala, que sigue viva.",
    "",
  );
  // Con y sin barra final: Cloudflare no las trata como la misma URL.
  const origenes = retirados.flatMap(([slug]) =>
    IDIOMAS.flatMap(({ barco }) => [`${barco}/${slug}`, `${barco}/${slug}/`]),
  );
  const col = alinear(origenes);
  for (const [slug, datos] of retirados) {
    lineas.push(`# ${datos.ship} — sin página desde ${datos.retiradoDesde}`);
    for (const { barco, guia } of IDIOMAS) {
      lineas.push(`${col(`${barco}/${slug}`)}${guia}  301`);
      lineas.push(`${col(`${barco}/${slug}/`)}${guia}  301`);
    }
    lineas.push("");
  }
  lineas.push(FIN);
}
const bloque = lineas.join("\n");

// Sustituir el bloque si ya existe; si no, añadirlo al final.
const i = redirectsOriginal.indexOf(INICIO);
const j = redirectsOriginal.indexOf(FIN);
let salida;
if (i !== -1 && j !== -1) {
  salida = redirectsOriginal.slice(0, i) + bloque + redirectsOriginal.slice(j + FIN.length);
} else if (bloque) {
  salida = redirectsOriginal.replace(/\s*$/, "") + "\n\n" + bloque + "\n";
} else {
  salida = redirectsOriginal;
}
salida = salida.replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "") + "\n";

const cambio = salida !== redirectsOriginal;
if (cambio) writeFileSync(REDIRECTS, salida);

// ── Resumen legible (lo lee una persona en el log del job) ──────────────────
console.log(`Barcos con página hoy: ${actuales.size}${nuevos ? ` · ${nuevos} nuevo(s)` : ""}`);
if (bajas) console.log(`⚠️  ${bajas} barco(s) se han quedado SIN página hoy → se les pone 301.`);
if (recuperados) console.log(`↩️  ${recuperados} barco(s) han vuelto al calendario → se les retira el 301.`);
if (retirados.length) {
  console.log(`Barcos retirados con 301: ${retirados.length}`);
  for (const [slug, d] of retirados) {
    console.log(`   ${d.ship} → ${IDIOMAS.map((i) => `${i.barco}/${slug}`).join(" · ")}`);
  }
} else {
  console.log("Ningún barco retirado: no hace falta ninguna redirección.");
}
console.log(cambio ? "public/_redirects ACTUALIZADO." : "public/_redirects ya estaba al día.");
