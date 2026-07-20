# Dónde el mar está en calma — parte diario de calas

> Herramienta diferencial de Calma Society: un mapa diario que estima, por cala,
> el **abrigo del mar** frente al viento de hoy y una **posibilidad de medusas**.
> Es contenido de primera mano, fechado y con metodología abierta → muy citable
> por IA (GEO) y alimento de la newsletter ("la cala de la semana").

## 1. Qué publica (y qué NO)

- **Abrigo del mar** (banda **alto / medio / bajo**): único indicador "fuerte".
  Es predicción meteo objetiva (viento de AEMET) cruzada con la orientación de la
  cala. **No** es un porcentaje exacto (sería falsa precisión): se comunica en bandas.
- **Posibilidad de medusas** (banda **baja / media / alta**): estimación por
  persistencia de viento *onshore*. Mide **condiciones de llegada**, NO presencia.
  Sin fuentes externas (decisión de Cristian, 17-jul-2026): solo nuestro dato de
  viento; el descargo remite a banderas y socorristas.
- **Nunca**: un aviso de seguridad. No mide corrientes, fondo ni peligros de baño.

## 2. Arquitectura (100% estática, no toca el despliegue)

```
CRON diario → scripts/parte-calma.mjs → AEMET (viento por municipio)
   → cálculo (abrigo + medusas) → src/data/parte-calma.json (versionado en git)
   → push → Cloudflare Pages rebuild → HTML estático con el dato dentro
```

- **Degradación sagrada**: si AEMET falla, conserva el parte de ayer y lo marca
  `stale` (nunca un mapa roto ni un "hoy" falso).
- **Cero JS de cliente**: SVG estilizado + lista accesible, pintados en build.
- El cron lo dispara `.github/workflows/parte-calma.yml` (ver §6).

## 3. El modelo (constantes visibles, versión `abrigo-1.0`)

Fuente del viento: **AEMET OpenData**, `prediccion/especifica/municipio/horaria/{INE}`
(JSON estructurado, dirección + velocidad por hora). Cada cala se alimenta del
viento de su municipio. Atribución obligatoria: **«Fuente: AEMET»** (leyenda literal
que exige AEMET para derivados; verificado 17-jul-2026, brief en
`.tmp_research/2026-07-17-medusas-fuentes.md`).

```
onshore   = (1 + cos(dirViento − openingBearingDeg)) / 2     # 1 = viento de frente
abrigo    = 1 − media_horaria( onshore · min(vel/38, 1) )    # franja diurna 10–18 h
banda: ≥0.66 alto · ≥0.4 medio · resto bajo
```

**Empuje del viento hacia la cala** (`empuje-medusas-2.0`, código en
`scripts/lib/empuje-medusas.mjs`). Reencuadre honesto: el viento es un **modulador
de 2º orden** del último tramo costa-adentro de *Pelagia noctiluca* — el driver real
es la **corriente, que no medimos** (punto ciego declarado). No afirma presencia:
estima condiciones de llegada.

```
push_h  = max(0, cos(dirViento_h − openingBearingDeg)) · fTransporte(vel_h) · gauss(h)
empuje  = Σ push_h / Σ gauss(h)      sobre la ventana t−48 h … t−6 h
score   = empuje · gateEstacional(mes)
```

- `fTransporte` **creciente con umbral**: ~0 por debajo de 8 km/h, sube desde
  **18 km/h** (Berline 2013: el viento que «impacta significativamente la corriente
  superficial»), pleno a 28–45 km/h, y baja algo en temporal (>45) porque el oleaje
  dispersa y daña. La medusa no navega: el viento mueve el **agua**, y mover agua
  exige energía.
- `gauss(h)` centrada en **24 h** (σ 12 h): el retardo típico de varamiento es ~1 día.
  **La pieza mejor calibrada** (ICM-CSIC 24–48 h; Berline lag 1 día; Keesing ~2 días).
- `gateEstacional` (suelo 0,5 en invierno): modula la **presencia** en el agua, no el
  empuje. Suelo alto a propósito — «onshore arrivals are not restricted to the summer».
- Bandas: **ALTA** `score≥0.40 ∧ horasAfavor≥10`; **MEDIA** `score≥0.18 ∧ horasAfavor≥5`;
  **BAJA** el resto. (`horasAfavor` = horas con onshore≥0.5 y viento≥18 km/h.)
- **Degradación honesta**: si falta >40 % de la ventana → `sin-dato` (solo descargo),
  **nunca** un "baja" por defecto (sería un falso negativo peligroso).

> **Recalibrado del 20-jul-2026 (v1 → v2).** La v1 suponía que «la brisa arrima más»
> y el propio código lo declaraba como hipótesis sin calibrar. La literatura dice lo
> contrario y la v1 hacía que la brisa floja del norte **empatara** con el viento
> fuerte del sur (0,293 vs 0,292 con datos reales del 17-jul) → **39 de 75 calas en
> MODERADO**: un aviso que sale en media isla todos los días no informa de nada.
> También se subió el suelo invernal: con `ene = 0,15` la v1 habría dicho «baja» el
> **4-ene-2023**, el día real en que cientos de medusas cubrieron Son Parc y Arenal
> d'en Castell. Las cuatro piezas (intensidad, estacionalidad, umbrales y regla de
> horas) están **acopladas**: se calibraron a la vez y se miden con
> `node scripts/calibrar-medusas.mjs`, que pasa el modelo por escenarios de viento
> conocidos y falla si el sur avisa con viento del norte, si la brisa floja dispara
> un aviso o si enero vuelve a callar. Fuentes: `.tmp_research/2026-07-17-medusas-viento-fisica.md`.

AEMET solo da previsión, así que el viento horario se **acumula** en
`src/data/viento-historia.json` a cada corrida del cron; hasta tener ~48 h, el empuje
sale `sin-dato`. La banda va siempre **inseparable** de su descargo (que remite a
banderas y socorristas).

## 4. La "IP": orientación por cala (`windExposure`)

Vive en cada lugar de `type: "cala"` (`src/content/lugares/*-es.json`), campo
opcional `windExposure` (ver schema en `src/content.config.ts`). Es dato editorial
curado a mano, **separado del feed meteo** (el cron nunca lo toca):

- `openingBearingDeg` — rumbo (0–360) al que la cala abre al mar abierto.
- `embayment` — `abierta | encajonada | bahia-cerrada`.
- `municipioINE` — código INE del municipio (para pedir el viento a AEMET).
- `shelteredFrom` / `exposedTo` — vientos que abrigan / castigan (nombres locales).
- `tienePradera` — pradera de posidonia enfrente (aviso de algas).
- `tieneVigilancia` — socorrismo en temporada (descargo legal especial si `false`).

Calas que aún no tienen ficha de lugar se listan en `src/data/calas-extra.json`
(mismo conjunto de campos + `id`, `name`, `area`, `lat`, `lng`). Cuando una pase a
ser ficha editorial completa, se mueve su `windExposure` al lugar y se quita de aquí.

## 5. Automatización y aprobación (Opción A — decidida 2026-06-22)

**Excepción consciente y registrada al flujo de aprobación diaria** (CLAUDE.md §6 bis):
el **abrigo** es predicción meteo objetiva y citada → **se auto-publica** (como un
widget del tiempo). La **aprobación humana se cumple aprobando el MODELO una vez**
(fórmula, `windExposure`, plantillas, descargos), no el dato cada día.

La aprobación humana se reserva para lo subjetivo/reputacional:
- **Override manual por cala** (pendiente de UI): ocultar/forzar una cala ante un
  vertido, plaga o cierre. Es la válvula de seguridad que hace seguro el 100% auto.
- **Copy editorial semanal** ("la cala de la semana"), si se hace, en `draft`.

**Empuje de medusas — automatización con salvaguardas:**
- **BAJA y MEDIA auto-publicables** (orientación con descargo, dato meteo derivado).
- **ALTA con override humano REGLADO, no discrecional**: regla escrita fija = "se
  publica ALTA siempre que se cumplan las 3 condiciones, salvo error de datos
  evidente". El visto bueno **verifica los DATOS, no suaviza ALTA por motivos
  comerciales** (blinda el conflicto de interés: la marca dirige tráfico a negocios
  de playa, ver `docs/MARKETING-...`).
- **Log de diligencia debida**: el commit diario de `parte-calma.json` en git es el
  registro inmutable (fecha, banda, score, viento de origen, versión del modelo).

Salvaguardas: degradación al último dato bueno + (pendiente) alerta si el JSON
envejece >24–36 h.

## 6. Legal

- Descargo en el widget y en cada cala: estimación orientativa de **abrigo del
  viento**, no de seguridad; no sustituye banderas ni socorristas.
- Calas **sin vigilancia**: aviso específico ("no hay banderas que consultar").
  `tieneVigilancia` verificado contra el plan de socorrismo del Consell (2024–2026).
- **Empuje de medusas — INVARIANTE de componente** (parte de la Definition of Done):
  el componente NUNCA renderiza la banda sin su descargo adyacente (misma jerarquía,
  no plegado aparte). El descargo remite a **banderas y socorristas**. En la UE un
  descargo solo exime si es inevadible visualmente.
- **Bloqueantes legales del empuje de medusas — CERRADOS el 17-jul-2026** (encendido `MEDUSAS_ENABLED=true`, KAN-81):
  1. AEMET: leyenda literal **«Fuente: AEMET»** aplicada (permite derivados comerciales; brief del investigador en `.tmp_research/2026-07-17-medusas-fuentes.md`).
  2. Open-Meteo: solo vive en los `*.poc.mjs` de dev; producción no lo usa.
  3. MedusApp: **ELIMINADA del producto** (decisión de Cristian: sin fuentes externas). Sin enlace, sin datos, sin permiso que pedir.
- Recomendado: revisión de un abogado antes del lanzamiento público (es un dato sobre el mar).

## 7. Operación

```bash
# Verificar que AEMET responde (go/no-go):
node scripts/fase0-aemet.mjs
# Generar/actualizar el parte (necesita AEMET_API_KEY en .env):
node scripts/parte-calma.mjs
# Pruebas de concepto (Open-Meteo, solo dev, no comercial):
node scripts/donde-el-mar-esta-en-calma.poc.mjs   # motor de abrigo
node scripts/posibilidad-medusas.poc.mjs          # baremo de medusas
# Banco de pruebas del empuje (escenarios de viento conocidos; falla si se descuadra):
node scripts/calibrar-medusas.mjs
```

El cron de producción: `.github/workflows/parte-calma.yml` (diario). Requiere el
secret **`AEMET_API_KEY`** en GitHub. Aviso: GitHub deshabilita los workflows
programados tras 60 días sin commits en el repo; si pasa, se reactivan a mano (o se
migra a Cloudflare Cron Triggers).

## 8. Estado y pendientes

- [x] AEMET verificado como motor (viento por municipio, JSON) — **GO**.
- [x] `windExposure` en el schema + 4 calas reales (Macarella, Turqueta, Mitjana, Pregonda).
- [x] Script de producción (abrigo + medusas + degradación) → `parte-calma.json`.
- [x] Página ES/EN + mapa SVG + lista accesible + descargos + JSON-LD. Compila.
- [x] Las 18 calas del piloto con datos verificados (investigador).
- [x] Baremo de medusas v1 aprobado (ciencia+legal) e implementado + acumulación de viento.
- [x] `tieneVigilancia` real por cala (plan de socorrismo del Consell).
- [x] **Cerrar los 3 bloqueantes legales** y poner `MEDUSAS_ENABLED=true` (17-jul-2026, KAN-81).
- [x] Capa visual de medusas en el mapa (stickers rosa malva, ALTA plena + MODERADO tenue; 17-jul-2026, KAN-81).
- [x] **Recalibrado v2 del empuje** (20-jul-2026): intensidad invertida a creciente-con-umbral,
      suelo invernal, umbrales y regla de horas — las cuatro a la vez, con banco de pruebas
      (`scripts/calibrar-medusas.mjs`) y modelo extraído a `scripts/lib/empuje-medusas.mjs`.
- [ ] Revalidar los cortes al cierre de temporada, ya con episodios reales observados.
- [ ] UI de override manual (ALTA) + alerta de dato obsoleto.
- [ ] Estado de la mar (oleaje) de la marítima costera de AEMET (código de costa en {40–47}).
- [ ] Enlace a la herramienta desde /descubrir y la home; CTA newsletter.
- [ ] Revisión legal del descargo.
