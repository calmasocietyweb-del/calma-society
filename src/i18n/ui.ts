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
    "site.tagline": "El Mediterráneo, sin prisa",
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
    "place.bestfor": "Ideal para",
    "place.goodtoknow": "Bueno saber",
    "place.what": "Qué ver y hacer",
    "place.getthere": "Cómo llegar",
    "place.effort": "Esfuerzo",
    "place.duration": "Tiempo orientativo",
    "place.season": "Temporada y horarios",
    "place.reserve": "Reserva",
    "place.reserve.yes": "Recomendada — confirma en la web oficial",
    "place.official": "Web oficial",
    "place.verified": "Datos verificados el",
    "place.verified.note": "confirma horarios y accesos el día de tu visita",
    "place.planit.title": "Encájalo en tu viaje",
    "place.planit.text":
      "El planificador arma tu itinerario de Menorca día a día —este lugar incluido— encadenado por cercanía y sin prisas.",
    "place.planit.cta": "Organiza tu viaje",
    "place.transfer.eyebrow": "Llega con chófer",
    "place.transfer.title": "Te llevamos y te recogemos",
    "place.transfer.text":
      "En los acantilados del atardecer y en los puertos casi nunca hay dónde aparcar —y de noche conducir es lo último que apetece—. Te recogemos en un Mercedes Clase S o Clase V con chófer privado, del primer atardecer al último cóctel.",
    "place.transfer.cta": "Reserva con Menorca Bus",

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
    "newsletter.doubleOptin": "Te llegará un correo para confirmar tu suscripción (revisa también spam).",
    "newsletter.optinDone": "Casi listo: te hemos enviado un correo para confirmar. Ábrelo y confirma (mira en spam).",
    "newsletter.optinError": "No hemos podido completar el alta. Inténtalo de nuevo en un momento.",
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
      "Calma Society — el Mediterráneo, sin prisa: una mirada de lujo tranquilo sobre Menorca. Primera edición.",
    "footer.sections": "Secciones",
    "footer.more": "Más",
    "footer.follow": "Síguenos",
    "footer.rights": "Todos los derechos reservados.",
  },
  en: {
    "site.tagline": "The Mediterranean, at ease",
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
    "place.bestfor": "Good for",
    "place.goodtoknow": "Good to know",
    "place.what": "What to see and do",
    "place.getthere": "Getting there",
    "place.effort": "Effort",
    "place.duration": "Suggested time",
    "place.season": "Season & opening times",
    "place.reserve": "Booking",
    "place.reserve.yes": "Recommended — confirm on the official site",
    "place.official": "Official site",
    "place.verified": "Facts checked on",
    "place.verified.note": "confirm times and access on the day of your visit",
    "place.planit.title": "Fit it into your trip",
    "place.planit.text":
      "The trip planner builds your day-by-day Menorca itinerary —this place included— chained by proximity and unhurried.",
    "place.planit.cta": "Plan your trip",
    "place.transfer.eyebrow": "Arrive with a chauffeur",
    "place.transfer.title": "We'll drive you there and back",
    "place.transfer.text":
      "On the sunset cliffs and around the harbours there's almost nowhere to park —and at night, driving is the last thing you want. We pick you up in a Mercedes S-Class or V-Class with a private chauffeur, from the first sunset to the last cocktail.",
    "place.transfer.cta": "Book with Menorca Bus",

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
    "newsletter.doubleOptin": "You'll get an email to confirm your subscription (check spam too).",
    "newsletter.optinDone": "Almost there: we've sent you an email to confirm. Open it and confirm (check spam).",
    "newsletter.optinError": "We couldn't complete your sign-up. Please try again in a moment.",
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
      "Calma Society — the Mediterranean, at ease: a quiet-luxury look at Menorca. Our first edition.",
    "footer.sections": "Sections",
    "footer.more": "More",
    "footer.follow": "Follow us",
    "footer.rights": "All rights reserved.",
  },
  fr: {
    "site.tagline": "La Méditerranée, sans hâte",
    "brand.tagline": "La Méditerranée, sans hâte",
    "nav.home": "Accueil",
    "nav.menu": "Menu",
    "nav.about": "À propos",
    "nav.newsletter": "La Société",
    "lang.label": "Langue",
    "a11y.skip": "Aller au contenu",
    "a11y.close": "Fermer",

    "common.readmore": "Lire la suite",
    "common.viewall": "Tout voir",
    "common.backhome": "Retour à l'accueil",

    "home.preview": "Aperçu du design",
    "home.hero.title": "Minorque, sans hâte.",
    "home.hero.subtitle":
      "Les expériences, le goût et la beauté de l'île — sublimés. Une publication de Calma Society.",
    "home.featured": "La sélection de la rédaction",
    "home.readmore": "Lire l'histoire",
    "home.discover.eyebrow": "L'essentiel de l'île",
    "home.discover.title": "Criques, plages et nature",
    "home.agenda": "À ne pas manquer",
    "home.agenda.eyebrow": "Agenda",
    "home.explore": "Explorer l'île",
    "home.explore.eyebrow": "Rubriques",
    "home.sections.intro": "Six façons de regarder Minorque, toutes avec discernement.",
    "home.manifesto":
      "Calma Society n'est pas un guide de plus : c'est un regard de luxe tranquille sur Minorque et une société de ceux qui l'aiment sans hâte. Du discernement, des expériences choisies avec calme et l'île 365 jours par an. Bienvenue dans la Société.",
    "home.manifesto.cta": "Découvrir la Société",

    "article.by": "Par",
    "article.published": "Publié le",
    "article.updated": "Mis à jour le",
    "article.related": "Lieux associés",
    "article.keepreading": "À lire aussi",
    "article.sponsored": "Contenu sponsorisé",
    "article.insection": "Dans",

    "section.empty": "Bientôt, d'autres histoires dans cette rubrique.",

    "place.practical": "Informations pratiques",
    "place.access": "Accès",
    "place.parking": "Stationnement",
    "place.services": "Services",
    "place.besttime": "Meilleure période",
    "place.hours": "Horaires",
    "place.area": "Zone",
    "place.viewmap": "Voir sur la carte",
    "place.bestfor": "Idéal pour",
    "place.goodtoknow": "Bon à savoir",
    "place.what": "À voir et à faire",
    "place.getthere": "Y aller",
    "place.effort": "Effort",
    "place.duration": "Durée indicative",
    "place.season": "Saison et horaires",
    "place.reserve": "Réservation",
    "place.reserve.yes": "Conseillée — à confirmer sur le site officiel",
    "place.official": "Site officiel",
    "place.verified": "Données vérifiées le",
    "place.verified.note": "confirmez horaires et accès le jour de votre visite",
    "place.planit.title": "Intégrez-le à votre voyage",
    "place.planit.text":
      "Le planificateur compose votre itinéraire de Minorque jour par jour —ce lieu compris— par proximité et sans hâte.",
    "place.planit.cta": "Organisez votre voyage",
    "place.transfer.eyebrow": "Arrivez avec chauffeur",
    "place.transfer.title": "On vous emmène et on vous ramène",
    "place.transfer.text":
      "Sur les falaises du coucher de soleil et autour des ports, il n'y a presque jamais où se garer —et le soir, conduire est bien la dernière chose dont on a envie—. On vient vous chercher en Mercedes Classe S ou Classe V avec chauffeur privé, du premier coucher de soleil au dernier cocktail.",
    "place.transfer.cta": "Réservez avec Menorca Bus",

    "agenda.upcoming": "À venir",
    "agenda.all": "Tout",
    "agenda.filterlabel": "Filtrer par type d'expérience",
    "agenda.empty": "Aucun événement publié pour le moment.",
    "agenda.when": "Quand",
    "agenda.where": "Où",

    "author.articlesby": "Articles de",

    "newsletter.eyebrow": "La Société",
    "newsletter.title": "Rejoignez la Société",
    "newsletter.text":
      "Restez connecté à Calma Society : tous les quinze jours, les nouvelles de la Société et le meilleur de Minorque, dans un regard de luxe tranquille. Sans bruit.",
    "newsletter.placeholder": "Votre adresse e-mail",
    "newsletter.cta": "Rejoindre la Société",
    "newsletter.privacy": "Pas de spam. Désabonnement quand vous voulez.",
    "newsletter.doubleOptin": "Vous recevrez un e-mail pour confirmer votre abonnement (vérifiez aussi les spams).",
    "newsletter.optinDone": "Presque terminé : nous vous avons envoyé un e-mail de confirmation. Ouvrez-le et confirmez (regardez dans les spams).",
    "newsletter.optinError": "Nous n'avons pas pu finaliser votre inscription. Réessayez dans un instant.",
    "newsletter.consent": "J'accepte de recevoir les nouvelles de la Société et la",
    "thanks.title": "Bienvenue dans la Société",
    "thanks.text":
      "Merci de nous avoir rejoints. Vous faites désormais partie des fondateurs de Calma Society : nous vous écrirons avec calme, seulement quand nous aurons quelque chose qui mérite vraiment votre temps.",
    "thanks.back": "Retour à l'accueil",

    "nav.contact": "Contact",
    "contact.lead": "Une histoire, une proposition ou une collaboration en tête ? Écrivez-nous.",
    "contact.name": "Nom",
    "contact.email": "E-mail",
    "contact.message": "Message",
    "contact.send": "Envoyer le message",
    "contact.directemail": "Ou écrivez-nous directement à",
    "contact.sent": "Merci ! Nous vous répondrons bientôt.",
    "contact.consent": "J'ai lu et j'accepte la",
    "contact.consentLink": "Politique de confidentialité",

    "footer.about":
      "Calma Society — la Méditerranée, sans hâte : un regard de luxe tranquille sur Minorque. Notre première édition.",
    "footer.sections": "Rubriques",
    "footer.more": "Plus",
    "footer.follow": "Suivez-nous",
    "footer.rights": "Tous droits réservés.",
  },
} satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)["es"];

/** Devuelve una función de traducción `t('clave')` para el idioma dado. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return (ui[locale] as Record<string, string>)[key] ?? ui[SITE.defaultLocale][key];
  };
}

/**
 * Devuelve `obj[locale]` con fallback en cascada fr→en→es. Para datos
 * localizados en un solo registro `{ es, en, fr? }` (p. ej. autores), donde el
 * francés es de despliegue por mercados y puede faltar todavía.
 */
export function pick<T>(obj: Partial<Record<Locale, T>>, locale: Locale): T {
  return (obj[locale] ?? obj.en ?? obj.es) as T;
}

// ---- Etiquetas de datos (tipos de lugar y categorías de evento) ----

const PLACE_TYPES: Record<string, Record<Locale, string>> = {
  cala: { es: "Cala", en: "Cove", fr: "Crique" },
  restaurante: { es: "Restaurante", en: "Restaurant", fr: "Restaurant" },
  alojamiento: { es: "Alojamiento", en: "Stay", fr: "Hébergement" },
  monumento: { es: "Monumento", en: "Monument", fr: "Monument" },
  comercio: { es: "Comercio", en: "Shop", fr: "Boutique" },
  otro: { es: "Lugar", en: "Place", fr: "Lieu" },
};

const EVENT_CATEGORIES: Record<string, Record<Locale, string>> = {
  fiesta: { es: "Fiesta", en: "Festival", fr: "Fête" },
  concierto: { es: "Concierto", en: "Concert", fr: "Concert" },
  mercado: { es: "Mercado", en: "Market", fr: "Marché" },
  deporte: { es: "Deporte", en: "Sport", fr: "Sport" },
  cultura: { es: "Cultura", en: "Culture", fr: "Culture" },
  gastronomia: { es: "Gastronomía", en: "Gastronomy", fr: "Gastronomie" },
  otro: { es: "Evento", en: "Event", fr: "Événement" },
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
  { key: "fiesta", label: { es: "Fiestas de pueblo", en: "Town festivals", fr: "Fêtes de village" } },
  { key: "concierto", label: { es: "Música", en: "Music", fr: "Musique" } },
  { key: "cultura", label: { es: "Cultura", en: "Culture", fr: "Culture" } },
  { key: "deporte", label: { es: "Naturaleza y deporte", en: "Nature & sport", fr: "Nature et sport" } },
  { key: "mercado", label: { es: "Mercados y ferias", en: "Markets & fairs", fr: "Marchés et foires" } },
  { key: "gastronomia", label: { es: "Gastronomía", en: "Food & drink", fr: "Gastronomie" } },
  { key: "otro", label: { es: "Otros", en: "Other", fr: "Autres" } },
] as const;

export function experienceTypeLabel(category: string, locale: Locale): string {
  const exp = EXPERIENCE_TYPES.find((e) => e.key === category);
  return exp?.label[locale] ?? eventCategoryLabel(category, locale);
}
