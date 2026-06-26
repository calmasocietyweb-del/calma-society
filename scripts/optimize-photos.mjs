// Optimiza fotos para la web: genera WebP responsive en public/uploads.
// Para cada imagen crea 3 anchos: base (1600), -960 y -480, para servir al
// móvil una versión ligera (srcset). El hero se recorta apaisado (cover) para
// que pese mucho menos. Uso: node scripts/optimize-photos.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = "MATERIAL FOTOS RRSS/Menorca";
const OUT = "public/uploads";
const QUALITY = 78;
const WIDTHS = [1600, 960, 480]; // base + variantes responsive

// jobs: { src, out, cover? }  — cover fuerza recorte apaisado (para heroes).
const jobs = [
  { src: `${SRC}/_web_CC/Menorca_Cala_Macarella_Menorca_02.jpg`, out: "cala-macarella" },
  { src: `${SRC}/_web_CC/Menorca_Cala_Turqueta_Menorca_06.jpg`, out: "cala-turqueta" },
  { src: `${SRC}/Cala-Mitjana-desde-el-Aire.jpg`, out: "cala-mitjana" },
  { src: `${SRC}/cala pregonda.jpg`, out: "cala-pregonda" },
  { src: `${SRC}/pelayo-arbues-OYUj4l3FoPQ-unsplash.jpg`, out: "menorca-hero", cover: { w: 1600, h: 1000 } },
  { src: `${SRC}/pelayo-arbues-B1gDa1LjMG4-unsplash.jpg`, out: "cala-macarelleta" },
  { src: `${SRC}/pelayo-arbues-CkZ1gMcK-iE-unsplash.jpg`, out: "cami-de-cavalls" },
  { src: `${SRC}/ciuta.avif`, out: "ciutadella" },
  // Fotos de Adobe Stock (licenciadas).
  { src: `${SRC}/_stock/fine-dining.jpg`, out: "fine-dining" },
  { src: `${SRC}/_stock/queso-curacion.jpg`, out: "queso-curacion" },
  { src: `${SRC}/_stock/casa-piedra.jpg`, out: "casa-piedra" },
  { src: `${SRC}/_stock/menorca-punta-nati.jpg`, out: "menorca-punta-nati" },
  { src: `${SRC}/_stock/puerto-mao.jpg`, out: "puerto-mao" },
  { src: `${SRC}/_stock/fornells.jpg`, out: "fornells" },
  { src: `${SRC}/_stock/faro-artrutx.jpg`, out: "faro-artrutx" },
  { src: `${SRC}/_stock/gin-menorca.jpg`, out: "gin-menorca" },
  { src: `${SRC}/_stock/villa-menorca.jpg`, out: "villa-menorca" },
  // Entradas nuevas (jun 2026).
  { src: `${SRC}/_stock/mao-puerto.jpg`, out: "mao-puerto", cover: { w: 1600, h: 1000 } }, // origen vertical → recorte apaisado
  { src: `${SRC}/_stock/binibeca.jpg`, out: "binibeca" },
  { src: `${SRC}/_stock/atardecer-menorca.jpg`, out: "atardecer-menorca" },
  { src: `${SRC}/_stock/navegar-menorca.jpg`, out: "navegar-menorca" },
  { src: `${SRC}/_stock/calma-menorca.jpg`, out: "calma-menorca" },
  // s'Albufera des Grau — Wikimedia Commons (Nicolas G. Mertens, CC BY-SA 4.0).
  { src: `${SRC}/_stock/albufera-des-grau.jpg`, out: "albufera-des-grau" },
  // Guía de productos de Menorca (Adobe Stock, licenciadas — jun 2026).
  { src: `${SRC}/_stock/productos-menorca.jpg`, out: "productos-menorca" },
  { src: `${SRC}/_stock/avarcas-menorca.jpg`, out: "avarcas-menorca" },
  { src: `${SRC}/_stock/vino-menorca.jpg`, out: "vino-menorca" },
  { src: `${SRC}/_stock/embutidos-menorca.jpg`, out: "embutidos-menorca" },
  { src: `${SRC}/_stock/dulces-menorca.jpg`, out: "dulces-menorca" },
  // Clúster de movilidad / transporte (Adobe Stock, licenciadas — jun 2026).
  { src: `${SRC}/_stock/crucero-menorca.jpg`, out: "crucero-menorca", cover: { w: 1600, h: 1000 } },
  { src: `${SRC}/_stock/transfer-menorca.jpg`, out: "transfer-menorca" },
  // Flota de LUJO de Menorca Bus (Mercedes Clase S y Clase V negros, en Menorca;
  // crédito "Menorca Bus"). Originales en "COCHES Videos y fotos/" (fuera del repo).
  { src: "COCHES Videos y fotos/Fotos/Clase V/7E3A0998.jpg", out: "mb-movilidad" },
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A0235.jpg", out: "mb-aeropuerto" },
  { src: "COCHES Videos y fotos/Fotos/Clase V/7E3A0917.jpg", out: "mb-excursiones" },
  { src: `${SRC}/_stock/mb-cruceros.webp`, out: "mb-cruceros" },
  // Movilidad de LUJO (Mercedes Clase S junto al puerto de Maó; crédito "Menorca Bus").
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A0304.jpg", out: "mb-lujo" }, // hero del hub
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A0362.jpg", out: "mb-clase-s-puerto" }, // intercalada Clase S
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A0274.jpg", out: "mb-lujo-detalle" }, // detalle cromado
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A0240.jpg", out: "mb-velada" }, // estrella S (hero velada)
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A0288.jpg", out: "mb-velada-detalle" }, // piloto S (intercalada)
  { src: "COCHES Videos y fotos/Fotos/Clase V/7E3A0890.jpg", out: "mb-bodas" }, // Clase V frontal (hero bodas)
  { src: "COCHES Videos y fotos/Fotos/Clase V/7E3A0833.jpg", out: "mb-bodas-grupo" }, // Clase V trasera (intercalada)
  // Interiores cuidados (variedad de composición): habitáculos en piel.
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A0671.jpg", out: "mb-clase-s-interior" }, // asientos traseros piel coñac
  { src: "COCHES Videos y fotos/Fotos/Clase V/7E3A1140.jpg", out: "mb-clase-v-interior" }, // habitáculo trasero piel negra
  // Sesión NOCTURNA del Clase S (faros/pilotos LED, ambiente LED interior) — para
  // el carrusel de "Atardeceres y copas". Fotos reales de la flota (Menorca Bus).
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A1419.jpg", out: "mb-noche-exterior" }, // coche de noche, faros LED + estrella proyectada
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A1314.jpg", out: "mb-noche-faros" }, // frontal con faros LED encendidos
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A1321.jpg", out: "mb-noche-piloto" }, // piloto trasero LED rojo de noche
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A1333.jpg", out: "mb-noche-volante" }, // interior nocturno, LED ambiental + estrella en el volante
  { src: "COCHES Videos y fotos/Fotos/Clase S/7E3A1356.jpg", out: "mb-noche-plazas" }, // plazas traseras piel coñac con LED ambiental
  // Fotos intercaladas en artículos (Adobe Stock, licenciadas — jun 2026).
  { src: `${SRC}/_stock/queso-tabla.jpg`, out: "queso-tabla" },
  { src: `${SRC}/_stock/gin-tonic.jpg`, out: "gin-tonic" },
  { src: `${SRC}/_stock/vino-bodega.jpg`, out: "vino-bodega" },
  { src: `${SRC}/_stock/embutidos-tabla.jpg`, out: "embutidos-tabla" },
  { src: `${SRC}/_stock/dulces-amargos.jpg`, out: "dulces-amargos" },
  { src: `${SRC}/_stock/alta-cocina-plato.jpg`, out: "alta-cocina-plato" },
  { src: `${SRC}/_stock/binibeca-calle.jpg`, out: "binibeca-calle" },
  { src: `${SRC}/_stock/ciutadella-puerto.jpg`, out: "ciutadella-puerto" },
  // Fotos reales de Wikimedia Commons (CC, con crédito) — talayótico y s'Albufera.
  { src: `${SRC}/_stock/naveta-tudons.jpg`, out: "naveta-tudons" }, // Menorquino, CC BY-SA 3.0
  { src: `${SRC}/_stock/albufera-badia.jpg`, out: "albufera-badia" }, // Discasto, CC BY-SA 4.0
  // Lote nuevo (jun 2026).
  { src: `${SRC}/_stock/mahonesa.jpg`, out: "mahonesa" }, // Adobe Stock
  { src: `${SRC}/_stock/sant-joan-jaleo.jpg`, out: "sant-joan-jaleo" }, // Strykess, Wikimedia CC BY-SA 4.0
  { src: `${SRC}/_stock/sant-joan-caixer.jpg`, out: "sant-joan-caixer" }, // Orruza1983, Wikimedia CC BY-SA 4.0
  // Pueblos (Wave B, jun 2026).
  { src: `${SRC}/_stock/cales-fonts.jpg`, out: "cales-fonts", cover: { w: 1600, h: 1000 } }, // Adobe Stock (vertical → apaisado)
  { src: `${SRC}/_stock/monte-toro.jpg`, out: "monte-toro" }, // Ian Kirk, Wikimedia CC BY 2.0
  { src: `${SRC}/_stock/alaior.jpg`, out: "alaior" }, // Mathewr1999, Wikimedia CC BY-SA 4.0
  { src: `${SRC}/_stock/cala-galdana.jpg`, out: "cala-galdana" }, // Adobe Stock
  { src: `${SRC}/_stock/binigaus.jpg`, out: "binigaus" }, // Adobe Stock
  // Destinos emblemáticos (Wave C, jun 2026) — Wikimedia Commons, con crédito.
  { src: `${SRC}/_stock/lithica.jpg`, out: "lithica" }, // Ben Salter, CC BY 2.0
  { src: `${SRC}/_stock/illa-del-rei.jpg`, out: "illa-del-rei" }, // Florent Pécassou, CC BY-SA 4.0
  { src: `${SRC}/_stock/cova-den-xoroi.jpg`, out: "cova-den-xoroi", cover: { w: 1600, h: 1000 } }, // Travelinho, CC BY-SA 3.0 (vertical → apaisado)
  { src: `${SRC}/_stock/la-mola.jpg`, out: "la-mola" }, // Alvaro Ortiz, CC BY-SA 3.0
  // Cultura/gastronomía (Wave E, jun 2026).
  { src: `${SRC}/_stock/caldereta-langosta.jpg`, out: "caldereta-langosta" }, // Adobe Stock
  // Playas (Wave D, jun 2026).
  { src: `${SRC}/_stock/son-bou.jpg`, out: "son-bou" }, // Wasquewhat, Wikimedia CC BY-SA 4.0
  // Fiestas para la Agenda (Adobe Stock, licenciadas — jun 2026). Variedad: una por fiesta.
  { src: `${SRC}/_stock/cabalgata-reyes.jpg`, out: "cabalgata-reyes" }, // Adobe Stock #676011625 (Cabalgata de Reyes)
  { src: `${SRC}/_stock/carnaval-menorca.jpg`, out: "carnaval-menorca" }, // Adobe Stock #573061026 (disfraces de carnaval)
  { src: `${SRC}/_stock/fiesta-caballos.jpg`, out: "fiesta-caballos" }, // Adobe Stock #316855635 (jinete y caballo, fiesta tradicional)
  { src: `${SRC}/_stock/caballos-jinetes.jpg`, out: "caballos-jinetes" }, // Adobe Stock #510706254 (caballos y jinetes)
  { src: `${SRC}/_stock/jinetes-fiesta.jpg`, out: "jinetes-fiesta" }, // Adobe Stock #1239213075 (jinetes engalanados)
];

mkdirSync(OUT, { recursive: true });

for (const j of jobs) {
  for (const w of WIDTHS) {
    // base = "nombre.webp"; variantes = "nombre-960.webp", "nombre-480.webp"
    const name = w === 1600 ? `${j.out}.webp` : `${j.out}-${w}.webp`;
    try {
      let img = sharp(j.src).rotate();
      if (j.cover) {
        // Recorte apaisado proporcional al ancho.
        const h = Math.round((j.cover.h / j.cover.w) * w);
        img = img.resize({ width: w, height: h, fit: "cover" });
      } else {
        img = img.resize({ width: w, withoutEnlargement: true });
      }
      const info = await img.webp({ quality: QUALITY }).toFile(join(OUT, name));
      console.log(`✓ ${name}  ${Math.round(info.size / 1024)} KB  ${info.width}x${info.height}`);
    } catch (e) {
      console.log(`✗ ${name}: ${e.message}`);
    }
  }
}
