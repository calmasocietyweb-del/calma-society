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
  label: { es: string; en: string };
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
const ZONE_DAY: Record<PlannerZone, { key: string; es: string; en: string }> = {
  "sur-oeste": { key: "calas-suroeste", es: "Día de calas del suroeste", en: "Southwest coves day" },
  "sur-centro": { key: "familiar", es: "Día de playas del sur-centro", en: "South-central beaches day" },
  "sur-este": { key: "sureste-tranquilo", es: "Día del sureste tranquilo", en: "Quiet south-east day" },
  norte: { key: "norte-agreste", es: "Día del norte agreste", en: "Wild north day" },
  oeste: { key: "calas-suroeste", es: "Día de Ciutadella y el oeste", en: "Ciutadella & the west day" },
  este: { key: "sureste-tranquilo", es: "Día de Maó y el este", en: "Maó & the east day" },
  centro: { key: "cultura-talayotica", es: "Día de interior y cultura", en: "Inland & culture day" },
  "eje-me1": { key: "cultura-talayotica", es: "Día de cultura en el eje Me-1", en: "Culture along the Me-1 day" },
};

function fullDay(dayIndex: number, info: ClusterInfo): DaySkeleton {
  const z = ZONE_DAY[info.zone];
  return { dayIndex, dayTypeKey: z.key, label: { es: z.es, en: z.en }, zone: info.zone, cluster: info.cluster };
}

const ARRIVAL: Pick<DaySkeleton, "dayTypeKey" | "label" | "zone"> = {
  dayTypeKey: "dia-llegada", zone: "base", label: { es: "Día de llegada", en: "Arrival day" },
};
const DEPARTURE: Pick<DaySkeleton, "dayTypeKey" | "label" | "zone"> = {
  dayTypeKey: "dia-salida", zone: "cercano-aeropuerto", label: { es: "Día de salida", en: "Departure day" },
};
const COLCHON: Pick<DaySkeleton, "dayTypeKey" | "label" | "zone"> = {
  dayTypeKey: "relax-lujo", zone: "base", label: { es: "Día colchón (repite tu favorita o descansa)", en: "Buffer day (revisit a favourite or rest)" },
};

/** Compone el esqueleto día a día respetando las invariantes del PASO 1. */
export function buildDaySkeleton(s: Survey, base: BaseZone, dataset: PlannerPlace[]): DaySkeleton[] {
  const ranked = rankClusters(s, base, dataset);
  const days = Math.max(1, s.days);

  // Viajes muy cortos (1-2 días): cada día cuenta como día PLENO (no se gastan
  // días en pura logística). La llegada/salida se añaden como AVISOS al primer y
  // último día desde el motor, no como días vacíos.
  if (days <= 2) {
    const out: DaySkeleton[] = [];
    const used = new Set<string>();
    let prevZone: PlannerZone | undefined;
    for (let d = 0; d < days; d++) {
      const info =
        ranked.find((c) => !used.has(c.cluster) && c.zone !== prevZone) ??
        ranked.find((c) => !used.has(c.cluster));
      if (!info) { out.push({ dayIndex: d, ...COLCHON }); continue; }
      used.add(info.cluster);
      prevZone = info.zone;
      out.push(fullDay(d, info));
    }
    return out;
  }

  const out: DaySkeleton[] = [{ dayIndex: 0, ...ARRIVAL }];
  const fullCount = days - 2; // entre llegada y salida
  const used = new Set<string>();
  let prevZone: PlannerZone | undefined;

  for (let d = 0; d < fullCount; d++) {
    const dayIndex = d + 1;
    const info =
      ranked.find((c) => !used.has(c.cluster) && c.zone !== prevZone) ??
      ranked.find((c) => !used.has(c.cluster));
    if (!info) {
      out.push({ dayIndex, ...COLCHON });
      continue;
    }
    used.add(info.cluster);
    prevZone = info.zone;
    out.push(fullDay(dayIndex, info));
  }

  out.push({ dayIndex: days - 1, ...DEPARTURE });
  return out;
}
