# Posibilidad de medusas en el mapa — diseño aprobado

> **Fecha:** 2026-07-17 · **Aprobado por:** Cristian (chat, mismo día)
> **Herramienta:** «Dónde el mar está en calma» (`ParteCalmaMap.astro`)
> **Estado previo:** el modelo `empuje-medusas-1.0` (ciencia+legal, doc
> `docs/DONDE-EL-MAR-ESTA-EN-CALMA.md` §3) lleva calculándose a diario en
> producción (`parte-calma.json → calas[].medusas`), con la UI **apagada**
> (`MEDUSAS_ENABLED=false`) por 3 bloqueantes legales anotados en el doc §6.

## 1. Decisión de producto (Cristian, 17-jul)

- Se publica una **«Posibilidad de medusas»**: dónde el viento lleva horas
  empujando hacia la cala → **PODRÍA** haber; **nunca** se afirma presencia.
- **Sin MedusApp ni ninguna fuente externa nueva**: solo nuestro dato de
  viento (AEMET). Se elimina del código el enlace y toda mención a MedusApp.
  (El invariante «banda siempre con enlace a avistamientos» del modelo v1 se
  sustituye por: banda siempre con **descargo inevadible** que remite a
  **banderas y socorristas**.)
- **Stickers en el mapa**: medusas **rosa malva claro**, simples y sofisticadas.
  **ALTO grande + MODERADO tenue** (elegido sabiendo que hoy serían 1 + 39).
- Cierre de bloqueantes (brief del investigador
  `.tmp_research/2026-07-17-medusas-fuentes.md`, consultado 17-jul):
  AEMET permite derivados comerciales con la leyenda literal **«Fuente: AEMET»**
  (hoy ponemos «Datos: AEMET» → se ajusta); Open-Meteo solo existe en el POC de
  dev; MedusApp deja de ser dependencia. → Se enciende `MEDUSAS_ENABLED=true`.

## 2. Comportamiento

| Caso | Qué se ve en el mapa |
|---|---|
| Empuje **ALTO** | Medusa plena (~17 px, opacidad ~0.9) con vaivén lentísimo (float CSS ~6 s) |
| Empuje **MODERADO** | Medusa pequeña (~11 px, opacidad ~0.38), estática tras el fundido |
| **BAJO** / `sin-dato` | Nada en el mapa (el detalle vive en la ficha de la cala) |
| Día ≠ hoy (línea temporal) | La capa **desaparece**: el empuje se calcula con viento YA soplado (48 h reales); predecirlo a días vista sería inventar |
| Parte caducado (`stale`) | La capa **no se pinta** |

- Aparición: **fade-in suave** al pintar; `prefers-reduced-motion` → sin float
  y sin fade (aparecen quietas).
- **Clic en la medusa → ficha de su cala** (mismo destino que su punto), con
  evento Umami **`calma-medusa`**. Los stickers son atajo **redundante**
  (la ficha ya es alcanzable por punto y lista): van con `aria-hidden="true"`
  y `tabindex="-1"` — decorativos para lector de pantalla y teclado; el dato
  accesible es el texto de la ficha.

## 3. Posición en el mapa (geometría)

Cada medusa se ancla **mar adentro frente a su cala**: punto de costa
`puntoEnArco(sFinal[i])` + `normal * MAR_OFFSET` (ALTO ~14 px, MODERADO ~10 px;
signo positivo = hacia el mar — los puntos de cala usan el negativo, tierra
adentro). Al usar `sFinal` (posición ya repartida por el anti-solape) las
medusas **heredan la separación tangencial** de sus calas: sin amontonarse y
sin lógica nueva. Nunca sobre tierra.

## 4. Visual

- **Un solo color, dos intensidades** (fiel a *Pelagia noctiluca*, que es
  rosa-malva): relleno rosa claro `#E3B7C4`, trazo `#C98DA3` (hex directos en
  el componente, como el semáforo `FILL` existente; no son tokens de marca).
- Sticker = `<symbol>` SVG único (campana + 3-4 tentáculos ondulados de trazo
  fino, estética de línea, nada infantil) + un `<use>` por cala elegible.
- Leyenda del mapa: entrada nueva con el símbolo y el texto (ES/EN/FR):
  «Medusa = el viento lleva horas empujando hacia esa cala: **podría** haber.
  No es un avistamiento. Solo para hoy.»

## 5. Ficha de la cala (bloque ya construido, se enciende y se retoca)

- `MEDUSAS_ENABLED = true`.
- Título humano nuevo: **«Posibilidad de medusas»** (tri), sobre el subtítulo
  técnico existente («Empuje del viento hacia la cala, orientativo»).
- Los textos por banda (baja/media/alta) **se mantienen** tal cual (ya honestos).
- **Descargo reescrito sin MedusApp** (tri), invariante inevadible se conserva:
  «Estimamos condiciones de llegada a partir del viento de las últimas 48 h;
  no detectamos medusas ni afirmamos que las haya. No captura las corrientes
  marinas. Para presencia real, consulta las banderas y a los socorristas.»
- Fuera: `const MEDUSAPP`, `medusasCTA` y su `<a>` (evento `calma-medusas-app`
  muere; en `/panel/analitica` se sustituye por `calma-medusa`).

## 6. Legal / atribución

- Donde diga **«Datos: AEMET»** pasa a la leyenda literal **«Fuente: AEMET»**
  (página del mapa y páginas de metodología es/en/fr si aparece).
- Prohibido sugerir patrocinio de AEMET (no cambia nada: no lo hacemos).
- Open-Meteo: solo en `scripts/*.poc.mjs` (dev, no comercial); producción no lo usa.

## 7. Fuera de alcance

- Tocar la fórmula `empuje-medusas-1.0` (recalibrado: tras 1 temporada, ya anotado).
- Extender el empuje a días futuros (línea temporal) — requeriría otro modelo.
- Override manual de ALTA (pendiente previo, no cambia).
- Cualquier integración externa (MedusApp, Platges de Balears — hoy caída).

## 8. Verificación (definición de hecho)

1. `astro check` 0/0 · suite de tests verde · build sin errores.
2. **Chrome headless (CDP)** con los datos del día (hoy: 1 ALTA + 39 MODERADO),
   móvil y escritorio: medusas en el mar (ninguna sobre tierra), jerarquía
   visible, desaparecen al mover la línea temporal, fundido correcto,
   `prefers-reduced-motion` respetado, clic baja a la ficha.
3. Accesibilidad: capa `aria-hidden`, sin paradas de tabulador nuevas; el
   dato en texto en cada ficha; contraste del texto sin cambios.
4. Tras aprobación de Cristian **en vivo**: push → `curl -sL` en producción
   (página + leyenda + «Fuente: AEMET») y ficha en Jira → Finalizado.
