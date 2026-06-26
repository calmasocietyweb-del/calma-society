// Flux RSS en français : /fr/rss.xml
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../../config/site";
import { getArticles } from "../../lib/content";
import { articleUrl } from "../../i18n/utils";

export async function GET(context: APIContext) {
  const articles = await getArticles("fr");
  return rss({
    title: `${SITE.name} — Minorque`,
    description:
      "Calma Society — l'art du luxe tranquille en Méditerranée. Première édition : Minorque.",
    site: context.site ?? SITE.url,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.excerpt,
      pubDate: a.data.publishDate,
      link: articleUrl("fr", a.id),
      categories: a.data.tags,
    })),
    customData: `<language>fr-FR</language>`,
  });
}
