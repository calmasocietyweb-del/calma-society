/**
 * Utilidades de LUGARES: listado publicado por idioma, agrupación por tipo y
 * "lugares cercanos" (la malla de enlaces internos entre fichas).
 *
 * POR QUÉ EXISTE (13-jul-2026): las ~300 fichas de lugar eran páginas
 * HUÉRFANAS. Estaban en el sitemap, pero NINGUNA página del sitio las
 * enlazaba (home, secciones y artículos: 0 enlaces) y las propias fichas
 * eran callejones sin salida. Para Google, una página sin enlaces internos
 * es una página sin importancia: la rastrea con desgana y a menudo no la
 * indexa. Resultado medido en GSC: 248 indexadas de ~500 URLs, y solo +8 en
 * los 10 días siguientes a publicar 262 fichas.
 *
 * El índice de lugares + estos "cercanos" les dan camino de rastreo y
 * autoridad interna. Ver `Documentación Página Web Calma` (vault).
 */
import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "../config/site";

export type Place = CollectionEntry<"lugares">;

/** Orden editorial de los tipos en el índice (los vacíos se omiten). */
export const TYPE_ORDER = [
  "cala",
  "restaurante",
  "monumento",
  "comercio",
  "alojamiento",
  "otro",
] as const;

/** Lugares PUBLICADOS de un idioma, ordenados por nombre. */
export async function publishedPlaces(locale: Locale): Promise<Place[]> {
  const places = await getCollection(
    "lugares",
    (e) => e.data.lang === locale && e.data.status === "published",
  );
  return places.sort((a, b) => a.data.name.localeCompare(b.data.name, locale));
}

/** Agrupa por tipo respetando `TYPE_ORDER`; descarta los grupos vacíos. */
export function groupByType(places: Place[]): { type: string; places: Place[] }[] {
  return TYPE_ORDER.map((type) => ({
    type: type as string,
    places: places.filter((p) => p.data.type === type),
  })).filter((g) => g.places.length > 0);
}

/**
 * Lugares "cercanos" para la malla interna de una ficha: primero los de la
 * MISMA área (mismo municipio/zona), y si no llegan, los del mismo tipo.
 * Nunca se incluye a sí mismo.
 */
export function relatedPlaces(current: Place, all: Place[], limit = 6): Place[] {
  const others = all.filter((p) => p.id !== current.id);
  const sameArea = others.filter((p) => p.data.area === current.data.area);
  const sameType = others.filter(
    (p) => p.data.area !== current.data.area && p.data.type === current.data.type,
  );
  return [...sameArea, ...sameType].slice(0, limit);
}
