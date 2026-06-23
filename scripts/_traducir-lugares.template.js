export const meta = {
  name: 'traducir-lugares-planner',
  description: 'Traduce a inglés (voz lujo tranquilo) el texto de las fichas de lugar que faltan en el dataset EN del planificador',
  phases: [{ title: 'Traducir', detail: 'agentes traducen lotes de lugares ES→EN' }],
}

const PLACES = __PLACES__

const TRANS_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          key: { type: 'string' },
          nameEn: { type: 'string' },
          descriptionEn: { type: 'string' },
          areaEn: { type: 'string' },
          highlightsEn: { type: 'array', items: { type: 'string' } },
        },
        required: ['key', 'nameEn', 'descriptionEn', 'areaEn', 'highlightsEn'],
      },
    },
  },
  required: ['items'],
}

function promptFor(batch) {
  return `Eres traductor/localizador de Calma Society, revista premium sobre Menorca. Traduce ES→EN el texto de estas fichas de lugar (para el planificador de viajes en inglés). VOZ "lujo tranquilo": sobria, elegante, SIN exclamaciones ni superlativos vacíos; inglés británico natural.

REGLAS:
- nameEn: mantén los NOMBRES PROPIOS de lugar/negocio tal cual (Cala Algaiarens, Bodegas Binifadet, Cova d'en Xoroi). Traduce solo descriptores genéricos: "Faro de X" → "X Lighthouse", "Mirador de X" → "X Viewpoint", "Cueva de X" → "X Cave", "Yacimiento de X" → "X (archaeological site)". Si dudas, deja el nombre propio.
- descriptionEn: traduce el SIGNIFICADO a una frase limpia y completa (1-2 frases, concisa: se usa como blurb corto). OJO: varias descripciones ES vienen CORTADAS a media palabra (acaban en "(co", "(M"…); NO copies el corte: redacta una frase EN completa y natural con la información legible. No inventes datos que no estén.
- areaEn: traduce la dirección, conserva el municipio entre paréntesis: "Norte (Ciutadella)" → "North (Ciutadella)", "Sur-este (Sant Lluis)" → "South-east (Sant Lluís)".
- highlightsEn: traduce cada highlight (frases accionables "qué ver/hacer"), misma voz. Si la ficha no trae highlights, devuelve [].

GLOSARIO: cala → cove · playa → beach · faro → lighthouse · mirador → viewpoint · yacimiento talayótico → Talayotic site · casco antiguo → old town · bodega → winery · sendero → trail · pinar → pine wood · arena → sand · aguas turquesa → turquoise water · atardecer → sunset.

FICHAS (JSON): ${JSON.stringify(batch)}

Devuelve items: [{key, nameEn, descriptionEn, areaEn, highlightsEn}] para CADA ficha del lote (usa la key EXACTA).`
}

phase('Traducir')
const BATCH = 8
const WAVE = 3
const groups = []
for (let i = 0; i < PLACES.length; i += BATCH) groups.push(PLACES.slice(i, i + BATCH))
const results = []
for (let i = 0; i < groups.length; i += WAVE) {
  const wave = groups.slice(i, i + WAVE)
  const r = await parallel(wave.map((g, j) => () =>
    agent(promptFor(g), { label: `traducir:lote-${i + j}`, phase: 'Traducir', schema: TRANS_SCHEMA })
  ))
  results.push(...r)
  const done = results.filter(Boolean).flatMap((x) => x.items || []).length
  log(`ola ${Math.floor(i / WAVE) + 1}/${Math.ceil(groups.length / WAVE)}: ${done} lugares traducidos`)
}
return results.filter(Boolean).flatMap((x) => x.items || [])
