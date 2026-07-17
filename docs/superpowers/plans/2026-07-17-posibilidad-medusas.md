# Posibilidad de medusas (stickers + encendido) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encender la «posibilidad de medusas» del mapa del mar en calma y pintarla como capa de stickers rosa malva (ALTO plena con vaivén, MODERADO tenue), solo para el día del parte, sin MedusApp y con la leyenda legal «Fuente: AEMET».

**Architecture:** Todo se renderiza en build (Astro SSR) dentro de `ParteCalmaMap.astro`, reutilizando la geometría de costa existente (`puntoEnArco`/`normalEnArco`/`sFinal`); el único JS nuevo es UNA línea en `applyFrame` que oculta la capa cuando el día elegido no es el del parte. El modelo de cálculo (`empuje-medusas-1.0`, robot `parte-calma.mjs`) NO se toca.

**Tech Stack:** Astro + SVG inline + CSS (animaciones con `prefers-reduced-motion`) + Umami (atributos `data-umami-event`).

**Spec:** `docs/superpowers/specs/2026-07-17-posibilidad-medusas-design.md`

## Global Constraints

- Idioma de comentarios/commits: español. Textos de UI SIEMPRE en los 3 idiomas (es/en/fr).
- Cero dependencias nuevas; cero islands nuevos (decisión #13 de CLAUDE.md intacta).
- La banda de medusas NUNCA se renderiza sin su descargo adyacente (invariante del componente).
- No afirmar presencia de medusas en ningún texto: siempre «podría», «condiciones», «no es un avistamiento».
- Leyenda legal literal: **«Fuente: AEMET»** (EN «Source: AEMET», FR «Source : AEMET»).
- NO hacer `git push` (KAN-81 queda En revisión hasta el visto bueno de Cristian en vivo).

---

### Task 1: Atribución «Fuente: AEMET» (robot, JSON vigente, crédito del mapa y doc)

**Files:**
- Modify: `scripts/parte-calma.mjs:247`
- Modify: `src/data/parte-calma.json:8`
- Modify: `src/components/ParteCalmaMap.astro:420,473,526` (clave `mapCredit` en es/en/fr)
- Modify: `docs/DONDE-EL-MAR-ESTA-EN-CALMA.md` (línea 35 y §6)

**Interfaces:**
- Produces: el JSON del parte y el crédito visible del mapa llevan la leyenda literal exigida por AEMET. Ningún otro task depende de esto.

- [ ] **Step 1: Cambiar el generador (robot)**

En `scripts/parte-calma.mjs` línea 247, sustituir:

```js
    attribution: `Datos: ${ATRIBUCION}`,
```

por:

```js
    // Leyenda literal exigida por AEMET para productos derivados (verificado 17-jul-2026).
    attribution: `Fuente: ${ATRIBUCION}`,
```

- [ ] **Step 2: Actualizar el JSON vigente (para no esperar al robot de mañana)**

En `src/data/parte-calma.json` línea 8: `"attribution": "Datos: AEMET",` → `"attribution": "Fuente: AEMET",`

- [ ] **Step 3: Crédito visible del mapa (3 idiomas)**

En `src/components/ParteCalmaMap.astro`:
- línea 420 (es): `"Contorno: © OpenStreetMap · Relieve: GEBCO 2020 · Estado del mar: AEMET"` → `"Contorno: © OpenStreetMap · Relieve: GEBCO 2020 · Fuente: AEMET"`
- línea 473 (en): `"Outline: © OpenStreetMap · Relief: GEBCO 2020 · Sea state: AEMET"` → `"Outline: © OpenStreetMap · Relief: GEBCO 2020 · Source: AEMET"`
- línea 526 (fr): `"Contour : © OpenStreetMap · Relief : GEBCO 2020 · État de la mer : AEMET"` → `"Contour : © OpenStreetMap · Relief : GEBCO 2020 · Source : AEMET"`

- [ ] **Step 4: Actualizar el doc de la herramienta**

En `docs/DONDE-EL-MAR-ESTA-EN-CALMA.md`:
- Línea 35: `Atribución obligatoria: **"Datos: AEMET"** (Ley 18/2015).` → `Atribución obligatoria: **«Fuente: AEMET»** (leyenda literal que exige AEMET para derivados; verificado 17-jul-2026, brief en .tmp_research/2026-07-17-medusas-fuentes.md).`
- En §1: sustituir la línea `Siempre emparejada con un enlace a **MedusApp** (avistamientos reales).` por `Sin fuentes externas (decisión de Cristian, 17-jul-2026): solo nuestro dato de viento; el descargo remite a banderas y socorristas.`
- En §3 (línea ~65): `La banda va siempre **inseparable** de su descargo y del enlace a MedusApp.` → `La banda va siempre **inseparable** de su descargo (que remite a banderas y socorristas).`
- En §6, sustituir el bloque «Bloqueantes legales del empuje de medusas (APAGADO `MEDUSAS_ENABLED=false` hasta cerrarlos)» y sus 3 puntos por:

```markdown
- **Bloqueantes legales del empuje de medusas — CERRADOS el 17-jul-2026** (encendido `MEDUSAS_ENABLED=true`):
  1. AEMET: leyenda literal «Fuente: AEMET» aplicada (permite derivados comerciales; brief del investigador).
  2. Open-Meteo: solo vive en los `*.poc.mjs` de dev; producción no lo usa.
  3. MedusApp: ELIMINADA del producto (decisión de Cristian: sin fuentes externas). Sin enlace, sin datos, sin permiso que pedir.
```

- En el checklist final, marcar `- [x] **Cerrar los 3 bloqueantes legales** y poner MEDUSAS_ENABLED=true` y añadir `- [x] Capa visual de medusas en el mapa (stickers, 17-jul-2026, KAN-81).`

- [ ] **Step 5: Verificar y commitear**

Run: `cd "D:/Escritorio/CLAUDE_REVISTA_GUIA_AUTOMATICA" && grep -rn "Datos: AEMET" scripts/ src/ docs/ | grep -v specs/`
Expected: sin resultados (solo puede quedar la mención histórica en el spec del 17-jul).

```bash
git add scripts/parte-calma.mjs src/data/parte-calma.json src/components/ParteCalmaMap.astro docs/DONDE-EL-MAR-ESTA-EN-CALMA.md
git commit -m "chore(mar-en-calma): atribucion literal 'Fuente: AEMET' en robot, JSON, mapa y doc — KAN-81"
```

---

### Task 2: Encendido del bloque de la ficha, sin MedusApp

**Files:**
- Modify: `src/components/ParteCalmaMap.astro:29-33` (constantes), `~446-456` (T es), `~499-509` (T en), `~552-562` (T fr), `~1010-1028` (bloque de la ficha)

**Interfaces:**
- Consumes: nada de otros tasks.
- Produces: `MEDUSAS_ENABLED === true`; claves de texto `T.medusasTitle` y `T.legendMedusa` (es/en/fr) que Task 3 y Task 4 usan; el bloque de ficha renderiza título + banda + descargo sin CTA externo.

- [ ] **Step 1: Constantes**

Sustituir (líneas 29-33):

```ts
const MEDUSAPP = "https://www.medusapp.net/";
// Empuje de medusas: APAGADO hasta cerrar pendientes legales (atribución exacta de
// AEMET, atribución Open-Meteo y permiso de deep-link de MedusApp por escrito) y
// recalibrar el modelo tras una temporada. Poner true para activarlo. Ver doc §legal.
const MEDUSAS_ENABLED = false;
```

por:

```ts
// Empuje de medusas: ENCENDIDO el 17-jul-2026 (KAN-81). Bloqueantes legales cerrados:
// leyenda literal «Fuente: AEMET» aplicada, Open-Meteo solo en los POC de dev, y
// MedusApp eliminada del producto (decisión de Cristian: sin fuentes externas — el
// descargo remite a banderas y socorristas). Recalibrar el modelo tras 1 temporada.
const MEDUSAS_ENABLED = true;
```

- [ ] **Step 2: Textos ES** — en el bloque `es` de `T`:

Sustituir la clave `waterCond: "Ver condiciones del agua",` por `medusasTitle: "Posibilidad de medusas",` y añadir tras `medusasNoData`:

```ts
    legendMedusa:
      "Medusa rosa: el viento lleva horas empujando hacia esa cala — podría haber. No es un avistamiento; solo vale para hoy.",
```

Sustituir el `medusasDisclaimer` ES entero por:

```ts
    medusasDisclaimer:
      "Estimamos condiciones de llegada a partir del viento de las últimas 48 h; no detectamos medusas ni afirmamos que las haya. No captura las corrientes marinas. Para presencia real, consulta las banderas y a los socorristas de la playa.",
```

Eliminar la clave `medusasCTA` ES.

- [ ] **Step 3: Textos EN** — mismas operaciones en el bloque `en`:

`waterCond: "See today’s water conditions",` → `medusasTitle: "Possible jellyfish",`

```ts
    legendMedusa:
      "Pink jellyfish: the wind has been pushing towards that cove for hours — there could be some. Not a sighting; valid today only.",
```

```ts
    medusasDisclaimer:
      "We estimate arrival conditions from the last 48 h of wind; we do not detect jellyfish or claim there are any. It does not capture sea currents. For actual presence, check the beach flags and ask the lifeguards.",
```

Eliminar `medusasCTA` EN.

- [ ] **Step 4: Textos FR** — mismas operaciones en el bloque `fr`:

`waterCond: "Voir les conditions de l'eau",` → `medusasTitle: "Possibilité de méduses",`

```ts
    legendMedusa:
      "Méduse rose : le vent pousse vers cette crique depuis des heures — il pourrait y en avoir. Ce n'est pas une observation ; valable aujourd'hui seulement.",
```

```ts
    medusasDisclaimer:
      "Nous estimons les conditions d'arrivée à partir du vent des dernières 48 h ; nous ne détectons pas de méduses et n'affirmons pas qu'il y en a. Cela ne tient pas compte des courants marins. Pour une présence réelle, consultez les drapeaux et les sauveteurs.",
```

Eliminar `medusasCTA` FR.

- [ ] **Step 5: El bloque de la ficha** — sustituir el bloque `{MEDUSAS_ENABLED && c.medusas && (…)}` (líneas ~1010-1028) por:

```astro
          {MEDUSAS_ENABLED && c.medusas && (
            <details class="mt-3 border-t border-niebla pt-3">
              <summary class="cursor-pointer text-sm text-piedra-suave hover:text-piedra" data-umami-event="calma-condiciones">{T.medusasTitle} →</summary>
              <div class="mt-2 rounded-md bg-arena/50 p-3">
                <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-oro">{T.medusasSublabel}</p>
                <p class="mt-1 text-sm text-piedra">
                  {c.medusas.band === "sin-dato" ? (
                    T.medusasNoData
                  ) : (
                    <Fragment><strong class="text-tinta">{T.medusasBand[c.medusas.band]}.</strong> {T.medusasCopy[c.medusas.band]}</Fragment>
                  )}
                </p>
                <p class="mt-2 text-xs leading-relaxed text-piedra-suave">{T.medusasDisclaimer}</p>
              </div>
            </details>
          )}
```

(Cambios: el `summary` pasa de `waterCond` a `medusasTitle`; desaparecen el `<a>` a MedusApp y su `<p>`; el resto queda igual. La const `MEDUSAPP` ya no existe.)

- [ ] **Step 6: Verificar que compila y commitear**

Run: `cd "D:/Escritorio/CLAUDE_REVISTA_GUIA_AUTOMATICA" && npx astro check 2>&1 | tail -3`
Expected: `0 errors` (los warnings previos que ya hubiera, sin nuevos). Si falla con «medusasCTA/waterCond no existe»: queda alguna referencia huérfana — buscarla con `grep -n "medusasCTA\|waterCond\|MEDUSAPP" src/components/ParteCalmaMap.astro` y eliminarla.

```bash
git add src/components/ParteCalmaMap.astro
git commit -m "feat(mar-en-calma): enciende la posibilidad de medusas en la ficha, sin MedusApp — KAN-81"
```

---

### Task 3: La capa de stickers en el SVG del mapa

**Files:**
- Modify: `src/components/ParteCalmaMap.astro` — frontmatter (tras el bloque de `markers`, ~línea 230), `<defs>` (~817-839), SVG tras `.calma-zonas` (~901), JSON embebido `#calma-tl-data` (~750), y el `<style>` del componente.

**Interfaces:**
- Consumes: `MEDUSAS_ENABLED` (Task 2), `sFinal`, `puntoEnArco`, `normalEnArco`, `parte`, `isStaleServer` (existentes).
- Produces: grupo `<g class="calma-medusas">` con un `<a class="medusa medusa-{alta|media}">` por cala elegible; símbolo `#calma-medusa` reutilizable (Task 4 lo usa en la leyenda); campo `medusasFecha` en el JSON embebido (Task 5 lo consume).

- [ ] **Step 1: Geometría en el frontmatter** — añadir justo DESPUÉS del bloque `const markers = …` (línea ~230):

```ts
// ---- Posibilidad de medusas (KAN-81): las calas con empuje alto/medio llevan un
// sticker EN EL MAR, delante de su cala: punto de orilla + normal POSITIVA (los
// puntos de cala usan la negativa, tierra adentro). Se usa sFinal (posición ya
// repartida por el anti-solape) para heredar su separación tangencial. Solo si el
// parte no está caducado: una medusa de ayer sería una mentira de hoy. ----
const MEDUSA_W: Record<string, number> = { alta: 17, media: 11 };
const MEDUSA_OFF: Record<string, number> = { alta: 14, media: 10 };
const medusas = MEDUSAS_ENABLED && !isStaleServer
  ? parte.calas.flatMap((c: any, i: number) => {
      const band = c.medusas?.band;
      if (band !== "alta" && band !== "media") return [];
      const p = puntoEnArco(sFinal[i]);
      const n = normalEnArco(sFinal[i]);
      return [{ id: c.id, name: c.name, band, x: p.x + n.x * MEDUSA_OFF[band], y: p.y + n.y * MEDUSA_OFF[band] }];
    })
  : [];
```

**OJO:** `isStaleServer` se declara hoy en la línea ~400, DESPUÉS de `markers`. Mover la declaración de `isStaleServer` (línea 400) a ANTES de este bloque nuevo (justo tras `const markers`), sin cambiarla. `buildToday` viaja con ella si hace falta (comprobar que `buildToday` se declara antes; si no, mover ambas juntas manteniendo su orden relativo).

- [ ] **Step 2: El símbolo en `<defs>`** — añadir dentro de `<defs>` (tras el filtro `#calma-punto`, línea ~838):

```astro
          {/* Medusa (Pelagia, rosa malva): campana con faldón y 3 tentáculos de trazo
              fino. Un solo símbolo; el tamaño y la opacidad los pone cada banda. */}
          <symbol id="calma-medusa" viewBox="0 0 24 24">
            <path d="M4 11 C4 6.6 7.6 3 12 3 C16.4 3 20 6.6 20 11 L20 12 C18.5 13.1 16.9 13.1 15.4 12.3 C14.3 13 13.1 13.2 12 13.2 C10.9 13.2 9.7 13 8.6 12.3 C7.1 13.1 5.5 13.1 4 12 Z" stroke-width="0.8" />
            <path d="M8 13.5 C7.6 15.5 8.6 16 8.2 18 C7.9 19.6 8.5 20.4 8.3 21.5" fill="none" stroke-width="1.1" stroke-linecap="round" />
            <path d="M12 13.8 C12.3 16 11.4 16.8 11.8 19 C12 20.2 11.7 21 11.9 22" fill="none" stroke-width="1.1" stroke-linecap="round" />
            <path d="M16 13.5 C16.5 15.2 15.6 16.2 16 18 C16.3 19.4 15.8 20.2 16 21.3" fill="none" stroke-width="1.1" stroke-linecap="round" />
          </symbol>
```

- [ ] **Step 3: La capa en el SVG** — añadir justo DESPUÉS del cierre del bloque `{MODO_MAPA === "zonas" && (…)}` (línea ~901) y ANTES del grupo `.calma-pueblos`:

```astro
        {/* Posibilidad de medusas: stickers EN EL MAR, delante de su cala. Capa
            decorativa-redundante (el dato accesible vive en la ficha): aria-hidden y
            fuera del tab; el clic baja a la ficha, como el punto. Se ocultan cuando el
            día elegido no es el del parte (clase medusas-ocultas, la pone applyFrame). */}
        {medusas.length > 0 && (
          <g class="calma-medusas" aria-hidden="true">
            {medusas.map((m, i) => (
              <a
                href={`#cala-${m.id}`}
                tabindex="-1"
                class={`medusa medusa-${m.band}`}
                data-umami-event="calma-medusa"
                data-umami-event-cala={m.id}
                style={`--mf-in: ${(i % 7) * 0.12}s; --mf: ${(i % 5) * -1.3}s`}
              >
                <circle cx={m.x} cy={m.y} r="11" fill="transparent" />
                <use
                  href="#calma-medusa"
                  x={m.x - MEDUSA_W[m.band] / 2}
                  y={m.y - MEDUSA_W[m.band] / 2}
                  width={MEDUSA_W[m.band]}
                  height={MEDUSA_W[m.band]}
                />
              </a>
            ))}
          </g>
        )}
```

- [ ] **Step 4: El CSS** — dentro del `<style>` del componente (localizarlo con `grep -n "<style" src/components/ParteCalmaMap.astro`), añadir al final:

```css
  /* ── Posibilidad de medusas (KAN-81) ─────────────────────────────────── */
  .calma-medusas use {
    fill: #e3b7c4;            /* rosa malva claro, fiel a la Pelagia */
    stroke: #c98da3;
  }
  .calma-medusas .medusa {
    --mo: 0.9;                /* opacidad destino: ALTA plena */
    opacity: 0;
    animation: medusa-in 0.8s ease-out forwards;
    animation-delay: var(--mf-in, 0s); /* van apareciendo, escalonadas */
  }
  .calma-medusas .medusa-media {
    --mo: 0.38;               /* MODERADO: tenue, casi acuarela */
  }
  .calma-medusas .medusa-alta use {
    animation: medusa-float 6s ease-in-out infinite;
    animation-delay: var(--mf, 0s);
  }
  @keyframes medusa-in { to { opacity: var(--mo); } }
  @keyframes medusa-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(1.6px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .calma-medusas .medusa { animation: none; opacity: var(--mo); }
    .calma-medusas .medusa-alta use { animation: none; }
  }
  .calma-medusas.medusas-ocultas { display: none; }
```

- [ ] **Step 5: La fecha del parte en el JSON embebido** — en el objeto de `#calma-tl-data` (línea ~750, `set:html={JSON.stringify({…})}`), añadir un campo al final del objeto:

```ts
      medusasFecha: parte.forecastDate,
```

- [ ] **Step 6: Verificar en el HTML construido y commitear**

Run: `cd "D:/Escritorio/CLAUDE_REVISTA_GUIA_AUTOMATICA" && npx astro check 2>&1 | tail -3 && npm run build 2>&1 | tail -3`
Expected: check sin errores nuevos; build completa.

Run: `node -e "const h=require('fs').readFileSync('dist/donde-el-mar-esta-en-calma/index.html','utf8'); const n=(h.match(/medusa-media/g)||[]).length; const a=(h.match(/medusa-alta/g)||[]).length; console.log('media:',n,'alta:',a); console.log('symbol:', h.includes('id=\"calma-medusa\"')); console.log('fecha:', h.includes('medusasFecha'));"`
Expected: `media:` y `alta:` coinciden con las bandas del JSON del día (comprobar contra `node -e "const j=require('./src/data/parte-calma.json'); const b={}; j.calas.forEach(c=>b[c.medusas?.band]=(b[c.medusas?.band]||0)+1); console.log(b)"`), `symbol: true`, `fecha: true`.

```bash
git add src/components/ParteCalmaMap.astro
git commit -m "feat(mar-en-calma): capa de medusas en el mapa — rosa malva, ALTA plena y MODERADO tenue — KAN-81"
```

---

### Task 4: La entrada de la leyenda

**Files:**
- Modify: `src/components/ParteCalmaMap.astro` — el `<aside class="calma-leyenda …">` (líneas ~950-975).

**Interfaces:**
- Consumes: `T.legendMedusa` (Task 2), símbolo `#calma-medusa` (Task 3), array `medusas` (Task 3).

- [ ] **Step 1: Añadir la entrada** — dentro del aside de la leyenda, tras el párrafo `{T.legendNeutro}` (línea ~974), añadir:

```astro
        {MEDUSAS_ENABLED && (
          <p class="calma-leyenda-medusa">
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><use href="#calma-medusa" /></svg>
            {T.legendMedusa}
          </p>
        )}
```

(Va condicionada a `MEDUSAS_ENABLED`, no a `medusas.length`: la leyenda explica el símbolo también los días sin ninguna medusa — «hoy no hay» también es información.)

- [ ] **Step 2: CSS de la entrada** — junto al CSS del Task 3:

```css
  .calma-leyenda-medusa svg {
    display: inline-block;
    vertical-align: -3px;
    margin-right: 4px;
    fill: #e3b7c4;
    stroke: #c98da3;
  }
```

- [ ] **Step 3: Verificar y commitear**

Run: `npm run build 2>&1 | tail -2 && node -e "const h=require('fs').readFileSync('dist/donde-el-mar-esta-en-calma/index.html','utf8'); console.log('leyenda:', h.includes('calma-leyenda-medusa'));"`
Expected: build OK, `leyenda: true`.

```bash
git add src/components/ParteCalmaMap.astro
git commit -m "feat(mar-en-calma): la leyenda explica la medusa (podria haber, no es avistamiento) — KAN-81"
```

---

### Task 5: Ocultar la capa cuando el día elegido no es el del parte

**Files:**
- Modify: `src/components/ParteCalmaMap.astro` — función `applyFrame` del `<script>` (líneas ~1206-1252).

**Interfaces:**
- Consumes: `D.medusasFecha` (Task 3, Step 5), grupo `.calma-medusas` (Task 3).

- [ ] **Step 1: El toggle** — dentro de `applyFrame`, justo después de la línea `pintarZonas(fr);` (~1232), añadir:

```ts
      // Las medusas solo valen para el día del parte (48 h de viento YA soplado):
      // en cualquier otro día de la barra, la capa desaparece — predecirlas sería inventar.
      document.querySelector(".calma-medusas")?.classList.toggle("medusas-ocultas", fr.fecha !== D.medusasFecha);
```

- [ ] **Step 2: Verificar el comportamiento en navegador (headless CDP)**

Run: arrancar `npx astro preview --port 4321` en background y comprobar con Chrome headless (CDP) sobre `http://localhost:4321/donde-el-mar-esta-en-calma/`:
1. Al cargar: `document.querySelectorAll('.calma-medusas .medusa').length` > 0 y SIN clase `medusas-ocultas`.
2. Ejecutar `const s=document.getElementById('calma-tiempo'); s.value=String(s.max); s.dispatchEvent(new Event('input'))` → `.calma-medusas` TIENE la clase `medusas-ocultas`.
3. Volver a `s.value='0'; s.dispatchEvent(new Event('input'))` → clase fuera (si el frame 0 es del día del parte).
Expected: los tres pasos como se describen.

- [ ] **Step 3: Commit**

```bash
git add src/components/ParteCalmaMap.astro
git commit -m "feat(mar-en-calma): las medusas desaparecen al mover la barra a otro dia — KAN-81"
```

---

### Task 6: El panel de analítica mide el sticker (muere el evento de MedusApp)

**Files:**
- Modify: `src/pages/panel/analitica.astro:102`

**Interfaces:**
- Consumes: el evento `calma-medusa` que emite la capa (Task 3).

- [ ] **Step 1: Sustituir el evento** — línea 102:

```ts
      ["calma-medusas-app", "Clic a la app de medusas"],
```

por:

```ts
      ["calma-medusa", "Clic en una medusa del mapa"],
```

- [ ] **Step 2: Verificar y commitear**

Run: `grep -rn "calma-medusas-app" src/`
Expected: sin resultados.

```bash
git add src/pages/panel/analitica.astro
git commit -m "chore(panel): mide el clic en la medusa del mapa (fuera el evento de MedusApp) — KAN-81"
```

---

### Task 7: Verificación completa (definición de hecho del spec §8)

**Files:**
- Ninguno (solo verificación; capturas al scratchpad de la sesión).

- [ ] **Step 1: Suite completa**

Run: `cd "D:/Escritorio/CLAUDE_REVISTA_GUIA_AUTOMATICA" && npx astro check 2>&1 | tail -3 && npm test 2>&1 | tail -4 && npm run build 2>&1 | tail -3`
Expected: check sin errores; `fail 0`; build completa (542 págs.).

- [ ] **Step 2: Recorrido en Chrome headless (CDP), escritorio y móvil**

Con `astro preview` en marcha, sobre ES (`/donde-el-mar-esta-en-calma/`), EN (`/en/where-the-sea-is-calm/`) y FR (la ruta FR que exista — confirmarla con `ls dist/fr/`):
1. Conteo de medusas = bandas del JSON del día; ninguna con `cx/cy` dentro de la silueta de tierra (verificación visual con captura ampliada de una zona con medusas).
2. Jerarquía visible: ALTA ~17 px opacidad ~0.9; MODERADO ~11 px opacidad ~0.38 (leer `getComputedStyle`).
3. Clic en una medusa → navega a `#cala-<id>` y la ficha muestra «Posibilidad de medusas» con banda + descargo (sin rastro de MedusApp: `grep -c medusapp dist/donde-el-mar-esta-en-calma/index.html` = 0).
4. Emulación `prefers-reduced-motion: reduce` → las medusas aparecen quietas (sin animación, opacidad final).
5. Móvil 390×844: los stickers no tapan puntos ni nombres; la leyenda legible.
6. Capturas de escritorio, móvil y del estado «otro día» (sin medusas) guardadas en el scratchpad para enseñárselas a Cristian.

- [ ] **Step 3: Accesibilidad**

En el DOM servido: `.calma-medusas` con `aria-hidden="true"`; ningún `tabindex` distinto de `-1` dentro; recorrer con Tab en headless y confirmar que el foco NUNCA entra en una medusa; un solo `h1`; el texto del descargo presente junto a la banda en cada ficha con medusas.

- [ ] **Step 4: Cierre de sesión de trabajo (SIN push)**

- Mover KAN-81 a **En revisión** (Jira) con comentario-resumen.
- Actualizar la bitácora del vault (`Documentación Página Web Calma.md`) con la entrada del día y «pendiente de visto bueno en vivo».
- Actualizar la memoria de `.claude` (`mapa-calas-estado.md`: medusas construidas y a la espera del OK).
- Avisar a Cristian: listo para verlo (capturas + URL de preview), el push se hace tras su OK.
