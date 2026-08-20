/**
 * aplicar-fotos-agenda.mjs — pone foto a los 51 eventos de la agenda que se
 * quedaron sin ella tras la auditoría KAN-119 (se retiró el stock anónimo que
 * no enseñaba ni el evento ni Menorca).
 *
 * Criterio, heredado de la memoria del proyecto: la foto de un evento es el
 * ARTISTA real o el SITIO real donde ocurre. Nunca stock genérico. Y el `alt`
 * DESCRIBE lo que se ve — no afirma el evento —, que es el fallo que costó
 * KAN-83 y KAN-119.
 *
 * Cada foto de aquí se ha mirado en hoja de contactos y se ha contrastado con
 * el nombre del fichero original de Commons (que nombra el lugar).
 *
 * Uso:  node scripts/aplicar-fotos-agenda.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TMP = ".tmp_wiki/nuevas";
const OUT = "public/uploads";
const DIR = "src/content/eventos";
const WIDTHS = [1600, 960, 480];
const idx = JSON.parse(readFileSync(join(TMP, "_candidatas.json"), "utf8"));

// translationKey → foto elegida.
//   src  : "<slug>--<n>" = candidata de Wikimedia Commons | "/uploads/x.webp" = foto propia ya verificada
//   es/en: qué SE VE en la foto (no qué evento ilustra)
const MAPA = {
  // ── MERCADOS ───────────────────────────────────────────────────────────────
  "mercat-ambulant-alaior": { src: "alaior--6",
    es: "Calle empedrada de Alaior entre casas blancas con persianas verdes",
    en: "A cobbled street in Alaior lined with white houses and green shutters" },
  "mercat-nit-alaior": { src: "/uploads/alaior.webp",
    es: "Calle estrecha de Alaior con fachadas encaladas al atardecer",
    en: "A narrow street in Alaior with whitewashed façades at dusk" },
  "mercat-ambulant-es-castell": { src: "es-castell--0",
    es: "Las casas y terrazas de Cales Fonts sobre el agua, en Es Castell",
    en: "The houses and waterside terraces of Cales Fonts, in Es Castell" },
  "mercat-nit-cales-fonts-es-castell": { src: "es-castell--5",
    es: "Cales Fonts de noche: las luces de los locales reflejadas en el agua",
    en: "Cales Fonts at night, the lights of its restaurants reflected in the water" },
  "mercat-ambulant-es-mercadal": { src: "es-mercadal--5",
    es: "Las aspas de un molino de viento de Es Mercadal contra el cielo",
    en: "The sails of a windmill in Es Mercadal against the sky" },
  "mercat-nit-es-mercadal": { src: "es-mercadal--0",
    es: "Un olivo iluminado en una plaza de Es Mercadal, al anochecer",
    en: "A lit olive tree in a square in Es Mercadal, at nightfall" },
  "mercat-ambulant-mao": { src: "mao--2",
    es: "Una plaza del centro de Maó con la iglesia al fondo y gente paseando",
    en: "A square in central Maó with the church behind and people walking" },
  "mercat-nit-port-mao": { src: "port-mao--3",
    es: "El paseo del puerto de Maó iluminado de noche, con las terrazas abiertas",
    en: "The Maó harbourfront promenade lit up at night, terraces open" },
  "mercat-born-ciutadella": { src: "born-ciutadella--2",
    es: "El obelisco de la Plaça des Born de Ciutadella, con los palacios detrás",
    en: "The obelisk in Ciutadella's Plaça des Born, palaces standing behind it" },
  "mercat-agrari-ciutadella": { src: "ciutadella--6",
    es: "Los soportales del Mercat Municipal de Ciutadella, con gente a la sombra",
    en: "The arcades of Ciutadella's municipal market, people resting in the shade" },
  "mercat-ferreries-dissabte": { src: "ferreries2--1",
    es: "El edificio de las antiguas Escuelas Nacionales de Ferreries, de 1933",
    en: "The old Escuelas Nacionales building in Ferreries, dated 1933" },
  "mercat-nit-ferreries": { src: "ferreries2--2",
    es: "Casas blancas de Ferreries al anochecer, con la sierra al fondo",
    en: "White houses in Ferreries at dusk, with the hills behind" },
  "mercat-nit-fornells": { src: "fornells--5",
    es: "Una esquina de Fornells con casas encaladas y terrazas de sillas rojas",
    en: "A corner of Fornells with whitewashed houses and terraces of red chairs" },
  "dimarts-as-migjorn": { src: "migjorn--0",
    es: "La platja de Sant Adeodat, en el término de Es Migjorn Gran",
    en: "Sant Adeodat beach, within the municipality of Es Migjorn Gran" },
  "moli-market-sant-lluis": { src: "moli-sant-lluis--0",
    es: "Es Molí de Dalt, el molino blanco de Sant Lluís, en la calle del pueblo",
    en: "Es Molí de Dalt, the white windmill of Sant Lluís, on the village street" },
  "fira-nadal-mao-gastronomia-hivern": { src: "mao--1",
    es: "Es Claustre del Carme de Maó de noche, con las arcadas iluminadas y gente en las mesas",
    en: "Es Claustre del Carme in Maó at night, its arcades lit and people at the tables" },

  // ── CONCIERTOS ─────────────────────────────────────────────────────────────
  "conciertos-orgue-santa-maria-mao": { src: "santa-maria-mao--2",
    es: "La iglesia de Santa Maria de Maó iluminada al anochecer, desde la plaça de la Conquesta",
    en: "The church of Santa Maria in Maó lit at dusk, seen from Plaça de la Conquesta" },
  "cranc-illa-de-menorca-festival": { src: "port-mao--1",
    es: "La Illa Pinto y la ensenada del puerto de Maó vistas desde lo alto",
    en: "Illa Pinto and the inlet of Maó harbour seen from above" },
  "festival-musica-estiu-ciutadella": { src: "ciutadella--4",
    es: "La portada gótica de la catedral de Ciutadella y las casas de la plaza",
    en: "The Gothic doorway of Ciutadella cathedral and the houses on the square" },
  "festival-musica-mao-2026": { src: "mao--4",
    es: "El claustro del Carme de Maó, con sus arcos de marés",
    en: "The Carme cloister in Maó, with its sandstone arches" },
  "fosquets-de-lithica": { src: "lithica--4",
    es: "El jardín crecido en el fondo de las Pedreres de s'Hostal, entre paredes de marés",
    en: "The garden grown at the bottom of Pedreres de s'Hostal, between sandstone walls" },
  "maria-del-mar-bonet-mao-2026": { src: "maria-del-mar-bonet-mao-2026--4",
    es: "Maria del Mar Bonet cantando en directo",
    en: "Maria del Mar Bonet singing live" },
  "maria-terremoto-mao-2026": { src: "teatre-mao--1",
    es: "La fachada de piedra del Teatre Principal de Maó",
    en: "The stone façade of the Teatre Principal in Maó" },
  "menorca-jazz": { src: "ciutadella--7",
    es: "Una plaza de Ciutadella de noche, con el reloj encendido y gente en los bancos",
    en: "A square in Ciutadella at night, its clock lit and people on the benches" },
  "menorca-music-festival": { src: "/uploads/monte-toro.webp",
    es: "Es Mercadal y el interior de la isla vistos desde lo alto del Toro",
    en: "Es Mercadal and the island's interior seen from the top of El Toro" },
  "pedra-viva-buika": { src: "pedra-viva-buika--4",
    es: "Buika cantando ante el micrófono en un concierto",
    en: "Buika singing at the microphone during a concert" },
  "splendid-festival-mao": { src: "mao--5",
    es: "El cielo de la tarde sobre los tejados de Maó",
    en: "Evening sky over the rooftops of Maó" },
  "ukalari-menorca-live": { src: "mao--7",
    es: "Atardecer anaranjado sobre las casas de Maó",
    en: "An orange sunset over the houses of Maó" },

  // ── CULTURA ────────────────────────────────────────────────────────────────
  "festival-pedra-viva-lithica": { src: "lithica--6",
    es: "Las paredes verticales de marés cortado de las Pedreres de s'Hostal",
    en: "The sheer cut-sandstone walls of Pedreres de s'Hostal" },
  "marco-flores-rayuela-mao-2026": { src: "/uploads/puerto-mao.webp",
    es: "Maó vista desde el agua, con las casas asomadas al puerto",
    en: "Maó seen from the water, its houses looking over the harbour" },
  "menorca-doc-fest": { src: "/uploads/mao-puerto.webp",
    es: "El puerto de Maó con los edificios de la ribera",
    en: "Maó harbour with the buildings along its shore" },
  "opening-menorca-2026": { src: "illa-del-rei--0",
    es: "El antiguo hospital de la Illa del Rei, en el puerto de Maó, con sus arcadas",
    en: "The old hospital on Illa del Rei, in Maó harbour, with its arcades" },
  "pedra-en-viu-mostra": { src: "lithica--0",
    es: "El laberinto de piedra en el fondo de la cantera de s'Hostal",
    en: "The stone maze at the bottom of the s'Hostal quarry" },
  "setmana-santa-menorca": { src: "santa-maria-mao--0",
    es: "La fachada y el campanario de la iglesia de Santa Maria de Maó",
    en: "The façade and bell tower of the church of Santa Maria in Maó" },
  "temporada-opera-mao": { src: "teatre-mao--0",
    es: "La sala del Teatre Principal de Maó: butacas rojas, palcos dorados y el telón pintado",
    en: "The auditorium of Maó's Teatre Principal: red seats, gilded boxes and the painted curtain" },

  // ── DEPORTE ────────────────────────────────────────────────────────────────
  "artiem-half-menorca-triatlon": { src: "fornells--2",
    es: "La bahía de Fornells con los veleros fondeados y el pueblo blanco al fondo",
    en: "Fornells bay with yachts at anchor and the white village behind" },
  "mitja-marato-menorca": { src: "born-ciutadella--3",
    es: "El ayuntamiento de Ciutadella y las palmeras de la Plaça des Born",
    en: "Ciutadella town hall and the palm trees of Plaça des Born" },
  "regata-menorca-sant-joan-trofeo-alfonso-xiii": { src: "port-mao--2",
    es: "Veleros amarrados en el puerto de Maó con el cielo del atardecer",
    en: "Yachts moored in Maó harbour under an evening sky" },
  "swim-in-menorca-travesia-macarella-son-xoriguer": { src: "cami-cavalls--0",
    es: "El Camí de Cavalls sobre la costa, cerca de Son Xoriguer",
    en: "The Camí de Cavalls above the coast, near Son Xoriguer" },
  "trail-cami-cavalls": { src: "cami-cavalls--6",
    es: "Sendero del Camí de Cavalls con valla de madera, cerca de Cala Macarella",
    en: "A stretch of the Camí de Cavalls with a wooden fence, near Cala Macarella" },
  "vela-clasica-menorca-copa-rey-barcos-epoca": { src: "es-castell--4",
    es: "Un velero de casco azul amarrado en el puerto, frente a Es Castell",
    en: "A blue-hulled sailing boat moored in the harbour, off Es Castell" },
  "volta-cicloturista-internacional-menorca": { src: "ciclismo--3",
    es: "Carretera con carril rojo para bicicletas entre muros de piedra seca, camino de Punta Nati",
    en: "A road with a red cycle lane running between dry-stone walls, on the way to Punta Nati" },
  "volta-menorca-btt": { src: "ciclismo--1",
    es: "Una bicicleta de montaña apoyada en un muro de piedra seca, junto al indicador de Sant Lluís",
    en: "A mountain bike leaning on a dry-stone wall, beside the signpost to Sant Lluís" },
  "volta-menorca-pati-de-vela-trofeu-lluis-gay": { src: "/uploads/navegar-menorca.webp",
    es: "Un velero fondeado en una cala de aguas turquesas, bajo los acantilados",
    en: "A sailing boat anchored in a turquoise cove, beneath the cliffs" },

  // ── FIESTA ─────────────────────────────────────────────────────────────────
  "carme": { src: "es-castell--2",
    es: "Llaüts de madera amarrados en fila en el puerto, frente a las casas de Es Castell",
    en: "Wooden llaüts moored in a row in the harbour, facing the houses of Es Castell" },
  "carnaval-darrers-dies-menorca": { src: "ciutadella--2",
    es: "La Plaça d'Alfons III de Ciutadella, con sus palmeras y el reloj",
    en: "Plaça d'Alfons III in Ciutadella, with its palm trees and clock" },
  "festes-calan-porter-alaior": { src: "calan-porter--0",
    es: "La cala y la playa de Cala en Porter encajadas entre acantilados",
    en: "The cove and beach of Cala en Porter set between cliffs" },

  // ── GASTRONOMÍA ────────────────────────────────────────────────────────────
  "fira-arrels-es-mercadal": { src: "es-mercadal--4",
    es: "Una casa de tejado rojo entre el verde, en el término de Es Mercadal",
    en: "A red-roofed house among greenery, in the municipality of Es Mercadal" },
  "fira-del-camp-alaior": { src: "vaca-menorquina--2",
    es: "Vacas de raza menorquina pastando en un rastrojo del barranc de Son Boter, en Alaior",
    en: "Menorcan-breed cows grazing on stubble in the Son Boter ravine, Alaior" },
  "fira-formatge-mahon-menorca-mao": { src: "/uploads/queso-mahon-artesa.webp",
    es: "Piezas de queso de Mahón-Menorca curándose sobre madera",
    en: "Wheels of Mahón-Menorca cheese ageing on wood" },
  "vi-menorca-fest-mao": { src: "/uploads/vino-menorca.webp",
    es: "Copa y botella de vino menorquín sobre una mesa",
    en: "A glass and bottle of Menorcan wine on a table" },
};

// ── Índice translationKey → { lang: fichero } ────────────────────────────────
const index = {};
for (const f of readdirSync(DIR)) {
  if (!f.endsWith(".json")) continue;
  const o = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  if (o.translationKey) (index[o.translationKey] ||= {})[o.lang] = f;
}

/** Localiza la candidata por "<slug>--<n>" y devuelve sus metadatos. */
function candidata(ref) {
  const m = ref.match(/^(.+)--(\d+)$/);
  if (!m) return null;
  const grupo = idx[m[1]];
  if (!grupo) return null;
  return grupo.candidatas.find((c) => c.local.startsWith(`${m[1]}--${m[2]}.`));
}

/** "Autor / Wikimedia Commons (CC BY-SA 4.0)" */
function credito(c) {
  const autor = (c.autor || "").replace(/\s+/g, " ").trim() || "autor no indicado";
  return `${autor} / Wikimedia Commons (${c.licencia})`;
}

mkdirSync(OUT, { recursive: true });
const creditsPath = "src/data/agenda-fotos-credits.json";
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {};

let hechas = 0;
const fallos = [];
for (const [key, cfg] of Object.entries(MAPA)) {
  const fichas = index[key];
  if (!fichas) { fallos.push(`${key}: sin ficha`); continue; }

  let ruta, cred = null;
  if (cfg.src.startsWith("/uploads/")) {
    ruta = cfg.src;
    if (!existsSync("public" + ruta)) { fallos.push(`${key}: no existe ${ruta}`); continue; }
  } else {
    const c = candidata(cfg.src);
    if (!c) { fallos.push(`${key}: candidata ${cfg.src} no encontrada`); continue; }
    const base = `ag-${key}`;
    try {
      for (const w of WIDTHS) {
        const nombre = w === 1600 ? `${base}.webp` : `${base}-${w}.webp`;
        await sharp(join(TMP, c.local)).rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 78 }).toFile(join(OUT, nombre));
      }
    } catch (e) { fallos.push(`${key}: sharp ${e.message}`); continue; }
    ruta = `/uploads/${base}.webp`;
    cred = credito(c);
    credits[key] = { archivo: c.archivo, autor: c.autor, licencia: c.licencia, pagina: c.pagina, fuente: "Wikimedia Commons" };
  }

  for (const [lang, fichero] of Object.entries(fichas)) {
    const p = join(DIR, fichero);
    const o = JSON.parse(readFileSync(p, "utf8"));
    o.image = ruta;
    o.imageAlt = lang === "en" ? cfg.en : cfg.es;
    if (cred) o.imageCredit = cred; else delete o.imageCredit;
    writeFileSync(p, JSON.stringify(o, null, 2) + "\n");
  }
  hechas++;
}

writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + "\n");
console.log(`✓ ${hechas}/${Object.keys(MAPA).length} eventos con foto.`);
if (fallos.length) { console.log(`\n⚠ ${fallos.length} fallos:`); fallos.forEach((f) => console.log("  " + f)); }
