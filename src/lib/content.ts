/**
 * Consultas de contenido. Toda función pública filtra por idioma y por
 * `status === 'published'`: la web NUNCA muestra borradores ni pendientes
 * (cortafuegos de aprobación, CLAUDE.md §6 bis).
 */
import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "../config/site";

const PUBLISHED = "published";

/** Artículos publicados de un idioma, del más reciente al más antiguo. */
export async function getArticles(
  locale: Locale,
): Promise<CollectionEntry<"articulos">[]> {
  const all = await getCollection(
    "articulos",
    (e) => e.data.lang === locale && e.data.status === PUBLISHED,
  );
  return all.sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  );
}

/** Artículos publicados de una sección. */
export async function getArticlesBySection(locale: Locale, section: string) {
  return (await getArticles(locale)).filter((a) => a.data.section === section);
}

/**
 * Artículos relacionados para "Sigue leyendo": misma sección, priorizando los
 * que comparten más tags; si faltan, completa con los más recientes. Excluye
 * el artículo actual. Reparte enlazado interno y evita finales sin salida.
 */
export async function getRelatedArticles(
  locale: Locale,
  currentId: string,
  section: string,
  tags: string[] = [],
  limit = 3,
): Promise<CollectionEntry<"articulos">[]> {
  const all = await getArticles(locale); // ya viene del más reciente al más antiguo
  const sameSection = all.filter(
    (a) => a.id !== currentId && a.data.section === section,
  );
  const picked = sameSection
    .map((a) => ({ a, score: a.data.tags.filter((t) => tags.includes(t)).length }))
    .sort((x, y) => y.score - x.score) // estable: mantiene el orden por fecha dentro del mismo score
    .slice(0, limit)
    .map((s) => s.a);
  if (picked.length < limit) {
    const ids = new Set(picked.map((a) => a.id));
    const fill = all.filter((a) => a.id !== currentId && !ids.has(a.id));
    picked.push(...fill.slice(0, limit - picked.length));
  }
  return picked;
}

/** Artículo destacado (o el más reciente si no hay ninguno marcado). */
export async function getFeaturedArticle(locale: Locale) {
  const arts = await getArticles(locale);
  return arts.find((a) => a.data.featured) ?? arts[0] ?? null;
}

/** Lugares publicados de un idioma. */
export async function getPlaces(locale: Locale) {
  return getCollection(
    "lugares",
    (e) => e.data.lang === locale && e.data.status === PUBLISHED,
  );
}

/**
 * Eventos publicados de un idioma, ordenados por PROXIMIDAD: la próxima
 * ocurrencia desde hoy primero, dando la vuelta al año (un evento de diciembre
 * va antes que uno de enero si hoy es noviembre). No por mes natural. Como
 * casi todos son fiestas anuales, se usa el mes-día de `startDate` y se calcula
 * la siguiente ocurrencia respecto a la fecha de compilación.
 */
export async function getEvents(locale: Locale) {
  const all = await getCollection(
    "eventos",
    (e) => e.data.lang === locale && e.data.status === PUBLISHED,
  );
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntilNext = (start: Date) => {
    // Usa el mes-día (UTC, porque las fechas se guardan como AAAA-MM-DD).
    const next = new Date(today.getFullYear(), start.getUTCMonth(), start.getUTCDate());
    if (next.getTime() < today.getTime()) next.setFullYear(next.getFullYear() + 1);
    return next.getTime() - today.getTime();
  };
  return all.sort(
    (a, b) => daysUntilNext(a.data.startDate) - daysUntilNext(b.data.startDate),
  );
}

/** Todos los autores (entradas únicas, no traducidas). */
export async function getAuthors() {
  return getCollection("autores");
}

/** Slug del artículo equivalente en otro idioma (para el selector de idioma). */
export async function articleSlugFor(
  translationKey: string,
  locale: Locale,
): Promise<string | null> {
  const all = await getCollection(
    "articulos",
    (e) =>
      e.data.translationKey === translationKey &&
      e.data.lang === locale &&
      e.data.status === PUBLISHED,
  );
  return all[0]?.id ?? null;
}

/** Slug del lugar equivalente en otro idioma. */
export async function placeSlugFor(
  translationKey: string,
  locale: Locale,
): Promise<string | null> {
  const all = await getCollection(
    "lugares",
    (e) =>
      e.data.translationKey === translationKey &&
      e.data.lang === locale &&
      e.data.status === PUBLISHED,
  );
  return all[0]?.id ?? null;
}
