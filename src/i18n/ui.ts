/**
 * Diccionarios de la INTERFAZ (menús, botones, etiquetas) por idioma.
 * El contenido editorial NO va aquí: vive en las content collections (Fase 2).
 *
 * Para añadir un idioma: añade su bloque con las mismas claves.
 * (Ver docs/ESTRATEGIA-MULTIIDIOMA.md)
 */
import { SITE, type Locale } from "../config/site";

export const ui = {
  es: {
    "site.tagline": "El arte de la calma en Menorca.",
    "nav.home": "Inicio",
    "nav.menu": "Menú",
    "lang.label": "Idioma",
    "a11y.skip": "Saltar al contenido",

    "home.preview": "Vista previa de diseño · contenido de muestra",
    "home.hero.title": "Menorca, sin prisa.",
    "home.hero.subtitle":
      "Las experiencias, el criterio y la belleza de la isla — elevados. Una publicación de Calma Society.",
    "home.featured": "Selección del editor",
    "home.readmore": "Leer la historia",

    "newsletter.title": "Únete a Calma Society",
    "newsletter.text":
      "Cada quince días, lo mejor de Menorca con mirada de lujo tranquilo. Sin ruido.",
    "newsletter.placeholder": "Tu correo electrónico",
    "newsletter.cta": "Suscribirme",
    "newsletter.privacy": "Sin spam. Te das de baja cuando quieras.",

    "footer.about":
      "Calma Society — el arte del lujo tranquilo en el Mediterráneo. Primera edición: Menorca.",
    "footer.sections": "Secciones",
    "footer.follow": "Síguenos",
    "footer.rights": "Todos los derechos reservados.",
  },
  en: {
    "site.tagline": "The art of calm in Menorca.",
    "nav.home": "Home",
    "nav.menu": "Menu",
    "lang.label": "Language",
    "a11y.skip": "Skip to content",

    "home.preview": "Design preview · sample content",
    "home.hero.title": "Menorca, unhurried.",
    "home.hero.subtitle":
      "The island's experiences, taste and beauty — elevated. A Calma Society publication.",
    "home.featured": "Editor's selection",
    "home.readmore": "Read the story",

    "newsletter.title": "Join Calma Society",
    "newsletter.text":
      "Every fortnight, the best of Menorca through a quiet-luxury lens. No noise.",
    "newsletter.placeholder": "Your email address",
    "newsletter.cta": "Subscribe",
    "newsletter.privacy": "No spam. Unsubscribe anytime.",

    "footer.about":
      "Calma Society — the art of quiet luxury in the Mediterranean. First edition: Menorca.",
    "footer.sections": "Sections",
    "footer.follow": "Follow us",
    "footer.rights": "All rights reserved.",
  },
} satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)["es"];

/** Devuelve una función de traducción `t('clave')` para el idioma dado. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui[SITE.defaultLocale][key];
  };
}
