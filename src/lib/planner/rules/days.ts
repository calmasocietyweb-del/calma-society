/**
 * PASO 1 del motor — esqueleto de la estancia (qué tipo de día y en qué zona).
 * docs/PLANIFICADOR-BLUEPRINT.md.
 *
 * Reglas (espina de pez): día 1 = llegada (cerca de la base), último = salida;
 * los días plenos toman 1 cluster cada uno, por afinidad y cercanía, SIN repetir
 * zona dos días seguidos. Si no quedan clusters nuevos, se inserta un día colchón.
 */
import type { PlannerPlace, PlannerZone, BaseZone } from "../types.ts";
import type { Survey } from "../survey.ts";
import { affinity, estimateTravelMin } from "./interests.ts";
import { surveySeed, pickRotating } from "./seed.ts";

export interface ClusterInfo {
  cluster: string;
  zone: PlannerZone;
  places: PlannerPlace[];
  affinity: number;
  travelFromBaseMin: number;
}

export interface DaySkeleton {
  dayIndex: number;
  dayTypeKey: string;
  label: { es: string; en: string; de: string; fr: string };
  zone: PlannerZone | "base" | "cercano-aeropuerto";
  cluster?: string;
}

/** Zona del cluster por mayoría (determinista, independiente del orden). */
function dominantZone(places: PlannerPlace[]): PlannerZone {
  const count = new Map<PlannerZone, number>();
  for (const p of places) count.set(p.zone, (count.get(p.zone) ?? 0) + 1);
  let best = places[0].zone;
  let bestN = -1;
  for (const [z, n] of [...count].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (n > bestN) { best = z; bestN = n; }
  }
  return best;
}

/** Agrupa el dataset en clusters y los ordena por afinidad y cercanía a la base. */
export function rankClusters(s: Survey, base: BaseZone, dataset: PlannerPlace[]): ClusterInfo[] {
  const byCluster = new Map<string, PlannerPlace[]>();
  for (const p of dataset) {
    const arr = byCluster.get(p.cluster);
    if (arr) arr.push(p);
    else byCluster.set(p.cluster, [p]);
  }
  const infos: ClusterInfo[] = [];
  for (const [cluster, places] of byCluster) {
    const zone = dominantZone(places); // un cluster comparte ramal → zona dominante
    // Afinidad del cluster = suma de las 3 mejores afinidades de sus lugares.
    const top3 = places.map((p) => affinity(p, s)).sort((a, b) => b - a).slice(0, 3);
    const aff = top3.reduce((x, y) => x + y, 0);
    infos.push({ cluster, zone, places, affinity: aff, travelFromBaseMin: estimateTravelMin(base, zone) });
  }
  // Orden determinista: afinidad ↓, cercanía ↑, nombre de cluster ↑.
  infos.sort((a, b) =>
    b.affinity - a.affinity ||
    a.travelFromBaseMin - b.travelFromBaseMin ||
    a.cluster.localeCompare(b.cluster),
  );
  return infos;
}

// Etiqueta y clave de tipo-de-día por zona (cruza con src/data/dayTypes.ts).
const ZONE_DAY: Record<PlannerZone, { key: string; es: string; en: string; de: string; fr: string }> = {
  "sur-oeste": { key: "calas-suroeste", es: "Día de calas del suroeste", en: "Southwest coves day", de: "Tag der Buchten im Südwesten", fr: "Jour des criques du sud-ouest" },
  "sur-centro": { key: "familiar", es: "Día de playas del sur-centro", en: "South-central beaches day", de: "Tag der Strände im Süden der Inselmitte", fr: "Jour des plages du sud-centre" },
  "sur-este": { key: "sureste-tranquilo", es: "Día del sureste tranquilo", en: "Quiet south-east day", de: "Tag im ruhigen Südosten", fr: "Jour dans le sud-est tranquille" },
  norte: { key: "norte-agreste", es: "Día del norte agreste", en: "Wild north day", de: "Tag im rauen Norden", fr: "Jour dans le nord sauvage" },
  oeste: { key: "calas-suroeste", es: "Día de Ciutadella y el oeste", en: "Ciutadella & the west day", de: "Tag in Ciutadella und im Westen", fr: "Jour à Ciutadella et dans l'ouest" },
  este: { key: "sureste-tranquilo", es: "Día de Maó y el este", en: "Maó & the east day", de: "Tag in Mahón und im Osten", fr: "Jour à Maó et dans l'est" },
  centro: { key: "cultura-talayotica", es: "Día de interior y cultura", en: "Inland & culture day", de: "Tag im Landesinneren und für Kultur", fr: "Jour dans l'intérieur des terres et la culture" },
  "eje-me1": { key: "cultura-talayotica", es: "Día de cultura en el eje Me-1", en: "Culture along the Me-1 day", de: "Kulturtag entlang der Me-1", fr: "Jour de culture sur l'axe Me-1" },
};

function fullDay(dayIndex: number, info: ClusterInfo, revisit = false): DaySkeleton {
  const z = ZONE_DAY[info.zone];
  // Segunda vuelta al mismo ramal: el motor ya no repite lugares, así que el día
  // enseña otras paradas. El título lo dice en voz alta para no parecer un
  // duplicado ("Más del norte agreste").
  const label = revisit
    ? {
        es: `Más ${z.es.replace(/^Día de /, "").replace(/^Día del /, "del ")}`,
        en: `More: ${z.en.replace(/ day$/, "")}`,
        de: `Mehr: ${z.de.replace(/^Tag /, "")}`,
        fr: `Encore : ${z.fr.replace(/^Jour /, "")}`,
      }
    : { es: z.es, en: z.en, de: z.de, fr: z.fr };
  return { dayIndex, dayTypeKey: z.key, label, zone: info.zone, cluster: info.cluster };
}

/**
 * Ventana de "casi empate" entre clusters (puntos de afinidad). Dentro de ella,
 * dos ramales sirven igual de bien al viaje, así que el orden puede ROTAR por
 * semilla: es lo que hace que dos viajeros con la misma encuesta pero distinta
 * variante recorran la isla por sitios distintos.
 */
const CLUSTER_TIE = 1.5;
/** Mínimo de lugares para que merezca la pena volver a un ramal otro día. */
const REVISIT_MIN_PLACES = 5;

/** Elige el siguiente cluster: el mejor disponible, rotando entre los equivalentes. */
function nextCluster(
  ranked: ClusterInfo[],
  ok: (c: ClusterInfo) => boolean,
  seed: number,
  salt: number,
): ClusterInfo | undefined {
  const cands = ranked.filter(ok);
  if (cands.length === 0) return undefined;
  const near = cands.filter((c) => c.affinity >= cands[0].affinity - CLUSTER_TIE);
  return pickRotating(near, seed, salt);
}

const ARRIVAL: Pick<DaySkeleton, "dayTypeKey" | "label" | "zone"> = {
  dayTypeKey: "dia-llegada", zone: "base", label: { es: "Día de llegada", en: "Arrival day", de: "Ankunftstag", fr: "Jour d'arrivée" },
};
const DEPARTURE: Pick<DaySkeleton, "dayTypeKey" | "label" | "zone"> = {
  dayTypeKey: "dia-salida", zone: "cercano-aeropuerto", label: { es: "Día de salida", en: "Departure day", de: "Abreisetag", fr: "Jour de départ" },
};
const COLCHON: Pick<DaySkeleton, "dayTypeKey" | "label" | "zone"> = {
  dayTypeKey: "relax-lujo", zone: "base", label: { es: "Día colchón (repite tu favorita o descansa)", en: "Buffer day (revisit a favourite or rest)", de: "Pufftag (Lieblingsort wiederholen oder ausruhen)", fr: "Jour tampon (repartez vers votre préférée ou reposez-vous)" },
};

/** Compone el esqueleto día a día respetando las invariantes del PASO 1. */
export function buildDaySkeleton(s: Survey, base: BaseZone, dataset: PlannerPlace[]): DaySkeleton[] {
  const ranked = rankClusters(s, base, dataset);
  const days = Math.max(1, s.days);
  const seed = surveySeed(s);
  const used = new Set<string>();
  const revisits = new Map<string, number>();
  let prevZone: PlannerZone | undefined;

  /**
   * Un día pleno. Primero un ramal NUEVO de otra zona; si no queda ninguno,
   * se VUELVE a un ramal grande (el motor no repite lugares, así que la segunda
   * vuelta enseña paradas distintas). El día colchón queda como último recurso
   * de verdad: antes aparecía a partir de los 15 días y dejaba 8 días de un
   * viaje de 21 sin una sola parada (auditoría 2026-08-11).
   */
  const planDay = (dayIndex: number): DaySkeleton => {
    const fresh = nextCluster(ranked, (c) => !used.has(c.cluster) && c.zone !== prevZone, seed, dayIndex);
    if (fresh) {
      used.add(fresh.cluster);
      prevZone = fresh.zone;
      return fullDay(dayIndex, fresh);
    }
    const again = [...ranked]
      .filter((c) => c.zone !== prevZone && c.places.length >= REVISIT_MIN_PLACES)
      .sort((a, b) => (revisits.get(a.cluster) ?? 0) - (revisits.get(b.cluster) ?? 0) || b.affinity - a.affinity)[0];
    if (again) {
      revisits.set(again.cluster, (revisits.get(again.cluster) ?? 0) + 1);
      prevZone = again.zone;
      return fullDay(dayIndex, again, true);
    }
    prevZone = undefined; // el colchón rompe la racha de zona
    return { dayIndex, ...COLCHON };
  };

  // Viajes muy cortos (1-2 días): cada día cuenta como día PLENO (no se gastan
  // días en pura logística). La llegada/salida se añaden como AVISOS al primer y
  // último día desde el motor, no como días vacíos.
  if (days <= 2) {
    return Array.from({ length: days }, (_, d) => planDay(d));
  }

  const out: DaySkeleton[] = [{ dayIndex: 0, ...ARRIVAL }];
  for (let d = 0; d < days - 2; d++) out.push(planDay(d + 1));
  out.push({ dayIndex: days - 1, ...DEPARTURE });
  return out;
}
