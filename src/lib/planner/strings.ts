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
import type { BaseZone, Weekday, PlannerZone } from "./types.ts";

export type Lang = "es" | "en" | "de" | "fr" | "it" | "pt";

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
  /** Nombres localizados del ritmo (nunca fugar el enum crudo al texto). */
  paceName: Record<"relajado" | "equilibrado" | "intenso", string>;
  /** Nombres localizados del día de la semana (avisos de cierre). */
  weekdayName: Record<Weekday, string>;
  /** Nombres legibles de las zonas (para explicar por qué se elige una base). */
  zoneName: Record<PlannerZone, string>;
  /** Meses (índice 0 = enero). Para no enseñar nunca una fecha ISO a una persona. */
  monthName: readonly string[];
  /** Fecha legible a partir de sus partes ("24 de julio" / "24 July"). */
  dayMonth: (day: number, month: string) => string;
  /**
   * Conector para enumerar dos cosas (" y " / " and " / " und " / " et ").
   * Estaba inline en `rules/base.ts` como `lang === "es" ? " y " : " and "`, así
   * que el ALEMÁN unía sus zonas con " and " en producción. Aquí el compilador
   * exige la entrada al añadir un idioma. (Ver CLAUDE.md §11.)
   */
  listJoin: string;

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
    /** elegida por los datos: la base que deja más cerca lo pedido. */
    dataDriven: (place: string, zones: string) => string;
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
    /** El lugar cierra el día de la semana que toca → se deja fuera con aviso. */
    closedThatDay: (name: string, weekday: string) => string;
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
    /** Qué ha hecho el presupuesto declarado con el plan. */
    budgetShaped: (budget: "ajustado" | "medio" | "alto") => string;
    /** Descargo: publicamos bandas orientativas, nunca tarifas. */
    costDisclaimer: string;
  };

  /** Nombres de las bandas de coste, para leerlas sin símbolos. */
  costName: Record<"gratis" | "€" | "€€" | "€€€", string>;
  /** Resumen de coste de un día. */
  dayCost: {
    free: string;
    paid: (n: number) => string;
  };
}

// ── Español (fuente de verdad, byte-idéntico al motor original) ──────────────
const ES: Strings = {
  paceName: { relajado: "relajado", equilibrado: "equilibrado", intenso: "intenso" },
  weekdayName: {
    lun: "lunes", mar: "martes", mie: "miércoles", jue: "jueves",
    vie: "viernes", sab: "sábado", dom: "domingo",
  },
  monthName: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  dayMonth: (day, month) => `${day} de ${month}`,
  listJoin: " y ",
  zoneName: {
    oeste: "Ciutadella y el oeste",
    "sur-oeste": "las calas del suroeste",
    "sur-centro": "las playas del sur-centro",
    "sur-este": "el sureste tranquilo",
    este: "Maó y el este",
    norte: "el norte agreste",
    centro: "el interior",
    "eje-me1": "el eje Me-1",
  },
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
    dataDriven: (place, zones) =>
      `Te proponemos ${place}: de las seis bases posibles, es la que deja más cerca lo que nos has pedido (${zones}), y así el coche del día es corto en vez de cruzar la isla.`,
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
    closedThatDay: (name, weekday) =>
      `${name} cierra ese día (${weekday}): lo dejamos fuera y elegimos alternativa abierta.`,
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
    budgetShaped: (budget) =>
      budget === "ajustado"
        ? "Con presupuesto ajustado el plan se apoya en lo que no se paga: calas, miradores y tramos del Camí de Cavalls. En Menorca eso no es conformarse — es casi todo lo mejor."
        : budget === "alto"
          ? "Con presupuesto alto el plan se atreve con lo que hay que reservar: salir al mar, mesas de autor y bienestar. Reserva con antelación en temporada."
          : "El plan mezcla lo de acceso libre con alguna experiencia de pago; puedes subir o bajar el listón cambiando el presupuesto de la encuesta.",
    costDisclaimer:
      "Los costes son una BANDA orientativa (gratis · € · €€ · €€€), no una tarifa: confirma el precio del día en la web de cada sitio.",
  },
  costName: { gratis: "gratis", "€": "económico", "€€": "de pago", "€€€": "alto" },
  // "Sin entradas" y no "día gratis": se sigue comiendo, y de una mesa sin ficha
  // propia no sabemos el precio, así que no lo damos por hecho.
  dayCost: {
    free: "Sin entradas de pago",
    paid: (n) => (n === 1 ? "1 parada de pago" : `${n} paradas de pago`),
  },
};

// ── Inglés (voz "lujo tranquilo": sobrio, con criterio, sin exclamaciones) ───
const EN: Strings = {
  paceName: { relajado: "relaxed", equilibrado: "balanced", intenso: "intense" },
  weekdayName: {
    lun: "Monday", mar: "Tuesday", mie: "Wednesday", jue: "Thursday",
    vie: "Friday", sab: "Saturday", dom: "Sunday",
  },
  monthName: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  dayMonth: (day, month) => `${day} ${month}`,
  listJoin: " and ",
  zoneName: {
    oeste: "Ciutadella and the west",
    "sur-oeste": "the south-western coves",
    "sur-centro": "the south-central beaches",
    "sur-este": "the quiet south-east",
    este: "Maó and the east",
    norte: "the wild north",
    centro: "the inland heart",
    "eje-me1": "the Me-1 axis",
  },
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
    dataDriven: (place, zones) =>
      `We suggest ${place}: of the six possible bases, it is the one that keeps closest what you asked us for (${zones}), so each day's drive stays short instead of crossing the island.`,
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
    closedThatDay: (name, weekday) =>
      `${name} is closed that day (${weekday}), so we left it out and picked an open alternative.`,
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
    budgetShaped: (budget) =>
      budget === "ajustado"
        ? "On a tight budget the plan leans on what costs nothing: coves, viewpoints and stretches of the Camí de Cavalls. On Menorca that is not settling — it is most of the best of it."
        : budget === "alto"
          ? "With a generous budget the plan reaches for what has to be booked: going out to sea, chef's tables and wellbeing. Book ahead in season."
          : "The plan mixes free access with the occasional paid experience; raise or lower the bar by changing the budget in the survey.",
    costDisclaimer:
      "Costs are an indicative BAND (free · € · €€ · €€€), not a rate: confirm the day's price on each place's own site.",
  },
  costName: { gratis: "free", "€": "inexpensive", "€€": "paid", "€€€": "high-end" },
  dayCost: {
    free: "No paid entries",
    paid: (n) => (n === 1 ? "1 paid stop" : `${n} paid stops`),
  },
};

// ── Alemán (Stimme "stiller Luxus": nüchtern, mit Urteilsvermögen, ohne Ausrufe).
//    Durchgehend Höflichkeitsform "Sie", auch in Hinweisen und Handlungsaufrufen.
const DE: Strings = {
  paceName: { relajado: "entspannt", equilibrado: "ausgewogen", intenso: "intensiv" },
  weekdayName: {
    lun: "Montag", mar: "Dienstag", mie: "Mittwoch", jue: "Donnerstag",
    vie: "Freitag", sab: "Samstag", dom: "Sonntag",
  },
  monthName: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  dayMonth: (day, month) => `${day}. ${month}`,
  listJoin: " und ",
  zoneName: {
    oeste: "Ciutadella und der Westen",
    "sur-oeste": "die Buchten des Südwestens",
    "sur-centro": "die Strände der südlichen Inselmitte",
    "sur-este": "der ruhige Südosten",
    este: "Mahón und der Osten",
    norte: "der raue Norden",
    centro: "das Landesinnere",
    "eje-me1": "die Achse der Me-1",
  },
  base: {
    chosenCarlessLimited: (place) =>
      `Sie wohnen in ${place}. Hinweis: Ohne Auto hat dieser Standort nur eingeschränkten öffentlichen Nahverkehr; ziehen Sie Transfers oder Ausflüge in Betracht.`,
    chosenDefault: (place) =>
      `Sie wohnen in ${place}; der Plan ist um diesen Standort herum aufgebaut, damit Sie täglich möglichst wenig fahren.`,
    ferry: (place) =>
      `Sie kommen über den Hafen von ${place} an, deshalb bringen wir Sie auf dieser Seite unter — so beginnen Sie, ohne die Insel zu queren.`,
    carlessCulture:
      "Ohne Auto ist Mahón der beste Ausgangspunkt: der einzige Ort mit Direktbus zum Flughafen und Verbindungen auf die ganze Insel, ideal für Kultur und Gastronomie.",
    carlessBalanced:
      "Ohne Auto ist Ciutadella der ausgewogenste Standort: historische Altstadt, Atmosphäre und Busse zu den Buchten des Westens.",
    nautica:
      "Für Segeln, Kajak und Tauchen sind Fornells und seine geschützte Bucht die beste nautische Basis (und ein Fischerhafen mit Charme).",
    familySonBou:
      "Mit Familie und knappem Budget bietet Son Bou den längsten Sandstrand, flaches Wasser und Apartments mit Küche (Selbstverpflegung am Abend lohnt sich).",
    familyGaldana:
      "Mit Familie ist Cala Galdana der beste Strandstandort: ruhiges, flaches Wasser, zentrale Lage an der Südküste und ein Spaziergang bis Mitjana.",
    nightlife:
      "Für Atmosphäre und Nachtleben ist Ciutadella die erste Wahl: lebendige Altstadt, Hafen und Gastronomie.",
    quietLuxury:
      "Für ein Paar, das Ruhe mit Urteilsvermögen sucht, verbindet Ciutadella (Altstadt oder Agrotourismus im Umland) Schönheit, Gastronomie und Zugang zu den Buchten des Südwestens.",
    broad:
      "Wenn Sie die ganze Insel bereisen möchten, ist Es Mercadal der zentrale, gleich weit entfernte Standort (die besten Verbindungen) — perfekt, um jeden Tag an eine andere Küste zu fahren.",
    firstTime:
      "Für ein ausgewogenes erstes Mal ist Ciutadella die sichere Empfehlung: eine Stadt mit Seele und Atmosphäre, in Reichweite der bekanntesten Buchten des Südens und Westens.",
    dataDriven: (place, zones) =>
      `Wir schlagen Ihnen ${place} vor: Von den sechs möglichen Standorten liegt dieser am nächsten an dem, worum Sie gebeten haben (${zones}) — so ist die tägliche Fahrt kurz, statt die Insel zu queren.`,
  },
  arrival: {
    usefulTime: (time) =>
      `Geschätzte nutzbare Zeit bei Ankunft an Ihrem Standort: ${time} (einschließlich Puffer für Flughafen und Transfer).`,
    stopForSupplies: "Halten Sie unterwegs für Wasser und etwas zum Frühstücken an (Supermärkte in Mahón, Ciutadella und Alaior).",
    lightFirstDay: "Tag 1 bleibt leicht und nah am Standort: keine entlegenen Buchten.",
    lateArrival: "Sie kommen spät an: nur Logistik und ein Abendessen in der Nähe. Am ersten Tag kein Programm.",
    settleIn: "Ankunft und Ankommen",
    settleInReason: "Stellen Sie die Koffer ab und atmen Sie durch, bevor es losgeht.",
    townStroll: "Spaziergang durch den Ortskern des Standorts",
    townStrollReason: "Ein ruhiger erster Kontakt, ohne Auto.",
    lunchInBase: "Ruhiges Mittagessen am Standort",
    lunchInBaseReason: "In der Nähe der Unterkunft.",
    easyNearbyReason: "Eine leicht zugängliche Bucht nahe dem Standort, um die Reise zu eröffnen.",
    lunchNearBase: "Mittagessen in der Nähe des Standorts",
    lunchNearBaseReason: "Check-in und erstes Essen ohne Eile.",
    sunsetNearBase: "Sonnenuntergang in der Gegend des Standorts",
    sunsetNearBaseReason: "Beschließt den ersten Tag in Ruhe.",
    dinnerNearBase: "Abendessen in der Nähe des Standorts",
    dinnerNearBaseReason: "Keine langen Wege am Ende der Reise.",
  },
  departure: {
    activityLimit: (time) =>
      `Späteste Uhrzeit für Programm am letzten Tag: ${time}. Danach mit Puffer direkt zum Flughafen.`,
    minimalPlan: "Am letzten Tag ein minimaler Plan in Flughafennähe: Koffer und ein kurzer Kaffee.",
    islandCrossing:
      "Risiko der Inselquerung: Von Ciutadella sind es 45 Minuten über die Me-1. Fahren Sie mit reichlich Puffer los oder erwägen Sie, die letzte Nacht näher bei Mahón zu schlafen.",
    refuel:
      "Tanken Sie, bevor Sie den Mietwagen zurückgeben (Tankstellen in Mahón und an der Me-1, nicht direkt am Flughafen).",
    breakfastPacking: "Frühstück in Ruhe und Kofferpacken",
    breakfastPackingReason: "Ohne Hast, aber mit Puffer.",
    shortStroll: "Kurzer Spaziergang nahe dem Standort oder dem Flughafen",
    shortStrollReason: "Keine Buchten mit Fußmarsch und kein Camí de Cavalls am Abreisetag.",
  },
  intraday: {
    whatToSee: (joined) => `Sehen und erleben: ${joined}.`,
    breakfast: (town) => `Frühstück in Ruhe in ${town}`,
    breakfastReason:
      "Beginnen Sie ohne Eile in der Nähe der Unterkunft (nehmen Sie Wasser mit und kommen Sie früh, wenn eine Bucht ansteht).",
    anchorFallbackReason: (name) => `${name}: passt zu Ihrem Profil und liegt im Cluster des Tages.`,
    lunchAt: (name) => `Mittagessen im ${name}`,
    lunchAtReason: "Lokale Produkte mit Urteilsvermögen.",
    lunchInTown: (name) => `Mittagessen in ${name}`,
    lunchInTownReason: "Suchen Sie sich eine ruhige Terrasse im Ort; lokale Produkte.",
    lunchLocal: "Mittagessen mit lokalen Produkten in der Gegend",
    lunchLocalReason: "Mittagspause; vermeiden Sie das Fahren bei hochstehender Sonne.",
    dinnerStroll: (name) => `Spazieren Sie durch ${name} und essen Sie dort zu Abend`,
    dinnerStrollAnchorReason: "Abendessen im Ort nach dem Tag, ohne weitere Wege.",
    dinnerStrollHighlightsReason: (joined) => `Unterwegs sollten Sie nicht verpassen: ${joined}.`,
    dinnerStrollDefaultReason: "Schlendern Sie ohne Eile durch die Altstadt und wählen Sie eine Terrasse zum Abendessen.",
    dinnerAt: (name) => `Abendessen im ${name}`,
    dinnerAtReason: "Abendessen mit Urteilsvermögen in der Gegend.",
    dinnerLocal: "Ruhiges Abendessen in der Gegend",
    dinnerLocalReason: "Beschließt den Tag ohne lange Wege.",
    reservation: (name) => `Reservieren Sie ${name} rechtzeitig.`,
    parkingClosed: (name, shuttle) => `${name}: Zufahrt im Sommer beschränkt. ${shuttle}`,
    parkingClosedFallback: "Nehmen Sie den Shuttle oder gehen Sie zu Fuß.",
    goEarly: (name) => `Kommen Sie früh nach ${name}: Der Parkplatz füllt sich schnell.`,
    effort: (name, note) => `${name} verlangt gute Kondition: ${note}.`,
    effortFallbackNote: "Fußmarsch oder anspruchsvolles Gelände",
    waterShade: (name) => `Nehmen Sie Wasser, Sonnenschutz und bequeme Schuhe für ${name} mit.`,
    confirmHours: (name) => `Bestätigen Sie die Öffnungszeiten von ${name} am Tag Ihres Besuchs.`,
    pace: (pace, dropped) =>
      `Um den Tag nicht zu überladen (Tempo ${pace}), habe ich weggelassen: ${dropped}. Sie können das an einem anderen Tag nachholen.`,
    closedThatDay: (name, weekday) =>
      `${name} hat an diesem Tag geschlossen (${weekday}): Wir lassen es weg und wählen eine geöffnete Alternative.`,
  },
  planb: {
    longLunch: "Langes Mittagessen mit Urteilsvermögen (Anker des Tages)",
    longLunchReason: "Bei Regen oder Hitze füllt das Mittagessen den Kernblock von 13 bis 15 Uhr.",
    indoorReason: (needsReservation) =>
      `Innenraum oder überdachter Ort in der Gegend${needsReservation ? " (Reservierung erforderlich)" : ""}.`,
    fewIndoors:
      "In dieser Gegend gibt es für einen Regentag wenige Innenräume: Erwägen Sie die Achse der Me-1 (Stadtmuseen, Käserei) oder einen Stadttag (Ciutadella/Mahón).",
    mondayClosed:
      "Es ist Montag: Viele Museen und Käsereien haben geschlossen. Prüfen Sie die Öffnungszeiten; Kathedrale, Märkte, Aussichtspunkte und Höhlen-Aussichtspunkte sind geöffnet.",
    extremeHeat:
      "Bei extremer Hitze (>34°): Bucht sehr früh (vor 12 Uhr) und ab 18 Uhr; die Mittagszeit im Schatten oder für die Siesta.",
  },
  wind: {
    tramontana: (backup) =>
      `Bei Tramuntana (Nordwind, der häufigste auf Menorca) wird diese Küste bewegt sein. Sehen Sie an dem Morgen in den Bericht${backup ? `; geschützte Alternative im Süden: ${backup}` : ""}.`,
    migjorn: (backup) =>
      `Der Süden liegt meist im Schutz der Tramuntana; bei Migjorn (Südwind) suchen Sie jedoch den Norden${backup ? `: ${backup}` : ""}. Sehen Sie jeden Morgen in den Bericht.`,
  },
  agenda: {
    inZone: (title, date) =>
      `Fällt zusammen mit ${title} in dieser Gegend (${date}): Reservieren Sie Unterkunft und Tisch rechtzeitig und rechnen Sie mit vielen Menschen.`,
    otherZone: (title, date, zone) =>
      `Am ${date} findet ${title} statt (${zone}). Sie können einen Tag umstellen, um dabei zu sein, oder es einfach im Blick behalten.`,
  },
  engine: {
    rentalCar:
      "Buchen Sie den Mietwagen rechtzeitig: Im Sommer ist die Flotte ausgebucht und die Preise schießen in die Höhe.",
    splitBase: (days, base, splitBase) =>
      `Bei ${days} Tagen und Interessen an gegenüberliegenden Küsten lohnt es sich, den Aufenthalt zu teilen: die eine Hälfte in ${base}, die andere in ${splitBase}.`,
    carless:
      "Ohne Auto: Einige der besten Buchten verlangen Bus plus Transfer oder einen Bootsausflug. Wir weisen bei jedem Tag darauf hin.",
    accessibilityFilter: (level, efforts) =>
      `Plan nach Anstrengung gefiltert (${level}): nur Orte der Stufe ${efforts}. Die Strände mit betreutem Baden sind A1 (Son Bou, Punta Prima, Es Grau).`,
    accessibilityWindow:
      "Die Dienste für betreutes Baden (Amphibienstuhl, Personal) laufen vom 1. Mai bis zum 31. Oktober. Außerhalb dieser Zeit fragen Sie bei der Gemeinde nach.",
    freeDay: "Freier Tag: Wiederholen Sie Ihre Lieblingsbucht oder ruhen Sie sich aus",
    freeDayReason: "Spielraum, um wegen Wind oder Müdigkeit umzustellen.",
    busTransferDay: (place: string) =>
      `Ohne Auto: Kommen Sie mit einem Haus-zu-Haus-Transfer von Menorca Bus nach ${place} (diese Gegend hat keine bequeme Direktverbindung mit dem Bus).`,
    budgetShaped: (budget) =>
      budget === "ajustado"
        ? "Bei knappem Budget stützt sich der Plan auf das, was nichts kostet: Buchten, Aussichtspunkte und Abschnitte des Camí de Cavalls. Auf Menorca ist das kein Verzicht — es ist fast alles, was zählt."
        : budget === "alto"
          ? "Bei hohem Budget traut sich der Plan an das, was reserviert werden muss: aufs Meer hinausfahren, Autorenküche und Wellness. In der Saison rechtzeitig reservieren."
          : "Der Plan mischt frei Zugängliches mit der einen oder anderen kostenpflichtigen Erfahrung; Sie können die Messlatte höher oder niedriger legen, indem Sie das Budget in der Umfrage ändern.",
    costDisclaimer:
      "Die Kosten sind eine ungefähre SPANNE (kostenlos · € · €€ · €€€), kein Tarif: Bestätigen Sie den Preis des Tages auf der Website des jeweiligen Ortes.",
  },
  costName: { gratis: "kostenlos", "€": "günstig", "€€": "kostenpflichtig", "€€€": "hoch" },
  dayCost: {
    free: "Keine kostenpflichtigen Eintritte",
    paid: (n) => (n === 1 ? "1 kostenpflichtige Station" : `${n} kostenpflichtige Stationen`),
  },
};

// ── Francés (voix "luxe tranquille" : sobre, avec discernement, sans points
//    d'exclamation). Vouvoiement dans le corps du texte (docs/GLOSARIO-TRADUCCION.md).
const FR: Strings = {
  paceName: { relajado: "détendu", equilibrado: "équilibré", intenso: "intense" },
  weekdayName: {
    lun: "lundi", mar: "mardi", mie: "mercredi", jue: "jeudi",
    vie: "vendredi", sab: "samedi", dom: "dimanche",
  },
  monthName: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  dayMonth: (day, month) => `${day} ${month}`,
  listJoin: " et ",
  zoneName: {
    oeste: "Ciutadella et l'ouest",
    "sur-oeste": "les criques du sud-ouest",
    "sur-centro": "les plages du sud-centre",
    "sur-este": "le sud-est tranquille",
    este: "Maó et l'est",
    norte: "le nord sauvage",
    centro: "l'intérieur des terres",
    "eje-me1": "l'axe de la Me-1",
  },
  base: {
    chosenCarlessLimited: (place) =>
      `Vous séjournez à ${place}. Attention : sans voiture, cette base dispose de transports publics limités ; envisagez des transferts ou des excursions pour vous déplacer.`,
    chosenDefault: (place) =>
      `Vous séjournez à ${place} ; le plan s'organise autour de cette base pour limiter les trajets en voiture au quotidien.`,
    ferry: (place) =>
      `Vous arrivez par le port de ${place}, nous vous installons donc de ce côté pour commencer sans traverser l'île.`,
    carlessCulture:
      "Sans voiture, Maó est la meilleure base : la seule ville avec un bus direct vers l'aéroport et des liaisons vers toute l'île, idéale pour la culture et la gastronomie.",
    carlessBalanced:
      "Sans voiture, Ciutadella est la base la plus équilibrée : vieille ville historique, ambiance et bus vers les criques de l'ouest.",
    nautica:
      "Pour la voile, le kayak et la plongée, Fornells et sa baie protégée forment la meilleure base nautique (et un port de pêcheurs plein de charme).",
    familySonBou:
      "En famille et avec un budget serré, Son Bou offre la plus longue plage de sable, des eaux peu profondes et des appartements avec cuisine (mieux vaut dîner en formule autonome).",
    familyGaldana:
      "En famille, Cala Galdana est la meilleure base balnéaire : eaux calmes et peu profondes, position centrale sur la côte sud et à une promenade de Mitjana.",
    nightlife:
      "Pour l'ambiance et la vie nocturne, Ciutadella est le premier choix : vieille ville animée, port et gastronomie.",
    quietLuxury:
      "Pour un couple en quête de calme avec discernement, Ciutadella (vieille ville ou agrotourisme aux alentours) allie beauté, gastronomie et accès aux criques du sud-ouest.",
    broad:
      "Si vous souhaitez parcourir toute l'île, Es Mercadal est la base centrale et équidistante (les meilleures liaisons), parfaite pour rejoindre chaque jour une côte différente.",
    firstTime:
      "Pour une première visite équilibrée, Ciutadella est la valeur sûre : une ville pleine d'âme, de l'ambiance et à deux pas des criques les plus célèbres du sud et de l'ouest.",
    dataDriven: (place, zones) =>
      `Nous vous proposons ${place} : parmi les six bases possibles, c'est celle qui rapproche le plus ce que vous nous avez demandé (${zones}), pour des trajets en voiture courts plutôt qu'une traversée de l'île.`,
  },
  arrival: {
    usefulTime: (time) =>
      `Heure utile estimée à votre arrivée à la base : ${time} (marge aéroport/transfert incluse).`,
    stopForSupplies: "En chemin, arrêtez-vous pour de l'eau et de quoi petit-déjeuner (supermarchés à Maó, Ciutadella ou Alaior).",
    lightFirstDay: "Le jour 1 reste léger et proche de la base : pas de crique éloignée.",
    lateArrival: "Vous arrivez tard : seulement la logistique et un dîner à proximité. Pas de visites le premier jour.",
    settleIn: "Arrivée et installation",
    settleInReason: "Posez les valises et prenez le temps de souffler avant de commencer.",
    townStroll: "Promenade dans le centre de la base",
    townStrollReason: "Un premier contact tranquille, sans voiture.",
    lunchInBase: "Déjeuner tranquille à la base",
    lunchInBaseReason: "Près du logement.",
    easyNearbyReason: "Une crique facile d'accès près de la base pour ouvrir le voyage.",
    lunchNearBase: "Déjeuner près de la base",
    lunchNearBaseReason: "Arrivée à l'hébergement et premier repas sans se presser.",
    sunsetNearBase: "Coucher de soleil dans les environs de la base",
    sunsetNearBaseReason: "Terminez le premier jour en douceur.",
    dinnerNearBase: "Dîner à proximité de la base",
    dinnerNearBaseReason: "Pas de longs trajets à la fin du voyage.",
  },
  departure: {
    activityLimit: (time) =>
      `Heure limite d'activité le dernier jour : ${time}. Ensuite, direction l'aéroport avec de la marge.`,
    minimalPlan: "Le dernier jour, un programme minimal et proche de l'aéroport : les valises et un café rapide.",
    islandCrossing:
      "Risque de traversée de l'île : depuis Ciutadella, comptez 45 min par la Me-1. Partez avec de la marge, ou envisagez de passer la dernière nuit plus près de Maó.",
    refuel:
      "Faites le plein avant de rendre la voiture (stations-service à Maó et le long de la Me-1, pas juste à côté de l'aéroport).",
    breakfastPacking: "Petit-déjeuner tranquille et bagages",
    breakfastPackingReason: "Sans précipitation, mais avec de la marge.",
    shortStroll: "Courte promenade près de la base ou de l'aéroport",
    shortStrollReason: "Pas de crique à pied ni de Camí de Cavalls le jour du départ.",
  },
  intraday: {
    whatToSee: (joined) => `À voir et à faire : ${joined}.`,
    breakfast: (town) => `Petit-déjeuner tranquille à ${town}`,
    breakfastReason:
      "Commencez sans vous presser près du logement (prenez de l'eau et, si une crique est au programme, arrivez tôt).",
    anchorFallbackReason: (name) => `${name} : correspond à votre profil et se trouve dans le secteur du jour.`,
    lunchAt: (name) => `Déjeuner à ${name}`,
    lunchAtReason: "Des produits locaux, choisis avec soin.",
    lunchInTown: (name) => `Déjeuner à ${name}`,
    lunchInTownReason: "Cherchez une terrasse tranquille dans le village ; produits locaux.",
    lunchLocal: "Déjeuner avec des produits locaux dans les environs",
    lunchLocalReason: "Pause de midi ; évitez de conduire quand le soleil est au plus haut.",
    dinnerStroll: (name) => `Flânez à ${name} et dînez sur place`,
    dinnerStrollAnchorReason: "Dîner au village après la journée, sans déplacement.",
    dinnerStrollHighlightsReason: (joined) => `En chemin, ne manquez pas : ${joined}.`,
    dinnerStrollDefaultReason: "Flânez sans hâte dans le centre historique et choisissez une terrasse pour dîner.",
    dinnerAt: (name) => `Dîner à ${name}`,
    dinnerAtReason: "Un dîner choisi avec soin dans les environs.",
    dinnerLocal: "Dîner tranquille dans les environs",
    dinnerLocalReason: "Terminez la journée sans longs trajets.",
    reservation: (name) => `Réservez ${name} à l'avance.`,
    parkingClosed: (name, shuttle) => `${name} : circulation restreinte en été. ${shuttle}`,
    parkingClosedFallback: "Prenez la navette ou allez-y à pied.",
    goEarly: (name) => `Allez tôt à ${name} : le parking se remplit vite.`,
    effort: (name, note) => `${name} demande une bonne condition physique : ${note}.`,
    effortFallbackNote: "marche ou terrain difficile",
    waterShade: (name) => `Prévoyez de l'eau, de l'ombre et des chaussures confortables pour ${name}.`,
    confirmHours: (name) => `Confirmez les horaires de ${name} le jour de votre visite.`,
    pace: (pace, dropped) =>
      `Pour ne pas surcharger la journée (rythme ${pace}), j'ai laissé de côté : ${dropped}. Vous pourrez vous rattraper un autre jour.`,
    closedThatDay: (name, weekday) =>
      `${name} est fermé ce jour-là (${weekday}) : nous l'avons laissé de côté et choisi une alternative ouverte.`,
  },
  planb: {
    longLunch: "Long déjeuner choisi avec soin (l'ancre de la journée)",
    longLunchReason: "En cas de pluie ou de forte chaleur, le déjeuner occupe le créneau central, 13h-15h.",
    indoorReason: (needsReservation) =>
      `Lieu intérieur ou couvert dans les environs${needsReservation ? " (réservation nécessaire)" : ""}.`,
    fewIndoors:
      "Peu de lieux intérieurs dans ce secteur pour un jour de pluie : envisagez l'axe de la Me-1 (musées, fromagerie) ou une journée en ville (Ciutadella/Maó).",
    mondayClosed:
      "C'est lundi : de nombreux musées et fromageries sont fermés. Vérifiez les horaires ; la cathédrale, les marchés, les belvédères et les grottes-belvédères restent ouverts.",
    extremeHeat:
      "En cas de forte chaleur (>34°) : la crique très tôt (avant midi) et à partir de 18h ; le milieu de journée, à l'abri ou pour une sieste.",
  },
  wind: {
    tramontana: (backup) =>
      `Avec la Tramontane (vent du nord, le plus fréquent à Minorque), cette côte sera agitée. Consultez le bulletin ce matin-là${backup ? ` ; une alternative abritée dans le sud : ${backup}` : ""}.`,
    migjorn: (backup) =>
      `Le sud est généralement protégé de la Tramontane ; mais par vent de Migjorn (du sud), cherchez le nord${backup ? ` : ${backup}` : ""}. Consultez le bulletin chaque matin.`,
  },
  agenda: {
    inZone: (title, date) =>
      `Cela coïncide avec ${title} dans ce secteur (${date}) : réservez hébergement et table à l'avance et attendez-vous à beaucoup de monde.`,
    otherZone: (title, date, zone) =>
      `Le ${date} a lieu ${title} (${zone}). Vous pouvez réorganiser une journée pour y assister, ou simplement en tenir compte.`,
  },
  engine: {
    rentalCar:
      "Réservez la voiture de location à l'avance : en été, les disponibilités s'épuisent et les prix s'envolent.",
    splitBase: (days, base, splitBase) =>
      `Avec ${days} jours et des envies sur des côtes opposées, envisagez de diviser le séjour : moitié à ${base}, moitié à ${splitBase}.`,
    carless:
      "Sans voiture : certaines criques incontournables demandent bus et transfert, ou une excursion en bateau. Nous le signalons chaque jour.",
    accessibilityFilter: (level, efforts) =>
      `Plan filtré par niveau d'effort (${level}) : uniquement les lieux de niveau ${efforts}. Les plages avec baignade assistée sont classées A1 (Son Bou, Punta Prima, Es Grau).`,
    accessibilityWindow:
      "Les services de baignade assistée (fauteuil amphibie, personnel) fonctionnent du 1er mai au 31 octobre. En dehors de cette période, vérifiez auprès de la mairie.",
    freeDay: "Jour libre : retournez dans votre crique préférée ou reposez-vous",
    freeDayReason: "Une marge pour réorganiser en cas de vent ou de fatigue.",
    busTransferDay: (place: string) =>
      `Sans voiture : rejoignez ${place} avec un transfert porte-à-porte Menorca Bus (ce secteur n'a pas de bus direct pratique).`,
    budgetShaped: (budget) =>
      budget === "ajustado"
        ? "Avec un budget serré, le plan s'appuie sur ce qui ne coûte rien : criques, belvédères et tronçons du Camí de Cavalls. À Minorque, ce n'est pas une concession — c'est presque tout ce qu'il y a de meilleur."
        : budget === "alto"
          ? "Avec un budget confortable, le plan ose ce qu'il faut réserver : sorties en mer, tables d'auteur et bien-être. Réservez à l'avance en haute saison."
          : "Le plan mêle accès libre et quelques expériences payantes ; vous pouvez ajuster le niveau en changeant le budget dans le questionnaire.",
    costDisclaimer:
      "Les coûts sont une FOURCHETTE indicative (gratuit · € · €€ · €€€), pas un tarif : confirmez le prix du jour sur le site de chaque lieu.",
  },
  costName: { gratis: "gratuit", "€": "économique", "€€": "payant", "€€€": "élevé" },
  dayCost: {
    free: "Aucune entrée payante",
    paid: (n) => (n === 1 ? "1 étape payante" : `${n} étapes payantes`),
  },
};

// ── Italiano (voce "lusso tranquillo": sobria, con criterio, senza esclamazioni).
//    Forma di cortesia LEI nel corpo del testo; le etichette brevi restano neutre
//    (docs/GLOSARIO-TRADUCCION.md: un rótulo nunca lleva imperativo de cortesía).
const IT: Strings = {
  paceName: { relajado: "rilassato", equilibrado: "equilibrato", intenso: "intenso" },
  weekdayName: {
    lun: "lunedì", mar: "martedì", mie: "mercoledì", jue: "giovedì",
    vie: "venerdì", sab: "sabato", dom: "domenica",
  },
  monthName: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
  dayMonth: (day, month) => `${day} ${month}`,
  listJoin: " e ",
  zoneName: {
    oeste: "Ciutadella e l'ovest",
    "sur-oeste": "le cale del sud-ovest",
    "sur-centro": "le spiagge del sud-centro",
    "sur-este": "il sud-est tranquillo",
    este: "Maó e l'est",
    norte: "il nord selvaggio",
    centro: "l'entroterra",
    "eje-me1": "l'asse della Me-1",
  },
  base: {
    chosenCarlessLimited: (place) =>
      `Soggiorna a ${place}. Attenzione: senza auto questa base ha trasporti pubblici limitati; valuti transfer o escursioni per spostarsi.`,
    chosenDefault: (place) =>
      `Soggiorna a ${place}; il piano si organizza attorno a quella base per ridurre l'auto di ogni giorno.`,
    ferry: (place) =>
      `Arriva dal porto di ${place}, quindi la sistemiamo su quel lato per iniziare senza attraversare l'isola.`,
    carlessCulture:
      "Senza auto, Maó è la base migliore: l'unico centro con autobus diretto dall'aeroporto e collegamenti con tutta l'isola, ideale per cultura e gastronomia.",
    carlessBalanced:
      "Senza auto, Ciutadella è la base più equilibrata: centro storico, atmosfera e autobus verso le cale dell'ovest.",
    nautica:
      "Per vela, kayak e immersioni, Fornells e la sua baia protetta sono la migliore base nautica (e un porto di pescatori pieno di fascino).",
    familySonBou:
      "In famiglia e con un budget contenuto, Son Bou offre la spiaggia di sabbia più lunga, acque basse e appartamenti con cucina (meglio cenare in autonomia).",
    familyGaldana:
      "In famiglia, Cala Galdana è la migliore base balneare: acque calme e poco profonde, posizione centrale sulla costa sud e a una passeggiata da Mitjana.",
    nightlife:
      "Per l'atmosfera e la vita notturna, Ciutadella è la prima scelta: centro storico vivo, porto e gastronomia.",
    quietLuxury:
      "Per una coppia che cerca calma con criterio, Ciutadella (centro storico o agriturismo nei dintorni) unisce bellezza, gastronomia e accesso alle cale del sud-ovest.",
    broad:
      "Se vuole percorrere tutta l'isola, Es Mercadal è la base centrale ed equidistante (i collegamenti migliori), perfetta per raggiungere ogni giorno una costa diversa.",
    firstTime:
      "Per una prima volta equilibrata, Ciutadella è la scelta sicura: una città con un'anima, atmosfera e a due passi dalle cale più famose del sud e dell'ovest.",
    dataDriven: (place, zones) =>
      `Le proponiamo ${place}: fra le sei basi possibili è quella che avvicina di più ciò che ci ha chiesto (${zones}), così l'auto di ogni giorno è breve invece di attraversare l'isola.`,
  },
  arrival: {
    usefulTime: (time) =>
      `Ora utile stimata all'arrivo alla base: ${time} (margine aeroporto/transfer incluso).`,
    stopForSupplies: "Lungo il tragitto si fermi per l'acqua e qualcosa per la colazione (supermercati a Maó, Ciutadella o Alaior).",
    lightFirstDay: "Il giorno 1 resta leggero e vicino alla base: nessuna cala lontana.",
    lateArrival: "Arriva tardi: solo logistica e cena nei dintorni. Nessuna visita il primo giorno.",
    settleIn: "Arrivo e sistemazione",
    settleInReason: "Posi le valigie e prenda fiato prima di iniziare.",
    townStroll: "Passeggiata nel centro della base",
    townStrollReason: "Un primo contatto tranquillo, senza auto.",
    lunchInBase: "Pranzo tranquillo alla base",
    lunchInBaseReason: "Vicino all'alloggio.",
    easyNearbyReason: "Una cala di accesso facile vicino alla base per aprire il viaggio.",
    lunchNearBase: "Pranzo vicino alla base",
    lunchNearBaseReason: "Check-in e primo pasto senza fretta.",
    sunsetNearBase: "Tramonto nei dintorni della base",
    sunsetNearBaseReason: "Chiuda il primo giorno con calma.",
    dinnerNearBase: "Cena vicino alla base",
    dinnerNearBaseReason: "Nessuno spostamento lungo alla fine del viaggio.",
  },
  departure: {
    activityLimit: (time) =>
      `Ora limite per le attività l'ultimo giorno: ${time}. Poi, verso l'aeroporto con margine.`,
    minimalPlan: "L'ultimo giorno, programma minimo e vicino all'aeroporto: valigia e un caffè veloce.",
    islandCrossing:
      "Rischio di attraversare l'isola: da Ciutadella sono 45 minuti sulla Me-1. Parta con margine, oppure valuti di dormire l'ultima notte più vicino a Maó.",
    refuel:
      "Faccia rifornimento prima di riconsegnare l'auto (distributori a Maó e lungo la Me-1, non a ridosso dell'aeroporto).",
    breakfastPacking: "Colazione con calma e valigia",
    breakfastPackingReason: "Senza fretta, ma con margine.",
    shortStroll: "Passeggiata breve vicino alla base o all'aeroporto",
    shortStrollReason: "Niente cale da raggiungere a piedi né Camí de Cavalls il giorno della partenza.",
  },
  intraday: {
    whatToSee: (joined) => `Da vedere e da fare: ${joined}.`,
    breakfast: (town) => `Colazione con calma a ${town}`,
    breakfastReason:
      "Inizi senza fretta vicino all'alloggio (prenda acqua e, se in programma c'è una cala, arrivi presto).",
    anchorFallbackReason: (name) => `${name}: corrisponde al suo profilo e si trova nel settore della giornata.`,
    lunchAt: (name) => `Pranzo a ${name}`,
    lunchAtReason: "Prodotti locali, scelti con criterio.",
    lunchInTown: (name) => `Pranzo a ${name}`,
    lunchInTownReason: "Cerchi una terrazza tranquilla in paese; prodotti locali.",
    lunchLocal: "Pranzo con prodotti locali in zona",
    lunchLocalReason: "Pausa di mezzogiorno; eviti di guidare con il sole alto.",
    dinnerStroll: (name) => `Passeggi per ${name} e ceni lì`,
    dinnerStrollAnchorReason: "Cena in paese dopo la giornata, senza spostamenti.",
    dinnerStrollHighlightsReason: (joined) => `Lungo il percorso, da non perdere: ${joined}.`,
    dinnerStrollDefaultReason: "Passeggi senza fretta nel centro storico e scelga una terrazza per cenare.",
    dinnerAt: (name) => `Cena a ${name}`,
    dinnerAtReason: "Una cena scelta con criterio in zona.",
    dinnerLocal: "Cena tranquilla in zona",
    dinnerLocalReason: "Chiuda la giornata senza spostamenti lunghi.",
    reservation: (name) => `Prenoti ${name} con anticipo.`,
    parkingClosed: (name, shuttle) => `${name}: circolazione limitata in estate. ${shuttle}`,
    parkingClosedFallback: "Prenda la navetta o ci vada a piedi.",
    goEarly: (name) => `Vada presto a ${name}: il parcheggio si riempie in fretta.`,
    effort: (name, note) => `${name} richiede una buona forma fisica: ${note}.`,
    effortFallbackNote: "camminata o terreno impegnativo",
    waterShade: (name) => `Porti acqua, un riparo dal sole e scarpe comode per ${name}.`,
    confirmHours: (name) => `Confermi l'orario di ${name} il giorno della visita.`,
    pace: (pace, dropped) =>
      `Per non sovraccaricare la giornata (ritmo ${pace}) ho lasciato fuori: ${dropped}. Potrà recuperarla un altro giorno.`,
    closedThatDay: (name, weekday) =>
      `${name} è chiuso quel giorno (${weekday}): lo lasciamo fuori e scegliamo un'alternativa aperta.`,
  },
  planb: {
    longLunch: "Pranzo lungo scelto con criterio (l'ancora della giornata)",
    longLunchReason: "Con pioggia o caldo forte, il pranzo occupa la fascia centrale, dalle 13 alle 15.",
    indoorReason: (needsReservation) =>
      `Luogo al chiuso o coperto in zona${needsReservation ? " (è necessaria la prenotazione)" : ""}.`,
    fewIndoors:
      "Pochi luoghi al chiuso in questa zona per una giornata di pioggia: valuti l'asse della Me-1 (musei di città, caseificio) o una giornata in città (Ciutadella/Maó).",
    mondayClosed:
      "È lunedì: molti musei e caseifici chiudono. Confermi gli orari; restano aperti la cattedrale, i mercati, i belvedere e le grotte-belvedere.",
    extremeHeat:
      "Con caldo estremo (>34°): cala molto presto (prima delle 12) e dalle 18 in poi; a mezzogiorno, al coperto o riposo.",
  },
  wind: {
    tramontana: (backup) =>
      `Con la Tramontana (vento del nord, il più frequente a Minorca) questa costa sarà mossa. Consulti il bollettino quella mattina${backup ? `; un'alternativa riparata nel sud: ${backup}` : ""}.`,
    migjorn: (backup) =>
      `Il sud di solito è protetto dalla Tramontana; ma con vento di Migjorn (da sud) cerchi il nord${backup ? `: ${backup}` : ""}. Consulti il bollettino ogni mattina.`,
  },
  agenda: {
    inZone: (title, date) =>
      `Coincide con ${title} in questa zona (${date}): prenoti alloggio e tavolo con anticipo e metta in conto molta gente.`,
    otherZone: (title, date, zone) =>
      `Il ${date} c'è ${title} (${zone}). Può riorganizzare una giornata per vederla, oppure semplicemente tenerne conto.`,
  },
  engine: {
    rentalCar:
      "Prenoti l'auto a noleggio con anticipo: in estate la flotta si esaurisce e i prezzi salgono.",
    splitBase: (days, base, splitBase) =>
      `Con ${days} giorni e interessi su coste opposte, valuti di dividere il soggiorno: metà a ${base}, metà a ${splitBase}.`,
    carless:
      "Senza auto: alcune cale imperdibili richiedono autobus più transfer, oppure un'escursione in barca. Lo segnaliamo giorno per giorno.",
    accessibilityFilter: (level, efforts) =>
      `Piano filtrato per livello di sforzo (${level}): solo luoghi di livello ${efforts}. Le spiagge con bagno assistito sono A1 (Son Bou, Punta Prima, Es Grau).`,
    accessibilityWindow:
      "I servizi di bagno assistito (sedia anfibia, personale) sono attivi dal 1º maggio al 31 ottobre. Fuori da quelle date, confermi con il comune.",
    freeDay: "Giorno libero: torni alla sua cala preferita o riposi",
    freeDayReason: "Un margine per riordinare la giornata per vento o per stanchezza.",
    busTransferDay: (place: string) =>
      `Senza auto: raggiunga ${place} con un transfer porta a porta di Menorca Bus (questa zona non ha un autobus diretto comodo).`,
    budgetShaped: (budget) =>
      budget === "ajustado"
        ? "Con un budget contenuto il piano si appoggia su ciò che non si paga: cale, belvedere e tratti del Camí de Cavalls. A Minorca non è accontentarsi — è quasi tutto il meglio."
        : budget === "alto"
          ? "Con un budget alto il piano osa ciò che va prenotato: uscite in mare, tavole d'autore e benessere. Prenoti con anticipo in alta stagione."
          : "Il piano mescola l'accesso libero con qualche esperienza a pagamento; può alzare o abbassare l'asticella cambiando il budget nel questionario.",
    costDisclaimer:
      "I costi sono una FASCIA indicativa (gratis · € · €€ · €€€), non una tariffa: confermi il prezzo del giorno sul sito di ogni luogo.",
  },
  costName: { gratis: "gratis", "€": "economico", "€€": "a pagamento", "€€€": "alto" },
  dayCost: {
    free: "Nessun ingresso a pagamento",
    paid: (n) => (n === 1 ? "1 tappa a pagamento" : `${n} tappe a pagamento`),
  },
};

// ── Português europeu (voz "luxo tranquilo": sóbria, com critério, sem
//    exclamações). Tratamento na 3.ª pessoa no corpo do texto; infinitivo nos
//    rótulos (docs/GLOSARIO-TRADUCCION.md). PT-PT, nunca PT-BR: autocarro,
//    aluguer, pequeno-almoço, esplanada, concelho.
const PT: Strings = {
  paceName: { relajado: "relaxado", equilibrado: "equilibrado", intenso: "intenso" },
  weekdayName: {
    lun: "segunda-feira", mar: "terça-feira", mie: "quarta-feira", jue: "quinta-feira",
    vie: "sexta-feira", sab: "sábado", dom: "domingo",
  },
  monthName: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  dayMonth: (day, month) => `${day} de ${month}`,
  listJoin: " e ",
  zoneName: {
    oeste: "Ciutadella e o oeste",
    "sur-oeste": "as enseadas do sudoeste",
    "sur-centro": "as praias do sul-centro",
    "sur-este": "o sudeste tranquilo",
    este: "Maó e o leste",
    norte: "o norte agreste",
    centro: "o interior",
    "eje-me1": "o eixo da Me-1",
  },
  base: {
    chosenCarlessLimited: (place) =>
      `Fica alojado em ${place}. Atenção: sem carro, esta base tem transportes públicos limitados; pondere transfers ou excursões para se deslocar.`,
    chosenDefault: (place) =>
      `Fica alojado em ${place}; o plano organiza-se à volta dessa base para reduzir o carro de cada dia.`,
    ferry: (place) =>
      `Chega pelo porto de ${place}, por isso propomos ficar desse lado para começar sem atravessar a ilha.`,
    carlessCulture:
      "Sem carro, Maó é a melhor base: o único núcleo com autocarro direto do aeroporto e ligações a toda a ilha, ideal para cultura e gastronomia.",
    carlessBalanced:
      "Sem carro, Ciutadella é a base mais equilibrada: centro histórico, ambiente e autocarros para as enseadas do oeste.",
    nautica:
      "Para vela, caiaque e mergulho, Fornells e a sua baía protegida são a melhor base náutica (e um porto piscatório cheio de encanto).",
    familySonBou:
      "Em família e com orçamento apertado, Son Bou oferece o areal mais longo, águas pouco profundas e apartamentos com cozinha (melhor jantar em casa).",
    familyGaldana:
      "Em família, Cala Galdana é a melhor base balnear: águas calmas e pouco profundas, posição central na costa sul e a um passeio de Mitjana.",
    nightlife:
      "Para ambiente e vida noturna, Ciutadella é a primeira escolha: centro histórico vivo, porto e gastronomia.",
    quietLuxury:
      "Para um casal que procura calma com critério, Ciutadella (centro histórico ou agroturismo nos arredores) junta beleza, gastronomia e acesso às enseadas do sudoeste.",
    broad:
      "Se quiser percorrer toda a ilha, Es Mercadal é a base central e equidistante (as melhores ligações), perfeita para sair todos os dias para uma costa diferente.",
    firstTime:
      "Para uma primeira vez equilibrada, Ciutadella é a recomendação segura: uma cidade com alma, ambiente e à distância das enseadas mais famosas do sul e do oeste.",
    dataDriven: (place, zones) =>
      `Propomos ${place}: das seis bases possíveis, é a que deixa mais perto o que nos pediu (${zones}), para que o carro de cada dia seja curto em vez de atravessar a ilha.`,
  },
  arrival: {
    usefulTime: (time) =>
      `Hora útil estimada à chegada à base: ${time} (inclui a margem de aeroporto/transfer).`,
    stopForSupplies: "Pelo caminho, pare para comprar água e algo para o pequeno-almoço (supermercados em Maó, Ciutadella ou Alaior).",
    lightFirstDay: "O dia 1 é leve e perto da base: nada de enseadas distantes.",
    lateArrival: "Chega tarde: apenas logística e jantar por perto. Nada de visitas no primeiro dia.",
    settleIn: "Chegada e instalação",
    settleInReason: "Deixe as malas e respire antes de começar.",
    townStroll: "Passeio pelo centro da base",
    townStrollReason: "Um primeiro contacto tranquilo, sem carro.",
    lunchInBase: "Almoço tranquilo na base",
    lunchInBaseReason: "Perto do alojamento.",
    easyNearbyReason: "Uma enseada de acesso fácil perto da base para estrear a viagem.",
    lunchNearBase: "Almoço perto da base",
    lunchNearBaseReason: "Check-in e primeira refeição sem pressa.",
    sunsetNearBase: "Pôr do sol nos arredores da base",
    sunsetNearBaseReason: "Feche o primeiro dia com calma.",
    dinnerNearBase: "Jantar perto da base",
    dinnerNearBaseReason: "Sem deslocações longas no fim da viagem.",
  },
  departure: {
    activityLimit: (time) =>
      `Hora limite de atividade no último dia: ${time}. Depois, direto ao aeroporto com margem.`,
    minimalPlan: "No último dia, plano mínimo e perto do aeroporto: mala e um café rápido.",
    islandCrossing:
      "Risco de atravessar a ilha: de Ciutadella são 45 min pela Me-1. Saia com folga ou pondere dormir a última noite mais perto de Maó.",
    refuel:
      "Abasteça antes de devolver o carro (estações de serviço em Maó e junto à Me-1, não coladas ao aeroporto).",
    breakfastPacking: "Pequeno-almoço com calma e mala",
    breakfastPackingReason: "Sem pressas, mas com margem.",
    shortStroll: "Passeio curto perto da base ou do aeroporto",
    shortStrollReason: "Nada de enseadas a pé nem de Camí de Cavalls no dia da partida.",
  },
  intraday: {
    whatToSee: (joined) => `O que ver e fazer: ${joined}.`,
    breakfast: (town) => `Pequeno-almoço com calma em ${town}`,
    breakfastReason:
      "Comece sem pressa perto do alojamento (leve água e, se houver enseada no programa, chegue cedo).",
    anchorFallbackReason: (name) => `${name}: encaixa no seu perfil e fica no setor do dia.`,
    lunchAt: (name) => `Almoço em ${name}`,
    lunchAtReason: "Produto local, escolhido com critério.",
    lunchInTown: (name) => `Almoçar em ${name}`,
    lunchInTownReason: "Procure uma esplanada tranquila na vila; produto local.",
    lunchLocal: "Almoço com produto local na zona",
    lunchLocalReason: "Pausa de meio-dia; evite conduzir com o sol alto.",
    dinnerStroll: (name) => `Passeie por ${name} e jante lá`,
    dinnerStrollAnchorReason: "Jantar na vila depois da jornada, sem deslocações.",
    dinnerStrollHighlightsReason: (joined) => `A caminho, não perca: ${joined}.`,
    dinnerStrollDefaultReason: "Passeie sem pressa pelo centro histórico e escolha uma esplanada para jantar.",
    dinnerAt: (name) => `Jantar em ${name}`,
    dinnerAtReason: "Um jantar escolhido com critério na zona.",
    dinnerLocal: "Jantar tranquilo na zona",
    dinnerLocalReason: "Feche o dia sem deslocações longas.",
    reservation: (name) => `Reserve ${name} com antecedência.`,
    parkingClosed: (name, shuttle) => `${name}: circulação restrita no verão. ${shuttle}`,
    parkingClosedFallback: "Use o autocarro de ligação ou vá a pé.",
    goEarly: (name) => `Vá cedo a ${name}: o estacionamento enche depressa.`,
    effort: (name, note) => `${name} exige boa forma física: ${note}.`,
    effortFallbackNote: "caminhada ou terreno exigente",
    waterShade: (name) => `Leve água, sombra e calçado confortável para ${name}.`,
    confirmHours: (name) => `Confirme o horário de ${name} no dia da visita.`,
    pace: (pace, dropped) =>
      `Para não sobrecarregar o dia (ritmo ${pace}) deixei de fora: ${dropped}. Pode recuperá-la noutro dia.`,
    closedThatDay: (name, weekday) =>
      `${name} encerra nesse dia (${weekday}): deixámo-lo de fora e escolhemos uma alternativa aberta.`,
  },
  planb: {
    longLunch: "Almoço longo escolhido com critério (âncora do dia)",
    longLunchReason: "Com chuva ou calor, o almoço ocupa o bloco central, das 13h às 15h.",
    indoorReason: (needsReservation) =>
      `Interior ou local coberto na zona${needsReservation ? " (exige reserva)" : ""}.`,
    fewIndoors:
      "Poucos interiores nesta zona para um dia de chuva: pondere o eixo da Me-1 (museus de cidade, queijaria) ou um dia de cidade (Ciutadella/Maó).",
    mondayClosed:
      "É segunda-feira: muitos museus e queijarias encerram. Confirme os horários; abrem a catedral, os mercados, os miradouros e as grutas-miradouro.",
    extremeHeat:
      "Com calor extremo (>34°): enseada muito cedo (antes das 12h) e a partir das 18h; ao meio-dia, à sombra ou de sesta.",
  },
  wind: {
    tramontana: (backup) =>
      `Com Tramontana (vento de norte, o mais frequente em Menorca) esta costa estará agitada. Consulte a previsão nessa manhã${backup ? `; alternativa abrigada no sul: ${backup}` : ""}.`,
    migjorn: (backup) =>
      `O sul costuma estar protegido da Tramontana; mas com vento de Migjorn (de sul) procure o norte${backup ? `: ${backup}` : ""}. Consulte a previsão todas as manhãs.`,
  },
  agenda: {
    inZone: (title, date) =>
      `Coincide com ${title} nesta zona (${date}): reserve alojamento e mesa com antecedência e conte com muita gente.`,
    otherZone: (title, date, zone) =>
      `A ${date} há ${title} (${zone}). Pode reorganizar um dia para a ver, ou apenas tê-la em conta.`,
  },
  engine: {
    rentalCar:
      "Reserve o carro de aluguer com antecedência: no verão a frota esgota-se e os preços disparam.",
    splitBase: (days, base, splitBase) =>
      `Com ${days} dias e interesses em costas opostas, pondere dividir a estadia: metade em ${base}, metade em ${splitBase}.`,
    carless:
      "Sem carro: algumas enseadas de topo exigem autocarro mais transfer, ou uma excursão de barco. Assinalamo-lo em cada dia.",
    accessibilityFilter: (level, efforts) =>
      `Plano filtrado por esforço (${level}): apenas locais de nível ${efforts}. As praias com banho assistido são A1 (Son Bou, Punta Prima, Es Grau).`,
    accessibilityWindow:
      "Os serviços de banho assistido (cadeira anfíbia, pessoal) funcionam de 1 de maio a 31 de outubro. Fora dessas datas, confirme com a câmara municipal.",
    freeDay: "Dia livre: repita a sua enseada preferida ou descanse",
    freeDayReason: "Margem para reorganizar por causa do vento ou do cansaço.",
    busTransferDay: (place: string) =>
      `Sem carro: chegue a ${place} com um transfer porta a porta da Menorca Bus (esta zona não tem autocarro direto cómodo).`,
    budgetShaped: (budget) =>
      budget === "ajustado"
        ? "Com orçamento apertado, o plano apoia-se no que não se paga: enseadas, miradouros e troços do Camí de Cavalls. Em Menorca isso não é contentar-se — é quase tudo o que há de melhor."
        : budget === "alto"
          ? "Com orçamento alto, o plano arrisca no que é preciso reservar: sair para o mar, mesas de autor e bem-estar. Reserve com antecedência na época alta."
          : "O plano mistura o acesso livre com alguma experiência paga; pode subir ou baixar a fasquia mudando o orçamento no questionário.",
    costDisclaimer:
      "Os custos são uma FAIXA indicativa (grátis · € · €€ · €€€), não uma tarifa: confirme o preço do dia no site de cada local.",
  },
  costName: { gratis: "grátis", "€": "económico", "€€": "pago", "€€€": "alto" },
  dayCost: {
    free: "Sem entradas pagas",
    paid: (n) => (n === 1 ? "1 paragem paga" : `${n} paragens pagas`),
  },
};

/** Devuelve el diccionario de textos del idioma pedido (default español). */
export function S(lang: Lang): Strings {
  /* Registro por idioma, NO un ternario: con `lang === "en" ? EN : ES` el alemán
     habría generado TODO el plan en español, sin ningún aviso (KAN-134). */
  return ({ es: ES, en: EN, de: DE, fr: FR, it: IT, pt: PT } as Record<Lang, Strings>)[lang] ?? ES;
}
