# Rediseño del planificador — «más visual y paso a paso»

**Fecha:** 2026-07-10 · **Estado:** diseño aprobado (pendiente del plan de implementación)
**Origen:** petición de Cristian — «el planificador es muy largo y no veo las cosas claras; hazlo más visual». Sesión de brainstorming con compañero visual (móvil vs propuesta).

## 1. Objetivo y contexto
El planificador (`/planificador`, `/en/trip-planner`) es un activo clave: trae tráfico y **capta correos** (KPI nº1, vía el gate del dossier). Hoy son **dos scrolls largos**: una **encuesta** de 6 bloques apilados y un **resultado** con todos los días seguidos y mucho texto. Cristian lo percibe **largo y poco claro**. Objetivo: hacerlo **más visual y directo**, con estética de **lujo tranquilo** (sin emojis), **sin quitar preguntas ni funciones** y **sin romper** el motor, la captación ni el SEO.

## 2. Alcance
**Dentro:**
- Encuesta como **asistente paso a paso** (wizard): una pregunta por pantalla, progreso, y elección por **tarjetas con iconos de línea**.
- Resultado con **tira-resumen «de un vistazo»** (los días, con salto) + **todos los días en scroll**, cada uno más visual (foto grande, menos texto).
- Sustituir los **emojis** de los avisos por **iconos de línea**.

**Fuera (no-goals):**
- NO se eliminan preguntas ni datos que recoge la encuesta (decisión de Cristian: presentarlas mejor, no quitarlas).
- NO se reescribe el **motor** `planTrip` ni el modelo de datos.
- NO se cambia la captación de correo, el dossier PDF ni el SEO (solo se preservan).
- NO se añaden dependencias ni JS externo; sigue siendo **un solo island**.

## 3. Restricciones a preservar (definición de «no romper»)
- **Motor puro** `src/lib/planner/engine.ts` (`planTrip`) y su salida: intactos. Los tests del motor siguen verdes.
- **Estado en la querystring** → el plan es **compartible** por URL. La encuesta (wizard) envía por GET igual que hoy.
- **Degradación sin JS**: sin el island, se ve un **formulario completo usable** (el actual) y su botón «Crear mi plan» funciona. El wizard es *mejora progresiva* encima.
- **Un solo island JS** (CLAUDE.md decisión #13): no crecer a varios islands ni a SSR.
- **Captación (KPI nº1)**: `POST /api/suscribir` + **gate del dossier** (el PDF se desbloquea con el correo) intactos.
- **Dossier PDF**: el print-CSS imprime `#planner-results` (portada + un día por página + plan-B abierto). La nueva estructura del resultado debe seguir imprimiéndose bien.
- **SEO**: `PlannerSeoContent.astro` y las rutas se mantienen.
- **i18n ES/EN** con paridad · **mobile-first** · **a11y** (WCAG AA) · **Lighthouse 95+**.
- **Sin emojis** en toda la UI (feedback de marca — quiet luxury).

## 4. Diseño — La encuesta (wizard)
- **Pasos** = los 6 bloques actuales, uno por pantalla:
  1. **Lo básico** — días · cómo te mueves · (si ferry) puerto.
  2. **Llegada y salida** — fechas · horas de vuelo.
  3. **Dónde duermes** — zona/base.
  4. **Tu estilo** — ritmo · intereses · presupuesto.
  5. **Contigo viaja** — niños · edades · accesibilidad.
  6. **Extras** — barco y atardeceres.
  (El reparto exacto de pasos puede afinarse en implementación, **sin perder campos**.)
- **Progreso**: filete fino con N segmentos + «Paso X de N».
- **Navegación**: Atrás / Siguiente; en el último paso, «Crear mi plan». Enter avanza.
- **Elección por tarjetas con iconos de línea** donde hoy hay opción cerrada: **transporte**, **ritmo**, **intereses** (multi), **presupuesto**, **accesibilidad**, **niños/edades**, **barco**. Siguen siendo `radio`/`checkbox` nativos ocultos dentro de `<label>` (patrón `.planner-pill` actual) → a11y y no-JS intactos. **No** son tarjeta: nº de días, fechas y horas (inputs nativos `date`/`time`), base (lista/tarjetas de zonas).
- **Condicional**: el puerto de ferry solo aparece si transporte = «Mi coche en ferry» (hoy siempre visible).
- **Regla de oro**: el wizard **no cambia** qué se envía ni la URL resultante; solo reparte el mismo formulario en pasos y lo hace visual.

## 5. Diseño — El resultado (resumen + días visuales) [opción B + resumen]
- **Tira-resumen «de un vistazo»** al principio: fila (scroll horizontal en móvil) de **fichas de día** — «DÍA n» + **tema corto del día**. Al tocar, **salta** (ancla `#dia-n`) a ese día; el día en vista se resalta.
  - *Tema del día*: título corto. Si el motor no lo da, se **deriva en cliente** (p. ej. del `label` del día o de su primera parada) — **sin tocar el motor**.
- **Días en scroll** (todos, seguidos). Cada `<article>` de día, más visual:
  - **Foto de cabecera más grande** (ya existe `hero`; se amplía, con su crédito CC).
  - **Menos texto**: el plan del día como **timeline limpia** (hora · lugar · una línea), recortando la prosa larga de `reason` donde recargue (se conserva lo útil). Cabecera: día + fecha + horas útiles.
  - **Avisos con iconos de línea** (sustituyen el mapa emoji `noticeIcon`).
  - Se mantienen: «Cómo llegar» y «ruta del día» (Google Maps), el **parte del mar** en días de playa, el **plan-B** (`<details>`), la **firma**/base/avisos globales y el **CTA Menorca Bus**.
- **Impresión/PDF**: el resultado conserva `#planner-results article` por día para que el print-CSS del dossier siga funcionando (portada + un día por página). La tira-resumen se **oculta al imprimir**.

## 6. Sistema de iconos de línea
Un juego pequeño de **SVG inline** (stroke ~1.3px, `currentColor` → hereda el color de marca), reutilizable en encuesta y resultado: transporte (coche, ferry, andar), ritmo, intereses, y los tipos de **aviso** que hoy son emoji (`reserva`, `madrugar`, `agua-sombra`, `parking`, `confirma-horario`, `esfuerzo`, `viento`, `accesibilidad`, `fiesta`, `transfer`, `logistica`). Sin dependencias; peso ínfimo; se define una vez y se usa en ambos sitios.

## 7. Estructura de archivos
`src/components/PlannerView.astro` es hoy grande (~770 líneas: markup + script + estilos). Aprovechando el trabajo, **dividir con criterio** sin romper el island:
- Extraer el markup de la **encuesta** (los fieldsets → pasos) y el de **acciones/gate** a parciales Astro si aclara (`PlannerSurvey.astro`, `PlannerActions.astro`).
- Los **iconos de línea** a un módulo/parcial compartido.
- El **script del island** (render + wizard) puede quedar en `PlannerView` o extraerse a un `.ts` que el island importe; **un solo** `<script>` (un island).
- El reparto exacto se decide en el plan; el objetivo son piezas enfocadas, no un refactor gratuito.

## 8. i18n
Nuevas etiquetas de UI (títulos de paso, «Atrás»/«Siguiente», «Paso X de N», temas por defecto) se añaden al diccionario `T` (ES/EN) con paridad, como el resto.

## 9. Accesibilidad
- Wizard: foco al título del paso al avanzar; progreso anunciado (`aria`); inputs siguen siendo nativos (radio/checkbox/select) → teclado y lector de pantalla; orden lógico intacto.
- Contraste AA (la paleta cálida ya cumple); foco visible; `alt` correcto en las fotos de día.

## 10. Rendimiento
Un solo island (como hoy); SVGs inline (bytes mínimos); sin dependencias nuevas; imágenes ya `lazy` con dimensiones. **Lighthouse 95+** intacto.

## 11. Verificación (definición de hecho)
- Para la misma entrada, la encuesta genera **el mismo plan** que hoy (misma URL de salida): el wizard no toca el motor.
- **Sin JS**: el formulario completo funciona y crea plan.
- El plan es **compartible** por URL; el **gate de correo** y el **PDF dossier** funcionan; la **impresión** sale bien.
- **ES y EN** a la par; a11y (teclado, foco, contraste); **Lighthouse 95+**; `astro check` y **tests** verdes.
- **Verificación en navegador** (móvil y escritorio) antes de dar por hecho.

## 12. Riesgos y mitigaciones
- **Print-CSS** depende de la estructura de `#planner-results article`: cuidar que el rediseño no la rompa (probar impresión explícitamente).
- **Tema por día** para la tira-resumen: si no existe en el motor, derivarlo en cliente para no ampliar alcance.
- **No engordar el island**: el wizard es CSS + poco JS (mostrar/ocultar pasos + progreso), no un framework.
