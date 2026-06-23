/**
 * Arquitectura de información: las secciones de la revista (CLAUDE.md §5).
 * Cada sección tiene su etiqueta, su URL (slug) y una intro, por idioma.
 */
import type { Locale } from "./site";

export interface Section {
  key: string;
  label: Record<Locale, string>;
  href: Record<Locale, string>;
  /** Tagline corta, VISIBLE en la portada de sección y en la rejilla de la home. */
  intro: Record<Locale, string>;
  /**
   * Descripción para la <meta description> de la portada de sección (140-160).
   * Solo cuando la `intro` es demasiado corta para SEO. No se muestra en pantalla;
   * si falta, se usa `intro`. Ver [section].astro.
   */
  seoDescription?: Partial<Record<Locale, string>>;
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
    seoDescription: {
      es: "Agenda de Menorca, actualizada: fiestas de Sant Joan, conciertos, mercados y cultura. Qué hacer cada mes en la isla, con criterio y a tu propio ritmo.",
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
    seoDescription: {
      es: "Vivir Menorca todo el año: lifestyle, propiedad e interiorismo con mirada de lujo tranquilo. Comprar casa, reformar y habitar la isla sin prisa.",
      en: "Living Menorca all year round: lifestyle, property and interiors with a quiet-luxury eye. Buying a home, renovating and inhabiting the island, unhurried.",
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
    // Slug heredado `/practica` mantenido a propósito (SEO/enlaces); la etiqueta e
    // intro se reenfocan a transporte + experiencias a medida (el núcleo real de la
    // sección: chófer, traslados, excursiones, cruceros), CLAUDE.md §5.
    key: "practica",
    label: { es: "Moverse", en: "Getting around" },
    href: { es: "/practica", en: "/en/practical" },
    intro: {
      es: "Traslados, chófer y experiencias a medida. Moverse por Menorca con calma y con clase.",
      en: "Transfers, chauffeur and bespoke experiences. Getting around Menorca, calm and with class.",
    },
    seoDescription: {
      es: "Moverse por Menorca con calma: traslados privados, chófer en Mercedes Clase S y V, excursiones a medida, transfers de crucero y cómo llegar. Operado por Menorca Bus.",
      en: "Getting around Menorca with calm: private transfers, chauffeur-driven Mercedes S and V Class, bespoke excursions, cruise transfers and how to get there. By Menorca Bus.",
    },
  },
];

/** Busca una sección por su clave. */
export function getSection(key: string): Section | undefined {
  return SECTIONS.find((s) => s.key === key);
}
