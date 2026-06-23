export const meta = {
  name: 'verificar-fechas-agenda',
  description: 'Un agente por evento pendiente verifica su fecha 2026 con fuentes oficiales y la marca como confirmada o aproximada',
  phases: [{ title: 'Verificar', detail: 'investigación web de la fecha 2026 de cada evento' }],
}

const EVENTS = __EVENTS__

const DATE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    key: { type: 'string' },
    dateType: { type: 'string', enum: ['fija-anual', 'movible-religiosa', 'recurrente-semanal', 'recurrente-temporada', 'puntual-2026', 'desconocida'] },
    startDate: { type: 'string', description: 'YYYY-MM-DD: mejor fecha 2026 (confirmada o aproximada). Vacío solo si es desconocida del todo.' },
    endDate: { type: 'string', description: 'YYYY-MM-DD o cadena vacía' },
    confidence: { type: 'string', enum: ['confirmada', 'aproximada', 'desconocida'] },
    basis: { type: 'string', description: 'Explicación breve: por qué esa fecha y de dónde sale.' },
    sourceName: { type: 'string' },
    sourceUrl: { type: 'string' },
    recommend: { type: 'string', enum: ['publicar', 'mantener-pendiente'] },
  },
  required: ['key', 'dateType', 'startDate', 'endDate', 'confidence', 'basis', 'sourceName', 'sourceUrl', 'recommend'],
}

function promptFor(ev) {
  return `Eres el verificador de datos de una revista premium sobre Menorca. NO inventes: el valor de la marca es que los datos sean reales y citables. Tu tarea: encontrar la FECHA 2026 (o el patrón recurrente) de este evento de la agenda, con fuente fiable.

USA WebSearch y WebFetch. Fuentes preferentes (de más a menos fiable):
- Web/redes oficiales del evento o festival.
- Ayuntamientos de Menorca (aj. de Maó, Ciutadella, Es Mercadal, Alaior, Ferreries, Sant Lluís, Es Castell, Es Migjorn Gran) y Consell Insular de Menorca (menorca.es).
- Federaciones deportivas / clubes (para regatas y travesías).
- Agendas culturales fiables de Menorca.

REGLAS por tipo:
- Mercados semanales/nocturnos: confirma el DÍA de la semana y la TEMPORADA (p. ej. "miércoles por la noche, de junio a septiembre"). Devuelve como startDate una fecha REPRESENTATIVA de 2026 = la primera vez que cae ese día dentro de la temporada en 2026. dateType "recurrente-semanal" o "recurrente-temporada". Si el patrón está documentado → confidence "confirmada".
- Fiestas religiosas MÓVILES (Semana Santa, Carnaval/Darrers Dies): CALCÚLALAS. La Pascua de 2026 es el domingo 5 de abril de 2026. Por tanto: Domingo de Ramos = 29 marzo 2026; Viernes Santo = 3 abril 2026; Miércoles de Ceniza = 18 febrero 2026 (Carnaval/Darrers Dies = los días previos, ~12-17 feb 2026). dateType "movible-religiosa", confidence "confirmada".
- Fiestas patronales de pueblo: tienen fecha tradicional ligada al santo o a un fin de semana fijo. Si el programa 2026 aún no está publicado, da la fecha APROXIMADA basada en el patrón habitual (p. ej. "último fin de semana de septiembre") y márcala "aproximada".
- Festivales/ciclos (ópera, conciertos, ferias): busca las fechas 2026 anunciadas; si no, aproxima por la temporada/edición previa y marca "aproximada".
- Si de verdad no hay NADA fiable ni patrón: confidence "desconocida", startDate vacío, recommend "mantener-pendiente".

EVENTO:
- key: ${ev.key}
- título: ${ev.titleEs} / ${ev.titleEn}
- categoría: ${ev.category}
- lugar: ${ev.location}
- fecha actual en la ficha (orientativa): ${ev.startDate}${ev.endDate ? ' a ' + ev.endDate : ''}
- descripción: ${ev.descEs}

Devuelve: key (= ${ev.key}), dateType, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD o ""), confidence, basis (breve, con la razón), sourceName, sourceUrl, recommend. Recomienda "publicar" si tienes fecha confirmada o una aproximación razonable; "mantener-pendiente" solo si es desconocida.`
}

phase('Verificar')
const CHUNK = 4 // lotes secuenciales: concurrencia baja para no saturar la API
const results = []
for (let i = 0; i < EVENTS.length; i += CHUNK) {
  const batch = EVENTS.slice(i, i + CHUNK)
  const r = await parallel(batch.map((ev) => () =>
    agent(promptFor(ev), { label: `fecha:${ev.key}`, phase: 'Verificar', schema: DATE_SCHEMA })
  ))
  results.push(...r)
  log(`lote ${Math.floor(i / CHUNK) + 1}/${Math.ceil(EVENTS.length / CHUNK)}: ${results.filter(Boolean).length}/${EVENTS.length} verificados`)
}
return results.filter(Boolean)
