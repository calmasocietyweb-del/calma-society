/**
 * Arquitectura de información: las secciones de la revista (CLAUDE.md §5).
 * Cada sección tiene su etiqueta y su URL (slug) por idioma.
 *
 * Las páginas de sección se construyen en la Fase 3; de momento alimentan
 * la navegación de la cabecera y el pie.
 */
import type { Locale } from "./site";

export interface Section {
  key: string;
  label: Record<Locale, string>;
  href: Record<Locale, string>;
}

export const SECTIONS: Section[] = [
  {
    key: "descubrir",
    label: { es: "Descubrir", en: "Discover" },
    href: { es: "/descubrir", en: "/en/discover" },
  },
  {
    key: "agenda",
    label: { es: "Agenda", en: "What's on" },
    href: { es: "/agenda", en: "/en/whats-on" },
  },
  {
    key: "comer-y-beber",
    label: { es: "Comer y beber", en: "Eat & Drink" },
    href: { es: "/comer-y-beber", en: "/en/eat-and-drink" },
  },
  {
    key: "vivir",
    label: { es: "Vivir", en: "Living" },
    href: { es: "/vivir", en: "/en/living" },
  },
  {
    key: "cultura",
    label: { es: "Cultura", en: "Culture" },
    href: { es: "/cultura", en: "/en/culture" },
  },
  {
    key: "practica",
    label: { es: "Práctica", en: "Practical" },
    href: { es: "/practica", en: "/en/practical" },
  },
];
