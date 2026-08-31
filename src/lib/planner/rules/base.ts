/**
 * PASO 0 del motor — recomendación de ZONA BASE (HUECO 4 del blueprint).
 * El motor recomienda zona, NUNCA hoteles. Regla maestra "espina de pez":
 * la base minimiza el coche diario y respeta "1 día = 1 cluster".
 *
 * Cascada determinista (primer match gana): puerto de ferry → sin coche →
 * perfil con coche. Cada salida deja un `baseReason` trazable (PASO 9).
 */
import type { BaseZone, PlannerPlace, PlannerZone } from "../types.ts";
import type { Survey, Interest } from "../survey.ts";
import { isCarless, dayBand } from "../survey.ts";
import { rankClusters } from "./days.ts";
import { affinity, BASE_SIDE } from "./interests.ts";
import { surveySeed, pickRotating } from "./seed.ts";
import { S, NICE, type Lang } from "../strings.ts";

export interface BaseResult {
  base: BaseZone;
  baseReason: string;
  /** Segunda base sugerida (solo si compensa dividir la estancia). */
  splitBase?: BaseZone;
}

const has = (s: Survey, i: Interest): boolean => s.interests.includes(i);

/** Las 6 zonas base entre las que el motor puede elegir. */
const CANDIDATES: BaseZone[] = ["ciutadella", "mao", "cala-galdana", "son-bou", "es-mercadal", "fornells"];

/**
 * Contraindicaciones de cada base, tomadas de la investigación verificada
 * (docs/PLANIFICADOR-BLUEPRINT.md § "ALOJAMIENTO POR ZONA"). Son criterio
 * editorial que los datos NO contienen: el dataset sabe dónde está cada cala,
 * pero no que Es Mercadal es un pueblo de interior y que mandar allí a alguien
 * que viene a bañarse es un mal consejo aunque conduzca poco.
 *
 * Sin esto, la fórmula —que premia minimizar coche— proponía el centro
 * geográfico de la isla para casi todos los perfiles.
 */
function contraindicated(base: BaseZone, s: Survey): boolean {
  const beachLed = has(s, "calas") || has(s, "nautica");
  switch (base) {
    // "NO está junto al mar → SIEMPRE hay que conducir para playa. Ideal para
    //  viajeros que cada día salen a explorar, no 'modo tumbona'."
    case "es-mercadal":
      return beachLed && !broadInterests(s);
    // "Falta de alma; calidad de bares/restaurantes pobre. NO ideal para parejas
    //  jóvenes, lujo tranquilo ni vida nocturna auténtica." Su caso bueno
    //  (familias con presupuesto ajustado) ya lo resuelve una regla anterior.
    case "son-bou":
      return has(s, "lujo-tranquilo") || has(s, "vida-nocturna") || has(s, "gastronomia") || !s.kids.has;
    // "De las zonas más caras y populares; muy estacional; bus limitado."
    case "cala-galdana":
      return s.budget === "ajustado" || isCarless(s);
    // "Oferta de alojamiento limitada; lejos del oeste; poco conectado en bus."
    case "fornells":
      return isCarless(s);
    default:
      return false;
  }
}
/**
 * Puntúa una base simulando los DÍAS que se harían desde ella: coge los ramales
 * que este viaje usaría de verdad (tantos como días plenos), cada uno valorado
 * por su afinidad y descontado por el coche diario que costaría — la espina de
 * pez castiga cruzar la isla cada mañana.
 *
 * Sustituye al antiguo "si no encaja en ninguna regla, Ciutadella", que mandaba
 * a Ciutadella a 8 de cada 10 perfiles, incluidos los de cultura (que vive en
 * Maó y el eje Me-1) y los de naturaleza (que vive en el norte). Auditoría
 * 2026-08-11.
 *
 * Se puntúan RAMALES y no lugares sueltos a propósito: sumar los 30 mejores
 * lugares premiaba a la base que está regular de cerca de todo por encima de la
 * que está muy cerca de lo que se ha pedido, y así "cultura" acababa en Fornells.
 */
/**
 * Lo que se disfruta por vivir AHÍ y no solo por pasar el día: el paseo antes de
 * cenar, la mesa a la que se vuelve, el mercado de la mañana, la última luz.
 */
const EVENING_TYPES = new Set<PlannerPlace["plannerType"]>([
  "pueblo", "cena", "comida", "desayuno", "atardecer",
]);
/**
 * Cuánto pesa "dónde duermes" frente a "cuánto conduces". Sin este término la
 * fórmula solo minimizaba coche, y entonces ganaba SIEMPRE el centro geográfico
 * de la isla (Es Mercadal, un pueblo de interior) para los seis perfiles — que
 * es tan poco útil como el "Ciutadella para todos" que vino a sustituir.
 */
const EVENING_WEIGHT = 1.15;

function scoreBase(s: Survey, base: BaseZone, dataset: PlannerPlace[]) {
  const fullDays = Math.max(1, Math.min(s.days <= 2 ? s.days : s.days - 2, 7));
  const best = rankClusters(s, base, dataset)
    .map((c) => ({ c, value: c.affinity * (1 - c.travelFromBaseMin / 110) }))
    .sort((a, b) => b.value - a.value || a.c.cluster.localeCompare(b.c.cluster))
    .slice(0, fullDays);
  const byZone = new Map<PlannerZone, number>();
  let score = 0;
  for (const { c, value } of best) {
    score += value;
    byZone.set(c.zone, (byZone.get(c.zone) ?? 0) + value);
  }

  // Valor de la base como sitio donde estar, no solo desde donde salir.
  const home = BASE_SIDE[base];
  const evening = dataset
    .filter((p) => p.zone === home && EVENING_TYPES.has(p.plannerType))
    .map((p) => affinity(p, s))
    .sort((a, b) => b - a)
    .slice(0, 4)
    .reduce((a, b) => a + b, 0);
  score += evening * EVENING_WEIGHT;
  byZone.set(home, (byZone.get(home) ?? 0) + evening * EVENING_WEIGHT);

  const zones = [...byZone]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([z]) => z);
  return { score, zones };
}

export function recommendBase(s: Survey, lang: Lang = "es", dataset: PlannerPlace[] = []): BaseResult {
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

  // Sin regla fuerte que aplique, deciden los DATOS: la base desde la que queda
  // más cerca lo que esta persona ha pedido. Entre bases prácticamente empatadas
  // rota la semilla, así que la variante también cambia dónde duermes.
  if (dataset.length) {
    const viables = CANDIDATES.filter((b) => !contraindicated(b, s));
    const ranked = (viables.length ? viables : CANDIDATES)
      .map((b) => ({ base: b, ...scoreBase(s, b, dataset) }))
      .sort((a, b) => b.score - a.score || a.base.localeCompare(b.base));
    const near = ranked.filter((x) => x.score >= ranked[0].score * 0.97);
    const pick = pickRotating(near, surveySeed(s), 77) ?? ranked[0];
    const zoneNames = S(lang).zoneName;
    return {
      base: pick.base,
      baseReason: t.dataDriven(NICE[pick.base], pick.zones.map((z) => zoneNames[z]).join(S(lang).listJoin)),
      splitBase: maybeSplit(s, pick.base),
    };
  }

  // Primera vez / por defecto (sin dataset a mano).
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
