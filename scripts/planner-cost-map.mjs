/**
 * Coste orientativo de cada plan del planificador — la banda, nunca el precio.
 *
 * POR QUÉ EXISTE. La encuesta pregunta el presupuesto desde el primer día
 * (ajustado / medio / alto) pero el motor apenas lo usaba: de 165 fichas de
 * lugares, solo 8 restaurantes tenían `priceRange`, y el dataset del
 * planificador no llevaba ningún dato de precio. Así que "más o menos lujo" no
 * cambiaba el plan (auditoría 2026-08-11).
 *
 * QUÉ NO HACE. No inventa precios ni los enseña. Un precio concreto envejece en
 * una temporada y publicar uno sin verificar es exactamente el fallo que este
 * proyecto ya ha pagado caro. Lo que se publica es una BANDA orientativa, con su
 * descargo visible, y el enlace a la web oficial para confirmar.
 *
 * DE DÓNDE SALE CADA BANDA (dos vías, y se sabe cuál es cuál):
 *   1. REGLA ESTRUCTURAL sobre datos que ya están verificados en la ficha
 *      (`plannerType`, `needsReservation`, `priceRange`). Una cala es de acceso
 *      público: que sea gratis no es una opinión. Certeza "alta".
 *   2. TABLA CURADA A MANO para lo que la regla clasifica mal — misma pauta que
 *      `planner-photo-map.mjs`. Certeza "media": es criterio editorial de la
 *      revista, no un dato de tarifa. Cada entrada lleva su porqué.
 *
 * Mantener: al añadir una ficha con `planner`, comprobar que la regla la coloca
 * bien; si no, una línea aquí.
 */

/** Las cuatro bandas. Se publican con el mismo lenguaje que las mesas del sitio. */
export const COST_BANDS = ["gratis", "€", "€€", "€€€"];

/**
 * Regla estructural. Devuelve la banda a partir de lo ya verificado en la ficha.
 * `needsReservation` es el mejor indicador disponible de "esto hay que pagarlo":
 * nadie reserva una cala.
 */
function byRule(p, priceRange) {
  // Una mesa con `priceRange` en su ficha manda sobre cualquier regla.
  if (priceRange) return priceRange === "€" ? "€" : priceRange === "€€" ? "€€" : "€€€";

  switch (p.plannerType) {
    // Espacio público: se entra y ya está.
    case "cala":
    case "playa":
    case "mirador":
    case "faro":
    case "pueblo":
      return "gratis";
    // Rutas y parques naturales: libres. Con reserva es una salida guiada.
    case "excursion":
      return p.needsReservation ? "€€" : "gratis";
    // Monumento con taquilla (los de acceso libre van en la tabla de abajo).
    case "yacimiento":
      return "€";
    // Museo suelto vs. visita concertada (bodega, quesería, finca).
    case "interior-cultural":
      return p.needsReservation ? "€€" : "€";
    // Salir al mar cuesta lo que cuesta salir al mar.
    case "actividad-acuatica":
      return "€€€";
    // Mirador libre vs. salida en barco al atardecer.
    case "atardecer":
      return p.needsReservation ? "€€€" : "gratis";
    case "comida":
    case "cena":
    case "desayuno":
      return "€€";
    default:
      return "€€";
  }
}

/**
 * Correcciones a mano: donde la regla se equivoca. Cada línea dice por qué.
 * Certeza "media" — criterio editorial, no tarifa consultada.
 */
const CURATED = {
  // — Yacimientos SIN taquilla: son recintos abiertos, no cobran entrada.
  trepuco: ["gratis", "recinto abierto, sin taquilla"],
  "necropolis-de-cala-morell": ["gratis", "acceso libre desde la carretera"],
  "necropolis-de-calescoves": ["gratis", "acceso libre por el barranco"],

  // — Monumentos de acceso libre que la regla cobraría.
  "castell-de-sant-nicolau": ["gratis", "acceso libre en su horario de apertura"],
  "destileria-gin-xoriguer": ["gratis", "la tienda y la cata de la destilería se visitan sin entrada"],

  // — Entradas de monumento grande: por encima de un museo municipal.
  "fortaleza-de-la-mola": ["€€", "recinto grande con visita larga, por encima de un museo municipal"],
  "illa-del-rei": ["€€", "hay que sumar la barca para cruzar al islote"],

  // — Bares y clubes de playa: no cobran entrada, pero se va a consumir.
  "eolo-sunset-bar": ["€", "sin entrada, pero se va a tomar algo"],
  "marea-beach-house-sunset-bar": ["€", "sin entrada, pero se va a tomar algo"],
  torralbenc: ["€€", "copa o mesa de hotel de campo"],
  "artrutx-sea-club": ["€€", "club de playa: reserva y consumición"],
  "son-bou-beach-club": ["€€", "club de playa: reserva y consumición"],
  "cova-den-xoroi": ["€€", "se paga entrada con consumición, no es una salida en barco"],

  // — Agua: no todo lo que se reserva cuesta lo mismo.
  "kayak-galdana-rutas-cuevas-familia": ["€€", "kayak guiado, muy por debajo de una salida en barco"],
  "kayak-snorkel-fornells-reserva-marina": ["€€", "kayak guiado, muy por debajo de una salida en barco"],
  "aquarock-parque-acuatico-calan-bosch": ["€€", "parque acuático con entrada de día"],
  "lloc-de-menorca-zoo-granja": ["€€", "entrada de día a la granja-zoo"],

  // — Bienestar: la banda alta de la isla.
  "spa-faustino-gran": ["€€€", "circuito y tratamientos de spa de hotel"],
  "spa-menorca-experimental": ["€€€", "circuito y tratamientos de spa de hotel"],
  "spa-santa-ponsa-fontenille": ["€€€", "circuito y tratamientos de spa de hotel"],
  "spa-torralbenc": ["€€€", "rituales de firma en spa de hotel"],
  "lago-spa-cala-en-bosch": ["€€", "spa de resort, más accesible que los de hotel de campo"],
  "wellness-cugo-gran": ["€€€", "bienestar en agroturismo de gama alta"],
  "torre-vella-yoga-naturaleza": ["€€", "sesión suelta de yoga o masaje"],

  // — Mesa: mercados frente a las mesas de autor.
  "mercat-des-peix": ["€", "tapear en las barras del mercado"],
  "mercat-municipal-de-ciutadella": ["€", "tapear en las barras del mercado"],
  "mercat-claustre-carme": ["€", "tapear en las barras del mercado"],
  "restaurant-sa-llagosta": ["€€€", "caldereta de langosta de autor"],
  "restaurante-es-cranc": ["€€€", "caldereta de langosta, el clásico de Fornells"],
  "restaurante-sant-joan-de-binissaida": ["€€€", "mesa de hotel rural con carta de autor"],
  "restaurante-smoix": ["€€", "cocina de mercado en el casco de Ciutadella"],
};

/**
 * Banda de coste de un lugar del planificador.
 * @returns {{ costBand: string, costCertainty: "alta" | "media" }}
 */
export function costOf(planner, priceRange) {
  const curated = CURATED[planner.__id];
  if (curated) return { costBand: curated[0], costCertainty: "media" };
  const band = byRule(planner, priceRange);
  // La regla es un hecho estructural cuando el espacio es público o la ficha ya
  // trae su `priceRange`; en el resto es una aproximación por tipo.
  const structural =
    !!priceRange ||
    ["cala", "playa", "mirador", "faro", "pueblo"].includes(planner.plannerType) ||
    (planner.plannerType === "excursion" && !planner.needsReservation);
  return { costBand: band, costCertainty: structural ? "alta" : "media" };
}

/** Para el informe del build: cuántas correcciones a mano hay. */
export const CURATED_COUNT = Object.keys(CURATED).length;
