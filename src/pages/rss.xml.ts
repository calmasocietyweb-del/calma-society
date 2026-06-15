// Feed RSS en español: /rss.xml
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../config/site";
import { getArticles } from "../lib/content";
import { articleUrl } from "../i18n/utils";

export async function GET(context: APIContext) {
  const articles = await getArticles("es");
  return rss({
    title: `${SITE.name} — Menorca`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.excerpt,
      pubDate: a.data.publishDate,
      link: articleUrl("es", a.id),
      categories: a.data.tags,
    })),
    customData: `<language>es-ES</language>`,
  });
}
