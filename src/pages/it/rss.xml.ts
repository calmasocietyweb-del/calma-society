// Feed RSS en italiano: /it/rss.xml
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../../config/site";
import { getArticles } from "../../lib/content";
import { articleUrl } from "../../i18n/utils";

export async function GET(context: APIContext) {
  const articles = await getArticles("it");
  return rss({
    title: `${SITE.name} — Menorca`,
    description:
      "Calma Society — l'arte del lusso tranquillo nel Mediterraneo. Prima edizione: Minorca.",
    site: context.site ?? SITE.url,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.excerpt,
      pubDate: a.data.publishDate,
      link: articleUrl("it", a.id),
      categories: a.data.tags,
    })),
    customData: `<language>it-IT</language>`,
  });
}
