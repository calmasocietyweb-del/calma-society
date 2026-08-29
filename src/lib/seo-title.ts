/**
 * Presupuesto y recorte del `<title>` (KAN-129).
 *
 * Google enseña unos 60 caracteres. Esta lógica nació en la ficha de lugar, donde
 * volcar el campo `area` entero producía títulos de hasta 161 caracteres; se
 * extrajo aquí para que la agenda —205 títulos largos, y es la sección con más
 * tráfico del sitio— use exactamente el mismo criterio en vez de otro paralelo.
 *
 * OJO con el presupuesto: el `title` que recibe `Seo.astro` NO es el que ve
 * Google. Seo le añade después « · Calma Society», así que el tope se calcula
 * restando ese sufijo real — si mañana cambia el nombre del sitio, el número se
 * ajusta solo.
 */
import { SITE } from "../config/site.ts";

/** Presupuesto cuando Seo.astro AÑADE « · Calma Society» detrás (páginas de índice). */
export const MAX_TITULO = 60 - ` · ${SITE.name}`.length;

/**
 * Presupuesto de las páginas de DETALLE, que desde KAN-136 no llevan la marca en
 * el `<title>`: los 60 caracteres visibles son enteros para la pieza. Son 17 más
 * que antes, y por eso muchos títulos vuelven a caber con su sufijo de sección.
 */
export const MAX_TITULO_SIN_MARCA = 60;

/**
 * Palabras que no pueden quedarse solas al final de un recorte. Cortar por
 * frontera de palabra dejaba títulos acabados en «— Es» (lo que quedaba de «Es
 * Mercadal») o en «del». Se descartan tantas como haga falta.
 *
 * Tres grupos: artículos y preposiciones de los seis idiomas activos; los
 * clasificadores geográficos que SIEMPRE preceden a un nombre propio («Cap de
 * Favàritx» recortado a «Cap» no dice nada, así que se cae el «Cap» también).
 */
export const COLGANTES = new Set([
  // es
  "de", "del", "la", "el", "los", "las", "es", "sa", "ses", "son", "des", "en", "y", "a", "por", "con",
  // en
  "the", "of", "and", "in", "at", "to", "from",
  // fr
  "du", "le", "les", "et", "à", "sur",
  // de
  "der", "die", "das", "den", "dem", "und", "von", "vom", "im", "am", "zum", "zur", "auf", "bei", "für",
  "durch", "entlang", "über", "unter", "nach", "mit", "ohne", "gegen", "zwischen", "aus",
  // it
  "di", "dei", "della", "dello", "delle", "il", "lo", "gli", "da", "su", "per", "con",
  // pt
  "do", "da", "dos", "das", "no", "na", "nos", "nas", "em", "para",
  // clasificadores geográficos
  "cap", "punta", "cala", "cales", "port", "illa", "illes", "torre", "faro", "far",
  "mont", "monte", "cova", "coves", "platja", "playa", "sant", "santa", "san", "camí", "cami",
]);

/** Quita la puntuación que queda huérfana tras cortar («… Menorca —»). */
export function limpiarFinal(t: string): string {
  return t.replace(/[,;:·—–-]+$/, "").trim();
}

/**
 * Delimitadores que van por parejas. Si el recorte deja uno abierto, el título
 * queda manco («… (S'Algar»).
 *
 * ⚠️ El alemán complica esto: sus comillas son „…“, así que « “ » es CIERRE en
 * alemán y APERTURA en inglés. Contar cada pareja por separado y de una sola
 * pasada rompía títulos correctos: «Cova des Coloms („die Kathedrale“) durch den»
 * perdía primero el “ (leído como apertura inglesa huérfana) y después el „,
 * quedando en «Cova des Coloms (». Por eso el balanceo se hace en BUCLE, con la
 * apertura más a la derecha, y solo se corta cuando el carácter no tiene pareja
 * a su derecha.
 */
function parejasDe(t: string): readonly (readonly [string, string])[] {
  /* El carácter “ es AMBIGUO: cierre en alemán („…“) y apertura en inglés (“…”).
     Se decide por contexto y de una vez para todo el título: si aparece „, este
     texto usa comillas alemanas y “ solo puede ser su cierre. */
  const aleman = t.includes("„");
  return [
    ["(", ")"],
    ["«", "»"],
    ...(aleman ? ([["„", "“"]] as const) : ([["“", "”"]] as const)),
  ];
}

/** Corta antes de cualquier delimitador de apertura que se haya quedado sin cierre. */
function cerrarHuerfanos(t: string): string {
  let out = t;
  const parejas = parejasDe(t);
  for (let vuelta = 0; vuelta <= parejas.length; vuelta++) {
    const huerfano = parejas
      .map(([ab, ce]) => {
        const pos = out.lastIndexOf(ab);
        return pos !== -1 && out.indexOf(ce, pos + 1) === -1 ? pos : -1;
      })
      .filter((p) => p !== -1);
    if (!huerfano.length) break;
    out = out.slice(0, Math.min(...huerfano)).trim();
  }
  return out;
}

/** Recorta por frontera de palabra, sin dejar delimitadores abiertos ni colgantes. */
export function recortar(t: string, max: number = MAX_TITULO): string {
  if (t.length <= max) return t;
  const corte = t.lastIndexOf(" ", max);
  let out = limpiarFinal(cerrarHuerfanos(t.slice(0, corte > 0 ? corte : max).trim()));
  let palabras = out.split(" ");
  while (palabras.length > 1 && COLGANTES.has(palabras[palabras.length - 1].toLowerCase())) {
    palabras.pop();
    out = limpiarFinal(palabras.join(" "));
    palabras = out.split(" ");
  }
  return out;
}

/**
 * Se degrada por pasos en vez de cortar a lo bruto: se prueba cada candidato de
 * más completo a más escueto y se coge el primero que quepa; solo si ninguno
 * cabe se recorta el último. Así los nombres largos conservan su parte útil en
 * vez de perderla.
 */
export function elegirTitulo(candidatos: string[], max: number = MAX_TITULO): string {
  const utiles = candidatos.filter((c): c is string => Boolean(c && c.trim()));
  return recortar(utiles.find((c) => c.length <= max) ?? utiles.at(-1) ?? "", max);
}
