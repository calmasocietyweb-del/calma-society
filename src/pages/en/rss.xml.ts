// RSS feed in English: /en/rss.xml
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../../config/site";
import { getArticles } from "../../lib/content";
import { articleUrl } from "../../i18n/utils";

export async function GET(context: APIContext) {
  const articles = await getArticles("en");
  return rss({
    title: `${SITE.name} — Menorca`,
    description:
      "Calma Society — the art of quiet luxury in the Mediterranean. First edition: Menorca.",
    site: context.site ?? SITE.url,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.excerpt,
      pubDate: a.data.publishDate,
      link: articleUrl("en", a.id),
      categories: a.data.tags,
    })),
    customData: `<language>en-GB</language>`,
  });
}
