/**
 * Tipos del dominio del Planificador de viajes (motor de reglas determinista).
 * docs/PLANIFICADOR-BLUEPRINT.md
 *
 * Estos union types ESPEJAN los enums de `planner` en src/content.config.ts.
 * Mantener ambos en sync (un cambio aquí debe reflejarse allí y viceversa).
 *
 * El motor es una función PURA: (Survey, Dataset) → Plan. Sin IO, sin azar
 * (la "semilla" es la propia encuesta), para que el mismo input dé el mismo
 * plan compartible por querystring.
 */

// ── Vocabulario geográfico / clustering ──────────────────────────────────────
export type PlannerZone =
  | "este"
  | "sur-este"
  | "sur-centro"
  | "sur-oeste"
  | "oeste"
  | "norte"
  | "centro"
  | "eje-me1";

export type PlannerType =
  | "cala"
  | "playa"
  | "pueblo"
  | "faro"
  | "yacimiento"
  | "mirador"
  | "atardecer"
  | "desayuno"
  | "comida"
  | "cena"
  | "actividad-acuatica"
  | "excursion"
  | "interior-cultural";

export type IdealFor =
  | "primera-vez"
  | "parejas"
  | "familias"
  | "ninos-pequenos"
  | "lujo-tranquilo"
  | "nautica"
  | "cultura"
  | "gastronomia"
  | "vida-nocturna"
  | "naturaleza";

export type CarAccess =
  | "coche-directo"
  | "coche-mas-caminata"
  | "solo-bus-lanzadera"
  | "sin-coche-ok";

/** Escala de esfuerzo/accesibilidad: A1 accesible-asistido … D duro. */
export type EffortLevel = "A1" | "A2" | "B" | "C" | "D";

export type WeatherProof = "cubierto" | "semicubierto" | "exterior";

export type Certainty = "alta" | "media" | "baja";

/**
 * Banda de coste ORIENTATIVA de un plan. Es una banda, nunca un precio: una
 * tarifa concreta envejece en una temporada y publicarla sin verificar es el
 * fallo que este proyecto ya ha pagado. La asigna `scripts/planner-cost-map.mjs`
 * (regla estructural sobre datos verificados + tabla curada a mano).
 */
export type CostBand = "gratis" | "€" | "€€" | "€€€";
/** Orden de las bandas, de menor a mayor. */
export const COST_ORDER: readonly CostBand[] = ["gratis", "€", "€€", "€€€"];

// ── Lugar (vista que consume el motor) ───────────────────────────────────────
// Subconjunto máquina-legible de una ficha `lugares`. El dataset compilado
// (planner-data.json, por idioma) es un array de estos. Las descripciones
// largas NO van aquí: se cargan al enlazar a /lugar/<slug>.
export interface PlannerPlace {
  /** translationKey: une las versiones de idioma; identidad estable del lugar. */
  id: string;
  name: string;
  /** Slug REAL de la página /lugar/<slug> — solo si la ficha está `published`
   * (las draft no generan página: sin slug no se enlaza). */
  slug?: string;
  coordinates: { lat: number; lng: number };

  zone: PlannerZone;
  cluster: string;
  plannerType: PlannerType;
  idealFor: IdealFor[];
  /**
   * Foto del lugar (ruta en /uploads, variante ligera). Cascada HONESTA en el
   * build: imagen de la ficha → tabla curada a mano → sin foto. Nunca una foto
   * de otro sitio fingiendo ser este (credibilidad, principio §3.8).
   */
  image?: string;
  /** Atribución de la foto cuando la licencia la exige (Wikimedia CC BY/BY-SA). */
  imageCredit?: string;
  /** Qué ver y hacer en el lugar (frases cortas accionables). */
  highlights?: string[];
  /** Descripción corta (fallback de "qué ver" cuando no hay highlights). */
  blurb?: string;
  durationMin?: number;

  carAccess: CarAccess;
  busServed: boolean;
  carAccessClosedSummer: boolean;
  shuttleInfo?: string;

  effortLevel: EffortLevel;
  effortNote?: string;
  accessibleService?: AccessibleService;

  isIndoor: boolean;
  weatherProof?: WeatherProof;
  indoorAlternativeOf: string[];

  openDays?: Weekday[];
  seasonalHours?: string;
  needsReservation: boolean;
  officialUrl?: string;
  /** Operador que hace la salida cuando la ficha es una experiencia, no un
   *  negocio (ver `operatorName` en content.config.ts). Cambia la etiqueta del
   *  enlace: "Reservar con X" en vez de "Web oficial". */
  operatorName?: string;

  dataCertainty: Certainty;
  lastVerified?: string;

  /** Cuánto cuesta hacer este plan, en banda (nunca en euros). */
  costBand?: CostBand;
  /** "alta" = hecho estructural (una cala pública es gratis); "media" = criterio editorial. */
  costCertainty?: Certainty;
}

export type Weekday = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export interface AccessibleService {
  amphibiousChair: boolean;
  adaptedToilet: boolean;
  reservedParking: boolean;
  staff: boolean;
  seasonWindow: { from: string; to: string };
  certainty: Certainty;
}

// ── Zonas base (alojamiento) — PASO 0 ────────────────────────────────────────
// El motor recomienda ZONA, nunca hoteles concretos (HUECO 4 del blueprint).
export type BaseZone =
  | "ciutadella"
  | "mao"
  | "cala-galdana"
  | "son-bou"
  | "es-mercadal"
  | "fornells";

// ── Guía de comida verificada por zona (enriquece la prosa del plan) ─────────
// Datos curados/verificados (moat: sin inventar), compilados aparte del dataset
// del motor en src/data/planner-food.{es,en}.json. El motor los teje en los
// huecos de comida (desayuno/comida/cena) y en los días de llegada/salida.
export interface ZoneFood {
  whatToEat: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  signature: { title: string; desc: string; idealFor: string[] } | null;
}
export interface BaseFood {
  arrivalDinner: string;
  arrivalPaseo: string;
  departureCafe: string;
  departurePaseo: string;
  /** Opciones de desayuno verificadas de la zona base, para ROTAR por día (variedad). */
  breakfasts?: string[];
}
export interface FoodByZone {
  zones: Partial<Record<PlannerZone, ZoneFood>>;
  bases: Partial<Record<BaseZone, BaseFood>>;
}

// ── Salida del motor ─────────────────────────────────────────────────────────
/** Recambio para un hueco del día: mismo momento, otro lugar igual de afín. */
export interface Swap {
  placeId: string;
  name: string;
  /** Por qué también encaja aquí (una frase corta, no una ficha). */
  note?: string;
  /** Coste orientativo: cambiar de parada puede cambiar lo que cuesta el día. */
  costBand?: CostBand;
}

/** Un bloque de la línea de tiempo intradía (llegada/desayuno → cena). */
export interface IntradayBlock {
  slot: "llegada" | "desayuno" | "manana" | "comida" | "tarde" | "atardecer" | "cena";
  /** Hora orientativa "HH:MM" (nunca presentada como inmutable). */
  timeHint?: string;
  placeId?: string;
  placeName: string;
  durationMin?: number;
  /** Razón trazable (PASO 9): alimenta el "por qué" visible (E-E-A-T + GEO). */
  reason?: string;
  /**
   * Recambios para este hueco: lugares del mismo ramal y afinidad comparable.
   * El plan deja de ser una respuesta cerrada y pasa a ser una propuesta con
   * salidas — que es como decide de verdad quien viaja.
   */
  alternatives?: Swap[];
  /** Coste orientativo de esta parada. */
  costBand?: CostBand;
}

/** Aviso contextual (chip): reserva, madrugar, agua/sombra, confirmar horario… */
export interface Notice {
  kind:
    | "reserva"
    | "madrugar"
    | "agua-sombra"
    | "parking"
    | "confirma-horario"
    | "esfuerzo"
    | "viento"
    | "accesibilidad"
    | "fiesta"
    | "transfer"
    | "logistica"
    | "coste";
  text: string;
  placeId?: string;
}

/** Enganche de monetización a Menorca Bus (negocio propio). */
export interface MenorcaBusHook {
  type: "transfer-aeropuerto" | "excursion-cala" | "excursion-lluvia" | "transfer-adaptado";
  context: string;
  dayIndex: number;
}

/** Tarjeta de un día del itinerario (DayCard). */
export interface DayCard {
  dayIndex: number;
  dayTypeKey: string;
  label: string;
  /** Fecha ISO del día (solo si la encuesta trae fechas): permite mostrar
   * "martes, 21 de julio", cruzar openDays y calcular el atardecer real. */
  date?: string;
  zone: PlannerZone | "base" | "variable" | "cercano-aeropuerto";
  cluster?: string;
  blocks: IntradayBlock[];
  notices: Notice[];
  /** Estimación de horas útiles consumidas (regla no-saturar 8,5 h). */
  budgetHours: number;
  /** Plan-B de mal tiempo (PASO 6): interiores de la zona como toggle "Si llueve". */
  planB?: { blocks: IntradayBlock[]; notices: Notice[] };
  /**
   * Lo que queda a mano ese día y NO entró en el plan (la regla de no-saturar
   * manda). No es relleno: es la profundidad del ramal, visible sin romper la
   * calma del itinerario — y la vía por la que salen a la luz los lugares
   * verificados que el plan no llega a programar.
   */
  alsoNearby?: Swap[];
  /** Lo que cuesta el día: la banda más alta de sus paradas. */
  costBand?: CostBand;
  /** Cuántas paradas del día se pagan (0 = día entero de acceso libre). */
  paidStops?: number;
}

/** Plan completo (salida del motor). */
export interface Plan {
  base: BaseZone;
  baseReason: string;
  splitBase?: BaseZone;
  days: DayCard[];
  globalNotices: Notice[];
  menorcaBusHooks: MenorcaBusHook[];
  /** Experiencia firma del viaje: 1 momento memorable, extraído de la guía de la
   * zona base o de la más afín (el "wow" curado). Opcional (solo si hay guía). */
  signature?: { title: string; desc: string };
}
