/**
 * Diccionario de textos del motor del Planificador (i18n).
 * docs/PLANIFICADOR-BLUEPRINT.md · docs/ESTRATEGIA-MULTIIDIOMA.md.
 *
 * El motor de reglas es la ÚNICA fuente de la prosa del plan (razones, avisos,
 * nombres de bloque). Para localizarlo sin tocar la lógica, todos los textos
 * visibles viven aquí, en `es` y `en`, con la MISMA forma:
 *   - strings planos para los fijos,
 *   - funciones para los interpolados (reciben los datos que varían).
 *
 * Regla de oro: el español es BYTE-IDÉNTICO al que el motor generaba inline
 * (hay tests que lo asertan). El inglés respeta la voz de marca "lujo tranquilo"
 * (marca/voz-y-tono/VOZ-Y-TONO.md): sobrio, sin exclamaciones ni superlativos
 * vacíos, con criterio y datos concretos.
 *
 * Los NOMBRES PROPIOS (Ciutadella, Maó, Son Bou…) no se traducen: viven en un
 * único mapa compartido por ambos idiomas.
 */
import type { BaseZone } from "./types.ts";

export type Lang = "es" | "en";

/** Nombres "bonitos" de las zonas base — proper nouns, iguales en todo idioma. */
export const NICE: Record<BaseZone, string> = {
  ciutadella: "Ciutadella",
  mao: "Maó",
  "cala-galdana": "Cala Galdana",
  "son-bou": "Son Bou",
  "es-mercadal": "Es Mercadal",
  fornells: "Fornells",
};

/** Forma del diccionario (la comparte `es` y `en`; el compilador exige paridad). */
interface Strings {
  // ── base.ts ──────────────────────────────────────────────────────────────
  base: {
    /** (a) base elegida + sin coche en zona con transporte limitado. */
    chosenCarlessLimited: (place: string) => string;
    /** (a) base elegida normal. */
    chosenDefault: (place: string) => string;
    /** (b) entra por ferry → base del lado del puerto. */
    ferry: (place: string) => string;
    /** (c) sin coche + cultura/gastronomía → Maó. */
    carlessCulture: string;
    /** (c) sin coche → Ciutadella equilibrada. */
    carlessBalanced: string;
    /** (d) náutica → Fornells. */
    nautica: string;
    /** (d) familia + calas + presupuesto ajustado → Son Bou. */
    familySonBou: string;
    /** (d) familia + calas → Cala Galdana. */
    familyGaldana: string;
    /** (d) vida nocturna → Ciutadella. */
    nightlife: string;
    /** (d) lujo tranquilo (pareja) → Ciutadella. */
    quietLuxury: string;
    /** (d) intereses amplios + varios días → Es Mercadal. */
    broad: string;
    /** primera vez / por defecto → Ciutadella. */
    firstTime: string;
  };

  // ── arrival-departure.ts ─────────────────────────────────────────────────
  arrival: {
    usefulTime: (time: string) => string;
    stopForSupplies: string;
    lightFirstDay: string;
    lateArrival: string;
    // bloques del día de llegada
    settleIn: string;
    settleInReason: string;
    townStroll: string;
    townStrollReason: string;
    lunchInBase: string;
    lunchInBaseReason: string;
    easyNearbyReason: string;
    lunchNearBase: string;
    lunchNearBaseReason: string;
    sunsetNearBase: string;
    sunsetNearBaseReason: string;
    dinnerNearBase: string;
    dinnerNearBaseReason: string;
  };
  departure: {
    activityLimit: (time: string) => string;
    minimalPlan: string;
    islandCrossing: string;
    refuel: string;
    // bloques del día de salida
    breakfastPacking: string;
    breakfastPackingReason: string;
    shortStroll: string;
    shortStrollReason: string;
  };

  // ── intraday.ts ──────────────────────────────────────────────────────────
  intraday: {
    whatToSee: (joined: string) => string;
    breakfast: (town: string) => string;
    breakfastReason: string;
    anchorFallbackReason: (name: string) => string;
    lunchAt: (name: string) => string;
    lunchAtReason: string;
    lunchInTown: (name: string) => string;
    lunchInTownReason: string;
    lunchLocal: string;
    lunchLocalReason: string;
    dinnerStroll: (name: string) => string;
    dinnerStrollAnchorReason: string;
    dinnerStrollHighlightsReason: (joined: string) => string;
    dinnerStrollDefaultReason: string;
    dinnerAt: (name: string) => string;
    dinnerAtReason: string;
    dinnerLocal: string;
    dinnerLocalReason: string;
    // avisos por lugar
    reservation: (name: string) => string;
    parkingClosed: (name: string, shuttle: string) => string;
    parkingClosedFallback: string;
    goEarly: (name: string) => string;
    effort: (name: string, note: string) => string;
    effortFallbackNote: string;
    waterShade: (name: string) => string;
    confirmHours: (name: string) => string;
    pace: (pace: string, dropped: string) => string;
  };

  // ── planb.ts ─────────────────────────────────────────────────────────────
  planb: {
    longLunch: string;
    longLunchReason: string;
    indoorReason: (needsReservation: boolean) => string;
    fewIndoors: string;
    mondayClosed: string;
    extremeHeat: string;
  };

  // ── wind.ts ──────────────────────────────────────────────────────────────
  wind: {
    tramontana: (backup?: string) => string;
    migjorn: (backup?: string) => string;
  };

  // ── agenda.ts ────────────────────────────────────────────────────────────
  agenda: {
    inZone: (title: string, date: string) => string;
    otherZone: (title: string, date: string, zone: string) => string;
  };

  // ── engine.ts ────────────────────────────────────────────────────────────
  engine: {
    rentalCar: string;
    splitBase: (days: number, base: string, splitBase: string) => string;
    carless: string;
    accessibilityFilter: (level: string, efforts: string) => string;
    accessibilityWindow: string;
    freeDay: string;
    freeDayReason: string;
    busTransferDay: (place: string) => string;
  };
}

// ── Español (fuente de verdad, byte-idéntico al motor original) ──────────────
const ES: Strings = {
  base: {
    chosenCarlessLimited: (place) =>
      `Te alojas en ${place}. Aviso: sin coche, esta base tiene transporte público limitado; valora transfers/excursiones para moverte.`,
    chosenDefault: (place) =>
      `Te alojas en ${place}; el plan se organiza alrededor de esa base para minimizar el coche diario.`,
    ferry: (place) =>
      `Entras por el puerto de ${place}, así que te alojamos en ese lado para empezar sin cruzar la isla.`,
    carlessCulture:
      "Sin coche, Maó es el mejor hub: único núcleo con bus directo al aeropuerto y conexiones a toda la isla, ideal para cultura y gastronomía.",
    carlessBalanced:
      "Sin coche, Ciutadella es la base más equilibrada: casco histórico, ambiente y buses a las calas del oeste.",
    nautica:
      "Para vela, kayak y buceo, Fornells y su bahía protegida son la mejor base náutica (y un puerto marinero con encanto).",
    familySonBou:
      "En familia y con presupuesto ajustado, Son Bou ofrece la playa de arena más larga, aguas someras y apartamentos con cocina (mejor cenar self-catering).",
    familyGaldana:
      "En familia, Cala Galdana es la mejor base de playa: aguas calmas y poco profundas, posición central en la costa sur y a un paseo de Mitjana.",
    nightlife:
      "Para ambiente y vida nocturna, Ciutadella es la primera opción: casco histórico vivo, puerto y gastronomía.",
    quietLuxury:
      "Para una pareja que busca calma con criterio, Ciutadella (casco o agroturismo de su entorno) combina belleza, gastronomía y acceso a las calas del suroeste.",
    broad:
      "Si quieres recorrer toda la isla, Es Mercadal es la base central y equidistante (las mejores conexiones), perfecta para salir cada día a una costa distinta.",
    firstTime:
      "Para una primera vez equilibrada, Ciutadella es la recomendación segura: ciudad con alma, ambiente y a tiro de las calas más famosas del sur y oeste.",
  },
  arrival: {
    usefulTime: (time) =>
      `Hora útil estimada al llegar a tu base: ${time} (incluye el buffer de aeropuerto/transfer).`,
    stopForSupplies: "De camino, para a por agua y algo de desayuno (super en Maó/Ciutadella/Alaior).",
    lightFirstDay: "El día 1 va ligero y cercano a la base: nada de calas lejanas.",
    lateArrival: "Llegas tarde: solo logística y cena cercana. Sin turismo el primer día.",
    settleIn: "Llegada e instalación",
    settleInReason: "Deja las maletas y respira antes de empezar.",
    townStroll: "Paseo por el casco de la base",
    townStrollReason: "Un primer contacto tranquilo, sin coche.",
    lunchInBase: "Comida tranquila en la base",
    lunchInBaseReason: "Cerca del alojamiento.",
    easyNearbyReason: "Una cala de acceso fácil cerca de la base para estrenar el viaje.",
    lunchNearBase: "Comida cerca de la base",
    lunchNearBaseReason: "Check-in y primera comida sin prisa.",
    sunsetNearBase: "Atardecer en la zona de la base",
    sunsetNearBaseReason: "Cierra el primer día con calma.",
    dinnerNearBase: "Cena cercana a la base",
    dinnerNearBaseReason: "Sin desplazamientos largos al final del viaje.",
  },
  departure: {
    activityLimit: (time) =>
      `Hora límite de actividad el último día: ${time}. Después, directo al aeropuerto con margen.`,
    minimalPlan: "El último día, plan mínimo y cerca del aeropuerto: maleta y un café corto.",
    islandCrossing:
      "Riesgo de cruce de isla: desde Ciutadella son 45 min por la Me-1. Sal con holgura o valora dormir la última noche más cerca de Maó.",
    refuel:
      "Reposta antes de devolver el coche (gasolineras en Maó y junto a la Me-1, no pegadas al aeropuerto).",
    breakfastPacking: "Desayuno con calma y maleta",
    breakfastPackingReason: "Sin prisas pero con margen.",
    shortStroll: "Paseo corto cerca de la base o del aeropuerto",
    shortStrollReason: "Nada de calas de caminata ni Camí de Cavalls el día de salida.",
  },
  intraday: {
    whatToSee: (joined) => `Qué ver y hacer: ${joined}.`,
    breakfast: (town) => `Desayuno con calma en ${town}`,
    breakfastReason:
      "Empieza sin prisas cerca del alojamiento (coge agua y, si toca cala, llega temprano).",
    anchorFallbackReason: (name) => `${name}: encaja con tu perfil y está en el cluster del día.`,
    lunchAt: (name) => `Comida en ${name}`,
    lunchAtReason: "Producto local con criterio.",
    lunchInTown: (name) => `Comer en ${name}`,
    lunchInTownReason: "Busca una terraza tranquila en el pueblo; producto local.",
    lunchLocal: "Comida con producto local en la zona",
    lunchLocalReason: "Pausa de mediodía; evita conducir con el sol alto.",
    dinnerStroll: (name) => `Pasea por ${name} y cena allí`,
    dinnerStrollAnchorReason: "Cena en el pueblo tras la jornada, sin desplazamientos.",
    dinnerStrollHighlightsReason: (joined) => `De paso, no te pierdas: ${joined}.`,
    dinnerStrollDefaultReason: "Pasea sin prisa por el casco y elige una terraza para cenar.",
    dinnerAt: (name) => `Cena en ${name}`,
    dinnerAtReason: "Cena con criterio en la zona.",
    dinnerLocal: "Cena tranquila en la zona",
    dinnerLocalReason: "Cierra el día sin desplazamientos largos.",
    reservation: (name) => `Reserva ${name} con antelación.`,
    parkingClosed: (name, shuttle) => `${name}: coche restringido en verano. ${shuttle}`,
    parkingClosedFallback: "Usa la lanzadera o ve a pie.",
    goEarly: (name) => `Ve temprano a ${name}: el parking se llena pronto.`,
    effort: (name, note) => `${name} requiere buena forma: ${note}.`,
    effortFallbackNote: "caminata o terreno exigente",
    waterShade: (name) => `Lleva agua, sombra y calzado cómodo para ${name}.`,
    confirmHours: (name) => `Confirma el horario de ${name} el día de tu visita.`,
    pace: (pace, dropped) =>
      `Para no saturar el día (ritmo ${pace}) dejé fuera: ${dropped}. Puedes recuperarla otro día.`,
  },
  planb: {
    longLunch: "Comida larga con criterio (ancla del día)",
    longLunchReason: "En lluvia o calor, la comida ocupa el bloque central 13-15h.",
    indoorReason: (needsReservation) =>
      `Interior o lugar cubierto en la zona${needsReservation ? " (requiere reserva)" : ""}.`,
    fewIndoors:
      "Pocos interiores en esta zona para un día de lluvia: valora el eje Me-1 (museos de ciudad, quesería) o un día de ciudad (Ciutadella/Maó).",
    mondayClosed:
      "Es lunes: muchos museos y queserías cierran. Confirma horarios; abren catedral, mercados, miradores y cuevas-mirador.",
    extremeHeat:
      "Con calor extremo (>34°): cala muy temprano (antes de las 12h) y a partir de las 18h; el mediodía, a cubierto o de siesta.",
  },
  wind: {
    tramontana: (backup) =>
      `Con Tramontana (viento del norte, el más frecuente en Menorca) esta costa estará movida. Mira el parte esa mañana${backup ? `; alternativa resguardada en el sur: ${backup}` : ""}.`,
    migjorn: (backup) =>
      `El sur suele estar protegido de la Tramontana; pero con viento de Migjorn (del sur) busca el norte${backup ? `: ${backup}` : ""}. Mira el parte cada mañana.`,
  },
  agenda: {
    inZone: (title, date) =>
      `Coincide con ${title} en esta zona (${date}): reserva alojamiento y mesa con antelación y cuenta con mucha gente.`,
    otherZone: (title, date, zone) =>
      `El ${date} hay ${title} (${zone}). Puedes reorganizar un día para verla, o solo tenerla en cuenta.`,
  },
  engine: {
    rentalCar:
      "Reserva el coche de alquiler con antelación: en verano la flota se agota y los precios se disparan.",
    splitBase: (days, base, splitBase) =>
      `Con ${days} días e intereses en costas opuestas, valora dividir la estancia: mitad en ${base}, mitad en ${splitBase}.`,
    carless:
      "Sin coche: algunas calas top requieren bus + transfer o una excursión en barco. Lo marcamos en cada día.",
    accessibilityFilter: (level, efforts) =>
      `Plan filtrado por esfuerzo (${level}): solo lugares de nivel ${efforts}. Las playas con baño asistido son A1 (Son Bou, Punta Prima, Es Grau).`,
    accessibilityWindow:
      "Los servicios de baño asistido (silla anfibia, personal) operan del 1 de mayo al 31 de octubre. Fuera de esas fechas, confirma con el ayuntamiento.",
    freeDay: "Día libre: repite tu cala favorita o descansa",
    freeDayReason: "Margen para reordenar por viento o por cansancio.",
    busTransferDay: (place: string) =>
      `Sin coche: llega a ${place} con un transfer puerta a puerta de Menorca Bus (esta zona no tiene bus directo cómodo).`,
  },
};

// ── Inglés (voz "lujo tranquilo": sobrio, con criterio, sin exclamaciones) ───
const EN: Strings = {
  base: {
    chosenCarlessLimited: (place) =>
      `You are staying in ${place}. Note: without a car, this base has limited public transport; consider transfers or excursions to get around.`,
    chosenDefault: (place) =>
      `You are staying in ${place}; the plan is built around that base to keep daily driving to a minimum.`,
    ferry: (place) =>
      `You arrive through the port of ${place}, so we base you on that side to start without crossing the island.`,
    carlessCulture:
      "Without a car, Maó is the best hub: the only town with a direct airport bus and connections across the island, ideal for culture and gastronomy.",
    carlessBalanced:
      "Without a car, Ciutadella is the most balanced base: a historic old town, atmosphere and buses to the western coves.",
    nautica:
      "For sailing, kayaking and diving, Fornells and its sheltered bay make the best nautical base (and a marina town with character).",
    familySonBou:
      "With family on a tighter budget, Son Bou offers the longest sandy beach, shallow waters and apartments with kitchens (self-catering for dinner works best).",
    familyGaldana:
      "With family, Cala Galdana is the best beach base: calm, shallow waters, a central spot on the south coast and a short walk from Mitjana.",
    nightlife:
      "For atmosphere and nightlife, Ciutadella is the first choice: a lively old town, harbour and good food.",
    quietLuxury:
      "For a couple seeking calm with discernment, Ciutadella (the old town or an agroturismo nearby) brings together beauty, gastronomy and access to the south-western coves.",
    broad:
      "If you want to take in the whole island, Es Mercadal is the central, equidistant base (the best connections), ideal for heading to a different coast each day.",
    firstTime:
      "For a balanced first visit, Ciutadella is the safe recommendation: a city with soul, atmosphere and within easy reach of the best-known coves of the south and west.",
  },
  arrival: {
    usefulTime: (time) =>
      `Estimated time you can start once at your base: ${time} (includes the airport/transfer buffer).`,
    stopForSupplies: "On the way, stop for water and a little breakfast (supermarkets in Maó, Ciutadella or Alaior).",
    lightFirstDay: "Day 1 stays light and close to the base: no distant coves.",
    lateArrival: "You arrive late: logistics and a nearby dinner only. No sightseeing on the first day.",
    settleIn: "Arrival and settling in",
    settleInReason: "Drop the bags and take a breath before you begin.",
    townStroll: "A stroll through the base town",
    townStrollReason: "A quiet first contact, on foot.",
    lunchInBase: "An unhurried lunch at the base",
    lunchInBaseReason: "Close to your accommodation.",
    easyNearbyReason: "An easy-access cove near the base to open the trip.",
    lunchNearBase: "Lunch near the base",
    lunchNearBaseReason: "Check-in and a first meal without rushing.",
    sunsetNearBase: "Sunset around the base",
    sunsetNearBaseReason: "Close the first day with calm.",
    dinnerNearBase: "Dinner near the base",
    dinnerNearBaseReason: "No long journeys at the end of the trip.",
  },
  departure: {
    activityLimit: (time) =>
      `Latest time for activities on the final day: ${time}. After that, head to the airport with time to spare.`,
    minimalPlan: "On the last day, keep it minimal and close to the airport: packing and a quick coffee.",
    islandCrossing:
      "Risk of crossing the island: from Ciutadella it is 45 min along the Me-1. Leave with plenty of time, or consider spending the last night closer to Maó.",
    refuel:
      "Refuel before returning the car (petrol stations in Maó and along the Me-1, not right by the airport).",
    breakfastPacking: "An unhurried breakfast and packing",
    breakfastPackingReason: "No rush, but with time to spare.",
    shortStroll: "A short stroll near the base or the airport",
    shortStrollReason: "No walk-in coves or Camí de Cavalls on departure day.",
  },
  intraday: {
    whatToSee: (joined) => `What to see and do: ${joined}.`,
    breakfast: (town) => `An unhurried breakfast in ${town}`,
    breakfastReason:
      "Start without rushing, close to your accommodation (take water and, if a cove is on the plan, arrive early).",
    anchorFallbackReason: (name) => `${name}: fits your profile and sits in the day's cluster.`,
    lunchAt: (name) => `Lunch at ${name}`,
    lunchAtReason: "Local produce, chosen with care.",
    lunchInTown: (name) => `Lunch in ${name}`,
    lunchInTownReason: "Look for a quiet terrace in the village; local produce.",
    lunchLocal: "Lunch with local produce in the area",
    lunchLocalReason: "A midday pause; avoid driving with the sun high.",
    dinnerStroll: (name) => `Stroll through ${name} and dine there`,
    dinnerStrollAnchorReason: "Dinner in the village after the day, with no journeys.",
    dinnerStrollHighlightsReason: (joined) => `While there, don't miss: ${joined}.`,
    dinnerStrollDefaultReason: "Wander the old town unhurried and pick a terrace for dinner.",
    dinnerAt: (name) => `Dinner at ${name}`,
    dinnerAtReason: "Dinner with care in the area.",
    dinnerLocal: "An unhurried dinner in the area",
    dinnerLocalReason: "Close the day with no long journeys.",
    reservation: (name) => `Book ${name} in advance.`,
    parkingClosed: (name, shuttle) => `${name}: cars restricted in summer. ${shuttle}`,
    parkingClosedFallback: "Use the shuttle or go on foot.",
    goEarly: (name) => `Go early to ${name}: the car park fills up soon.`,
    effort: (name, note) => `${name} requires good fitness: ${note}.`,
    effortFallbackNote: "a walk or demanding terrain",
    waterShade: (name) => `Take water, shade and comfortable footwear for ${name}.`,
    confirmHours: (name) => `Confirm the opening hours of ${name} on the day of your visit.`,
    pace: (pace, dropped) =>
      `To keep the day unhurried (${pace} pace) I left out: ${dropped}. You can pick it up another day.`,
  },
  planb: {
    longLunch: "A long lunch with care (the anchor of the day)",
    longLunchReason: "In rain or heat, lunch fills the central block, 1-3 pm.",
    indoorReason: (needsReservation) =>
      `An indoor or covered spot in the area${needsReservation ? " (booking required)" : ""}.`,
    fewIndoors:
      "Few indoor options in this area for a rainy day: consider the Me-1 corridor (city museums, a cheese dairy) or a city day (Ciutadella or Maó).",
    mondayClosed:
      "It's Monday: many museums and cheese dairies close. Confirm hours; the cathedral, markets, viewpoints and cave-viewpoints open.",
    extremeHeat:
      "In extreme heat (>34°): the cove very early (before noon) and from 6 pm on; spend midday under cover or resting.",
  },
  wind: {
    tramontana: (backup) =>
      `With Tramontana (the north wind, the most frequent in Menorca) this coast will be choppy. Check the forecast that morning${backup ? `; a sheltered alternative in the south: ${backup}` : ""}.`,
    migjorn: (backup) =>
      `The south is usually sheltered from the Tramontana; but with a Migjorn wind (from the south) head north${backup ? `: ${backup}` : ""}. Check the forecast each morning.`,
  },
  agenda: {
    inZone: (title, date) =>
      `Coincides with ${title} in this area (${date}): book accommodation and a table in advance and expect large crowds.`,
    otherZone: (title, date, zone) =>
      `On ${date} there is ${title} (${zone}). You can reorganise a day to see it, or simply keep it in mind.`,
  },
  engine: {
    rentalCar:
      "Book the rental car in advance: in summer the fleet runs out and prices climb.",
    splitBase: (days, base, splitBase) =>
      `With ${days} days and interests on opposite coasts, consider splitting your stay: half in ${base}, half in ${splitBase}.`,
    carless:
      "Without a car: some top coves require a bus plus transfer or a boat excursion. We flag it on each day.",
    accessibilityFilter: (level, efforts) =>
      `Plan filtered by effort (${level}): only places rated ${efforts}. Beaches with assisted bathing are A1 (Son Bou, Punta Prima, Es Grau).`,
    accessibilityWindow:
      "Assisted bathing services (amphibious chair, staff) run from 1 May to 31 October. Outside those dates, confirm with the town hall.",
    freeDay: "Free day: revisit your favourite cove or rest",
    freeDayReason: "Room to reorder for wind or for tiredness.",
    busTransferDay: (place) =>
      `Without a car: reach ${place} with a door-to-door Menorca Bus transfer (this area has no convenient direct bus).`,
  },
};

/** Devuelve el diccionario de textos del idioma pedido (default español). */
export function S(lang: Lang): Strings {
  return lang === "en" ? EN : ES;
}
