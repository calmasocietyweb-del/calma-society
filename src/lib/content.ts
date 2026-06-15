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

/** Eventos publicados de un idioma, por fecha de inicio ascendente. */
export async function getEvents(locale: Locale) {
  const all = await getCollection(
    "eventos",
    (e) => e.data.lang === locale && e.data.status === PUBLISHED,
  );
  return all.sort(
    (a, b) => a.data.startDate.getTime() - b.data.startDate.getTime(),
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
