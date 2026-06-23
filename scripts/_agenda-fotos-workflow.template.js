export const meta = {
  name: 'agenda-fotos-tematicas',
  description: 'Un agente por evento de la agenda busca en Adobe Stock (free) la foto acorde a su tema; devuelve candidatos rankeados sin coordinar (el dedup es del main loop)',
  phases: [{ title: 'Buscar', detail: 'fan-out: un agente por evento busca su foto temática en Adobe Stock' }],
}

const EVENTS = __EVENTS__

const LIBRARY = `BIBLIOTECA (fotos reales ya disponibles; usa una SOLO si es un match fuerte y literal para ESTE evento, kind "library", ref = el nombre exacto):
- cami-de-cavalls: sendero costero del Camí de Cavalls (senderismo/trail)
- lithica: anfiteatro de las antiguas canteras de marés de Lithica (Pedreres de s'Hostal)
- cova-den-xoroi: bar en cueva sobre los acantilados al atardecer (Cova d'en Xoroi)
- naveta-tudons: monumento talayótico de piedra
- la-mola: fortaleza de La Mola en la bocana del puerto de Maó
- illa-del-rei: isla con hospital histórico en el puerto de Maó
- ciutadella / ciutadella-puerto: casco antiguo / puerto de Ciutadella
- mao-puerto / puerto-mao: puerto de Maó
- cales-fonts: puerto de Es Castell con terrazas en cuevas de pescadores
- alaior: pueblo blanco de Alaior
- binibeca / binibeca-calle: callejuelas encaladas de Binibeca
- queso-tabla / queso-curacion: queso de Mahón-Menorca
- vino-bodega / vino-menorca: vino y bodega de Menorca
- gin-menorca / gin-tonic: ginebra de Menorca
- caldereta-langosta: caldereta de langosta
- productos-menorca / embutidos-menorca / dulces-menorca / avarcas-menorca / mahonesa: producto local
- fine-dining / alta-cocina-plato: alta cocina emplatada
- atardecer-menorca: atardecer mediterráneo
- faro-artrutx / menorca-punta-nati: faros y acantilados
- albufera-des-grau / albufera-badia: humedal del parque natural de s'Albufera des Grau
- son-bou / cala-galdana / cala-mitjana / cala-macarella / cala-turqueta / cala-pregonda / binigaus / cala-macarelleta: playas y calas
- navegar-menorca: velero navegando
- calma-menorca / menorca-hero: paisaje de Menorca`

const CAND_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string' },
    idealSubject: { type: 'string' },
    toolAccess: { type: 'string', description: 'ok si pudiste buscar; si no, el error' },
    candidates: {
      type: 'array', minItems: 1, maxItems: 8,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          kind: { type: 'string', enum: ['stock', 'library'] },
          ref: { type: 'string', description: 'assetId real (stock) o nombre exacto de biblioteca (library)' },
          name: { type: 'string' },
          fit: { type: 'string' },
          width: { type: 'integer' },
          height: { type: 'integer' },
          pricing: { type: 'string' },
        },
        required: ['kind', 'ref', 'name', 'fit'],
      },
    },
  },
  required: ['key', 'idealSubject', 'toolAccess', 'candidates'],
}

function promptFor(ev) {
  return `Eres documentalista de fotografía de una revista de viajes PREMIUM sobre Menorca. Para el evento de agenda de abajo, encuentra la mejor foto que ENCAJE con su tema concreto: que un lector lo entienda de un vistazo. Nada genérico ni que descuadre (una playa para un concierto está MAL).

PASOS:
1. ToolSearch con query EXACTA: select:mcp__claude_ai_Adobe_for_creativity__adobe_mandatory_init,mcp__claude_ai_Adobe_for_creativity__asset_search
2. Llama a mcp__claude_ai_Adobe_for_creativity__adobe_mandatory_init (sin args).
3. Decide el TEMA visual ideal (idealSubject) leyendo título y descripción.
4. Haz 2-5 búsquedas con asset_search (entityScope "StockAsset"), queries CORTAS de palabras clave (inglés y español). NO uses filtros de orientación/contentType (dan 0 resultados). Puedes usar filters {"pricing":"free"}.
5. Quédate con resultados pricing "free" y APAISADOS (width>height). Elige 6-8 candidatos DIVERSOS que de verdad representen el tema (variedad: si otro evento parecido coge uno, que queden alternativas distintas).
6. Solo si una imagen de la BIBLIOTECA es un match fuerte y literal para ESTE evento (p. ej. el propio lugar), inclúyela también (kind "library").

PISTAS POR TIPO:
- Conciertos de teatro/clásica/ópera/flamenco: músicos/cantantes/orquesta/escenario; NO el edificio ni el puerto.
- Órgano: órgano de tubos de iglesia.
- Festivales de música pop/rock/indie/electrónica: escenario/público/luces de festival.
- Cine/documental: proyección, sala o festival de cine.
- Arte contemporáneo (Opening): galería/exposición/obra de arte.
- Mercados (diurnos o nocturnos): puestos de mercado, paradas de artesanía/producto; los nocturnos al atardecer con luces.
- Ferias gastronómicas: queso/vino/embutidos/producto según el caso concreto.
- Deporte: el deporte EXACTO (triatlón, media maratón corriendo, ciclismo de carretera, BTT, regata de vela / barcos clásicos de madera, natación en aguas abiertas, patí català/catamarán de vela ligera).
- Fiestas patronales de caballos de Menorca (Sant Joan y similares: jaleo, caixers): caballo negro encabritado, jinete y multitud; busca VARIEDAD para que cada pueblo tenga foto distinta. Fiesta marinera (Carme): barcas engalanadas y procesión marítima.
- Procesiones (Setmana Santa; Sant Antoni/Diada): procesión, cofradía o el acto típico.
- Feria cinegética (perdiz): perdiz/ave o feria rural de caza.

EVENTO:
- key: ${ev.key}
- título: ${ev.titleEs} / ${ev.titleEn}
- categoría: ${ev.category}
- lugar: ${ev.location}
- descripción: ${ev.descEs}

${LIBRARY}

Devuelve: key (= ${ev.key}), idealSubject, toolAccess ("ok" o el error), y 6-8 candidates rankeados mejor-primero (kind, ref=assetId real o nombre de biblioteca, name del resultado, fit=por qué encaja con ESTE evento, width, height, pricing).`
}

phase('Buscar')
const results = await parallel(EVENTS.map((ev) => () =>
  agent(promptFor(ev), { label: `buscar:${ev.key}`, phase: 'Buscar', schema: CAND_SCHEMA })
))
return results.filter(Boolean)
