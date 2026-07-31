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
    "a11y.breadcrumb": "Ruta de navegación",

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

    // Índice de lugares (malla interna; ver lib/places.ts)
    "places.title": "Lugares de Menorca",
    "places.description":
      "El índice de la isla: calas, restaurantes, monumentos y rincones con criterio. Cada lugar, con su acceso, su aparcamiento y su mejor hora.",
    "places.intro":
      "Toda la isla, lugar a lugar. Calas con su acceso y su aparcamiento, mesas con criterio, monumentos y rincones que merecen el desvío.",
    "places.all": "Todos los lugares",
    "place.nearby": "Cerca de aquí",
    "place.nearby.all": "Ver todos los lugares",

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

    // Página de detalle de evento (KAN-102)
    "event.official": "Web oficial del evento",
    "event.all": "Ver toda la agenda",
    "event.upcoming": "Próximas citas",
    "event.related": "Para ir con contexto",

    "author.articlesby": "Artículos de",

    // Ofrecemos LA GUÍA, no una idea abstracta (28-jul-2026). El dato que lo
    // decidió: el formulario genérico convirtió 1 de 489 visitantes; la landing
    // del imán, 2 de 9 (22%). Lo que convence es algo concreto que se recibe.
    // La entrega es real: el alta entra en el grupo del imán, que dispara la
    // automatización de bienvenida con el PDF.
    "newsletter.eyebrow": "La guía, de bienvenida",
    "newsletter.title": "Las calas con menos gente",
    "newsletter.text":
      "Déjanos tu correo y te enviamos la guía: las calas de Menorca donde todavía se puede estar tranquilo, con cómo llegar y a qué hora ir. Después, alguna carta serena — solo cuando de verdad merece la pena.",
    // Gancho de la portada de Agenda (2ª página más vista). Mantiene el gancho de
    // eventos pero entrega la misma guía, que es lo que de verdad se envía.
    "newsletter.agenda.eyebrow": "No te lo pierdas",
    "newsletter.agenda.title": "No te pierdas lo que pasa en Menorca",
    "newsletter.agenda.text":
      "La isla no para: fiestas, conciertos y mercados todo el año. Únete a la Sociedad y te damos la bienvenida con la guía de las calas con menos gente. Sin ruido.",
    "newsletter.placeholder": "Tu correo electrónico",
    "newsletter.cta": "Quiero la guía",
    "newsletter.privacy": "Sin spam. Te das de baja cuando quieras.",
    // El alta es directa (opt-in simple con casilla de consentimiento): ya no hay
    // correo de confirmación, así que el texto no puede prometerlo (28-jul-2026).
    "newsletter.optinNote": "Te enviamos la guía y poco más. Puedes darte de baja cuando quieras.",
    "newsletter.optinDone": "Ya estás dentro. Te hemos enviado la guía al correo (mira también en spam).",
    "newsletter.optinError": "No hemos podido completar el alta. Inténtalo de nuevo en un momento.",
    "newsletter.consent": "Acepto recibir las noticias de la Sociedad y la",
    // Ya no hay paso de confirmación (opt-in simple, 28-jul-2026): la página de
    // gracias no puede pedir algo que no va a llegar.
    "thanks.title": "Ya estás en la Sociedad",
    "thanks.text":
      "Te hemos enviado la guía de las calas con menos gente al correo. Si no la ves en unos minutos, mira en spam. Después te escribiremos solo cuando de verdad merezca la pena.",
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
    "a11y.breadcrumb": "Breadcrumb",

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

    // Places index (internal mesh; see lib/places.ts)
    "places.title": "Places in Menorca",
    "places.description":
      "The island, place by place: coves, restaurants, monuments and corners worth the detour — each with its access, parking and best hour.",
    "places.intro":
      "The whole island, place by place. Coves with their access and parking, tables with judgement, monuments and corners worth the detour.",
    "places.all": "All places",
    "place.nearby": "Nearby",
    "place.nearby.all": "See all places",

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

    // Event detail page (KAN-102)
    "event.official": "Official event website",
    "event.all": "See everything that's on",
    "event.upcoming": "Coming up next",
    "event.related": "Read this first",

    "author.articlesby": "Articles by",

    // We offer THE GUIDE, not an abstract idea (28 Jul 2026). The number that
    // settled it: the generic form converted 1 of 489 visitors; the lead-magnet
    // landing, 2 of 9 (22%). What persuades is something concrete you receive.
    // Delivery is real: sign-ups join the lead-magnet group, which triggers the
    // welcome automation carrying the PDF.
    "newsletter.eyebrow": "The welcome guide",
    "newsletter.title": "Menorca's quietest coves",
    "newsletter.text":
      "Leave us your email and we'll send you the guide: the coves where you can still find room to breathe, with how to get there and when to go. After that, the occasional calm letter — only when it's genuinely worth it.",
    // Agenda hook (2nd most-viewed page). Keeps the events angle but delivers the
    // same guide, which is what actually gets sent.
    "newsletter.agenda.eyebrow": "Don't miss out",
    "newsletter.agenda.title": "Don't miss what's on in Menorca",
    "newsletter.agenda.text":
      "The island never rests: festivals, concerts and markets all year round. Join the Society and we'll welcome you with the guide to Menorca's quietest coves. No noise.",
    "newsletter.placeholder": "Your email address",
    "newsletter.cta": "Send me the guide",
    "newsletter.privacy": "No spam. Unsubscribe anytime.",
    "newsletter.optinNote": "We'll send you the guide and little else. Unsubscribe whenever you like.",
    "newsletter.optinDone": "You're in. We've sent the guide to your inbox (check spam too).",
    "newsletter.optinError": "We couldn't complete your sign-up. Please try again in a moment.",
    "newsletter.consent": "I agree to receive the Society's news and accept the",
    // No confirmation step any more (single opt-in, 28 Jul 2026): the thank-you
    // page can't ask for something that will never arrive.
    "thanks.title": "You're in the Society",
    "thanks.text":
      "We've sent the guide to Menorca's quietest coves to your inbox. If you don't see it within a few minutes, check your spam folder. After that, we'll only write when it's genuinely worth it.",
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
    "a11y.breadcrumb": "Fil d'Ariane",

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

    // Index des lieux (maillage interne ; voir lib/places.ts)
    "places.title": "Lieux de Minorque",
    "places.description":
      "L'île, lieu par lieu : criques, restaurants, monuments et coins qui valent le détour — chacun avec son accès, son parking et sa meilleure heure.",
    "places.intro":
      "Toute l'île, lieu par lieu. Des criques avec leur accès et leur parking, des tables avec du goût, des monuments et des coins qui valent le détour.",
    "places.all": "Tous les lieux",
    "place.nearby": "À proximité",
    "place.nearby.all": "Voir tous les lieux",

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

    // Page de détail d'événement (KAN-102)
    "event.official": "Site officiel de l'événement",
    "event.all": "Voir tout l'agenda",
    "event.upcoming": "Prochains rendez-vous",
    "event.related": "À lire avant d'y aller",

    "author.articlesby": "Articles de",

    "newsletter.eyebrow": "La Société",
    "newsletter.title": "Rejoignez la Société",
    // Copy honnête (accord du propriétaire, 24 juil.) : aucune newsletter
    // périodique n'est envoyée aujourd'hui, donc nous ne promettons NI cadence ni
    // publication continue. Seulement ce que l'abonné reçoit vraiment : inscription,
    // bienvenue et un e-mail ponctuel quand cela en vaut vraiment la peine.
    "newsletter.text":
      "Faites partie de la Société. Sans cadence imposée ni bruit : nous vous écrivons seulement quand il y a quelque chose qui en vaut vraiment la peine — le meilleur de Minorque, dans un regard de luxe tranquille.",
    // Accroche propre à l'Agenda (2e page la plus vue). Copy conservateur (accord
    // du propriétaire, 24 juil.) : nous ne promettons PAS de livraison de contenu
    // par e-mail — aucune newsletter périodique n'est envoyée aujourd'hui. Reprend
    // le même CTA de la Société.
    "newsletter.agenda.eyebrow": "Ne manquez rien",
    "newsletter.agenda.title": "Ne manquez rien de ce qui se passe à Minorque",
    "newsletter.agenda.text":
      "L'île ne s'arrête jamais : fêtes, concerts et marchés toute l'année. Rejoignez la Société et gardez Minorque tout près, dans un regard de luxe tranquille. Sans bruit.",
    "newsletter.placeholder": "Votre adresse e-mail",
    "newsletter.cta": "Rejoindre la Société",
    "newsletter.privacy": "Pas de spam. Désabonnement quand vous voulez.",
    // ⚠️ En français il n'existe encore NI guide NI automatisation de bienvenue
    // (28 juil. 2026) : ce copy ne doit donc rien promettre qui n'arrivera pas.
    // À corriger dès que la guide existera en français.
    "newsletter.optinNote": "Uniquement la lettre de la Société. Vous pouvez vous désabonner quand vous voulez.",
    "newsletter.optinDone": "C'est fait : vous faites partie de la Société. Nous vous écrirons seulement quand cela en vaudra la peine.",
    "newsletter.optinError": "Nous n'avons pas pu finaliser votre inscription. Réessayez dans un instant.",
    "newsletter.consent": "J'accepte de recevoir les nouvelles de la Société et la",
    "thanks.title": "Vous faites partie de la Société",
    "thanks.text":
      "Votre inscription est enregistrée. Nous vous écrirons seulement quand il y aura quelque chose qui en vaut vraiment la peine — le meilleur de Minorque, dans un regard de luxe tranquille.",
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

/** Etiquetas en PLURAL: encabezados de los grupos del índice de lugares. */
const PLACE_TYPES_PLURAL: Record<string, Record<Locale, string>> = {
  cala: { es: "Calas y playas", en: "Coves & beaches", fr: "Criques et plages" },
  restaurante: { es: "Mesas con criterio", en: "Tables with judgement", fr: "Tables de caractère" },
  alojamiento: { es: "Alojamientos", en: "Stays", fr: "Hébergements" },
  monumento: { es: "Monumentos y patrimonio", en: "Monuments & heritage", fr: "Monuments et patrimoine" },
  comercio: { es: "Comercios y ocio", en: "Shops & nightlife", fr: "Boutiques et sorties" },
  otro: { es: "Pueblos y otros lugares", en: "Villages & other places", fr: "Villages et autres lieux" },
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

export function placeTypePlural(type: string, locale: Locale): string {
  return PLACE_TYPES_PLURAL[type]?.[locale] ?? type;
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
