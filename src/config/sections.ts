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
    label: { es: "Descubrir", en: "Discover", fr: "Découvrir", de: "Entdecken", it: "Scoprire", pt: "Descobrir" },
    href: { es: "/descubrir", en: "/en/discover", fr: "/fr/decouvrir", de: "/de/entdecken", it: "/it/scoprire", pt: "/pt/descobrir" },
    intro: {
      es: "Calas, rutas, pueblos y naturaleza. La isla que enamora, con criterio.",
      en: "Coves, trails, villages and nature. The island that captivates, with judgement.",
      fr: "Criques, sentiers, villages et nature. L'île qui séduit, avec discernement.",
      de: "Buchten, Wege, Dörfer und Natur. Die Insel, in die man sich verliebt — mit Gespür.",
      it: "Cale, sentieri, borghi e natura. L'isola che conquista, con criterio.",
      pt: "Enseadas, trilhos, aldeias e natureza. A ilha que conquista, com critério.",
    },
  },
  {
    key: "agenda",
    label: { es: "Agenda", en: "What's on", fr: "Agenda", de: "Veranstaltungen", it: "Eventi", pt: "Agenda" },
    href: { es: "/agenda", en: "/en/whats-on", fr: "/fr/agenda", de: "/de/veranstaltungen", it: "/it/eventi", pt: "/pt/agenda" },
    intro: {
      es: "Fiestas, conciertos y mercados. Qué pasa en Menorca, actualizado.",
      en: "Festivals, concerts and markets. What's happening in Menorca, kept current.",
      fr: "Fêtes, concerts et marchés. Ce qui se passe à Minorque, tenu à jour.",
      de: "Feste, Konzerte und Märkte. Was auf Menorca los ist, immer aktuell.",
      it: "Feste, concerti e mercati. Cosa succede a Minorca, sempre aggiornato.",
      pt: "Festas, concertos e mercados. O que acontece em Menorca, sempre atualizado.",
    },
    seoTitle: {
      es: "Agenda de Menorca: fiestas, conciertos y mercados",
      en: "What's on in Menorca: festivals, concerts and markets",
      fr: "Agenda de Minorque : fêtes, concerts et marchés",
      it: "Eventi a Minorca: feste, concerti e mercati",
      pt: "Agenda de Menorca: festas, concertos e mercados",
    },
    seoDescription: {
      es: "Agenda de Menorca, actualizada: fiestas de Sant Joan, conciertos, mercados y cultura. Qué hacer cada mes en la isla, con criterio y a tu propio ritmo.",
      en: "What's on in Menorca, kept current: Sant Joan and the summer town festivals, concerts, markets and culture. What to do each month on the island, at your own pace.",
      fr: "L'agenda de Minorque, tenu à jour : Sant Joan et les fêtes des villages, concerts, marchés et culture. Que faire chaque mois sur l'île, à votre rythme.",
      it: "Gli eventi di Minorca, sempre aggiornati: Sant Joan e le feste dei paesi, concerti, mercati e cultura. Cosa fare ogni mese sull'isola, al proprio ritmo.",
      pt: "A agenda de Menorca, sempre atualizada: Sant Joan e as festas populares, concertos, mercados e cultura. O que fazer na ilha, mês a mês, ao seu ritmo.",
    },
  },
  {
    key: "comer-y-beber",
    label: { es: "Comer y beber", en: "Eat & Drink", fr: "Manger et boire", de: "Essen & Trinken", it: "Mangiare e bere", pt: "Comer e beber" },
    href: { es: "/comer-y-beber", en: "/en/eat-and-drink", fr: "/fr/manger-et-boire", de: "/de/essen-und-trinken", it: "/it/mangiare-e-bere", pt: "/pt/comer-e-beber" },
    intro: {
      es: "Gastronomía con producto local: queso DOP, vino de la tierra y buenas mesas.",
      en: "Gastronomy rooted in local produce: PDO cheese, wine of the land and fine tables.",
      fr: "Une gastronomie ancrée dans le produit local : fromage AOP, vin de la terre et belles tables.",
      de: "Küche aus lokalem Erzeugnis: Käse mit Ursprungsbezeichnung, Wein der Insel und gute Tische.",
      it: "Cucina di prodotto locale: formaggio DOP, vino del territorio e buone tavole.",
      pt: "Gastronomia de produto local: queijo DOP, vinho da terra e boas mesas.",
    },
  },
  {
    key: "vivir",
    label: { es: "Vivir", en: "Living", fr: "Vivre", de: "Leben", it: "Vivere", pt: "Viver" },
    href: { es: "/vivir", en: "/en/living", fr: "/fr/vivre", de: "/de/leben", it: "/it/vivere", pt: "/pt/viver" },
    intro: {
      es: "Lifestyle, propiedad e interiorismo. Vivir Menorca todo el año.",
      en: "Lifestyle, property and interiors. Living Menorca all year round.",
      fr: "Art de vivre, immobilier et décoration. Vivre Minorque toute l'année.",
      de: "Lebensart, Immobilien und Interieur. Menorca das ganze Jahr über leben.",
      it: "Stile di vita, immobili e interni. Vivere Minorca tutto l'anno.",
      pt: "Estilo de vida, imóveis e interiores. Viver Menorca todo o ano.",
    },
    seoDescription: {
      es: "Vivir Menorca todo el año: lifestyle, propiedad e interiorismo con mirada de lujo tranquilo. Comprar casa, reformar y habitar la isla sin prisa.",
      en: "Living Menorca all year round: lifestyle, property and interiors with a quiet-luxury eye. Buying a home, renovating and inhabiting the island, unhurried.",
      fr: "Vivre Minorque toute l'année : art de vivre, immobilier et décoration dans un regard de luxe tranquille. Acheter, rénover et habiter l'île sans hâte.",
      it: "Vivere Minorca tutto l'anno: stile di vita, immobili e interni con lo sguardo del lusso tranquillo. Comprare casa, ristrutturare e abitare l'isola senza fretta.",
      pt: "Viver Menorca todo o ano: estilo de vida, imóveis e interiores com um olhar de luxo tranquilo. Comprar casa, remodelar e habitar a ilha sem pressa.",
    },
  },
  {
    key: "cultura",
    label: { es: "Cultura", en: "Culture", fr: "Culture", de: "Kultur", it: "Cultura", pt: "Cultura" },
    // seoTitle: el label a secas era IDÉNTICO en EN y FR → <title> duplicado
    // en GSC (KAN-88). El nombre completo de la sección (§5 del CLAUDE.md)
    // diferencia idiomas sin tocar la navegación.
    seoTitle: { es: "Cultura e identidad", en: "Culture & identity", fr: "Culture et identité", it: "Cultura e identità", pt: "Cultura e identidade" },
    href: { es: "/cultura", en: "/en/culture", fr: "/fr/culture", de: "/de/kultur", it: "/it/cultura", pt: "/pt/cultura" },
    intro: {
      es: "Historia, lengua, artesanía y la Menorca talayótica. La identidad de la isla.",
      en: "History, language, craft and Talayotic Menorca. The island's identity.",
      fr: "Histoire, langue, artisanat et la Minorque talayotique. L'identité de l'île.",
      de: "Geschichte, Sprache, Handwerk und das talayotische Menorca. Die Identität der Insel.",
      it: "Storia, lingua, artigianato e la Minorca talaiotica. L'identità dell'isola.",
      pt: "História, língua, artesanato e a Menorca talaiótica. A identidade da ilha.",
    },
  },
  {
    // Slug heredado `/practica` mantenido a propósito (SEO/enlaces); la etiqueta e
    // intro se reenfocan a transporte + experiencias a medida (el núcleo real de la
    // sección: chófer, traslados, excursiones, cruceros), CLAUDE.md §5.
    key: "practica",
    label: { es: "Moverse", en: "Getting around", fr: "Se déplacer", de: "Unterwegs", it: "Muoversi", pt: "Deslocar-se" },
    href: { es: "/practica", en: "/en/practical", fr: "/fr/se-deplacer", de: "/de/unterwegs", it: "/it/muoversi", pt: "/pt/deslocar-se" },
    intro: {
      es: "Traslados, chófer y experiencias a medida. Moverse por Menorca con calma y con clase.",
      en: "Transfers, chauffeur and bespoke experiences. Getting around Menorca, calm and with class.",
      fr: "Transferts, chauffeur et expériences sur mesure. Se déplacer à Minorque, en toute quiétude et avec classe.",
      de: "Transfers, Chauffeur und maßgeschneiderte Erlebnisse. Menorca in Ruhe und mit Klasse erkunden.",
      it: "Transfer, autista privato ed esperienze su misura. Muoversi a Minorca con calma e con classe.",
      pt: "Transfers, motorista privado e experiências à medida. Deslocar-se por Menorca com calma e com classe.",
    },
    seoDescription: {
      es: "Moverse por Menorca con calma: traslados privados, chófer en Mercedes Clase S y V, excursiones a medida, transfers de crucero y cómo llegar. Operado por Menorca Bus.",
      en: "Getting around Menorca with calm: private transfers, chauffeur-driven Mercedes S and V Class, bespoke excursions, cruise transfers and how to get there. By Menorca Bus.",
      fr: "Se déplacer à Minorque en toute quiétude : transferts privés, chauffeur en Mercedes Classe S et V, excursions sur mesure, transferts de croisière et comment venir. Par Menorca Bus.",
      it: "Muoversi a Minorca con calma: transfer privati, autista in Mercedes Classe S e V, escursioni su misura, transfer da crociera e come arrivare. Operato da Menorca Bus.",
      pt: "Deslocar-se por Menorca com calma: transfers privados, motorista em Mercedes Classe S e V, excursões à medida, transfers de cruzeiro e como chegar. Operado pela Menorca Bus.",
    },
  },
];

/** Busca una sección por su clave. */
export function getSection(key: string): Section | undefined {
  return SECTIONS.find((s) => s.key === key);
}
