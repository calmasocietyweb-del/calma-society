/**
 * Tiempos de desplazamiento en coche — base del "presupuesto de tiempo" del
 * planificador de viajes (regla "espina de pez": el eje Me-1 Maó–Ciutadella son
 * 45 min, así que cruzar la isla cuesta ~1,5 h ida/vuelta → no se encadenan
 * costas opuestas en un día). Verificados en la investigación (jun. 2026).
 *
 * Son SIMÉTRICOS (A→B = B→A) salvo nota. El motor consulta cluster→cluster aquí;
 * si un par no está tabulado, deriva del eje (mismo lado ~15-30 min; cruce ~45).
 * Dato estacionalmente estable (las distancias no cambian); solo el tráfico de
 * agosto añade el recargo de hora punta.
 */
export interface TravelTime {
  from: string;
  to: string;
  minutesByCar: number;
  certainty: "alta" | "media" | "baja";
  notes?: string;
}

/** Pares entre zonas/bases y a las calas clave (15 verificados). */
export const TRAVEL_TIMES: TravelTime[] = [
  { from: "Maó", to: "Ciutadella", minutesByCar: 45, certainty: "alta", notes: "Eje Me-1 (~47 km); en agosto sube por tráfico. Base de tiempos de la isla." },
  { from: "Maó", to: "Fornells", minutesByCar: 20, certainty: "alta", notes: "Por la Me-7, directa." },
  { from: "Maó", to: "Cala Galdana", minutesByCar: 34, certainty: "alta", notes: "Vía Ferreries, único acceso en coche." },
  { from: "Maó", to: "Faro de Favàritx", minutesByCar: 30, certainty: "media", notes: "Tramo final lento y sinuoso." },
  { from: "Maó", to: "Es Grau", minutesByCar: 15, certainty: "media", notes: "Parc Natural de s'Albufera, muy cerca de Maó." },
  { from: "Ciutadella", to: "Cala Galdana", minutesByCar: 27, certainty: "alta", notes: "Puerta de las calas vírgenes del suroeste." },
  { from: "Ciutadella", to: "Fornells", minutesByCar: 33, certainty: "alta" },
  { from: "Ciutadella", to: "Faro de Punta Nati", minutesByCar: 10, certainty: "media", notes: "Restricción de coche en verano; confirmar bus." },
  { from: "Ciutadella", to: "Cala en Turqueta", minutesByCar: 20, certainty: "alta", notes: "+ 10-15 min a pie; el parking se llena ~9h en agosto." },
  { from: "Fornells", to: "Cap de Cavalleria", minutesByCar: 15, certainty: "media" },
  { from: "Fornells", to: "Faro de Favàritx", minutesByCar: 30, certainty: "media" },
  { from: "Es Mercadal", to: "Maó", minutesByCar: 25, certainty: "media", notes: "Centro geográfico de la isla; útil como base central. Monte Toro a ~10 min." },
  { from: "Ferreries", to: "Cala Galdana", minutesByCar: 15, certainty: "alta", notes: "Único acceso en coche a Galdana; bus TMSA L53." },
  { from: "Es Mercadal", to: "Ciutadella", minutesByCar: 22, certainty: "media" },
  { from: "Es Mercadal", to: "Fornells", minutesByCar: 12, certainty: "media" },
];

/**
 * Aeropuerto de Maó (MAH) → base de alojamiento. Para cuadrar el DÍA DE LLEGADA
 * (del aeropuerto a la base + plan ligero) y el DÍA DE SALIDA (margen al vuelo:
 * el motor resta vuelo −2 h, devolución de coche −30 min, y avisa si la base es
 * Ciutadella por el cruce de la isla).
 */
export const AIRPORT_TRANSFERS: TravelTime[] = [
  { from: "Aeropuerto (MAH)", to: "Maó", minutesByCar: 12, certainty: "alta" },
  { from: "Aeropuerto (MAH)", to: "Es Castell", minutesByCar: 15, certainty: "media" },
  { from: "Aeropuerto (MAH)", to: "Sant Lluís", minutesByCar: 14, certainty: "media" },
  { from: "Aeropuerto (MAH)", to: "Alaior", minutesByCar: 20, certainty: "media" },
  { from: "Aeropuerto (MAH)", to: "Cala en Porter", minutesByCar: 22, certainty: "media" },
  { from: "Aeropuerto (MAH)", to: "Es Mercadal", minutesByCar: 27, certainty: "media" },
  { from: "Aeropuerto (MAH)", to: "Es Migjorn Gran", minutesByCar: 28, certainty: "media" },
  { from: "Aeropuerto (MAH)", to: "Fornells", minutesByCar: 32, certainty: "media" },
  { from: "Aeropuerto (MAH)", to: "Ciutadella", minutesByCar: 45, certainty: "alta", notes: "Cruce de la isla por la Me-1: contar margen en el día de salida." },
];

/** Recargo (min) por hora punta de verano (franja ~18-20h) en los pares del eje Me-1. */
export const PEAK_SURCHARGE_MIN = 12;
