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

// ── Lugar (vista que consume el motor) ───────────────────────────────────────
// Subconjunto máquina-legible de una ficha `lugares`. El dataset compilado
// (planner-data.json, por idioma) es un array de estos. Las descripciones
// largas NO van aquí: se cargan al enlazar a /lugar/<slug>.
export interface PlannerPlace {
  /** translationKey: une las versiones de idioma; identidad estable del lugar. */
  id: string;
  name: string;
  slug: string;
  coordinates: { lat: number; lng: number };

  zone: PlannerZone;
  cluster: string;
  plannerType: PlannerType;
  idealFor: IdealFor[];
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

  dataCertainty: Certainty;
  lastVerified?: string;
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
/** Un bloque de la línea de tiempo intradía (desayuno → cena). */
export interface IntradayBlock {
  slot: "desayuno" | "manana" | "comida" | "tarde" | "atardecer" | "cena";
  /** Hora orientativa "HH:MM" (nunca presentada como inmutable). */
  timeHint?: string;
  placeId?: string;
  placeName: string;
  durationMin?: number;
  /** Razón trazable (PASO 9): alimenta el "por qué" visible (E-E-A-T + GEO). */
  reason?: string;
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
    | "logistica";
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
  zone: PlannerZone | "base" | "variable" | "cercano-aeropuerto";
  cluster?: string;
  blocks: IntradayBlock[];
  notices: Notice[];
  /** Estimación de horas útiles consumidas (regla no-saturar 8,5 h). */
  budgetHours: number;
  /** Plan-B de mal tiempo (PASO 6): interiores de la zona como toggle "Si llueve". */
  planB?: { blocks: IntradayBlock[]; notices: Notice[] };
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
