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
    "brand.tagline": "El Mediterráneo, sin prisa",
    "nav.home": "Inicio",
    "nav.menu": "Menú",
    "nav.about": "Quiénes somos",
    "nav.newsletter": "La Sociedad",
    "lang.label": "Idioma",
    "a11y.skip": "Saltar al contenido",
    "a11y.close": "Cerrar",

    "common.readmore": "Leer más",
    "common.viewall": "Ver todo",
    "common.backhome": "Volver al inicio",

    "home.preview": "Vista previa de diseño",
    "home.hero.title": "Menorca, sin prisa.",
    "home.hero.subtitle":
      "Las experiencias, el criterio y la belleza de la isla — elevados. Una publicación de Calma Society.",
    "home.featured": "Selección del editor",
    "home.readmore": "Leer la historia",
    "home.discover.eyebrow": "Lo esencial de la isla",
    "home.discover.title": "Calas, playas y naturaleza",
    "home.agenda": "No te lo pierdas",
    "home.agenda.eyebrow": "Agenda",
    "home.explore": "Explora la isla",
    "home.explore.eyebrow": "Secciones",
    "home.sections.intro": "Seis maneras de mirar Menorca, todas con criterio.",
    "home.manifesto":
      "Calma Society no es una guía más: es una mirada de lujo tranquilo sobre Menorca y una sociedad de quienes la aman sin prisa. Criterio, experiencias elegidas con calma y la isla los 365 días del año. Bienvenido a la Sociedad.",
    "home.manifesto.cta": "Conoce la Sociedad",

    "article.by": "Por",
    "article.published": "Publicado el",
    "article.updated": "Actualizado el",
    "article.related": "Lugares relacionados",
    "article.keepreading": "Sigue leyendo",
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
    "agenda.all": "Todas",
    "agenda.filterlabel": "Filtrar por tipo de experiencia",
    "agenda.empty": "No hay eventos publicados ahora mismo.",
    "agenda.when": "Cuándo",
    "agenda.where": "Dónde",

    "author.articlesby": "Artículos de",

    "newsletter.eyebrow": "La Sociedad",
    "newsletter.title": "Forma parte de la Sociedad",
    "newsletter.text":
      "Mantente conectado a Calma Society: cada quince días, las noticias de la Sociedad y lo mejor de Menorca, con mirada de lujo tranquilo. Sin ruido.",
    "newsletter.placeholder": "Tu correo electrónico",
    "newsletter.cta": "Unirme a la Sociedad",
    "newsletter.privacy": "Sin spam. Te das de baja cuando quieras.",
    "newsletter.consent": "Acepto recibir las noticias de la Sociedad y la",
    "thanks.title": "Bienvenido a la Sociedad",
    "thanks.text":
      "Gracias por unirte. Ya formas parte de los fundadores de Calma Society: te escribiremos con calma, solo cuando tengamos algo que de verdad merezca tu tiempo.",
    "thanks.back": "Volver a la portada",

    "nav.contact": "Contacto",
    "contact.lead": "¿Tienes una historia, una propuesta o una colaboración en mente? Escríbenos.",
    "contact.name": "Nombre",
    "contact.email": "Correo electrónico",
    "contact.message": "Mensaje",
    "contact.send": "Enviar mensaje",
    "contact.directemail": "O escríbenos directamente a",
    "contact.sent": "¡Gracias! Te responderemos pronto.",
    "contact.consent": "He leído y acepto la",
    "contact.consentLink": "Política de privacidad",

    "footer.about":
      "Calma Society — el arte del lujo tranquilo en el Mediterráneo. Primera edición: Menorca.",
    "footer.sections": "Secciones",
    "footer.more": "Más",
    "footer.follow": "Síguenos",
    "footer.rights": "Todos los derechos reservados.",
  },
  en: {
    "site.tagline": "The art of calm in Menorca.",
    "brand.tagline": "The Mediterranean, at ease",
    "nav.home": "Home",
    "nav.menu": "Menu",
    "nav.about": "About",
    "nav.newsletter": "The Society",
    "lang.label": "Language",
    "a11y.skip": "Skip to content",
    "a11y.close": "Close",

    "common.readmore": "Read more",
    "common.viewall": "View all",
    "common.backhome": "Back to home",

    "home.preview": "Design preview",
    "home.hero.title": "Menorca, unhurried.",
    "home.hero.subtitle":
      "The island's experiences, taste and beauty — elevated. A Calma Society publication.",
    "home.featured": "Editor's selection",
    "home.readmore": "Read the story",
    "home.discover.eyebrow": "The island's essentials",
    "home.discover.title": "Coves, beaches & nature",
    "home.agenda": "Don't miss",
    "home.agenda.eyebrow": "Diary",
    "home.explore": "Explore the island",
    "home.explore.eyebrow": "Sections",
    "home.sections.intro": "Six ways of looking at Menorca, all with judgement.",
    "home.manifesto":
      "Calma Society isn't just another guide: it's a quiet-luxury look at Menorca and a society of those who love it unhurried. Judgement, experiences chosen with calm and the island 365 days a year. Welcome to the Society.",
    "home.manifesto.cta": "Discover the Society",

    "article.by": "By",
    "article.published": "Published on",
    "article.updated": "Updated on",
    "article.related": "Related places",
    "article.keepreading": "Keep reading",
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
    "agenda.all": "All",
    "agenda.filterlabel": "Filter by type of experience",
    "agenda.empty": "No events published right now.",
    "agenda.when": "When",
    "agenda.where": "Where",

    "author.articlesby": "Articles by",

    "newsletter.eyebrow": "The Society",
    "newsletter.title": "Become part of the Society",
    "newsletter.text":
      "Stay connected to Calma Society: every fortnight, the Society's news and the best of Menorca, through a quiet-luxury lens. No noise.",
    "newsletter.placeholder": "Your email address",
    "newsletter.cta": "Join the Society",
    "newsletter.privacy": "No spam. Unsubscribe anytime.",
    "newsletter.consent": "I agree to receive the Society's news and accept the",
    "thanks.title": "Welcome to the Society",
    "thanks.text":
      "Thank you for joining. You're now among the founders of Calma Society: we'll write to you calmly, only when we have something truly worth your time.",
    "thanks.back": "Back to home",

    "nav.contact": "Contact",
    "contact.lead": "Have a story, a pitch or a collaboration in mind? Get in touch.",
    "contact.name": "Name",
    "contact.email": "Email",
    "contact.message": "Message",
    "contact.send": "Send message",
    "contact.directemail": "Or email us directly at",
    "contact.sent": "Thank you! We'll be in touch soon.",
    "contact.consent": "I have read and accept the",
    "contact.consentLink": "Privacy policy",

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

// ---- Tipos de EXPERIENCIA (agrupación de alto nivel para el buscador de la
// agenda). Se derivan de la `category` del evento; la clave del tipo ES la
// propia categoría, para poder filtrar por ella. El orden marca el de los chips.
export const EXPERIENCE_TYPES = [
  { key: "fiesta", label: { es: "Fiestas de pueblo", en: "Town festivals" } },
  { key: "concierto", label: { es: "Música", en: "Music" } },
  { key: "cultura", label: { es: "Cultura", en: "Culture" } },
  { key: "deporte", label: { es: "Naturaleza y deporte", en: "Nature & sport" } },
  { key: "mercado", label: { es: "Mercados y ferias", en: "Markets & fairs" } },
  { key: "gastronomia", label: { es: "Gastronomía", en: "Food & drink" } },
  { key: "otro", label: { es: "Otros", en: "Other" } },
] as const;

export function experienceTypeLabel(category: string, locale: Locale): string {
  const exp = EXPERIENCE_TYPES.find((e) => e.key === category);
  return exp?.label[locale] ?? eventCategoryLabel(category, locale);
}
