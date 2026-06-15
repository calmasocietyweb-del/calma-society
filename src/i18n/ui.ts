/**
 * Diccionarios de la INTERFAZ (menús, botones, etiquetas) por idioma.
 * El contenido editorial NO va aquí: vive en las content collections.
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
    "nav.about": "Quiénes somos",
    "nav.newsletter": "Newsletter",
    "lang.label": "Idioma",
    "a11y.skip": "Saltar al contenido",

    "common.readmore": "Leer más",
    "common.viewall": "Ver todo",
    "common.backhome": "Volver al inicio",

    "home.preview": "Vista previa de diseño",
    "home.hero.title": "Menorca, sin prisa.",
    "home.hero.subtitle":
      "Las experiencias, el criterio y la belleza de la isla — elevados. Una publicación de Calma Society.",
    "home.featured": "Selección del editor",
    "home.readmore": "Leer la historia",
    "home.agenda": "No te lo pierdas",
    "home.explore": "Explora la isla",

    "article.by": "Por",
    "article.published": "Publicado el",
    "article.updated": "Actualizado el",
    "article.related": "Lugares relacionados",
    "article.sponsored": "Contenido patrocinado",
    "article.insection": "En",

    "section.empty": "Pronto, más historias en esta sección.",

    "place.practical": "Información práctica",
    "place.access": "Acceso",
    "place.parking": "Aparcamiento",
    "place.services": "Servicios",
    "place.besttime": "Mejor época",
    "place.hours": "Horario",
    "place.area": "Zona",
    "place.viewmap": "Ver en el mapa",

    "agenda.upcoming": "Próximas citas",
    "agenda.empty": "No hay eventos publicados ahora mismo.",
    "agenda.when": "Cuándo",
    "agenda.where": "Dónde",

    "author.articlesby": "Artículos de",

    "newsletter.title": "Únete a Calma Society",
    "newsletter.text":
      "Cada quince días, lo mejor de Menorca con mirada de lujo tranquilo. Sin ruido.",
    "newsletter.placeholder": "Tu correo electrónico",
    "newsletter.cta": "Suscribirme",
    "newsletter.privacy": "Sin spam. Te das de baja cuando quieras.",

    "nav.contact": "Contacto",
    "contact.lead": "¿Tienes una historia, una propuesta o una colaboración en mente? Escríbenos.",
    "contact.name": "Nombre",
    "contact.email": "Correo electrónico",
    "contact.message": "Mensaje",
    "contact.send": "Enviar mensaje",
    "contact.directemail": "O escríbenos directamente a",
    "contact.sent": "¡Gracias! Te responderemos pronto.",

    "footer.about":
      "Calma Society — el arte del lujo tranquilo en el Mediterráneo. Primera edición: Menorca.",
    "footer.sections": "Secciones",
    "footer.more": "Más",
    "footer.follow": "Síguenos",
    "footer.rights": "Todos los derechos reservados.",
  },
  en: {
    "site.tagline": "The art of calm in Menorca.",
    "nav.home": "Home",
    "nav.menu": "Menu",
    "nav.about": "About",
    "nav.newsletter": "Newsletter",
    "lang.label": "Language",
    "a11y.skip": "Skip to content",

    "common.readmore": "Read more",
    "common.viewall": "View all",
    "common.backhome": "Back to home",

    "home.preview": "Design preview",
    "home.hero.title": "Menorca, unhurried.",
    "home.hero.subtitle":
      "The island's experiences, taste and beauty — elevated. A Calma Society publication.",
    "home.featured": "Editor's selection",
    "home.readmore": "Read the story",
    "home.agenda": "Don't miss",
    "home.explore": "Explore the island",

    "article.by": "By",
    "article.published": "Published on",
    "article.updated": "Updated on",
    "article.related": "Related places",
    "article.sponsored": "Sponsored content",
    "article.insection": "In",

    "section.empty": "More stories coming to this section soon.",

    "place.practical": "Practical information",
    "place.access": "Access",
    "place.parking": "Parking",
    "place.services": "Services",
    "place.besttime": "Best time",
    "place.hours": "Opening hours",
    "place.area": "Area",
    "place.viewmap": "View on map",

    "agenda.upcoming": "What's coming up",
    "agenda.empty": "No events published right now.",
    "agenda.when": "When",
    "agenda.where": "Where",

    "author.articlesby": "Articles by",

    "newsletter.title": "Join Calma Society",
    "newsletter.text":
      "Every fortnight, the best of Menorca through a quiet-luxury lens. No noise.",
    "newsletter.placeholder": "Your email address",
    "newsletter.cta": "Subscribe",
    "newsletter.privacy": "No spam. Unsubscribe anytime.",

    "nav.contact": "Contact",
    "contact.lead": "Have a story, a pitch or a collaboration in mind? Get in touch.",
    "contact.name": "Name",
    "contact.email": "Email",
    "contact.message": "Message",
    "contact.send": "Send message",
    "contact.directemail": "Or email us directly at",
    "contact.sent": "Thank you! We'll be in touch soon.",

    "footer.about":
      "Calma Society — the art of quiet luxury in the Mediterranean. First edition: Menorca.",
    "footer.sections": "Sections",
    "footer.more": "More",
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

// ---- Etiquetas de datos (tipos de lugar y categorías de evento) ----

const PLACE_TYPES: Record<string, Record<Locale, string>> = {
  cala: { es: "Cala", en: "Cove" },
  restaurante: { es: "Restaurante", en: "Restaurant" },
  alojamiento: { es: "Alojamiento", en: "Stay" },
  monumento: { es: "Monumento", en: "Monument" },
  comercio: { es: "Comercio", en: "Shop" },
  otro: { es: "Lugar", en: "Place" },
};

const EVENT_CATEGORIES: Record<string, Record<Locale, string>> = {
  fiesta: { es: "Fiesta", en: "Festival" },
  concierto: { es: "Concierto", en: "Concert" },
  mercado: { es: "Mercado", en: "Market" },
  deporte: { es: "Deporte", en: "Sport" },
  cultura: { es: "Cultura", en: "Culture" },
  gastronomia: { es: "Gastronomía", en: "Gastronomy" },
  otro: { es: "Evento", en: "Event" },
};

export function placeTypeLabel(type: string, locale: Locale): string {
  return PLACE_TYPES[type]?.[locale] ?? type;
}

export function eventCategoryLabel(cat: string, locale: Locale): string {
  return EVENT_CATEGORIES[cat]?.[locale] ?? cat;
}
