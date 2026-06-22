/**
 * Siembra el "esqueleto de imperdibles" del Planificador: ~16 lugares clave
 * repartidos por TODAS las zonas, para que el motor produzca planes variados.
 *
 * P1-full acotado (docs/PLANIFICADOR-BLUEPRINT.md). Cada valor se DERIVA de la
 * investigación verificada (.tmp_research/planner-lugares-COMPLETO.json) + las
 * reglas del blueprint (esfuerzo A1–D, cierre estival, playas accesibles). NO
 * inventa. Nace en `status: draft` para visto bueno humano (§6 bis).
 *
 * Idempotente: NO sobrescribe fichas que ya existan (no toca el piloto publicado).
 * Uso:  node scripts/seed-imperdibles.mjs [--dry]
 */
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";
const TODAY = "2026-06-22";
const DRY = process.argv.includes("--dry");

// Servicio de baño asistido (playas A1). Ventana 1 may–31 oct por defecto.
const A1_SERVICE = { amphibiousChair: true, adaptedToilet: true, reservedParking: true, staff: true, certainty: "alta" };

const PLACES = {
  // ───────────────────────── OESTE ─────────────────────────
  ciutadella: {
    type: "otro", coords: { lat: 40.0014, lng: 3.8416 },
    area: { es: "Oeste (Ciutadella)", en: "West (Ciutadella)" },
    name: "Ciutadella de Menorca",
    tags: ["oeste", "casco histórico", "catedral", "ciutadella"],
    desc: {
      es: "Antigua capital señorial: el casco antiguo más monumental de la isla, con catedral gótica, palacios y un puerto vivo al atardecer.",
      en: "The island's grand former capital: its most monumental old town, with a Gothic cathedral, palaces and a harbour that comes alive at dusk.",
    },
    planner: {
      common: { zone: "oeste", cluster: "ciutadella-ciudad", plannerType: "pueblo", idealFor: ["cultura", "parejas", "gastronomia", "primera-vez"], durationMin: 240, carAccess: "sin-coche-ok", busServed: true, effortLevel: "A2", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Casco peatonal y llano; aparca fuera del centro (zonas reguladas y parkings perimetrales)." },
      en: { effortNote: "Flat, pedestrian old town; park outside the centre (regulated zones and perimeter car parks)." },
    },
  },
  lithica: {
    type: "otro", coords: { lat: 39.9889, lng: 3.865 },
    area: { es: "Oeste (Ciutadella)", en: "West (Ciutadella)" },
    name: "Lithica – Pedreres de s'Hostal",
    tags: ["oeste", "cantera", "jardín", "cultura", "ciutadella"],
    desc: {
      es: "Antiguas canteras de marés convertidas en un espacio cultural único: laberintos de piedra, jardines esculpidos en la roca y un anfiteatro.",
      en: "Former sandstone quarries turned into a one-of-a-kind cultural space: stone labyrinths, gardens carved into the rock and an amphitheatre.",
    },
    planner: {
      common: { zone: "oeste", cluster: "ciutadella-ciudad", plannerType: "interior-cultural", idealFor: ["cultura", "naturaleza", "parejas"], durationMin: 90, carAccess: "coche-directo", busServed: false, effortLevel: "B", isIndoor: false, weatherProof: "exterior", needsReservation: false, officialUrl: "https://lithica.es", dataCertainty: "alta", lastVerified: TODAY },
      es: { seasonalHours: "9:30-14:30; en temporada alta también por la tarde. Mejor para el calor que para la lluvia (es al aire libre)." },
      en: { seasonalHours: "9:30-14:30; also afternoons in high season. Better for heat than rain (it is open-air)." },
    },
  },
  // ───────────────────────── SUR-CENTRO ─────────────────────────
  "cala-galdana": {
    type: "cala", coords: { lat: 39.936, lng: 3.965 },
    area: { es: "Sur (Ferreries)", en: "South (Ferreries)" },
    name: "Cala Galdana",
    tags: ["sur", "turquesa", "familiar", "ferreries"],
    desc: {
      es: "Gran ensenada en herradura, protegida por acantilados, con arena fina, aguas turquesa muy tranquilas y pinos hasta la orilla. Base de las calas del sur.",
      en: "A large horseshoe bay sheltered by cliffs, with fine sand, very calm turquoise water and pines to the shore. The base for the southern coves.",
    },
    planner: {
      common: { zone: "sur-centro", cluster: "galdana-mitjana", plannerType: "playa", idealFor: ["familias", "primera-vez", "parejas"], durationMin: 240, carAccess: "coche-directo", busServed: true, effortLevel: "A1", accessibleService: A1_SERVICE, isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Pasarelas hasta el mar, silla anfibia y rampas (servicio accesible 1 may–31 oct). Gran parking gratuito en lo alto; bajada de 5-10 min." },
      en: { effortNote: "Large free car park up top; a steep 5-10 min walk down. Developed, with full services." },
    },
  },
  "son-bou": {
    type: "cala", coords: { lat: 39.895, lng: 4.078 },
    area: { es: "Sur (Alaior)", en: "South (Alaior)" },
    name: "Playa de Son Bou",
    tags: ["sur", "arena", "accesible", "alaior", "familiar"],
    desc: {
      es: "El arenal más largo de Menorca (casi 4 km), de arena fina y aguas someras, con chiringuitos y un extenso humedal y sistema dunar detrás.",
      en: "Menorca's longest beach (nearly 4 km), with fine sand and shallow water, beach bars and an extensive wetland and dune system behind.",
    },
    planner: {
      common: { zone: "sur-centro", cluster: "son-bou-migjorn", plannerType: "playa", idealFor: ["familias", "ninos-pequenos", "naturaleza"], durationMin: 240, carAccess: "coche-directo", busServed: true, effortLevel: "A1", accessibleService: A1_SERVICE, isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Playa accesible: pasarelas, silla anfibia, baño adaptado y personal de apoyo (1 may–31 oct). Gran parking que se llena pronto en verano." },
      en: { effortNote: "Accessible beach: boardwalks, amphibious chair, adapted toilet and support staff (1 May–31 Oct). Large car park, fills early in summer." },
    },
  },
  "torre-den-galmes": {
    type: "monumento", coords: { lat: 39.9269, lng: 4.1283 },
    area: { es: "Sur (Alaior)", en: "South (Alaior)" },
    name: "Torre d'en Galmés",
    tags: ["talayótico", "unesco", "alaior", "cultura"],
    desc: {
      es: "El mayor poblado talayótico de Baleares (más de 6 ha), parte de la Menorca Talayótica UNESCO: talayots, recinto de taula y sistema hidráulico.",
      en: "The largest Talayotic settlement in the Balearics (over 6 ha), part of UNESCO's Talayotic Menorca: talayots, a taula enclosure and a water system.",
    },
    planner: {
      common: { zone: "sur-centro", cluster: "talayotic-alaior", plannerType: "yacimiento", idealFor: ["cultura", "primera-vez", "familias"], durationMin: 75, carAccess: "coche-directo", busServed: false, effortLevel: "B", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Camino de tierra de 2 km y recinto amplio sin apenas sombra: visítalo temprano o a última hora en verano." },
      en: { effortNote: "A 2 km dirt road and a large site with almost no shade: visit early or late in summer." },
    },
  },
  // ───────────────────────── SUR-ESTE ─────────────────────────
  "binibeca-vell": {
    type: "otro", coords: { lat: 39.8158, lng: 4.2253 },
    area: { es: "Sureste (Sant Lluís)", en: "South-east (Sant Lluís)" },
    name: "Binibeca Vell",
    tags: ["sureste", "pueblo blanco", "fotogénico", "sant lluís"],
    desc: {
      es: "Conjunto de casas blancas encaladas (1972) que imita un pueblo de pescadores, con callejones laberínticos y rincones de postal. Es propiedad privada.",
      en: "A whitewashed village (1972) imitating a fishing hamlet, with maze-like lanes and postcard corners. It is private property.",
    },
    planner: {
      common: { zone: "sur-este", cluster: "binibeca-sur-este", plannerType: "pueblo", idealFor: ["parejas", "cultura", "primera-vez"], durationMin: 60, carAccess: "coche-directo", busServed: false, effortLevel: "A2", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { seasonalHours: "Es propiedad privada con horarios de visita restringidos; respeta el silencio y los accesos. Ve fuera de la hora punta del mediodía." },
      en: { seasonalHours: "Private property with restricted visiting hours; respect the quiet and the access rules. Avoid the midday rush." },
    },
  },
  "punta-prima": {
    type: "cala", coords: { lat: 39.812, lng: 4.275 },
    area: { es: "Sureste (Sant Lluís)", en: "South-east (Sant Lluís)" },
    name: "Punta Prima",
    tags: ["sureste", "accesible", "familiar", "sant lluís"],
    desc: {
      es: "Playa abierta de arena clara con todos los servicios, frente al islote de l'Aire y su faro. Cómoda y familiar; más expuesta al viento que las del sur-oeste.",
      en: "An open, light-sand beach with full services, facing the islet of l'Aire and its lighthouse. Easy and family-friendly; windier than the south-west coves.",
    },
    planner: {
      common: { zone: "sur-este", cluster: "binibeca-sur-este", plannerType: "playa", idealFor: ["familias", "primera-vez"], durationMin: 180, carAccess: "coche-directo", busServed: true, effortLevel: "A1", accessibleService: A1_SERVICE, isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Playa accesible con pasarela, silla anfibia y socorristas (1 may–31 oct). Aparcamiento y servicios completos." },
      en: { effortNote: "Accessible beach with boardwalk, amphibious chair and lifeguards (1 May–31 Oct). Car park and full services." },
    },
  },
  // ───────────────────────── ESTE (Maó) ─────────────────────────
  mao: {
    type: "otro", coords: { lat: 39.8885, lng: 4.2658 },
    area: { es: "Este (Maó)", en: "East (Maó)" },
    name: "Maó",
    tags: ["este", "puerto", "capital", "maó"],
    desc: {
      es: "Capital cosmopolita con fuerte huella británica del s. XVIII, asomada al puerto natural más grande del Mediterráneo. Centro elegante y bodega de ginebra.",
      en: "A cosmopolitan capital with a strong 18th-century British imprint, overlooking the Mediterranean's largest natural harbour. Elegant centre and a gin distillery.",
    },
    planner: {
      common: { zone: "este", cluster: "mao-puerto", plannerType: "pueblo", idealFor: ["cultura", "gastronomia", "primera-vez"], durationMin: 240, carAccess: "sin-coche-ok", busServed: true, effortLevel: "A2", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Capital peatonalizable y bien conectada (bus a toda la isla y al aeropuerto). Aparcamiento de pago en el centro." },
      en: { effortNote: "A walkable, well-connected capital (buses across the island and to the airport). Paid parking in the centre." },
    },
  },
  "mercat-claustre-carme": {
    type: "otro", coords: { lat: 39.888, lng: 4.265 },
    area: { es: "Este (Maó)", en: "East (Maó)" },
    name: "Mercat des Claustre del Carme",
    tags: ["este", "mercado", "gastronomía", "maó"],
    desc: {
      es: "Mercado gastronómico en un claustro carmelita del s. XVIII en el corazón de Maó: producto de la tierra, elaboraciones caseras y artesanía.",
      en: "A food market in an 18th-century Carmelite cloister in the heart of Maó: local produce, homemade fare and craft.",
    },
    planner: {
      common: { zone: "este", cluster: "mao-puerto", plannerType: "comida", idealFor: ["gastronomia", "cultura", "familias"], durationMin: 90, carAccess: "sin-coche-ok", busServed: true, effortLevel: "A1", isIndoor: true, weatherProof: "cubierto", indoorAlternativeOf: ["mao-puerto", "este"], openDays: ["lun", "mar", "mie", "jue", "vie", "sab"], needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { seasonalHours: "Centro de Maó, a pie. El Mercat des Peix anexo abre mar-sáb 07:00-14:00." },
      en: { seasonalHours: "Maó centre, on foot. The adjoining fish market (Mercat des Peix) opens Tue-Sat 07:00-14:00." },
    },
  },
  // ───────────────────────── NORTE ─────────────────────────
  fornells: {
    type: "otro", coords: { lat: 40.0539, lng: 4.1356 },
    area: { es: "Norte (Es Mercadal)", en: "North (Es Mercadal)" },
    name: "Fornells",
    tags: ["norte", "puerto", "caldereta", "náutica"],
    desc: {
      es: "Pueblo pesquero del norte, de casas blancas sobre una gran bahía natural de casi 3 km con llaüts. La referencia de la caldereta de langosta y base náutica.",
      en: "A northern fishing village of white houses above a nearly 3 km natural bay dotted with llaüts. The home of lobster stew and a watersports base.",
    },
    planner: {
      common: { zone: "norte", cluster: "fornells-cavalleria", plannerType: "pueblo", idealFor: ["gastronomia", "parejas", "nautica"], durationMin: 180, carAccess: "coche-directo", busServed: false, effortLevel: "A2", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Pueblo peatonal pequeño; aparca a la entrada. Conexión de bus limitada (mejor con coche)." },
      en: { effortNote: "Small pedestrian village; park at the entrance. Limited bus service (better by car)." },
    },
  },
  "cala-cavalleria": {
    type: "cala", coords: { lat: 40.056, lng: 4.093 },
    area: { es: "Norte (Es Mercadal)", en: "North (Es Mercadal)" },
    name: "Platja de Cavalleria",
    tags: ["norte", "arena rojiza", "virgen", "es mercadal"],
    desc: {
      es: "Gran playa virgen de arena rojiza enmarcada por acantilados ocres, una de las postales del norte. Cómoda por su aparcamiento a pie de cala.",
      en: "A large unspoilt beach of reddish sand framed by ochre cliffs, one of the north's icons. Convenient thanks to its car park near the cove.",
    },
    planner: {
      common: { zone: "norte", cluster: "fornells-cavalleria", plannerType: "playa", idealFor: ["naturaleza", "parejas"], durationMin: 180, carAccess: "coche-mas-caminata", busServed: false, effortLevel: "B", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Carretera estrecha asfaltada ~15 min hasta el parking gratuito; desde allí ~400 m a pie por escaleras de madera." },
      en: { effortNote: "A narrow paved road, ~15 min to the free car park; from there ~400 m on foot down wooden stairs." },
    },
  },
  "faro-cavalleria": {
    type: "monumento", coords: { lat: 40.0915, lng: 4.092 },
    area: { es: "Norte (Es Mercadal)", en: "North (Es Mercadal)" },
    name: "Cap de Cavalleria",
    tags: ["norte", "faro", "mirador", "atardecer"],
    desc: {
      es: "El cabo y faro más al norte de la isla: acantilados dramáticos, viento y vistas inmensas. Cita obligada al atardecer.",
      en: "The island's northernmost cape and lighthouse: dramatic cliffs, wind and immense views. A must at sunset.",
    },
    planner: {
      common: { zone: "norte", cluster: "fornells-cavalleria", plannerType: "atardecer", idealFor: ["parejas", "naturaleza", "lujo-tranquilo"], durationMin: 90, carAccess: "coche-directo", busServed: false, effortLevel: "A2", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Carretera estrecha pero asfaltada con parking junto al faro; apenas se camina. En verano se llena al atardecer." },
      en: { effortNote: "A narrow but paved road with parking by the lighthouse; barely any walking. Busy at sunset in summer." },
    },
  },
  "faro-favaritx": {
    type: "monumento", coords: { lat: 40.001, lng: 4.272 },
    area: { es: "Norte (Maó)", en: "North (Maó)" },
    name: "Faro de Favàritx",
    tags: ["norte", "faro", "pizarra", "parc natural"],
    desc: {
      es: "Faro sobre un cabo de pizarra negra estriada que parece otro planeta, en el extremo norte del Parc Natural de s'Albufera des Grau.",
      en: "A lighthouse on a cape of striated black slate that looks like another planet, at the northern edge of the s'Albufera des Grau Natural Park.",
    },
    planner: {
      common: { zone: "norte", cluster: "albufera-favaritx", plannerType: "faro", idealFor: ["naturaleza", "parejas"], durationMin: 90, carAccess: "solo-bus-lanzadera", busServed: true, carAccessClosedSummer: true, effortLevel: "B", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { shuttleInfo: "Acceso en coche restringido en verano (aprox. 1 jun–mediados oct): bus de temporada desde Maó (línea ~43, ~3,50 €/trayecto). Confirma el calendario del año." },
      en: { shuttleInfo: "Car access restricted in summer (approx. 1 Jun–mid Oct): seasonal bus from Maó (line ~43, ~€3.50/trip). Confirm the year's calendar." },
    },
  },
  "es-grau": {
    type: "cala", coords: { lat: 39.956, lng: 4.266 },
    area: { es: "Norte (Maó)", en: "North (Maó)" },
    name: "Es Grau",
    tags: ["norte", "accesible", "parc natural", "biosfera", "maó"],
    desc: {
      es: "Playa de arena dorada de aguas someras y tranquilas junto al pueblo pesquero de Es Grau, puerta del Parc Natural de s'Albufera des Grau.",
      en: "A golden-sand beach with shallow, calm water beside the fishing village of Es Grau, gateway to the s'Albufera des Grau Natural Park.",
    },
    planner: {
      common: { zone: "norte", cluster: "albufera-favaritx", plannerType: "playa", idealFor: ["familias", "ninos-pequenos", "naturaleza"], durationMin: 180, carAccess: "coche-directo", busServed: true, effortLevel: "A1", accessibleService: A1_SERVICE, isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Playa accesible (pasarelas, silla anfibia, baño adaptado; 1 may–31 oct), aguas someras ideales para niños. Combina con el sendero del parque." },
      en: { effortNote: "Accessible beach (boardwalks, amphibious chair, adapted toilet; 1 May–31 Oct), shallow water ideal for children. Pairs with the park trail." },
    },
  },
  // ───────────────────────── CENTRO ─────────────────────────
  "monte-toro": {
    type: "monumento", coords: { lat: 39.9925, lng: 4.1108 },
    area: { es: "Centro (Es Mercadal)", en: "Centre (Es Mercadal)" },
    name: "Monte Toro",
    tags: ["centro", "mirador", "santuario", "es mercadal"],
    desc: {
      es: "El punto más alto de Menorca (358 m), con el santuario de la Mare de Déu del Toro y un mirador de 360° sobre toda la isla, de mar a mar.",
      en: "Menorca's highest point (358 m), with the sanctuary of the Mare de Déu del Toro and a 360° viewpoint over the whole island, sea to sea.",
    },
    planner: {
      common: { zone: "centro", cluster: "interior-cultura", plannerType: "mirador", idealFor: ["cultura", "naturaleza", "primera-vez"], durationMin: 60, carAccess: "coche-directo", busServed: false, effortLevel: "A2", isIndoor: false, weatherProof: "exterior", needsReservation: false, dataCertainty: "alta", lastVerified: TODAY },
      es: { effortNote: "Carretera asfaltada con curvas desde Es Mercadal (~10 min) hasta el parking de la cima." },
      en: { effortNote: "A winding paved road from Es Mercadal (~10 min) to the summit car park." },
    },
  },
};

let created = 0, skipped = 0;
for (const [key, p] of Object.entries(PLACES)) {
  for (const lang of ["es", "en"]) {
    const file = join(DIR, `${key}-${lang}.json`);
    if (existsSync(file)) { skipped++; continue; }
    const planner = { ...p.planner.common, ...(p.planner[lang] ?? {}) };
    const ficha = {
      name: typeof p.name === "string" ? p.name : p.name[lang],
      lang,
      translationKey: key,
      type: p.type,
      description: p.desc[lang],
      coordinates: p.coords,
      area: p.area[lang],
      tags: p.tags,
      status: "draft",
      planner,
    };
    if (DRY) console.log("→ (dry)", file, "·", planner.plannerType, planner.zone, "effort", planner.effortLevel);
    else { writeFileSync(file, JSON.stringify(ficha, null, 2) + "\n"); console.log("✓", file); }
    created++;
  }
}
console.log(`\n${DRY ? "DRY-RUN" : "Hecho"}: ${created} fichas ${DRY ? "a crear" : "creadas"} (draft), ${skipped} ya existían.`);
