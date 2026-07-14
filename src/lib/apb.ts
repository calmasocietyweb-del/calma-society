/**
 * EL REGISTRO DE ATRAQUES DEL PUERTO (Autoridad Portuaria de Baleares).
 *
 * La APB publica un feed abierto con los atraques reales de todos sus puertos: muelle,
 * consignatario, número de escala y HORAS. Es la fuente oficial — la misma que usan los
 * consignatarios — y durante meses dimos por hecho que no existía.
 *
 * Sirve para lo que ningún agregador hace bien: decir la verdad sobre las próximas
 * semanas. Los agregadores internacionales beben unos de otros (coincidir entre ellos no
 * es confirmar) y se dejan escalas enteras: el Marella Explorer, 1.924 pasajeros, no
 * estaba en ninguno de los tres y sí en este registro.
 *
 * LÍMITE HONESTO: el feed solo ve unas semanas por delante. Confirma lo inminente; no
 * rellena la temporada. Para eso hacen falta los consignatarios.
 *
 * Módulo PURO (sin red, sin ficheros): de este diff depende que no se publique una hora
 * de atraque falsa. Quien lo use le pasa el feed ya descargado.
 */

/** Un registro del feed, tal cual lo publica el puerto. */
export type RegistroAPB = {
  codpue: string; // puerto: "M" = Maó
  destipbuq: string; // "CRUCEROS TURISTICOS", "FERRYS CARGA/PASAJE"…
  nombuq: string; // nombre del barco, en mayúsculas
  gt: number; // arqueo bruto (tamaño)
  eslora: number;
  fecatr: string; // "dd/mm/aaaa hh:mm"
  fecsal: string;
  desmue?: string;
  nomcsg?: string; // consignatario
  escala?: string;
  estatr?: string;
};

/** Una escala del puerto, ya normalizada a nuestro modelo. */
export type EscalaAPB = {
  date: string;
  ship: string;
  arrival: string | null;
  departure: string | null;
  /** Fecha de zarpa si el barco PERNOCTA (zarpa otro día). */
  departureDate: string | null;
  eslora: number;
  muelle?: string;
  consignatario?: string;
  escala?: string;
};

/** Escala nuestra, tal como vive en el calendario. */
type EscalaNuestra = {
  date: string;
  ship: string;
  arrival: string | null;
  departure: string | null;
  departureDate?: string | null;
  confidence: string;
  [k: string]: unknown;
};

/** Código del puerto de Maó en el feed de la APB. */
const PUERTO_MAO = "M";

/**
 * Un crucero de verdad no baja de las 1.000 toneladas. El tipo "CRUCEROS TURISTICOS" del
 * puerto también engloba barcos de paseo locales, y esos no traen a nadie a la isla.
 * El umbral deja dentro a los boutique de lujo —el SeaDream I, de 112 pasajeros, son
 * 4.333 toneladas—, que son justamente nuestro lector.
 */
const GT_MINIMO = 1000;

/** "20/07/2026 09:00" → { date: "2026-07-20", time: "09:00" } */
function partirFecha(f: string | undefined): { date: string | null; time: string | null } {
  if (!f) return { date: null, time: null };
  const m = f.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}))?/);
  if (!m) return { date: null, time: null };
  return { date: `${m[3]}-${m[2]}-${m[1]}`, time: m[4] ?? null };
}

/** El puerto escribe "AIDASTELLA" y nosotros "AIDAstella": es el mismo barco. */
export function mismoBarco(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  return norm(a) === norm(b);
}

/** Del feed de toda Baleares, las escalas de crucero de Maó. */
export function escalasDeMao(feed: RegistroAPB[]): EscalaAPB[] {
  const out: EscalaAPB[] = [];
  for (const r of feed) {
    if (r.codpue !== PUERTO_MAO) continue;
    if (r.destipbuq !== "CRUCEROS TURISTICOS") continue;
    if (!(r.gt >= GT_MINIMO)) continue;

    const atr = partirFecha(r.fecatr);
    const sal = partirFecha(r.fecsal);
    if (!atr.date) continue;

    out.push({
      date: atr.date,
      ship: r.nombuq.trim(),
      arrival: atr.time,
      departure: sal.time,
      // Si zarpa otro día, el barco duerme en el puerto.
      departureDate: sal.date && sal.date !== atr.date ? sal.date : null,
      eslora: r.eslora,
      muelle: r.desmue,
      consignatario: r.nomcsg,
      escala: r.escala,
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export type Correccion = {
  date: string;
  ship: string;
  campo: "arrival" | "departure" | "departureDate";
  antes: string | null | undefined;
  ahora: string | null;
};

/**
 * Hasta dónde alcanza a ver el puerto EN CRUCEROS. Y solo eso.
 *
 * Ojo, que aquí es fácil equivocarse: el feed llega más lejos en ferries que en cruceros
 * (los ferries tienen horario regular y se cargan con meses de antelación; los cruceros,
 * no). Si se toma la ventana del feed entero, todas nuestras escalas de crucero del mes
 * siguiente parecen "canceladas" cuando lo único que pasa es que el puerto aún no las
 * tiene. Serían falsas alarmas cada día — y una alarma que siempre suena deja de mirarse.
 *
 * Se ignora el pasado: el puerto publica ahí la hora REAL ejecutada, y reescribir el
 * histórico con ella no le sirve a nadie que vaya a coger un barco.
 */
export function ventanaDeCruceros(
  puerto: EscalaAPB[],
  hoy: string,
): { desde: string | null; hasta: string | null } {
  const futuras = puerto.map((e) => e.date).filter((d) => d >= hoy).sort();
  return { desde: hoy, hasta: futuras[futuras.length - 1] ?? null };
}

export type Diff = {
  /** Horas que el puerto desmiente. Se corrigen SOLAS: es dato oficial y objetivo. */
  correcciones: Correccion[];
  /** Escalas nuestras que el puerto avala (suben a fiabilidad "alta"). */
  confirmadas: EscalaNuestra[];
  /** El puerto las tiene y nosotros no. NO se publican solas: piden pasaje y naviera. */
  nuevas: EscalaAPB[];
  /** Las tenemos, el puerto no, y caen DENTRO de su ventana. ¿Canceladas? Se avisa. */
  desaparecidas: EscalaNuestra[];
  /** Días con dos cruceros: uno puede tener que fondear (se desembarca en lancha). */
  dobles: { date: string; barcos: { ship: string; eslora: number }[] }[];
};

/**
 * Compara el registro del puerto con nuestro calendario.
 *
 * La ventana importa: el feed solo ve unas semanas. Fuera de ella, que el puerto no tenga
 * una escala NO significa que no exista — significa que aún no la sabe. Avisar de eso
 * sería una falsa alarma cada día, y una alarma que siempre suena deja de mirarse.
 */
export function diffCalendario(
  puerto: EscalaAPB[],
  calendario: EscalaNuestra[],
  ventana: { desde: string | null; hasta: string | null },
): Diff {
  const correcciones: Correccion[] = [];
  const confirmadas: EscalaNuestra[] = [];
  const nuevas: EscalaAPB[] = [];
  const desaparecidas: EscalaNuestra[] = [];
  const { desde, hasta } = ventana;

  // El pasado no se toca: ahí el puerto da la hora REAL ejecutada (un barco que atracó a
  // las 08:50 en vez de las 09:00 previstas). Corregirla no ayuda a nadie que vaya a coger
  // un barco, y ensucia el calendario con cambios que no significan nada.
  const enVentana = (d: string) => (!desde || d >= desde) && (!hasta || d <= hasta);
  puerto = puerto.filter((p) => enVentana(p.date));

  for (const p of puerto) {
    const mia = calendario.find((c) => c.date === p.date && mismoBarco(p.ship, c.ship));
    if (!mia) {
      nuevas.push(p);
      continue;
    }
    let tocada = false;
    const campos: Correccion["campo"][] = ["arrival", "departure", "departureDate"];
    for (const campo of campos) {
      const ahora = p[campo];
      const antes = mia[campo] as string | null | undefined;
      // El puerto no siempre trae la hora; si no la trae, no borra la que ya teníamos.
      if (ahora == null) continue;
      if ((antes ?? null) !== ahora) {
        correcciones.push({ date: p.date, ship: mia.ship, campo, antes, ahora });
        tocada = true;
      }
    }
    if (!tocada) confirmadas.push(mia);
  }

  if (desde && hasta) {
    for (const c of calendario) {
      if (!enVentana(c.date)) continue; // fuera de la ventana: el puerto aún no lo sabe
      const enPuerto = puerto.some((p) => p.date === c.date && mismoBarco(p.ship, c.ship));
      if (!enPuerto) desaparecidas.push(c);
    }
  }

  // Días con más de un crucero: en Maó el muelle de cruceros es uno.
  const porDia = new Map<string, { ship: string; eslora: number }[]>();
  for (const p of puerto) {
    if (!porDia.has(p.date)) porDia.set(p.date, []);
    porDia.get(p.date)!.push({ ship: p.ship, eslora: p.eslora });
  }
  const dobles = [...porDia.entries()]
    .filter(([, barcos]) => barcos.length > 1)
    .map(([date, barcos]) => ({ date, barcos }));

  return { correcciones, confirmadas, nuevas, desaparecidas, dobles };
}
