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
   * Título para la etiqueta <title> de la portada de sección. Solo cuando la
   * `label` (que se usa en el menú) es demasiado genérica para SEO y conviene
   * anclar a "Menorca" la consulta. No cambia el menú ni el H1; si falta, se usa
   * `label`. Ver [section].astro.
   */
  seoTitle?: Partial<Record<Locale, string>>;
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
    label: { es: "Descubrir", en: "Discover", fr: "Découvrir" },
    href: { es: "/descubrir", en: "/en/discover", fr: "/fr/decouvrir" },
    intro: {
      es: "Calas, rutas, pueblos y naturaleza. La isla que enamora, con criterio.",
      en: "Coves, trails, villages and nature. The island that captivates, with judgement.",
      fr: "Criques, sentiers, villages et nature. L'île qui séduit, avec discernement.",
    },
  },
  {
    key: "agenda",
    label: { es: "Agenda", en: "What's on", fr: "Agenda" },
    href: { es: "/agenda", en: "/en/whats-on", fr: "/fr/agenda" },
    intro: {
      es: "Fiestas, conciertos y mercados. Qué pasa en Menorca, actualizado.",
      en: "Festivals, concerts and markets. What's happening in Menorca, kept current.",
      fr: "Fêtes, concerts et marchés. Ce qui se passe à Minorque, tenu à jour.",
    },
    seoTitle: {
      es: "Agenda de Menorca: fiestas, conciertos y mercados",
      en: "What's on in Menorca: festivals, concerts and markets",
      fr: "Agenda de Minorque : fêtes, concerts et marchés",
    },
    seoDescription: {
      es: "Agenda de Menorca, actualizada: fiestas de Sant Joan, conciertos, mercados y cultura. Qué hacer cada mes en la isla, con criterio y a tu propio ritmo.",
      en: "What's on in Menorca, kept current: Sant Joan and the summer town festivals, concerts, markets and culture. What to do each month on the island, at your own pace.",
      fr: "L'agenda de Minorque, tenu à jour : Sant Joan et les fêtes des villages, concerts, marchés et culture. Que faire chaque mois sur l'île, à votre rythme.",
    },
  },
  {
    key: "comer-y-beber",
    label: { es: "Comer y beber", en: "Eat & Drink", fr: "Manger et boire" },
    href: { es: "/comer-y-beber", en: "/en/eat-and-drink", fr: "/fr/manger-et-boire" },
    intro: {
      es: "Gastronomía con producto local: queso DOP, vino de la tierra y buenas mesas.",
      en: "Gastronomy rooted in local produce: PDO cheese, wine of the land and fine tables.",
      fr: "Une gastronomie ancrée dans le produit local : fromage AOP, vin de la terre et belles tables.",
    },
  },
  {
    key: "vivir",
    label: { es: "Vivir", en: "Living", fr: "Vivre" },
    href: { es: "/vivir", en: "/en/living", fr: "/fr/vivre" },
    intro: {
      es: "Lifestyle, propiedad e interiorismo. Vivir Menorca todo el año.",
      en: "Lifestyle, property and interiors. Living Menorca all year round.",
      fr: "Art de vivre, immobilier et décoration. Vivre Minorque toute l'année.",
    },
    seoDescription: {
      es: "Vivir Menorca todo el año: lifestyle, propiedad e interiorismo con mirada de lujo tranquilo. Comprar casa, reformar y habitar la isla sin prisa.",
      en: "Living Menorca all year round: lifestyle, property and interiors with a quiet-luxury eye. Buying a home, renovating and inhabiting the island, unhurried.",
      fr: "Vivre Minorque toute l'année : art de vivre, immobilier et décoration dans un regard de luxe tranquille. Acheter, rénover et habiter l'île sans hâte.",
    },
  },
  {
    key: "cultura",
    label: { es: "Cultura", en: "Culture", fr: "Culture" },
    // seoTitle: el label a secas era IDÉNTICO en EN y FR → <title> duplicado
    // en GSC (KAN-88). El nombre completo de la sección (§5 del CLAUDE.md)
    // diferencia idiomas sin tocar la navegación.
    seoTitle: { es: "Cultura e identidad", en: "Culture & identity", fr: "Culture et identité" },
    href: { es: "/cultura", en: "/en/culture", fr: "/fr/culture" },
    intro: {
      es: "Historia, lengua, artesanía y la Menorca talayótica. La identidad de la isla.",
      en: "History, language, craft and Talayotic Menorca. The island's identity.",
      fr: "Histoire, langue, artisanat et la Minorque talayotique. L'identité de l'île.",
    },
  },
  {
    // Slug heredado `/practica` mantenido a propósito (SEO/enlaces); la etiqueta e
    // intro se reenfocan a transporte + experiencias a medida (el núcleo real de la
    // sección: chófer, traslados, excursiones, cruceros), CLAUDE.md §5.
    key: "practica",
    label: { es: "Moverse", en: "Getting around", fr: "Se déplacer" },
    href: { es: "/practica", en: "/en/practical", fr: "/fr/se-deplacer" },
    intro: {
      es: "Traslados, chófer y experiencias a medida. Moverse por Menorca con calma y con clase.",
      en: "Transfers, chauffeur and bespoke experiences. Getting around Menorca, calm and with class.",
      fr: "Transferts, chauffeur et expériences sur mesure. Se déplacer à Minorque, en toute quiétude et avec classe.",
    },
    seoDescription: {
      es: "Moverse por Menorca con calma: traslados privados, chófer en Mercedes Clase S y V, excursiones a medida, transfers de crucero y cómo llegar. Operado por Menorca Bus.",
      en: "Getting around Menorca with calm: private transfers, chauffeur-driven Mercedes S and V Class, bespoke excursions, cruise transfers and how to get there. By Menorca Bus.",
      fr: "Se déplacer à Minorque en toute quiétude : transferts privés, chauffeur en Mercedes Classe S et V, excursions sur mesure, transferts de croisière et comment venir. Par Menorca Bus.",
    },
  },
];

/** Busca una sección por su clave. */
export function getSection(key: string): Section | undefined {
  return SECTIONS.find((s) => s.key === key);
}
