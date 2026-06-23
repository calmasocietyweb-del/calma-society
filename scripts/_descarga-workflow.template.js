export const meta = {
  name: 'descarga-agenda-fotos',
  description: 'Agentes licencian (Adobe Stock, free) y descargan con curl las fotos de la agenda a _stock/ag-<key>.jpg',
  phases: [{ title: 'Descargar', detail: 'lotes de agentes; cada uno licencia y descarga un grupo' }],
}

const ITEMS = __ITEMS__

const DL_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    downloads: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          key: { type: 'string' }, assetId: { type: 'string' },
          ok: { type: 'boolean' }, bytes: { type: 'integer' }, note: { type: 'string' },
        },
        required: ['key', 'assetId', 'ok', 'bytes', 'note'],
      },
    },
  },
  required: ['downloads'],
}

function promptFor(group) {
  return `Tienes herramienta Bash y herramientas MCP de Adobe. Descarga a disco cada foto de Adobe Stock de la lista.

PASOS:
1. Carga la herramienta de licencia: ToolSearch con query EXACTA: select:mcp__claude_ai_Adobe_for_creativity__adobe_mandatory_init,mcp__claude_ai_Adobe_for_creativity__asset_license_and_download_stock
2. Llama a mcp__claude_ai_Adobe_for_creativity__adobe_mandatory_init (sin args).
3. Para CADA item: llama a mcp__claude_ai_Adobe_for_creativity__asset_license_and_download_stock con su assetId → obtienes downloadUrl (S3 presigned, válido 1h).
4. Descarga con Bash a la ruta exacta (el directorio ya existe; usa la key TAL CUAL):
   curl -sL "<downloadUrl>" -o "MATERIAL FOTOS RRSS/Menorca/_stock/ag-<key>.jpg"
5. Verifica el tamaño: wc -c < "MATERIAL FOTOS RRSS/Menorca/_stock/ag-<key>.jpg"
   Si algún curl falla o el archivo pesa <50000 bytes, reintenta una vez (re-licencia para refrescar la URL).

Items (JSON): ${JSON.stringify(group)}

Importante: la working dir ya es el repo; NO uses rutas absolutas. Descarga TODOS los items del grupo.
Devuelve downloads: [{key, assetId, ok (true si el jpg pesa >50000 bytes), bytes, note breve}].`
}

phase('Descargar')
const GROUP = 6        // items por agente
const WAVE = 3         // agentes concurrentes por ola (suave con la API)
const groups = []
for (let i = 0; i < ITEMS.length; i += GROUP) groups.push(ITEMS.slice(i, i + GROUP))
const results = []
for (let i = 0; i < groups.length; i += WAVE) {
  const wave = groups.slice(i, i + WAVE)
  const r = await parallel(wave.map((g, j) => () =>
    agent(promptFor(g), { label: `descarga:grupo-${i + j}`, phase: 'Descargar', schema: DL_SCHEMA })
  ))
  results.push(...r)
  const done = results.filter(Boolean).flatMap((x) => x.downloads || []).filter((d) => d.ok).length
  log(`ola ${Math.floor(i / WAVE) + 1}/${Math.ceil(groups.length / WAVE)}: ${done} fotos descargadas en total`)
}
return results.filter(Boolean).flatMap((x) => x.downloads || [])
