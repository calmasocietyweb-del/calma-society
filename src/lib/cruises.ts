/**
 * ESCALAS DE CRUCERO EN MAÓ — el tiempo que de verdad tienes en tierra.
 *
 * El crucerista baja del barco a una hora y TIENE que estar de vuelta a otra. Si
 * pierde el barco, lo pierde de verdad. Su única pregunta es «¿qué me da tiempo a
 * hacer?», y nadie se la responde con números.
 *
 * Aquí se responde, cruzando dos datos que ya tenemos:
 *   · la hora real de atraque y zarpa de cada barco (src/data/cruceros-menorca-2026.json)
 *   · los tiempos de coche reales desde Maó (src/data/travelTimes.ts)
 *
 * Módulo PURO (sin Astro, sin importar el JSON) para poder probarlo con node:test: de
 * este cálculo depende que alguien no se quede en tierra. Quien lo use le pasa las
 * escalas; el JSON se carga fuera (igual que `sun-core.ts`).
 */
export type Call = {
  date: string;
  ship: string;
  line: string;
  pax: number | null;
  arrival: string | null;
  departure: string | null;
  confidence: string;
};

/** Lo que se descuenta de la escala para saber el tiempo REAL en tierra. */
export const DESEMBARQUE_MIN = 30; // bajar del barco, pasar el control, salir del muelle
export const MARGEN_VUELTA_MIN = 60; // el "all aboard" suele ser 30-60 min antes de zarpar: tomamos el peor caso

/**
 * PLANES, no destinos sueltos. La pregunta del crucerista no es «¿llego a Ciutadella?»
 * —a casi todo se llega— sino «¿qué plan me cabe entero, sin mirar el reloj?». Con
 * 5 h 30 útiles cabe UNA cosa lejos; encadenar dos, no. Eso es lo que hay que decirle.
 *
 * Los minutos de coche salen de `src/data/travelTimes.ts` (verificados, ida y vuelta
 * desde el puerto de Maó). La estancia es lo mínimo para que el viaje merezca la pena:
 * ir a una cala para estar 20 minutos no es un plan, es una carrera.
 */
export type Plan = {
  id: string;
  /** minutos de coche en total (ida y vuelta, y los saltos intermedios) */
  cocheMin: number;
  /** minutos en el sitio (o sitios) */
  estanciaMin: number;
  es: string;
  en: string;
  /** el detalle que lo hace creíble */
  detalleEs: string;
  detalleEn: string;
};

const plan = (
  id: string,
  cocheMin: number,
  estanciaMin: number,
  es: string,
  en: string,
  detalleEs: string,
  detalleEn: string,
): Plan => ({ id, cocheMin, estanciaMin, es, en, detalleEs, detalleEn });

/** De menos a más ambicioso. Todos parten del muelle de Maó. */
export const PLANES: Plan[] = [
  plan(
    "mao-a-pie", 0, 150,
    "Maó a pie, sin coche",
    "Maó on foot, no car",
    "Del muelle se sube a la ciudad de arriba: el mercado del Claustre, las calles georgianas y una copa mirando el puerto. No hace falta coche.",
    "From the quay you climb to the upper town: the Claustre market, the Georgian streets and a drink looking over the harbour. No car needed.",
  ),
  plan(
    "es-grau", 30, 150,
    "Es Grau: playa y albufera",
    "Es Grau: beach and lagoon",
    "Quince minutos en coche y estás en el corazón de la Reserva de Biosfera: arena tranquila, la albufera detrás y las barcas quietas.",
    "Fifteen minutes by car and you are in the heart of the Biosphere Reserve: quiet sand, the lagoon behind and the boats still.",
  ),
  plan(
    "favaritx", 60, 90,
    "El faro de Favàritx",
    "Favàritx lighthouse",
    "Pizarra negra, paisaje casi lunar y el faro más cinematográfico de la isla, a media hora del muelle.",
    "Black slate, an almost lunar landscape and the island's most cinematic lighthouse, half an hour from the quay.",
  ),
  plan(
    "fornells", 40, 180,
    "Fornells: la bahía y una caldereta",
    "Fornells: the bay and a lobster stew",
    "Veinte minutos al norte, un pueblo blanco de pescadores sobre una bahía enorme, y la caldereta de langosta que le dio fama.",
    "Twenty minutes north, a white fishing village on a huge bay, and the lobster stew that made it famous.",
  ),
  plan(
    "cala-galdana", 68, 180,
    "Una cala del sur: Cala Galdana",
    "A southern cove: Cala Galdana",
    "Media hora de coche hasta Cala Galdana y, si te apetece andar, media hora a pie más hasta Macarella, que es la postal de la isla.",
    "Half an hour to Cala Galdana and, if you fancy the walk, half an hour more on foot to Macarella, the island's postcard.",
  ),
  plan(
    "ciutadella", 90, 180,
    "Ciutadella, al otro extremo de la isla",
    "Ciutadella, at the other end of the island",
    "Cuarenta y cinco minutos por la carretera que cruza Menorca, y otros tantos de vuelta. A cambio: el casco antiguo con más carácter de las Baleares y su puerto encajonado.",
    "Forty-five minutes along the road that crosses Menorca, and as many back. In exchange: the old town with the most character in the Balearics and its narrow harbour.",
  ),
  plan(
    "ciutadella-y-cala", 106, 240,
    "Ciutadella y, de camino, una cala del sur",
    "Ciutadella plus a southern cove on the way",
    "El plan completo: cruzar la isla, ver Ciutadella y bajar a una cala del sur antes de volver. Cerca de dos horas de coche en total — solo sale si la escala es larga.",
    "The full day: cross the island, see Ciutadella and drop down to a southern cove before heading back. Close to two hours of driving in total — it only works if the call is long.",
  ),
];

/** Un plan cabe si su coche y su estancia entran en el tiempo útil. */
export const cabe = (p: Plan, utilesMin: number): boolean => p.cocheMin + p.estanciaMin <= utilesMin;

export type Barco = {
  slug: string;
  ship: string;
  line: string;
  pax: number | null;
  arrival: string;
  departure: string;
  /** duración de la escala, en minutos */
  escalaMin: number;
  /** lo que de verdad queda para ti, descontando desembarque y margen de vuelta */
  utilesMin: number;
  /** todas sus fechas de escala este año */
  fechas: string[];
  /** planes que caben enteros, del más ambicioso al más tranquilo */
  caben: Plan[];
  /** planes que NO caben — decirlo vale más que veinte adjetivos */
  noCaben: Plan[];
  /** zarpa lo bastante tarde como para ver la puesta de sol en tierra (verano) */
  llegaAlAtardecer: boolean;
  /** zarpa tan tarde que da para cenar en tierra */
  daParaCenar: boolean;
  /**
   * Bajan más de 1.500 personas de golpe: el muelle se hace cola y los taxis del
   * puerto se agotan en la primera media hora. No es un adjetivo, es logística — y
   * es la diferencia entre empezar el día a las 9:15 o a las 10:30.
   */
  desembarcoMasivo: boolean;
  /** Zarpa a media tarde o antes: la escala es solo de mañana, se come a bordo. */
  soloManana: boolean;
};

/** Lo que sobra tras hacer el plan. Menos de una hora de margen es ir con el reloj. */
export const margenDe = (p: Plan, utilesMin: number): number =>
  utilesMin - (p.cocheMin + p.estanciaMin);
export const vaJusto = (p: Plan, utilesMin: number): boolean => margenDe(p, utilesMin) < 60;

export const hhmmAMin = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const slugBarco = (ship: string): string =>
  ship
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Los barcos que merecen página: los que REPITEN (2+ escalas) y tienen horas
 * verificadas. Sin horas no hay cálculo, y sin cálculo la página no aporta nada:
 * sería relleno. Se quedan fuera hasta que se consigan sus horarios.
 */
export function barcosConPagina(calls: Call[]): Barco[] {
  const porBarco = new Map<string, Call[]>();
  for (const c of calls) {
    if (!porBarco.has(c.ship)) porBarco.set(c.ship, []);
    porBarco.get(c.ship)!.push(c);
  }

  const barcos: Barco[] = [];
  for (const [ship, escalas] of porBarco) {
    if (escalas.length < 2) continue; // un barco que viene un día suelto no sostiene una página
    const conHora = escalas.find((e) => e.arrival && e.departure);
    if (!conHora) continue; // sin horas no hay nada útil que contar

    const arrival = conHora.arrival!;
    const departure = conHora.departure!;
    const escalaMin = hhmmAMin(departure) - hhmmAMin(arrival);
    if (escalaMin <= 0) continue; // escala que cruza la medianoche: no se modela (aún)

    const utilesMin = Math.max(0, escalaMin - DESEMBARQUE_MIN - MARGEN_VUELTA_MIN);
    const zarpa = hhmmAMin(departure);

    barcos.push({
      slug: slugBarco(ship),
      ship,
      line: conHora.line,
      pax: conHora.pax,
      arrival,
      departure,
      escalaMin,
      utilesMin,
      fechas: escalas.map((e) => e.date).sort(),
      // Primero lo más ambicioso que cabe entero; al final, el plan tranquilo.
      caben: PLANES.filter((p) => cabe(p, utilesMin)).sort(
        (a, b) => b.cocheMin + b.estanciaMin - (a.cocheMin + a.estanciaMin),
      ),
      noCaben: PLANES.filter((p) => !cabe(p, utilesMin)).sort(
        (a, b) => a.cocheMin + a.estanciaMin - (b.cocheMin + b.estanciaMin),
      ),
      // En Menorca el sol se pone entre las 20:15 y las 21:20 de mayo a agosto: si el
      // barco zarpa a las 21:00 o más tarde, la puesta de sol en tierra es posible.
      llegaAlAtardecer: zarpa >= 21 * 60,
      daParaCenar: zarpa >= 22 * 60,
      desembarcoMasivo: (conHora.pax ?? 0) >= 1500,
      soloManana: zarpa <= 15 * 60,
    });
  }

  return barcos.sort((a, b) => b.fechas.length - a.fechas.length);
}

/** Cuánto tiempo útil, en «5 h 30» y no en minutos sueltos. */
export const enHoras = (min: number, locale: "es" | "en"): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (locale === "es") return m ? `${h} h ${m} min` : `${h} horas`;
  return m ? `${h} h ${m} min` : `${h} hours`;
};
