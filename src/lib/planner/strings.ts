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

export type Lang = "es" | "en" | "de";

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

/** Devuelve el diccionario de textos del idioma pedido (default español). */
export function S(lang: Lang): Strings {
  /* Registro por idioma, NO un ternario: con `lang === "en" ? EN : ES` el alemán
     habría generado TODO el plan en español, sin ningún aviso (KAN-134). */
  return ({ es: ES, en: EN, de: DE } as Record<Lang, Strings>)[lang] ?? ES;
}
