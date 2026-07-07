# Diseño — Tapar las fugas de conversión del embudo de newsletter (KAN-38)

> Fecha: 2026-07-07 · Estado: **propuesta, pendiente de aprobación del dueño**
> KPI que ataca: captación de suscriptores de newsletter (CLAUDE.md §3.1, el nº1).
> Relación: avanza también **KAN-39** (mini-backend en Cloudflare Functions).

---

## 1. Objetivo

Subir la **conversión** del embudo de captación (visita → suscriptor real de MailerLite),
empezando por **tapar lo que está roto**, no por embellecer. No es traer más tráfico (eso
es otro frente); es que **cada visita con intención que hoy se pierde deje de perderse**, y
dejar la máquina afinada para cuando el tráfico suba (el SEO del planner madura en 4-8
semanas).

Contexto medido (Umami, 30 d a 3-jul): 161 visitantes/mes, rebote 67 %. El planificador
**engancha** (13 intentos de guardar el PDF en 30 d) pero el punto de mayor intención del
sitio hoy **no genera suscriptores**.

## 2. Diagnóstico verificado (auditoría CRO + verificación en código)

**La fuga madre:** el sitio tiene **dos sistemas de captación que no se hablan**. El bueno
—MailerLite, con doble opt-in, bienvenida automática y entrega de PDF— solo está enchufado
en algunos sitios (home, `/newsletter`, landing del imán). El **gate del planificador** y el
**popup** usan el sistema viejo (**Formspree**), que no crea suscriptores reales.

| # | Fuga | Ubicación (verificada) | Gravedad |
|---|------|------------------------|----------|
| 🔴 1 | Gate del planner → Formspree (`captureEndpoint`), no entra en MailerLite; buzón **compartido con contacto** | `PlannerView.astro:340`, `site.ts:127`=`:187` | Alta |
| 🔴 2 | El popup propio **no renderiza** (`captureMode` es `false` con MailerLite activo) | `NewsletterPopup.astro:19-20` | Alta |
| 🟠 3 | CTA de **fin de artículo** es un `<a href="/newsletter">`, no un formulario (un clic extra donde más caliente está el lector) | `NewsletterSignup.astro:84-90` | Media-alta |
| 🟠 4 | El "PDF" del gate es `window.print()` — confuso en móvil (mayoría del tráfico) | `PlannerView.astro:655,671` | Media |
| 🟠 5 | Ningún copy anticipa el **doble opt-in** ("confirma en tu correo") → quien no confirma se pierde | global (`i18n/ui.ts`) | Media |
| 🟡 6 | Falta la reafirmación de confianza ("sin spam / cada quince días") en el momento del gate | `PlannerView.astro:360-367` | Baja-media |
| 🟡 7 | Botón del imán en home genérico ("Unirme a la Sociedad" vs. "Quiero la guía") | `index.astro:160-163` | Baja |

**Lo que YA está bien (no romper):** anti-ruido respetado (ningún popup al entrar, sin FOMO,
copy de lujo tranquilo con frecuencia declarada); accesibilidad de formularios correcta
(`label`+`for`, `autocomplete`, foco visible); red de seguridad si MailerLite no carga; el
gate tiene "escape" (Copiar enlace libre) y no pierde el plan (estado en la URL).

## 3. Arquitectura de despliegue (restricción dura)

- La **web pública (calmasociety.com) se sirve desde Cloudflare Pages, 100 % estática, SIN
  adaptador.** Vercel solo sirve el panel de edición/paneles (todo en `noindex`).
- Las funciones del sitio público viven en `functions/` como **Cloudflare Pages Functions**
  (`functions/api/reservas.ts` → `/api/reservas`), con secretos en el panel de Cloudflare.
- **NO se toca el adaptador de Astro** (meterlo en Cloudflare fue lo que congeló la web una
  vez — ver memoria `deployment-cloudflare`). La función nueva es independiente, como reservas.

## 4. La solución (decisiones ya aprobadas por el dueño)

1. **Conexión de verdad vía API de MailerLite.** El gate y el popup dejan de ir a Formspree
   y pasan por una **función propia** en Cloudflare que llama a la API de MailerLite.
2. **Destino:** grupo **general de "la Sociedad"** (el mismo del formulario embebido `GIibQ8`),
   con **doble opt-in + la bienvenida que ya existe**. Sin montar automatizaciones nuevas.
3. **Origen etiquetado** (`planificador`, `popup`, …) para poder medir de dónde vino cada alta.
4. El **plan de viaje se sigue obteniendo en la propia página** (PDF/imprimir + copiar enlace);
   el correo del gate ya no promete "tu plan por email" → **copy honesto**.

### 4.1 Componente nuevo: `functions/api/suscribir.ts` (Cloudflare Pages Function)

- **Entrada:** POST (JSON preferido; acepta form-data como respaldo `<noscript>`). Campos:
  `email` (obligatorio, validado), `consent` (obligatorio = aceptado), `origen`, `locale`.
- **Anti-abuso:** campo honeypot oculto + validación de email; descartar si el honeypot viene
  relleno. (Sin cookies ni tracking.)
- **Acción:** `POST https://connect.mailerlite.com/api/subscribers` con
  `Authorization: Bearer ${MAILERLITE_API_KEY}`, body con `email`, `groups: [GROUP_ID]`,
  `fields`/`origen` y el estado que dispare el **doble opt-in** (a verificar el parámetro
  exacto al construir; la cuenta ya tiene doble opt-in configurado).
- **Salida:** `200 {ok:true}` si MailerLite acepta; `4xx/5xx {ok:false, motivo}` si no.
  La **API key nunca sale al cliente**.
- **Secretos (panel de Cloudflare Pages, no en el repo):** `MAILERLITE_API_KEY`,
  `MAILERLITE_GROUP_ID` (grupo general de la Sociedad).

### 4.2 Cambios en el cliente

- **Gate del planner** (`PlannerView.astro`): el `emailForm` hace `fetch('/api/suscribir')`
  (same-origin) en lugar de a Formspree. En éxito → `unlockPdf()` (como ahora). En fallo de
  red/servidor → **mensaje amable + reintento**, y como cortesía **desbloquear igualmente el
  PDF** (no penalizar al usuario por un fallo nuestro); se registra el error en la función.
  Se retira la dependencia de `captureEndpoint` (Formspree) en el gate.
- **Popup** (`NewsletterPopup.astro`): revivir **nuestro** componente propio (ya está diseñado
  calmado: aparece tras 35 % de scroll, cerrable, una sola vez, recordado) apuntando su
  formulario a `/api/suscribir`. Se ajusta la condición `show` para que funcione con
  `enabled:true` (hoy depende de `captureMode`, que es `false`). Anti-ruido intacto.
- **Fin de artículo** (`NewsletterSignup.astro`, variante `inline`): sustituir el enlace por
  captación directa (formulario embebido de MailerLite —como ya hace la variante `section`—
  o mini-form a `/api/suscribir`; se elige la vía de menor riesgo al implementar). Que el
  lector más caliente pueda suscribirse **sin un clic extra**.
- **Copy honesto y confianza:**
  - Línea serena de doble opt-in bajo los CTAs y en el gate: *"Te llegará un correo para
    confirmar tu suscripción (revisa también spam)."* — en ES/EN/FR (`i18n/ui.ts`).
  - Añadir "sin spam · cada quince días" en el gate (reutilizar `newsletter.privacy`).
  - Botón del imán en home → concreto ("Quiero la guía" / "Ver la guía"), coherente con la
    landing.
  - Gate: el botón del PDF no promete una "descarga"; en móvil, nota breve de cómo guardarlo.

### 4.3 Verificación en el panel de MailerLite (contigo, no es código)

- Confirmar el **ID del grupo general** de la Sociedad (para `MAILERLITE_GROUP_ID`).
- Generar la **API key** (te guío; 2 min).
- Revisar que el **mensaje de éxito** del formulario embebido deja claro que hay que confirmar.
- El form popup viejo de ML (`ETGJGK`) queda **sin uso** (usamos el popup propio).

## 5. Fuera de alcance / aplazado (con poco tráfico, no tocar a ciegas)

- **A/B testing** de `scrollPercent` o micro-copys: con 161 visitas/mes el ruido se come la
  señal. Se cambia por criterio, no por test.
- **Reducir fricción del gate** (quitar consentimiento, etc.): el consentimiento RGPD **no es
  negociable**; el resto se decide viendo el ratio `planner-email ÷ planner-generado` (el gate
  es del 3-jul, aún sin datos).
- **Enviar el plan personalizado por email** (grupo/automatización propios del planner): opción
  B descartada por ahora; se puede retomar con volumen.
- **FR completo** de la captación (form/grupo FR, `/fr/confidentialite`): anotado, no bloqueante.
- **Unificar TODA la captación** en `/api/suscribir` (jubilar el embed de ML y Formspree):
  deseable a futuro; esta tanda solo mueve gate + popup (+ inline) para minimizar riesgo.

## 6. Principios que se respetan (definición de hecho)

- **Anti-ruido (§12):** sin popups al entrar, sin FOMO; el popup propio es discreto y cerrable.
- **Rendimiento (§3.5):** la web sigue 100 % estática; la función es serverless aparte; el JS
  de cliente añadido es mínimo (reutiliza el island del planner y el script del popup ya
  existentes). Lighthouse intacto.
- **A11y (§3.6):** se mantiene `label`+`for`, foco visible, estados con `role="status"`.
- **i18n (§3.4):** todo copy nuevo entra por diccionario en ES/EN (+FR donde ya hay página).
- **Privacidad (§12):** sin cookies ni trackers; la API key vive solo en el servidor.
- **Honestidad:** no se promete lo que no se entrega (plan por email); el doble opt-in se avisa.

## 7. Lo que necesito de ti (Cristian)

1. **Generar la API key de MailerLite** (Integrations → API, te guío) y decirme el **ID del
   grupo general** de la Sociedad. Los pego yo como secretos en Cloudflare (no van al repo).
2. Nada más para empezar: el resto es código + verificación que hago yo.

## 8. Riesgos y mitigación

- **La función cae / MailerLite responde error** → el usuario no se penaliza (se desbloquea el
  PDF igualmente) y el error se registra; se puede reintentar. Con volumen, evaluar una cola.
- **El doble opt-in por API no dispara el correo** → se verifica en la primera prueba real
  (alta → correo de confirmación → bienvenida) antes de dar por hecho; si hiciera falta, se
  ajusta el parámetro de estado o se usa el endpoint específico de MailerLite.
- **Regresión del gate** → el flujo actual (fetch + fallback + no perder el plan) se conserva;
  solo cambia el destino del POST. Se prueba el camino feliz y el de error.

## 9. Definición de hecho

- Alta real de prueba desde el gate entra en el grupo de MailerLite, recibe doble opt-in y,
  al confirmar, la bienvenida. Verificado extremo a extremo (como se hizo con el lead magnet).
- El popup propio aparece, capta y entra en la misma lista.
- Fin de artículo capta sin clic extra.
- Copy de doble opt-in y confianza presentes en ES/EN.
- Sitio sigue estático; Lighthouse sin regresión; sin secretos en el repo.
- Fichas de Jira **KAN-38** (y lo que toque de **KAN-39**) actualizadas; registro de la web en
  el vault al día.
