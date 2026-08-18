/**
 * Catálogo del registro de socios (KAN-122): los valores válidos de cada campo
 * de estado y sus etiquetas para el panel. Fuente única — la API valida contra
 * esto y el panel pinta con esto. Modelo de tarifa validado con el dueño el
 * 15-jul-2026: los locales van por cuota fija (la visita/clic la JUSTIFICA,
 * no es la unidad de cobro); afiliación solo con reserva rastreable.
 */
export const TIPOS_SOCIO = [
  "restaurante",
  "agroturismo",
  "hotel",
  "beach-club",
  "bodega",
  "queseria",
  "comercio",
  "actividad",
  "otro",
] as const;
export type TipoSocio = (typeof TIPOS_SOCIO)[number];

export const ESTADOS_SOCIO = [
  "pendiente",
  "contactado",
  "respondio-si",
  "respondio-no",
  "descartado",
  "socio",
] as const;
export type EstadoSocio = (typeof ESTADOS_SOCIO)[number];

export const MODELOS_TRATO = [
  "trueque",
  "cuota-directorio",
  "afiliacion",
  "branded",
  "otro",
] as const;
export type ModeloTrato = (typeof MODELOS_TRATO)[number];

export const ESTADOS_TRATO = ["propuesto", "activo", "terminado", "rechazado"] as const;
export type EstadoTrato = (typeof ESTADOS_TRATO)[number];

export const ETIQUETADOS = ["editorial", "patrocinado"] as const;
export type Etiquetado = (typeof ETIQUETADOS)[number];

/** Etiquetas legibles para el panel (sin emojis, lujo tranquilo). */
export const LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  contactado: "Contactado",
  "respondio-si": "Respondió sí",
  "respondio-no": "Respondió no",
  descartado: "Descartado",
  socio: "Socio",
  trueque: "Trueque",
  "cuota-directorio": "Cuota de directorio",
  afiliacion: "Afiliación",
  branded: "Branded content",
  otro: "Otro",
  propuesto: "Propuesto",
  activo: "Activo",
  terminado: "Terminado",
  rechazado: "Rechazado",
  editorial: "Editorial",
  patrocinado: "Patrocinado",
  restaurante: "Restaurante",
  agroturismo: "Agroturismo",
  hotel: "Hotel",
  "beach-club": "Beach club",
  bodega: "Bodega",
  queseria: "Quesería",
  comercio: "Comercio",
  actividad: "Actividad",
};
