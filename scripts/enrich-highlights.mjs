/**
 * Añade `highlights` ("qué ver y hacer") al bloque planner de los lugares clave,
 * para que el plan diga cosas concretas ("pasea por el centro de Maó: el puerto,
 * Xoriguer, el Mercat; cena en el puerto") en vez de "cena en la zona".
 *
 * Highlights ES, curados a partir de la investigación y del conocimiento de cada
 * sitio (no inventados: son los rasgos conocidos de cada lugar). Solo toca el
 * fichero -es de cada clave. NO toca fichas con `windExposure` (calma-del-mar, sin
 * commitear) para no entrelazar. Idempotente.
 *
 * Uso:  node scripts/enrich-highlights.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/lugares";

const H = {
  // — Pueblos / núcleos (los que más necesitan "qué hacer") —
  ciutadella: ["la Catedral gótica de Santa María", "el paseo del Born y Ses Voltes", "el puerto al atardecer", "tapear en el Mercat des Peix"],
  mao: ["el puerto natural, uno de los mayores del mundo", "subir al casco por Ses Voltes", "la destilería de ginebra Xoriguer", "el Mercat des Claustre del Carme"],
  fornells: ["el paseo del puerto entre llaüts", "subir a la torre de defensa por las vistas", "una caldereta de langosta", "kayak o paddle por la bahía protegida"],
  "es-mercadal": ["subir al Monte Toro al atardecer", "el casco tranquilo de pueblo de interior", "una quesería DOP cercana (Subaida)"],
  alaior: ["el casco blanco sobre la colina", "queso y helado artesanos (DOP Mahón-Menorca)", "el yacimiento de Torre d'en Galmés muy cerca"],
  ferreries: ["el pueblo más alto de la isla", "el mercado artesanal (en temporada)", "la puerta de entrada a Cala Galdana"],
  "es-migjorn-gran": ["el pueblo blanco más sereno del sur", "el barranc de Binigaus hacia la Cova des Coloms", "bajar a pie a la playa de Binigaus"],
  "es-castell": ["el puerto de Cales Fonts al atardecer", "la Fortaleza de La Mola", "cenar pescado en una terraza sobre el agua"],
  "sant-lluis": ["el pueblo blanco de trazado francés", "los molinos restaurados", "base para Binibèquer y Punta Prima"],
  // — Iconos y experiencias —
  lithica: ["los laberintos de piedra de marés", "los jardines esculpidos en la roca", "el anfiteatro y el jardín circular"],
  "monte-toro": ["el mirador de 360° sobre toda la isla, de mar a mar", "el santuario de la Mare de Déu del Toro", "ir con la luz del atardecer"],
  "naveta-tudons": ["el monumento funerario mejor conservado (más de 3.000 años)", "ir temprano o a última hora (no hay sombra)"],
  "torre-den-galmes": ["los talayots y el recinto de taula", "el sistema hidráulico prehistórico", "las vistas al sur desde lo alto"],
  "cova-den-xoroi": ["las terrazas excavadas en el acantilado", "una copa con el atardecer", "reservar online en verano"],
  "binibeca-vell": ["el dédalo de callejones encalados", "los rincones fotogénicos sin gente (pronto o tarde)", "respetar que es propiedad privada"],
  "es-grau": ["el baño tranquilo de aguas someras", "el sendero del Parc Natural de s'Albufera", "observar aves en la laguna"],
  "cala-galdana": ["el baño en aguas turquesa muy calmas", "caminar el Camí de Cavalls hasta Cala Mitjana", "kayak a las calas vírgenes vecinas"],
  "son-bou": ["el arenal de casi 4 km", "el humedal y el sistema dunar de detrás", "servicio de baño accesible con silla anfibia"],
  "punta-prima": ["el faro de l'Illa de l'Aire enfrente", "playa familiar con todos los servicios", "baño accesible (de mayo a octubre)"],
  "faro-cavalleria": ["el punto más al norte de la isla", "los acantilados y las vistas inmensas", "uno de los mejores atardeceres de Menorca"],
  "faro-favaritx": ["el paisaje lunar de pizarra negra", "el faro dentro del Parc Natural", "en verano se llega en bus de temporada"],
  "artrutx-sea-club": ["la terraza junto al faro del Cap d'Artrutx", "una copa o cena con el atardecer", "reservar con antelación en verano"],
  "mercat-claustre-carme": ["picar producto local entre los puestos", "el claustro carmelita del s. XVIII", "el Mercat des Peix anexo para tapear"],
  // — Experiencias gastronómicas (de paso, interior) —
  "queseria-subaida": ["la visita guiada por la finca", "la cata de queso Mahón-Menorca DOP", "reservar antes de ir"],
  "hort-de-sant-patrici": ["el museo del queso y los jardines", "la bodega y la cata", "reservar la visita"],
  "destileria-gin-xoriguer": ["la tienda junto al puerto de Maó", "la cata de la ginebra de Menorca", "probar la pomada (gin con limonada)"],
  "fortaleza-de-la-mola": ["la fortaleza del s. XIX sobre la bocana del puerto", "los túneles y baterías", "las vistas a Maó desde los miradores"],
};

let done = 0, skipped = 0;
for (const [key, highlights] of Object.entries(H)) {
  const file = join(DIR, `${key}-es.json`);
  if (!existsSync(file)) { console.log("• no existe, omito:", key); skipped++; continue; }
  const raw = readFileSync(file, "utf8");
  if (raw.includes('"windExposure"')) { console.log("• tiene windExposure, omito:", key); skipped++; continue; }
  const j = JSON.parse(raw);
  if (!j.planner) { console.log("• sin planner, omito:", key); skipped++; continue; }
  j.planner.highlights = highlights;
  writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
  console.log("✓", key, `(${highlights.length})`);
  done++;
}
console.log(`\nHecho: ${done} fichas con highlights, ${skipped} omitidas.`);
