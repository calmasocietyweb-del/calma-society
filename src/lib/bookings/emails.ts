/**
 * Correos de una solicitud de traslado (KAN-63).
 *
 * POR QUÉ EXISTE. Una solicitud puede llegar completa en el formulario y aun
 * así no bastar para cerrar un PRESUPUESTO: sin el número de vuelo no se sabe a
 * qué hora recoger, sin saber la edad de los niños no se sabe qué silla montar,
 * y sin el equipaje no se sabe si cabe en el vehículo pedido. Antes de contestar
 * "no podemos", se pregunta.
 *
 * DOS REGLAS DE ESTE MÓDULO
 *
 *  1. **Texto plano, nunca HTML.** Es un correo de trabajo entre dos personas,
 *     no una campaña. Se lee igual en cualquier cliente y no parece publicidad.
 *  2. **No dice NADA de dinero.** Ni precios, ni condiciones, ni plazos de
 *     cancelación: esas son condiciones comerciales de Menorca Bus y no se
 *     inventan aquí (ver CLAUDE.md y la nota de alcance del proyecto). Este
 *     correo solo PIDE DATOS.
 *
 * El texto se compone en el idioma en que el cliente rellenó el formulario, y
 * se personaliza con su nombre, su localizador y su trayecto. Quien lo revisa
 * puede editarlo antes de enviarlo: el módulo redacta, no envía.
 */

/**
 * Idiomas del correo. Es el MISMO conjunto que el del formulario: si la reserva
 * se ofrece en un idioma, su correo tiene que llegar en ese idioma. Atarlo a
 * `BookingLocale` obliga al compilador a avisar cuando se despliegue otro.
 */
import type { BookingLocale } from "./catalog";

export type Locale = BookingLocale;

/** Lo mínimo que necesita este módulo de una fila de `bookings`. */
export interface BookingRow {
  ref: string;
  locale: string;
  origin: string;
  destination: string;
  trip_type: string;
  pickup_date: string;
  pickup_time: string;
  return_date?: string | null;
  return_time?: string | null;
  flight_number?: string | null;
  adults: number;
  children: number;
  infants: number;
  vehicle_category: string;
  name: string;
  address: string;
  extras?: Record<string, number> | string | null;
}

/** Los huecos que este módulo sabe detectar. */
export type HuecoId = "vuelo" | "sillas" | "equipaje" | "direccion";

export interface Hueco {
  id: HuecoId;
  /** Por qué hace falta, para que quien revisa entienda la pregunta. */
  motivo: string;
}

const ES_AEROPUERTO = /aeropuerto|airport|\bmah\b|\bmao airport\b/i;
const ES_PUERTO = /\bpuerto\b|\bport\b|muelle|ferry|terminal mar/i;
const SILLAS: readonly string[] = ["silla-nino", "maxicosi", "booster"];

/** `extras` viaja como JSON en D1 y como objeto en memoria: se acepta cualquiera. */
function extrasDe(b: BookingRow): Record<string, number> {
  if (!b.extras) return {};
  if (typeof b.extras === "string") {
    try {
      return JSON.parse(b.extras) as Record<string, number>;
    } catch {
      return {};
    }
  }
  return b.extras;
}

const pasajeros = (b: BookingRow) => b.adults + b.children + b.infants;
const tocaAeropuerto = (b: BookingRow) => ES_AEROPUERTO.test(b.origin) || ES_AEROPUERTO.test(b.destination);
const tocaPuerto = (b: BookingRow) => ES_PUERTO.test(b.origin) || ES_PUERTO.test(b.destination);

/**
 * Qué falta para poder presupuestar. Cada regla responde a una pregunta real
 * del que tiene que poner el precio; ninguna es decorativa.
 */
export function huecosParaPresupuesto(b: BookingRow): Hueco[] {
  const ex = extrasDe(b);
  const huecos: Hueco[] = [];

  // Sin vuelo (o barco) no se puede fijar la hora de recogida ni seguir retrasos.
  if ((tocaAeropuerto(b) || tocaPuerto(b)) && !String(b.flight_number ?? "").trim()) {
    huecos.push({
      id: "vuelo",
      motivo: tocaAeropuerto(b)
        ? "el trayecto pasa por el aeropuerto y no hay número de vuelo: sin él no se puede ajustar la hora ni seguir un retraso"
        : "el trayecto pasa por el puerto y no consta el barco ni la naviera",
    });
  }

  // Niños sin silla declarada: es obligatorio por ley y condiciona el vehículo.
  const sillas = SILLAS.reduce((n, id) => n + (ex[id] ?? 0), 0);
  if (b.children + b.infants > 0 && sillas === 0) {
    huecos.push({
      id: "sillas",
      motivo: `viajan ${b.children + b.infants} menor(es) y no se ha pedido ninguna silla: hace falta saber edades y pesos`,
    });
  }

  // Grupo grande sin equipaje declarado: el maletero decide el vehículo.
  if (pasajeros(b) >= 4 && (ex["maleta-extra"] ?? 0) === 0) {
    huecos.push({
      id: "equipaje",
      motivo: `son ${pasajeros(b)} pasajeros y no consta equipaje: el maletero decide qué vehículo cabe`,
    });
  }

  // Una dirección sin número no la encuentra un conductor.
  const dir = String(b.address ?? "").trim();
  if (!tocaAeropuerto(b) && (dir.length < 8 || !/\d/.test(dir))) {
    huecos.push({
      id: "direccion",
      motivo: "la dirección de recogida no lleva número ni referencia: el conductor necesita un punto exacto",
    });
  }

  return huecos;
}

/** La pregunta concreta que se le hace al cliente, en su idioma. */
const PREGUNTAS: Record<HuecoId, Record<Locale, string>> = {
  vuelo: {
    es: "Número de vuelo o barco de llegada (y compañía). Lo necesitamos para ajustar la hora de recogida y para seguir el vuelo si se retrasa.",
    en: "Your arrival flight or ferry number (and the operator). We need it to set the pick-up time and to track your arrival if it is delayed.",
    fr: "Le numéro de votre vol ou de votre bateau d’arrivée (et la compagnie). Il nous est nécessaire pour ajuster l’heure de prise en charge et suivre votre arrivée en cas de retard.",
    de: "Die Nummer Ihres Ankunftsflugs oder Ihrer Fähre (und die Gesellschaft). Wir benötigen sie, um die Abholzeit anzupassen und Ihre Ankunft bei Verspätung zu verfolgen.",
  },
  sillas: {
    es: "Edad y peso aproximado de cada menor que viaja, para llevar la silla homologada que corresponde.",
    en: "The age and approximate weight of each child travelling, so we bring the correct approved child seat.",
    fr: "L’âge et le poids approximatif de chaque enfant qui voyage, afin d’emporter le siège homologué qui convient.",
    de: "Alter und ungefähres Gewicht jedes mitreisenden Kindes, damit wir den passenden zugelassenen Kindersitz mitbringen.",
  },
  // Ojo con el registro: el correo trata de USTED de principio a fin. Un
  // "lleváis" aquí rompía el tono a media carta.
  equipaje: {
    es: "Cuántas maletas grandes y cuántos bultos de mano llevan, y si hay algo voluminoso (carrito, silla de ruedas, tabla, palos de golf, instrumento).",
    en: "How many large suitcases and cabin bags you are carrying, and whether there is anything bulky (pushchair, wheelchair, board, golf clubs, an instrument).",
    fr: "Combien de grandes valises et de bagages à main vous emportez, et s’il y a un objet encombrant (poussette, fauteuil roulant, planche, clubs de golf, instrument).",
    de: "Wie viele große Koffer und Handgepäckstücke Sie mitführen und ob etwas Sperriges dabei ist (Kinderwagen, Rollstuhl, Board, Golfschläger, ein Instrument).",
  },
  direccion: {
    es: "Dirección exacta de recogida, con número y, si es un hotel o apartamento, su nombre.",
    en: "The exact pick-up address, with street number and, if it is a hotel or apartment, its name.",
    fr: "L’adresse exacte de prise en charge, avec le numéro et, s’il s’agit d’un hôtel ou d’un appartement, son nom.",
    de: "Die genaue Abholadresse mit Hausnummer und, falls es sich um ein Hotel oder eine Wohnung handelt, deren Namen.",
  },
};

const T = {
  es: {
    asunto: (ref: string) => `Su traslado en Menorca — nos faltan unos datos (ref. ${ref})`,
    saludo: (n: string) => `Estimado/a ${n}:`,
    intro:
      "Hemos recibido su solicitud de traslado y le escribimos para pedirle unos datos que nos faltan. En cuanto los tengamos, le enviaremos el presupuesto.",
    resumen: "Su solicitud:",
    pedimos: (n: number) => (n === 1 ? "Nos faltaría este dato:" : "Nos faltarían estos datos:"),
    cierre:
      "Puede responder a este mismo correo. Si algo ha cambiado (fecha, hora o número de pasajeros), indíquenoslo también y lo actualizamos.",
    firma: "Un cordial saludo,",
    ida: "solo ida",
    idaVuelta: "ida y vuelta",
    pax: (a: number, n: number, b: number) => {
      const p = [`${a} adulto${a === 1 ? "" : "s"}`];
      if (n) p.push(`${n} niño${n === 1 ? "" : "s"}`);
      if (b) p.push(`${b} bebé${b === 1 ? "" : "s"}`);
      return p.join(", ");
    },
    lVuelta: "Vuelta",
    lTrayecto: "Trayecto",
    lFecha: "Fecha",
    lPasajeros: "Pasajeros",
    lRef: "Referencia",
  },
  en: {
    asunto: (ref: string) => `Your transfer in Menorca — a few details missing (ref. ${ref})`,
    saludo: (n: string) => `Dear ${n},`,
    intro:
      "We have received your transfer request and are writing to ask for a few details we are missing. As soon as we have them, we will send you the quote.",
    resumen: "Your request:",
    pedimos: (n: number) => (n === 1 ? "We would need this detail:" : "We would need these details:"),
    cierre:
      "You can simply reply to this email. If anything has changed (date, time or number of passengers), please tell us and we will update it.",
    firma: "Kind regards,",
    ida: "one way",
    idaVuelta: "return",
    pax: (a: number, n: number, b: number) => {
      const p = [`${a} adult${a === 1 ? "" : "s"}`];
      if (n) p.push(`${n} child${n === 1 ? "" : "ren"}`);
      if (b) p.push(`${b} infant${b === 1 ? "" : "s"}`);
      return p.join(", ");
    },
    lVuelta: "Return",
    lTrayecto: "Route",
    lFecha: "Date",
    lPasajeros: "Passengers",
    lRef: "Reference",
  },
  fr: {
    asunto: (ref: string) => `Votre transfert à Minorque — il nous manque quelques informations (réf. ${ref})`,
    saludo: (n: string) => `Cher/Chère ${n},`,
    intro:
      "Nous avons bien reçu votre demande de transfert et nous vous écrivons pour vous demander quelques informations qui nous manquent. Dès que nous les aurons, nous vous enverrons le devis.",
    resumen: "Votre demande :",
    pedimos: (n: number) => (n === 1 ? "Il nous manquerait cette information :" : "Il nous manquerait ces informations :"),
    cierre:
      "Vous pouvez répondre directement à ce courriel. Si quelque chose a changé (date, heure ou nombre de passagers), indiquez-le-nous et nous le mettrons à jour.",
    firma: "Cordialement,",
    ida: "aller simple",
    idaVuelta: "aller-retour",
    pax: (a: number, n: number, b: number) => {
      const p = [`${a} adulte${a === 1 ? "" : "s"}`];
      if (n) p.push(`${n} enfant${n === 1 ? "" : "s"}`);
      if (b) p.push(`${b} bébé${b === 1 ? "" : "s"}`);
      return p.join(", ");
    },
    lVuelta: "Retour",
    lTrayecto: "Trajet",
    lFecha: "Date",
    lPasajeros: "Passagers",
    lRef: "Référence",
  },
  de: {
    asunto: (ref: string) => `Ihr Transfer auf Menorca — uns fehlen noch einige Angaben (Ref. ${ref})`,
    saludo: (n: string) => `Sehr geehrte/r ${n},`,
    intro:
      "Wir haben Ihre Transferanfrage erhalten und schreiben Ihnen, um einige noch fehlende Angaben zu erfragen. Sobald wir sie haben, senden wir Ihnen das Angebot.",
    resumen: "Ihre Anfrage:",
    pedimos: (n: number) => (n === 1 ? "Uns fehlt noch diese Angabe:" : "Uns fehlen noch diese Angaben:"),
    cierre:
      "Sie können einfach auf diese E-Mail antworten. Falls sich etwas geändert hat (Datum, Uhrzeit oder Anzahl der Fahrgäste), teilen Sie es uns mit und wir aktualisieren es.",
    firma: "Mit freundlichen Grüßen,",
    ida: "einfache Fahrt",
    idaVuelta: "Hin- und Rückfahrt",
    pax: (a: number, n: number, b: number) => {
      const p = [`${a} Erwachsene${a === 1 ? "r" : ""}`];
      if (n) p.push(`${n} Kind${n === 1 ? "" : "er"}`);
      if (b) p.push(`${b} Kleinkind${b === 1 ? "" : "er"}`);
      return p.join(", ");
    },
    lVuelta: "Rückfahrt",
    lTrayecto: "Strecke",
    lFecha: "Datum",
    lPasajeros: "Fahrgäste",
    lRef: "Referenz",
  },
} as const;

/** Solo el nombre de pila: un correo formal pero no acartonado. */
function nombreDePila(nombre: string): string {
  const n = String(nombre ?? "").trim().split(/\s+/)[0] ?? "";
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
}

export interface CorreoCompuesto {
  asunto: string;
  cuerpo: string;
  para: string;
  huecos: Hueco[];
}

/**
 * Redacta la petición de datos. Texto plano y personalizado: el nombre, el
 * localizador y el trayecto de esa persona, y SOLO las preguntas que le faltan
 * a esa solicitud. Nunca habla de precios ni de condiciones.
 *
 * `remitente` es la firma que va al pie (p. ej. "Calma Society").
 */
export function componerPeticionDeInfo(
  b: BookingRow,
  para: string,
  remitente: string,
): CorreoCompuesto {
  // Antes esto era `b.locale === "en" ? "en" : "es"`: una reserva en francés o
  // en alemán recibía su correo EN ESPAÑOL sin que nada avisara. Ahora se busca
  // en la tabla y solo se cae al español si el idioma no existe de verdad.
  const locale: Locale = (b.locale in T ? b.locale : "es") as Locale;
  const t = T[locale];
  const huecos = huecosParaPresupuesto(b);

  const lineas: string[] = [];
  lineas.push(t.saludo(nombreDePila(b.name) || b.name));
  lineas.push("");
  lineas.push(t.intro);
  lineas.push("");
  lineas.push(t.resumen);
  lineas.push(`  ${t.lRef}: ${b.ref}`);
  lineas.push(`  ${t.lTrayecto}: ${b.origin} - ${b.destination} (${b.trip_type === "ida-vuelta" ? t.idaVuelta : t.ida})`);
  lineas.push(`  ${t.lFecha}: ${b.pickup_date} ${b.pickup_time}`);
  if (b.trip_type === "ida-vuelta" && b.return_date) {
    lineas.push(`  ${t.lVuelta}: ${b.return_date} ${b.return_time ?? ""}`.trimEnd());
  }
  lineas.push(`  ${t.lPasajeros}: ${t.pax(b.adults, b.children, b.infants)}`);
  lineas.push("");
  lineas.push(t.pedimos(huecos.length));
  lineas.push("");
  huecos.forEach((h, i) => {
    lineas.push(`  ${i + 1}. ${PREGUNTAS[h.id][locale]}`);
  });
  lineas.push("");
  lineas.push(t.cierre);
  lineas.push("");
  lineas.push(t.firma);
  lineas.push(remitente);

  return { asunto: t.asunto(b.ref), cuerpo: lineas.join("\n"), para, huecos };
}

/**
 * Enlace `mailto:` con el correo ya escrito. Se abre en el cliente de correo de
 * quien revisa, que lo lee, lo ajusta si quiere y lo envía él. No se manda nada
 * a espaldas de nadie, y al ser `mailto:` el cuerpo es texto plano por
 * definición: no hay forma de que se cuele HTML.
 */
export function mailtoHref(c: CorreoCompuesto): string {
  const q = `subject=${encodeURIComponent(c.asunto)}&body=${encodeURIComponent(c.cuerpo)}`;
  return `mailto:${encodeURIComponent(c.para)}?${q}`;
}
