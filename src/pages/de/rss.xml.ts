// RSS-Feed auf Deutsch: /de/rss.xml
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../../config/site";
import { getArticles } from "../../lib/content";
import { articleUrl } from "../../i18n/utils";

export async function GET(context: APIContext) {
  const articles = await getArticles("de");
  return rss({
    title: `${SITE.name} — Menorca`,
    description:
      "Calma Society — die Kunst des stillen Luxus im Mittelmeer. Erste Ausgabe: Menorca.",
    site: context.site ?? SITE.url,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.excerpt,
      pubDate: a.data.publishDate,
      link: articleUrl("de", a.id),
      categories: a.data.tags,
    })),
    customData: `<language>de-DE</language>`,
  });
}
