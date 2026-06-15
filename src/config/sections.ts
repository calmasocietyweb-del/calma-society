/**
 * Arquitectura de información: las secciones de la revista (CLAUDE.md §5).
 * Cada sección tiene su etiqueta, su URL (slug) y una intro, por idioma.
 */
import type { Locale } from "./site";

export interface Section {
  key: string;
  label: Record<Locale, string>;
  href: Record<Locale, string>;
  intro: Record<Locale, string>;
}

export const SECTIONS: Section[] = [
  {
    key: "descubrir",
    label: { es: "Descubrir", en: "Discover" },
    href: { es: "/descubrir", en: "/en/discover" },
    intro: {
      es: "Calas, rutas, pueblos y naturaleza. La isla que enamora, con criterio.",
      en: "Coves, trails, villages and nature. The island that captivates, with judgement.",
    },
  },
  {
    key: "agenda",
    label: { es: "Agenda", en: "What's on" },
    href: { es: "/agenda", en: "/en/whats-on" },
    intro: {
      es: "Fiestas, conciertos y mercados. Qué pasa en Menorca, actualizado.",
      en: "Festivals, concerts and markets. What's happening in Menorca, kept current.",
    },
  },
  {
    key: "comer-y-beber",
    label: { es: "Comer y beber", en: "Eat & Drink" },
    href: { es: "/comer-y-beber", en: "/en/eat-and-drink" },
    intro: {
      es: "Gastronomía con producto local: queso DOP, vino de la tierra y buenas mesas.",
      en: "Gastronomy rooted in local produce: PDO cheese, wine of the land and fine tables.",
    },
  },
  {
    key: "vivir",
    label: { es: "Vivir", en: "Living" },
    href: { es: "/vivir", en: "/en/living" },
    intro: {
      es: "Lifestyle, propiedad e interiorismo. Vivir Menorca todo el año.",
      en: "Lifestyle, property and interiors. Living Menorca all year round.",
    },
  },
  {
    key: "cultura",
    label: { es: "Cultura", en: "Culture" },
    href: { es: "/cultura", en: "/en/culture" },
    intro: {
      es: "Historia, lengua, artesanía y la Menorca talayótica. La identidad de la isla.",
      en: "History, language, craft and Talayotic Menorca. The island's identity.",
    },
  },
  {
    key: "practica",
    label: { es: "Práctica", en: "Practical" },
    href: { es: "/practica", en: "/en/practical" },
    intro: {
      es: "Cómo llegar, moverse y cuándo ir. Lo que necesitas saber, sin rodeos.",
      en: "How to get there, get around and when to go. What you need to know, plainly.",
    },
  },
];

/** Busca una sección por su clave. */
export function getSection(key: string): Section | undefined {
  return SECTIONS.find((s) => s.key === key);
}
