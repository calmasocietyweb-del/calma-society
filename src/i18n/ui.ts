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
    // Fichas de experiencia (no de negocio): nombramos al operador en vez de
    // llamarlo "web oficial", porque no podemos afirmar que sea EL negocio de
    // la ficha (KAN-60). "%s" = nombre del operador.
    "place.reserve.yes.operator": "Recomendada — la hace %s",
    "place.official": "Web oficial",
    "place.operator": "Web de %s",
    "place.owner": "¿Es tu negocio? Corrígenos los datos",
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
    "newsletter.title": "Las playas famosas de Menorca",
    "newsletter.text":
      "Déjanos tu correo y te enviamos la guía: las seis playas que todo el mundo quiere ver, con cómo llegar y a qué hora dejan de estar llenas. Después, alguna carta serena — solo cuando de verdad merece la pena.",
    // Gancho de la portada de Agenda (2ª página más vista). Mantiene el gancho de
    // eventos pero entrega la misma guía, que es lo que de verdad se envía.
    "newsletter.agenda.eyebrow": "No te lo pierdas",
    "newsletter.agenda.title": "No te pierdas lo que pasa en Menorca",
    "newsletter.agenda.text":
      "La isla no para: fiestas, conciertos y mercados todo el año. Únete a la Sociedad y te damos la bienvenida con la guía de las playas famosas y la hora a la que se vacían. Sin ruido.",
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
      "Te hemos enviado al correo la guía de las playas famosas de Menorca. Si no la ves en unos minutos, mira en spam. Después te escribiremos solo cuando de verdad merezca la pena.",
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

    // Puerta de entrada para negocios de la isla. La ficha editorial es
    // gratuita; el día que haya tarifa, lo pagado se etiqueta (CLAUDE.md §3.8).
    "business.nav": "Para negocios",
    "business.title": "¿Tienes un negocio en Menorca?",
    "business.lead":
      "Escribimos fichas de los sitios que nos gustan: una foto, un texto con criterio, tus datos, el enlace a tu web y los datos estructurados que Google necesita para enseñarte bien. En español e inglés, y dentro del planificador de viajes. Hoy no cuesta nada.",
    "business.rules.title": "Lo que no se compra",
    "business.rules.body":
      "El puesto, el orden y la opinión no se pagan nunca. El día que haya una tarifa, lo que se pague irá etiquetado y separado de lo editorial. Eso es justamente lo que hace que esta guía valga algo para quien la lee.",
    "business.field.business": "Nombre del negocio",
    "business.field.type": "Tipo",
    "business.type.restaurante": "Restaurante o bar",
    "business.type.alojamiento": "Hotel, agroturismo o alojamiento",
    "business.type.experiencia": "Experiencia, náutica o excursión",
    "business.type.producto": "Productor, bodega o quesería",
    "business.type.comercio": "Comercio o taller",
    "business.type.otro": "Otro",
    "business.field.website": "Web",
    "business.field.season": "Meses que abrís",
    "business.field.seasonHelp": "En Menorca media isla cierra en invierno y casi ninguna guía lo mantiene al día.",
    "business.field.what": "Qué hacéis distinto",
    "business.field.whatHelp":
      "Una o dos frases, sin adornos. Es lo que de verdad decide si escribimos sobre vosotros. Si ya tenéis ficha y hay algo mal, contadlo aquí.",
    "business.field.person": "Tu nombre",
    "business.send": "Enviar",

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
    "place.reserve.yes.operator": "Recommended — run by %s",
    "place.official": "Official site",
    "place.operator": "%s’s site",
    "place.owner": "Is this your business? Send us a correction",
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
    "newsletter.title": "Menorca's famous beaches",
    "newsletter.text":
      "Leave us your email and we'll send you the guide: the six beaches everyone wants to see, with how to get there and the hour at which they stop being full. After that, the occasional calm letter — only when it's genuinely worth it.",
    // Agenda hook (2nd most-viewed page). Keeps the events angle but delivers the
    // same guide, which is what actually gets sent.
    "newsletter.agenda.eyebrow": "Don't miss out",
    "newsletter.agenda.title": "Don't miss what's on in Menorca",
    "newsletter.agenda.text":
      "The island never rests: festivals, concerts and markets all year round. Join the Society and we'll welcome you with the guide to Menorca's famous beaches and the hour they empty out. No noise.",
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
      "We've sent the guide to Menorca's famous beaches to your inbox. If you don't see it within a few minutes, check your spam folder. After that, we'll only write when it's genuinely worth it.",
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

    "business.nav": "For businesses",
    "business.title": "Do you run a business in Menorca?",
    "business.lead":
      "We write listings for the places we like: a photograph, a description with judgement, your details, a link to your site and the structured data Google needs to display you properly. In Spanish and English, and inside the trip planner. Today it costs nothing.",
    "business.rules.title": "What is not for sale",
    "business.rules.body":
      "Placement, order and opinion are never paid for. The day there is a rate, whatever is paid will be labelled and kept apart from the editorial. That is precisely what makes this guide worth anything to the person reading it.",
    "business.field.business": "Business name",
    "business.field.type": "Type",
    "business.type.restaurante": "Restaurant or bar",
    "business.type.alojamiento": "Hotel, agrotourism or other stay",
    "business.type.experiencia": "Experience, boating or excursion",
    "business.type.producto": "Producer, winery or cheese dairy",
    "business.type.comercio": "Shop or workshop",
    "business.type.otro": "Other",
    "business.field.website": "Website",
    "business.field.season": "Months you open",
    "business.field.seasonHelp": "Half the island closes in winter and almost no guide keeps that up to date.",
    "business.field.what": "What you do differently",
    "business.field.whatHelp":
      "One or two sentences, plainly put. This is what really decides whether we write about you. If you already have a listing and something is wrong, tell us here.",
    "business.field.person": "Your name",
    "business.send": "Send",

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
    "place.reserve.yes.operator": "Conseillée — assurée par %s",
    "place.official": "Site officiel",
    "place.operator": "Site de %s",
    "place.owner": "C’est votre établissement ? Signalez-nous une correction",
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

    "business.nav": "Pour les professionnels",
    "business.title": "Vous avez une activité à Minorque ?",
    "business.lead":
      "Nous écrivons des fiches sur les lieux qui nous plaisent : une photo, un texte avec un point de vue, vos coordonnées, le lien vers votre site et les données structurées dont Google a besoin pour bien vous afficher. En espagnol et en anglais, et dans le planificateur de voyage. Aujourd’hui, c’est gratuit.",
    "business.rules.title": "Ce qui ne s’achète pas",
    "business.rules.body":
      "La place, l’ordre et l’avis ne se paient jamais. Le jour où il y aura un tarif, ce qui sera payé sera signalé et séparé de l’éditorial. C’est précisément ce qui donne de la valeur à ce guide pour celui qui le lit.",
    "business.field.business": "Nom de l’établissement",
    "business.field.type": "Type",
    "business.type.restaurante": "Restaurant ou bar",
    "business.type.alojamiento": "Hôtel, agrotourisme ou hébergement",
    "business.type.experiencia": "Expérience, nautisme ou excursion",
    "business.type.producto": "Producteur, cave ou fromagerie",
    "business.type.comercio": "Commerce ou atelier",
    "business.type.otro": "Autre",
    "business.field.website": "Site web",
    "business.field.season": "Mois d’ouverture",
    "business.field.seasonHelp": "À Minorque, la moitié de l’île ferme en hiver et presque aucun guide ne le tient à jour.",
    "business.field.what": "Ce que vous faites différemment",
    "business.field.whatHelp":
      "Une ou deux phrases, sans fioritures. C’est ce qui décide vraiment si nous écrivons sur vous. Si vous avez déjà une fiche et qu’une information est erronée, dites-le ici.",
    "business.field.person": "Votre nom",
    "business.send": "Envoyer",

    "footer.about":
      "Calma Society — la Méditerranée, sans hâte : un regard de luxe tranquille sur Minorque. Notre première édition.",
    "footer.sections": "Rubriques",
    "footer.more": "Plus",
    "footer.follow": "Suivez-nous",
    "footer.rights": "Tous droits réservés.",
  },
  de: {
    "site.tagline": "Das Mittelmeer, ohne Eile",
    "brand.tagline": "Das Mittelmeer, ohne Eile",
    "nav.home": "Startseite",
    "nav.menu": "Menü",
    "nav.about": "Über uns",
    "nav.newsletter": "Die Society",
    "lang.label": "Sprache",
    "a11y.skip": "Zum Inhalt springen",
    "a11y.close": "Schließen",
    "a11y.breadcrumb": "Navigationspfad",

    "common.readmore": "Weiterlesen",
    "common.viewall": "Alle ansehen",
    "common.backhome": "Zurück zur Startseite",

    "home.preview": "Design-Vorschau",
    "home.hero.title": "Menorca, ohne Eile.",
    "home.hero.subtitle":
      "Die Erlebnisse, das Gespür und die Schönheit der Insel — gehoben. Eine Publikation von Calma Society.",
    "home.featured": "Auswahl der Redaktion",
    "home.readmore": "Die Geschichte lesen",
    "home.discover.eyebrow": "Das Wesentliche der Insel",
    "home.discover.title": "Buchten, Strände und Natur",
    "home.agenda": "Nicht verpassen",
    "home.agenda.eyebrow": "Termine",
    "home.explore": "Die Insel entdecken",
    "home.explore.eyebrow": "Rubriken",
    "home.sections.intro": "Sechs Blickwinkel auf Menorca, alle mit Gespür.",
    "home.manifesto":
      "Calma Society ist kein weiterer Reiseführer: Es ist ein Blick auf Menorca im Zeichen des stillen Luxus — und eine Gemeinschaft derer, die die Insel ohne Eile lieben. Gespür, in Ruhe gewählte Erlebnisse und die Insel an 365 Tagen im Jahr. Willkommen in der Society.",
    "home.manifesto.cta": "Die Society entdecken",

    "article.by": "Von",
    "article.published": "Veröffentlicht am",
    "article.updated": "Aktualisiert am",
    "article.related": "Passende Orte",
    "article.keepreading": "Auch lesenswert",
    "article.sponsored": "Gesponserter Inhalt",
    "article.insection": "In",

    "section.empty": "Bald mehr Geschichten in dieser Rubrik.",

    // Ortsverzeichnis (interne Verlinkung; siehe lib/places.ts)
    "places.title": "Orte auf Menorca",
    "places.description":
      "Die Insel, Ort für Ort: Buchten, Restaurants, Baudenkmäler und Winkel, für die sich der Umweg lohnt — jeweils mit Anfahrt, Parkmöglichkeit und der besten Uhrzeit.",
    "places.intro":
      "Die ganze Insel, Ort für Ort. Buchten mit Anfahrt und Parkmöglichkeit, Tische mit Gespür, Baudenkmäler und Winkel, für die sich der Umweg lohnt.",
    "places.all": "Alle Orte",
    "place.nearby": "In der Nähe",
    "place.nearby.all": "Alle Orte ansehen",

    "place.practical": "Praktische Hinweise",
    "place.access": "Zufahrt",
    "place.parking": "Parken",
    "place.services": "Ausstattung",
    "place.besttime": "Beste Zeit",
    "place.hours": "Öffnungszeiten",
    "place.area": "Gegend",
    "place.viewmap": "Auf der Karte ansehen",
    "place.bestfor": "Gut für",
    "place.goodtoknow": "Gut zu wissen",
    "place.what": "Sehen und erleben",
    "place.getthere": "Anfahrt",
    "place.effort": "Anstrengung",
    "place.duration": "Empfohlene Dauer",
    "place.season": "Saison und Öffnungszeiten",
    "place.reserve": "Reservierung",
    "place.reserve.yes": "Empfohlen — auf der offiziellen Seite bestätigen",
    "place.reserve.yes.operator": "Empfohlen — durchgeführt von %s",
    "place.official": "Offizielle Website",
    "place.operator": "Website von %s",
    "place.owner": "Ist das Ihr Betrieb? Schicken Sie uns eine Korrektur",
    "place.verified": "Angaben geprüft am",
    "place.verified.note": "Zeiten und Zufahrt am Tag des Besuchs bestätigen",
    "place.planit.title": "In Ihre Reise einbauen",
    "place.planit.text":
      "Der Reiseplaner stellt Ihre Menorca-Route Tag für Tag zusammen — diesen Ort inbegriffen —, nach Nähe verkettet und ohne Eile.",
    "place.planit.cta": "Reise planen",
    "place.transfer.eyebrow": "Mit Chauffeur ankommen",
    "place.transfer.title": "Wir fahren Sie hin und zurück",
    "place.transfer.text":
      "An den Klippen zum Sonnenuntergang und rund um die Häfen gibt es kaum einen Parkplatz — und abends ist Autofahren das Letzte, worauf man Lust hat. Wir holen Sie mit einer Mercedes S-Klasse oder V-Klasse und privatem Chauffeur ab, vom ersten Sonnenuntergang bis zum letzten Cocktail.",
    "place.transfer.cta": "Mit Menorca Bus buchen",

    "agenda.upcoming": "Was ansteht",
    "agenda.all": "Alle",
    "agenda.filterlabel": "Nach Art des Erlebnisses filtern",
    "agenda.empty": "Zurzeit sind keine Veranstaltungen veröffentlicht.",
    "agenda.when": "Wann",
    "agenda.where": "Wo",

    // Veranstaltungsseite (KAN-102)
    "event.official": "Offizielle Veranstaltungsseite",
    "event.all": "Alle Termine ansehen",
    "event.upcoming": "Als Nächstes",
    "event.related": "Vorher lesen",

    "author.articlesby": "Beiträge von",

    // Wir bieten DEN GUIDE an, keine abstrakte Idee (28. Juli 2026). Die Zahl, die
    // es entschieden hat: Das allgemeine Formular überzeugte 1 von 489 Besuchern;
    // die Landingpage des Lead-Magneten 2 von 9 (22 %). Was überzeugt, ist etwas
    // Konkretes, das man bekommt. Die Zustellung ist echt: Anmeldungen landen in
    // der Lead-Magnet-Gruppe, die die Willkommensstrecke mit dem PDF auslöst.
    "newsletter.eyebrow": "Der Willkommens-Guide",
    "newsletter.title": "Menorcas berühmte Strände",
    "newsletter.text":
      "Hinterlassen Sie uns Ihre E-Mail-Adresse und wir schicken Ihnen den Guide: die sechs Strände, die alle sehen wollen — mit der Anfahrt und der Uhrzeit, zu der sie sich leeren. Danach nur hin und wieder ein ruhiger Brief, wenn er sich wirklich lohnt.",
    // Aufhänger für die Terminseite (zweitmeistbesuchte Seite). Behält den
    // Veranstaltungswinkel, liefert aber denselben Guide, der tatsächlich verschickt wird.
    "newsletter.agenda.eyebrow": "Nichts verpassen",
    "newsletter.agenda.title": "Verpassen Sie nicht, was auf Menorca los ist",
    "newsletter.agenda.text":
      "Die Insel ruht nie: Feste, Konzerte und Märkte das ganze Jahr über. Treten Sie der Society bei und wir begrüßen Sie mit dem Guide zu Menorcas berühmten Stränden und der Uhrzeit, zu der sie sich leeren. Ohne Lärm.",
    "newsletter.placeholder": "Ihre E-Mail-Adresse",
    "newsletter.cta": "Schicken Sie mir den Guide",
    "newsletter.privacy": "Kein Spam. Jederzeit abbestellbar.",
    "newsletter.optinNote": "Wir schicken Ihnen den Guide und wenig sonst. Abbestellen jederzeit möglich.",
    "newsletter.optinDone": "Sie sind dabei. Wir haben den Guide an Ihr Postfach geschickt (schauen Sie auch im Spam nach).",
    "newsletter.optinError": "Ihre Anmeldung konnte nicht abgeschlossen werden. Bitte versuchen Sie es gleich noch einmal.",
    "newsletter.consent": "Ich möchte die Neuigkeiten der Society erhalten und akzeptiere die",
    // Kein Bestätigungsschritt mehr (Single Opt-in, 28. Juli 2026): Die Dankesseite
    // kann nichts verlangen, was nie ankommen wird.
    "thanks.title": "Sie gehören zur Society",
    "thanks.text":
      "Wir haben Ihnen den Guide zu Menorcas berühmten Stränden an Ihr Postfach geschickt. Sollte er nicht innerhalb weniger Minuten ankommen, schauen Sie bitte im Spam-Ordner nach. Danach schreiben wir nur, wenn es sich wirklich lohnt.",
    "thanks.back": "Zurück zur Startseite",

    "nav.contact": "Kontakt",
    "contact.lead": "Sie haben eine Geschichte, einen Vorschlag oder eine Zusammenarbeit im Sinn? Schreiben Sie uns.",
    "contact.name": "Name",
    "contact.email": "E-Mail",
    "contact.message": "Nachricht",
    "contact.send": "Nachricht senden",
    "contact.directemail": "Oder schreiben Sie uns direkt an",
    "contact.sent": "Vielen Dank! Wir melden uns in Kürze.",
    "contact.consent": "Ich habe die Datenschutzerklärung gelesen und akzeptiere sie:",
    "contact.consentLink": "Datenschutzerklärung",

    "business.nav": "Für Betriebe",
    "business.title": "Führen Sie einen Betrieb auf Menorca?",
    "business.lead":
      "Wir schreiben Einträge über die Orte, die uns gefallen: ein Foto, eine Beschreibung mit Gespür, Ihre Angaben, ein Link zu Ihrer Website und die strukturierten Daten, die Google braucht, um Sie richtig anzuzeigen. Auf Spanisch und Englisch, und im Reiseplaner. Heute kostet das nichts.",
    "business.rules.title": "Was nicht zu kaufen ist",
    "business.rules.body":
      "Platzierung, Reihenfolge und Urteil werden nie bezahlt. An dem Tag, an dem es einen Tarif gibt, wird alles Bezahlte gekennzeichnet und vom Redaktionellen getrennt. Genau das ist es, was diesen Reiseführer für den Leser überhaupt wertvoll macht.",
    "business.field.business": "Name des Betriebs",
    "business.field.type": "Art",
    "business.type.restaurante": "Restaurant oder Bar",
    "business.type.alojamiento": "Hotel, Agrotourismus oder andere Unterkunft",
    "business.type.experiencia": "Erlebnis, Bootsfahrt oder Ausflug",
    "business.type.producto": "Erzeuger, Weingut oder Käserei",
    "business.type.comercio": "Geschäft oder Werkstatt",
    "business.type.otro": "Sonstiges",
    "business.field.website": "Website",
    "business.field.season": "Monate, in denen Sie geöffnet haben",
    "business.field.seasonHelp": "Die halbe Insel schließt im Winter, und fast kein Reiseführer hält das aktuell.",
    "business.field.what": "Was Sie anders machen",
    "business.field.whatHelp":
      "Ein oder zwei Sätze, ganz schlicht. Davon hängt wirklich ab, ob wir über Sie schreiben. Wenn Sie schon einen Eintrag haben und etwas nicht stimmt, sagen Sie es uns hier.",
    "business.field.person": "Ihr Name",
    "business.send": "Senden",

    "footer.about":
      "Calma Society — das Mittelmeer, ohne Eile: ein Blick auf Menorca im Zeichen des stillen Luxus. Unsere erste Ausgabe.",
    "footer.sections": "Rubriken",
    "footer.more": "Mehr",
    "footer.follow": "Folgen Sie uns",
    "footer.rights": "Alle Rechte vorbehalten.",
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
  cala: { es: "Cala", en: "Cove", fr: "Crique", de: "Bucht" },
  restaurante: { es: "Restaurante", en: "Restaurant", fr: "Restaurant", de: "Restaurant" },
  bodega: { es: "Bodega", en: "Winery", fr: "Cave viticole", de: "Weingut" },
  productor: { es: "Productor", en: "Producer", fr: "Producteur", de: "Erzeuger" },
  bar: { es: "Bar", en: "Bar", fr: "Bar", de: "Bar" },
  experiencia: { es: "Experiencia", en: "Experience", fr: "Expérience", de: "Erlebnis" },
  ruta: { es: "Ruta", en: "Trail", fr: "Sentier", de: "Wanderweg" },
  naturaleza: { es: "Naturaleza", en: "Nature", fr: "Nature", de: "Natur" },
  monumento: { es: "Monumento", en: "Monument", fr: "Monument", de: "Baudenkmal" },
  museo: { es: "Museo", en: "Museum", fr: "Musée", de: "Museum" },
  spa: { es: "Spa", en: "Spa", fr: "Spa", de: "Spa" },
  alojamiento: { es: "Alojamiento", en: "Stay", fr: "Hébergement", de: "Unterkunft" },
  comercio: { es: "Comercio", en: "Shop", fr: "Boutique", de: "Geschäft" },
  pueblo: { es: "Pueblo", en: "Village", fr: "Village", de: "Ortschaft" },
  otro: { es: "Lugar", en: "Place", fr: "Lieu", de: "Ort" },
};

/** Etiquetas en PLURAL: encabezados de los grupos del índice de lugares. */
const PLACE_TYPES_PLURAL: Record<string, Record<Locale, string>> = {
  cala: { es: "Calas y playas", en: "Coves & beaches", fr: "Criques et plages", de: "Buchten und Strände" },
  restaurante: { es: "Mesas con criterio", en: "Tables with judgement", fr: "Tables de caractère", de: "Tische mit Gespür" },
  bodega: { es: "Bodegas y vinos", en: "Wineries & wine", fr: "Caves et vins", de: "Weingüter und Weine" },
  productor: { es: "Productores y visitas", en: "Producers & farm visits", fr: "Producteurs et visites", de: "Erzeuger und Besichtigungen" },
  bar: { es: "Copas y atardeceres", en: "Drinks & sunsets", fr: "Verres et couchers de soleil", de: "Drinks und Sonnenuntergänge" },
  experiencia: { es: "Experiencias", en: "Experiences", fr: "Expériences", de: "Erlebnisse" },
  ruta: { es: "Rutas y senderos", en: "Trails & walks", fr: "Sentiers et randonnées", de: "Wege und Wanderungen" },
  naturaleza: { es: "Naturaleza y parques", en: "Nature & parks", fr: "Nature et parcs", de: "Natur und Naturparks" },
  monumento: { es: "Monumentos y patrimonio", en: "Monuments & heritage", fr: "Monuments et patrimoine", de: "Baudenkmäler und Kulturerbe" },
  museo: { es: "Museos y arte", en: "Museums & art", fr: "Musées et art", de: "Museen und Kunst" },
  spa: { es: "Spas y bienestar", en: "Spas & wellness", fr: "Spas et bien-être", de: "Spas und Wellness" },
  alojamiento: { es: "Alojamientos", en: "Stays", fr: "Hébergements", de: "Unterkünfte" },
  comercio: { es: "Comercios y mercados", en: "Shops & markets", fr: "Boutiques et marchés", de: "Geschäfte und Märkte" },
  pueblo: { es: "Pueblos", en: "Villages & towns", fr: "Villages", de: "Orte und Städte" },
  otro: { es: "Otros lugares", en: "Other places", fr: "Autres lieux", de: "Weitere Orte" },
};

const EVENT_CATEGORIES: Record<string, Record<Locale, string>> = {
  fiesta: { es: "Fiesta", en: "Festival", fr: "Fête", de: "Fest" },
  concierto: { es: "Concierto", en: "Concert", fr: "Concert", de: "Konzert" },
  mercado: { es: "Mercado", en: "Market", fr: "Marché", de: "Markt" },
  deporte: { es: "Deporte", en: "Sport", fr: "Sport", de: "Sport" },
  cultura: { es: "Cultura", en: "Culture", fr: "Culture", de: "Kultur" },
  gastronomia: { es: "Gastronomía", en: "Gastronomy", fr: "Gastronomie", de: "Gastronomie" },
  otro: { es: "Evento", en: "Event", fr: "Événement", de: "Veranstaltung" },
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
  { key: "fiesta", label: { es: "Fiestas de pueblo", en: "Town festivals", fr: "Fêtes de village", de: "Dorffeste" } },
  { key: "concierto", label: { es: "Música", en: "Music", fr: "Musique", de: "Musik" } },
  { key: "cultura", label: { es: "Cultura", en: "Culture", fr: "Culture", de: "Kultur" } },
  { key: "deporte", label: { es: "Naturaleza y deporte", en: "Nature & sport", fr: "Nature et sport", de: "Natur und Sport" } },
  { key: "mercado", label: { es: "Mercados y ferias", en: "Markets & fairs", fr: "Marchés et foires", de: "Märkte und Messen" } },
  { key: "gastronomia", label: { es: "Gastronomía", en: "Food & drink", fr: "Gastronomie", de: "Essen und Trinken" } },
  { key: "otro", label: { es: "Otros", en: "Other", fr: "Autres", de: "Sonstiges" } },
] as const;

export function experienceTypeLabel(category: string, locale: Locale): string {
  const exp = EXPERIENCE_TYPES.find((e) => e.key === category);
  return exp?.label[locale] ?? eventCategoryLabel(category, locale);
}
