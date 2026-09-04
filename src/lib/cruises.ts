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
  /** Fecha real de zarpa cuando el barco PERNOCTA en Maó (duerme en el puerto). */
  departureDate?: string | null;
  confidence: string;
};

/** El barco duerme en Maó: no es una escala de un día, y no se modela como tal. */
export const pernocta = (c: Call): boolean =>
  Boolean(c.departureDate && c.departureDate !== c.date);

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
/** Los seis idiomas del sitio, aquí en local para que el módulo siga siendo PURO. */
type PlanLocale = "es" | "en" | "fr" | "de" | "it" | "pt";

export type Plan = {
  id: string;
  /** minutos de coche en total (ida y vuelta, y los saltos intermedios) */
  cocheMin: number;
  /** minutos en el sitio (o sitios) */
  estanciaMin: number;
  es: string;
  en: string;
  fr: string;
  de: string;
  it: string;
  pt: string;
  /** el detalle que lo hace creíble */
  detalleEs: string;
  detalleEn: string;
  detalleFr: string;
  detalleDe: string;
  detalleIt: string;
  detallePt: string;
};

/**
 * Título y detalle van en DOS registros por idioma, no en catorce argumentos
 * sueltos: con la firma posicional anterior, añadir italiano y portugués
 * significaba contar hasta quince cadenas seguidas, y una fuera de sitio no da
 * error de compilación — solo enseña el idioma equivocado. Con `Record<PlanLocale, string>`
 * el compilador exige las seis y nombra cuál falta.
 */
const plan = (
  id: string,
  cocheMin: number,
  estanciaMin: number,
  titulo: Record<PlanLocale, string>,
  detalle: Record<PlanLocale, string>,
): Plan => ({
  id,
  cocheMin,
  estanciaMin,
  es: titulo.es,
  en: titulo.en,
  fr: titulo.fr,
  de: titulo.de,
  it: titulo.it,
  pt: titulo.pt,
  detalleEs: detalle.es,
  detalleEn: detalle.en,
  detalleFr: detalle.fr,
  detalleDe: detalle.de,
  detalleIt: detalle.it,
  detallePt: detalle.pt,
});

/** De menos a más ambicioso. Todos parten del muelle de Maó. */
export const PLANES: Plan[] = [
  plan(
    "mao-a-pie", 0, 150,
    {
      es: "Maó a pie, sin coche",
      en: "Maó on foot, no car",
      fr: "Maó à pied, sans voiture",
      de: "Mahón zu Fuß, ohne Auto",
      it: "Maó a piedi, senza auto",
      pt: "Maó a pé, sem carro",
    },
    {
      es: "Del muelle se sube a la ciudad de arriba: el mercado del Claustre, las calles georgianas y una copa mirando el puerto. No hace falta coche.",
      en: "From the quay you climb to the upper town: the Claustre market, the Georgian streets and a drink looking over the harbour. No car needed.",
      fr: "Du quai, on monte à la ville haute : le marché du Claustre, les rues géorgiennes et un verre face au port. Pas besoin de voiture.",
      de: "Vom Kai steigt man hinauf in die Oberstadt: der Markt im Claustre, die georgianischen Straßen und ein Glas mit Blick auf den Hafen. Ein Auto braucht es nicht.",
      it: "Dal molo si sale alla città alta: il mercato del Claustre, le vie georgiane e un bicchiere con vista sul porto. L'auto non serve.",
      pt: "Do cais sobe-se à cidade alta: o mercado do Claustre, as ruas georgianas e um copo com vista para o porto. Não é preciso carro.",
    },
  ),
  plan(
    "es-grau", 30, 150,
    {
      es: "Es Grau: playa y albufera",
      en: "Es Grau: beach and lagoon",
      fr: "Es Grau : plage et lagune",
      de: "Es Grau: Strand und Lagune",
      it: "Es Grau: spiaggia e laguna",
      pt: "Es Grau: praia e lagoa",
    },
    {
      es: "Quince minutos en coche y estás en el corazón de la Reserva de Biosfera: arena tranquila, la albufera detrás y las barcas quietas.",
      en: "Fifteen minutes by car and you are in the heart of the Biosphere Reserve: quiet sand, the lagoon behind and the boats still.",
      fr: "Quinze minutes de voiture et vous êtes au cœur de la Réserve de biosphère : du sable tranquille, la lagune derrière et les barques immobiles.",
      de: "Fünfzehn Minuten mit dem Auto und Sie sind im Herzen des Biosphärenreservats: ruhiger Sand, dahinter die Lagune und die stillliegenden Boote.",
      it: "Quindici minuti di auto e si è nel cuore della Riserva della Biosfera: sabbia tranquilla, la laguna alle spalle e le barche immobili.",
      pt: "Quinze minutos de carro e está no coração da Reserva da Biosfera: areia tranquila, a lagoa por trás e os barcos parados.",
    },
  ),
  plan(
    "favaritx", 60, 90,
    {
      es: "El faro de Favàritx",
      en: "Favàritx lighthouse",
      fr: "Le phare de Favàritx",
      de: "Der Leuchtturm von Favàritx",
      it: "Il faro di Favàritx",
      pt: "O farol de Favàritx",
    },
    {
      es: "Pizarra negra, paisaje casi lunar y el faro más cinematográfico de la isla, a media hora del muelle.",
      en: "Black slate, an almost lunar landscape and the island's most cinematic lighthouse, half an hour from the quay.",
      fr: "Ardoise noire, un paysage presque lunaire et le phare le plus cinématographique de l'île, à une demi-heure du quai.",
      de: "Schwarzer Schiefer, eine fast mondähnliche Landschaft und der filmreifste Leuchtturm der Insel, eine halbe Stunde vom Kai entfernt.",
      it: "Ardesia nera, un paesaggio quasi lunare e il faro più cinematografico dell'isola, a mezz'ora dal molo.",
      pt: "Ardósia negra, uma paisagem quase lunar e o farol mais cinematográfico da ilha, a meia hora do cais.",
    },
  ),
  plan(
    "fornells", 40, 180,
    {
      es: "Fornells: la bahía y una caldereta",
      en: "Fornells: the bay and a lobster stew",
      fr: "Fornells : la baie et une caldereta",
      de: "Fornells: die Bucht und eine Caldereta",
      it: "Fornells: la baia e una caldereta",
      pt: "Fornells: a baía e uma caldereta",
    },
    {
      es: "Veinte minutos al norte, un pueblo blanco de pescadores sobre una bahía enorme, y la caldereta de langosta que le dio fama.",
      en: "Twenty minutes north, a white fishing village on a huge bay, and the lobster stew that made it famous.",
      fr: "Vingt minutes vers le nord, un village blanc de pêcheurs au bord d'une immense baie, et la caldereta de langouste qui a fait sa renommée.",
      de: "Zwanzig Minuten nach Norden, ein weißes Fischerdorf an einer riesigen Bucht und die Langusten-Caldereta, die es berühmt gemacht hat.",
      it: "Venti minuti verso nord, un paese bianco di pescatori affacciato su una baia enorme, e la caldereta di aragosta che l'ha resa famosa.",
      pt: "Vinte minutos para norte, uma aldeia branca de pescadores sobre uma baía enorme, e a caldereta de lagosta que lhe deu fama.",
    },
  ),
  plan(
    "cala-galdana", 68, 180,
    {
      es: "Una cala del sur: Cala Galdana",
      en: "A southern cove: Cala Galdana",
      fr: "Une crique du sud : Cala Galdana",
      de: "Eine Bucht im Süden: Cala Galdana",
      it: "Una cala del sud: Cala Galdana",
      pt: "Uma enseada do sul: Cala Galdana",
    },
    {
      es: "Media hora de coche hasta Cala Galdana y, si te apetece andar, media hora a pie más hasta Macarella, que es la postal de la isla.",
      en: "Half an hour to Cala Galdana and, if you fancy the walk, half an hour more on foot to Macarella, the island's postcard.",
      fr: "Une demi-heure de voiture jusqu'à Cala Galdana et, si le cœur vous en dit, une demi-heure de marche de plus jusqu'à Macarella, la carte postale de l'île.",
      de: "Eine halbe Stunde mit dem Auto bis Cala Galdana und, wenn Sie Lust zu laufen haben, eine weitere halbe Stunde zu Fuß bis Macarella, dem Postkartenmotiv der Insel.",
      it: "Mezz'ora di auto fino a Cala Galdana e, se ha voglia di camminare, un'altra mezz'ora a piedi fino a Macarella, la cartolina dell'isola.",
      pt: "Meia hora de carro até Cala Galdana e, se lhe apetecer andar, mais meia hora a pé até Macarella, que é o postal da ilha.",
    },
  ),
  plan(
    "ciutadella", 90, 180,
    {
      es: "Ciutadella, al otro extremo de la isla",
      en: "Ciutadella, at the other end of the island",
      fr: "Ciutadella, à l'autre bout de l'île",
      de: "Ciutadella, am anderen Ende der Insel",
      it: "Ciutadella, all'altro capo dell'isola",
      pt: "Ciutadella, no outro extremo da ilha",
    },
    {
      es: "Cuarenta y cinco minutos por la carretera que cruza Menorca, y otros tantos de vuelta. A cambio: el casco antiguo con más carácter de las Baleares y su puerto encajonado.",
      en: "Forty-five minutes along the road that crosses Menorca, and as many back. In exchange: the old town with the most character in the Balearics and its narrow harbour.",
      fr: "Quarante-cinq minutes par la route qui traverse Minorque, et autant au retour. En échange : la vieille ville la plus attachante des Baléares et son port encaissé.",
      de: "Fünfundvierzig Minuten über die Straße, die Menorca quert, und ebenso lange zurück. Dafür: die Altstadt mit dem meisten Charakter auf den Balearen und ihr eingeschnittener Hafen.",
      it: "Quarantacinque minuti sulla strada che attraversa Minorca, e altrettanti al ritorno. In cambio: il centro storico con più carattere delle Baleari e il suo porto incassato.",
      pt: "Quarenta e cinco minutos pela estrada que atravessa Menorca, e outros tantos de regresso. Em troca: o centro histórico com mais carácter das Baleares e o seu porto encaixado.",
    },
  ),
  plan(
    "ciutadella-y-cala", 106, 240,
    {
      es: "Ciutadella y, de camino, una cala del sur",
      en: "Ciutadella plus a southern cove on the way",
      fr: "Ciutadella et, en chemin, une crique du sud",
      de: "Ciutadella und unterwegs eine Bucht im Süden",
      it: "Ciutadella e, lungo la strada, una cala del sud",
      pt: "Ciutadella e, a caminho, uma enseada do sul",
    },
    {
      es: "El plan completo: cruzar la isla, ver Ciutadella y bajar a una cala del sur antes de volver. Cerca de dos horas de coche en total — solo sale si la escala es larga.",
      en: "The full day: cross the island, see Ciutadella and drop down to a southern cove before heading back. Close to two hours of driving in total — it only works if the call is long.",
      fr: "La journée complète : traverser l'île, voir Ciutadella et descendre vers une crique du sud avant de rentrer. Près de deux heures de route au total — cela ne tient que si l'escale est longue.",
      de: "Der komplette Tag: die Insel queren, Ciutadella ansehen und vor der Rückkehr noch zu einer Bucht im Süden hinunter. Insgesamt knapp zwei Stunden Fahrt — das geht nur bei einem langen Anlauf auf.",
      it: "Il programma completo: attraversare l'isola, vedere Ciutadella e scendere a una cala del sud prima di rientrare. Quasi due ore di auto in totale — regge solo se lo scalo è lungo.",
      pt: "O plano completo: atravessar a ilha, ver Ciutadella e descer a uma enseada do sul antes de regressar. Perto de duas horas de carro no total — só compensa se a escala for longa.",
    },
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
    // Una pernocta NO sirve para calcular el día tipo: restar sus horas daría una escala
    // absurdamente corta (zarpa a las 17:00 del día SIGUIENTE, no del mismo día).
    const conHora = escalas.find((e) => e.arrival && e.departure && !pernocta(e));
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
export const enHoras = (min: number, locale: PlanLocale): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  /* La forma compacta «5 h 30 min» vale en las seis lenguas: es DURACIÓN, no hora
     de reloj (esa sí cambia de formato por mercado y sale del dato del puerto). */
  if (m) return `${h} h ${m} min`;
  /* La palabra suelta sí cambia: "5 horas" / "5 hours" / "5 Stunden" / "5 ore". */
  const palabra: Record<PlanLocale, string> = {
    es: "horas",
    en: "hours",
    fr: "heures",
    de: "Stunden",
    it: "ore",
    pt: "horas",
  };
  return `${h} ${palabra[locale]}`;
};
