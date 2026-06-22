/**
 * PASO 0 del motor — recomendación de ZONA BASE (HUECO 4 del blueprint).
 * El motor recomienda zona, NUNCA hoteles. Regla maestra "espina de pez":
 * la base minimiza el coche diario y respeta "1 día = 1 cluster".
 *
 * Cascada determinista (primer match gana): puerto de ferry → sin coche →
 * perfil con coche. Cada salida deja un `baseReason` trazable (PASO 9).
 */
import type { BaseZone } from "../types.ts";
import type { Survey, Interest } from "../survey.ts";
import { isCarless, dayBand } from "../survey.ts";

export interface BaseResult {
  base: BaseZone;
  baseReason: string;
  /** Segunda base sugerida (solo si compensa dividir la estancia). */
  splitBase?: BaseZone;
}

const has = (s: Survey, i: Interest): boolean => s.interests.includes(i);
const NICE: Record<BaseZone, string> = {
  ciutadella: "Ciutadella",
  mao: "Maó",
  "cala-galdana": "Cala Galdana",
  "son-bou": "Son Bou",
  "es-mercadal": "Es Mercadal",
  fornells: "Fornells",
};

export function recommendBase(s: Survey): BaseResult {
  // (a) Base elegida explícitamente por la persona → se respeta.
  if (s.base !== "recomiendame") {
    return { base: s.base, baseReason: reasonForChosen(s, s.base), splitBase: maybeSplit(s, s.base) };
  }

  // (b) Llega en ferry con su coche → base del lado del puerto (no cruzar isla).
  if (s.transport === "coche-propio-ferry" && s.ferryPort) {
    const base: BaseZone = s.ferryPort === "ciutadella" ? "ciutadella" : "mao";
    return {
      base,
      baseReason: `Entras por el puerto de ${NICE[base]}, así que te alojamos en ese lado para empezar sin cruzar la isla.`,
      splitBase: maybeSplit(s, base),
    };
  }

  // (c) Sin coche → solo Maó o Ciutadella (los dos únicos hubs de bus reales).
  if (isCarless(s)) {
    if ((has(s, "cultura") || has(s, "gastronomia")) && !has(s, "vida-nocturna")) {
      return {
        base: "mao",
        baseReason:
          "Sin coche, Maó es el mejor hub: único núcleo con bus directo al aeropuerto y conexiones a toda la isla, ideal para cultura y gastronomía.",
      };
    }
    return {
      base: "ciutadella",
      baseReason:
        "Sin coche, Ciutadella es la base más equilibrada: casco histórico, ambiente y buses a las calas del oeste.",
    };
  }

  // (d) Con coche → por perfil, intereses y días.
  const families = s.kids.has;

  if (has(s, "nautica") && !families) {
    return {
      base: "fornells",
      baseReason:
        "Para vela, kayak y buceo, Fornells y su bahía protegida son la mejor base náutica (y un puerto marinero con encanto).",
    };
  }

  if (families && has(s, "calas")) {
    if (s.budget === "ajustado") {
      return {
        base: "son-bou",
        baseReason:
          "En familia y con presupuesto ajustado, Son Bou ofrece la playa de arena más larga, aguas someras y apartamentos con cocina (mejor cenar self-catering).",
      };
    }
    return {
      base: "cala-galdana",
      baseReason:
        "En familia, Cala Galdana es la mejor base de playa: aguas calmas y poco profundas, posición central en la costa sur y a un paseo de Mitjana.",
    };
  }

  if (has(s, "vida-nocturna")) {
    return {
      base: "ciutadella",
      baseReason:
        "Para ambiente y vida nocturna, Ciutadella es la primera opción: casco histórico vivo, puerto y gastronomía.",
    };
  }

  if (has(s, "lujo-tranquilo") && !families) {
    return {
      base: "ciutadella",
      baseReason:
        "Para una pareja que busca calma con criterio, Ciutadella (casco o agroturismo de su entorno) combina belleza, gastronomía y acceso a las calas del suroeste.",
      splitBase: maybeSplit(s, "ciutadella"),
    };
  }

  // Explorar costas opuestas con varios días → base central equidistante.
  if (broadInterests(s) && dayBand(s) !== "corta") {
    return {
      base: "es-mercadal",
      baseReason:
        "Si quieres recorrer toda la isla, Es Mercadal es la base central y equidistante (las mejores conexiones), perfecta para salir cada día a una costa distinta.",
      splitBase: maybeSplit(s, "es-mercadal"),
    };
  }

  // Primera vez / por defecto.
  return {
    base: "ciutadella",
    baseReason:
      "Para una primera vez equilibrada, Ciutadella es la recomendación segura: ciudad con alma, ambiente y a tiro de las calas más famosas del sur y oeste.",
    splitBase: maybeSplit(s, "ciutadella"),
  };
}

/** ¿Intereses dispersos por costas opuestas? (calas + cultura + naturaleza…). */
function broadInterests(s: Survey): boolean {
  return s.interests.length >= 4 || (has(s, "calas") && has(s, "cultura") && has(s, "naturaleza"));
}

/**
 * Split de base: solo si compensa (blueprint PASO 3). 8+ días, o 6-7 días con
 * intereses muy dispersos. Nunca con 3-4 días. Devuelve la 2ª base (lado opuesto).
 */
function maybeSplit(s: Survey, base: BaseZone): BaseZone | undefined {
  if (isCarless(s)) return undefined; // sin coche no se cambia de base
  const band = dayBand(s);
  if (band === "corta") return undefined;
  const eastBases: BaseZone[] = ["mao", "son-bou"];
  const isEast = eastBases.includes(base);
  if (band === "larga") return isEast ? "ciutadella" : "mao";
  // 6-7 días: solo si los intereses cubren ambos extremos con intensidad.
  if (broadInterests(s)) return isEast ? "ciutadella" : "mao";
  return undefined;
}

function reasonForChosen(s: Survey, base: BaseZone): string {
  if (isCarless(s) && base !== "mao" && base !== "ciutadella") {
    return `Te alojas en ${NICE[base]}. Aviso: sin coche, esta base tiene transporte público limitado; valora transfers/excursiones para moverte.`;
  }
  return `Te alojas en ${NICE[base]}; el plan se organiza alrededor de esa base para minimizar el coche diario.`;
}
