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
import { S, NICE, type Lang } from "../strings.ts";

export interface BaseResult {
  base: BaseZone;
  baseReason: string;
  /** Segunda base sugerida (solo si compensa dividir la estancia). */
  splitBase?: BaseZone;
}

const has = (s: Survey, i: Interest): boolean => s.interests.includes(i);

export function recommendBase(s: Survey, lang: Lang = "es"): BaseResult {
  const t = S(lang).base;

  // (a) Base elegida explícitamente por la persona → se respeta.
  if (s.base !== "recomiendame") {
    return { base: s.base, baseReason: reasonForChosen(s, s.base, lang), splitBase: maybeSplit(s, s.base) };
  }

  // (b) Llega en ferry con su coche → base del lado del puerto (no cruzar isla).
  if (s.transport === "coche-propio-ferry" && s.ferryPort) {
    const base: BaseZone = s.ferryPort === "ciutadella" ? "ciutadella" : "mao";
    return {
      base,
      baseReason: t.ferry(NICE[base]),
      splitBase: maybeSplit(s, base),
    };
  }

  // (c) Sin coche → solo Maó o Ciutadella (los dos únicos hubs de bus reales).
  if (isCarless(s)) {
    if ((has(s, "cultura") || has(s, "gastronomia")) && !has(s, "vida-nocturna")) {
      return {
        base: "mao",
        baseReason: t.carlessCulture,
      };
    }
    return {
      base: "ciutadella",
      baseReason: t.carlessBalanced,
    };
  }

  // (d) Con coche → por perfil, intereses y días.
  const families = s.kids.has;

  if (has(s, "nautica") && !families) {
    return {
      base: "fornells",
      baseReason: t.nautica,
    };
  }

  if (families && has(s, "calas")) {
    if (s.budget === "ajustado") {
      return {
        base: "son-bou",
        baseReason: t.familySonBou,
      };
    }
    return {
      base: "cala-galdana",
      baseReason: t.familyGaldana,
    };
  }

  if (has(s, "vida-nocturna")) {
    return {
      base: "ciutadella",
      baseReason: t.nightlife,
    };
  }

  if (has(s, "lujo-tranquilo") && !families) {
    return {
      base: "ciutadella",
      baseReason: t.quietLuxury,
      splitBase: maybeSplit(s, "ciutadella"),
    };
  }

  // Explorar costas opuestas con varios días → base central equidistante.
  if (broadInterests(s) && dayBand(s) !== "corta") {
    return {
      base: "es-mercadal",
      baseReason: t.broad,
      splitBase: maybeSplit(s, "es-mercadal"),
    };
  }

  // Primera vez / por defecto.
  return {
    base: "ciutadella",
    baseReason: t.firstTime,
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

function reasonForChosen(s: Survey, base: BaseZone, lang: Lang): string {
  const t = S(lang).base;
  if (isCarless(s) && base !== "mao" && base !== "ciutadella") {
    return t.chosenCarlessLimited(NICE[base]);
  }
  return t.chosenDefault(NICE[base]);
}
