# Conexión del embudo a MailerLite — Plan de implementación (KAN-38)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el gate del planificador y el popup generen suscriptores REALES de MailerLite (grupo general de la Sociedad, con su bienvenida), y tapar de paso las fugas menores del embudo (CTA de fin de artículo, aviso de doble opt-in, confianza, copys).

**Architecture:** Una Cloudflare Pages Function nueva (`functions/api/suscribir.ts`, mismo patrón que `/api/reservas`) recibe el alta y llama a la API de MailerLite con la API key guardada como secreto de Cloudflare. La lógica pura (validación + payload) vive en `src/lib/newsletter/` y se testea con `node --test`. En el cliente, un componente reutilizable `SubscribeForm.astro` postea a `/api/suscribir` por `fetch` (progresivamente mejorado: sin JS hace POST clásico con redirect). El gate del planner reapunta su `fetch` existente a `/api/suscribir`. La web pública sigue 100 % estática; NO se toca el adaptador de Astro.

**Tech Stack:** Astro 6 (estático) + TypeScript, Cloudflare Pages Functions, API de MailerLite (Connect), tests con `node --test` (nativo, sin dependencias).

## Global Constraints

- **Web pública 100 % estática, SIN adaptador.** No modificar `astro.config.ts` para añadir adaptador (meterlo en Cloudflare congeló la web una vez). Las funciones van en `functions/`.
- **Sin dependencias nuevas** (CLAUDE.md §11): validación y llamada a MailerLite con `fetch` nativo y regex. No añadir librerías.
- **Secretos solo en Cloudflare**, nunca en el repo: `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`.
- **Anti-ruido (§12):** ningún popup al entrar; el popup aparece tras 35 % de scroll, cerrable, una sola vez. Copy de lujo tranquilo, sin FOMO.
- **A11y (§3.6):** `label`+`for`, `autocomplete="email"`, foco visible, estados con `role="status"`. Honeypot oculto también para lectores de pantalla (`aria-hidden`, `tabindex="-1"`).
- **i18n (§3.4):** todo copy nuevo entra por diccionario ES/EN (y FR donde ya haya página); nunca texto hardcodeado en plantilla.
- **Honestidad:** no prometer "plan por email"; avisar del doble opt-in.
- **Commits:** Conventional Commits en español; terminar el mensaje con `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. No `git push` hasta verificación E2E con el dueño (Task 8).
- **Test runner:** `npm test` corre `node --test` sobre `src/lib/**/*.test.ts`. Para incluir la carpeta nueva, ampliar el glob del script `test` en `package.json` (Task 1).

---

### Task 1: Lógica pura de suscripción (`src/lib/newsletter/`)

**Files:**
- Create: `src/lib/newsletter/subscribe.ts`
- Test: `src/lib/newsletter/subscribe.test.ts`
- Modify: `package.json:17` (ampliar el glob de `test`)

**Interfaces:**
- Produces:
  - `type SubscribeInput = { email: string; locale: "es" | "en"; origen: string }`
  - `validateSubscribeInput(raw: Record<string,string>): { ok: true; value: SubscribeInput } | { ok: false; error: "bot" | "email" | "consent" }`
  - `buildSubscriberPayload(value: SubscribeInput, groupId: string): { email: string; groups: string[] }`
  - `const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers"`

- [ ] **Step 1: Ampliar el glob de tests en `package.json`**

Modificar la línea 17 para que incluya la carpeta nueva:

```json
    "test": "node --test \"src/lib/planner/**/*.test.ts\" \"src/lib/bookings/**/*.test.ts\" \"src/lib/newsletter/**/*.test.ts\""
```

- [ ] **Step 2: Escribir el test que falla**

Crear `src/lib/newsletter/subscribe.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSubscribeInput, buildSubscriberPayload } from "./subscribe.ts";

function base(): Record<string, string> {
  return { email: "Prueba@Example.com ", consent: "on", locale: "es", origen: "planificador", web: "" };
}

test("acepta un alta válida y normaliza email y locale", () => {
  const r = validateSubscribeInput(base());
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.email, "prueba@example.com"); // trim + minúsculas
  assert.equal(r.value.locale, "es");
  assert.equal(r.value.origen, "planificador");
});

test("acepta el consentimiento con el nombre heredado del gate (consentimiento)", () => {
  const raw = { ...base(), consent: "", consentimiento: "on" };
  assert.equal(validateSubscribeInput(raw).ok, true);
});

test("rechaza el honeypot relleno (bot)", () => {
  const r = validateSubscribeInput({ ...base(), web: "http://spam" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "bot");
});

test("rechaza email inválido", () => {
  const r = validateSubscribeInput({ ...base(), email: "no-es-email" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "email");
});

test("rechaza si falta el consentimiento", () => {
  const r = validateSubscribeInput({ ...base(), consent: "", consentimiento: "" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.error, "consent");
});

test("locale desconocido cae a es", () => {
  const r = validateSubscribeInput({ ...base(), locale: "de" });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.locale, "es");
});

test("buildSubscriberPayload mete el email y el grupo", () => {
  const payload = buildSubscriberPayload(
    { email: "a@b.com", locale: "es", origen: "popup" },
    "1234567890",
  );
  assert.deepEqual(payload, { email: "a@b.com", groups: ["1234567890"] });
});
```

- [ ] **Step 3: Ejecutar el test para verlo fallar**

Run: `npm test`
Expected: FAIL — no existe `./subscribe.ts` (Cannot find module).

- [ ] **Step 4: Escribir la implementación mínima**

Crear `src/lib/newsletter/subscribe.ts`:

```ts
/**
 * Alta de suscriptor de la newsletter (servidor). Lógica pura y sin
 * dependencias (CLAUDE.md §11): la usa functions/api/suscribir.ts para
 * validar el formulario y construir el cuerpo de la API de MailerLite.
 * El origen del alta se mide por eventos de Umami, no por campos de ML.
 */
export const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

export interface SubscribeInput {
  email: string;
  locale: "es" | "en";
  origen: string;
}

// Email pragmático: algo@algo.algo (no perseguimos el RFC completo).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSubscribeInput(
  raw: Record<string, string>,
): { ok: true; value: SubscribeInput } | { ok: false; error: "bot" | "email" | "consent" } {
  // Honeypot: un bot rellena el campo oculto "web"; un humano lo deja vacío.
  if ((raw.web ?? "").trim() !== "") return { ok: false, error: "bot" };

  const email = (raw.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email" };

  // El gate heredó el nombre "consentimiento"; el resto usa "consent".
  // Usamos `||` (no `??`) para que un "consent" vacío caiga al heredado.
  const consent = (raw.consent || raw.consentimiento || "").trim();
  if (consent === "") return { ok: false, error: "consent" };

  const locale = raw.locale === "en" ? "en" : "es";
  const origen = (raw.origen ?? "web").slice(0, 40);
  return { ok: true, value: { email, locale, origen } };
}

export function buildSubscriberPayload(
  value: SubscribeInput,
  groupId: string,
): { email: string; groups: string[] } {
  // El grupo general de la Sociedad dispara la bienvenida ya existente.
  return { email: value.email, groups: [groupId] };
}
```

- [ ] **Step 5: Ejecutar los tests hasta verlos pasar**

Run: `npm test`
Expected: PASS — los 7 tests de `subscribe.test.ts` en verde (y el resto de la suite intacta).

- [ ] **Step 6: Commit**

```bash
git add src/lib/newsletter/subscribe.ts src/lib/newsletter/subscribe.test.ts package.json
git commit -m "feat(newsletter): lógica pura de alta de suscriptor (validación + payload ML) — KAN-38"
```

---

### Task 2: Función Cloudflare `functions/api/suscribir.ts`

**Files:**
- Create: `functions/api/suscribir.ts`

**Interfaces:**
- Consumes (de Task 1): `validateSubscribeInput`, `buildSubscriberPayload`, `MAILERLITE_ENDPOINT`.
- Produces: endpoint `POST /api/suscribir`.
  - Con cabecera `Accept: application/json` (el `fetch` del cliente) → responde `200 {ok:true}` o `4xx {ok:false, error}`.
  - Con POST clásico form-data (respaldo `<noscript>`) → `303` redirect a la página de gracias (éxito) o a `/newsletter` (error) del idioma.
- La API key **nunca** sale al cliente.

> Esta función se verifica extremo a extremo en la Task 8 (necesita secretos y la cuenta real). Aquí el objetivo es que compile y quede completa.

- [ ] **Step 1: Escribir la función completa**

Crear `functions/api/suscribir.ts`:

```ts
/**
 * API de alta de newsletter (Cloudflare Pages Functions).
 * Mete el correo en el grupo general de la Sociedad en MailerLite (con su
 * bienvenida). Dos modos de respuesta: JSON para el fetch del cliente y
 * redirect 303 para el respaldo sin JS. La API key vive en el entorno de
 * Cloudflare (MAILERLITE_API_KEY), nunca en el repo. Ver
 * docs/superpowers/specs/2026-07-07-conversion-gate-mailerlite-design.md
 */
import {
  validateSubscribeInput,
  buildSubscriberPayload,
  MAILERLITE_ENDPOINT,
} from "../../src/lib/newsletter/subscribe.ts";

interface Env {
  MAILERLITE_API_KEY?: string;
  MAILERLITE_GROUP_ID?: string;
}
type Ctx = { request: Request; env: Env };

const THANKS: Record<string, string> = {
  es: "/sociedad-bienvenida",
  en: "/en/society-welcome",
};
const RETRY: Record<string, string> = {
  es: "/newsletter",
  en: "/en/newsletter",
};

function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  const ct = request.headers.get("content-type") ?? "";
  let raw: Record<string, string> = {};
  if (ct.includes("application/json")) {
    raw = ((await request.json().catch(() => ({}))) as Record<string, string>) ?? {};
  } else {
    const form = await request.formData();
    for (const [k, v] of form.entries()) if (typeof v === "string") raw[k] = v;
  }
  const locale = raw.locale === "en" ? "en" : "es";
  const asJson = wantsJson(request);

  const respondErr = (error: string, status: number): Response =>
    asJson
      ? json({ ok: false, error }, status)
      : Response.redirect(new URL(RETRY[locale], request.url).toString(), 303);
  const respondOk = (): Response =>
    asJson
      ? json({ ok: true })
      : Response.redirect(new URL(THANKS[locale], request.url).toString(), 303);

  const result = validateSubscribeInput(raw);
  if (!result.ok) {
    // El honeypot (bot) se responde como "ok" para no dar pistas al spammer.
    if (result.error === "bot") return respondOk();
    return respondErr(result.error, 400);
  }

  if (!env.MAILERLITE_API_KEY || !env.MAILERLITE_GROUP_ID) {
    console.error("suscribir: faltan MAILERLITE_API_KEY / MAILERLITE_GROUP_ID");
    return respondErr("config", 500);
  }

  try {
    const r = await fetch(MAILERLITE_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(buildSubscriberPayload(result.value, env.MAILERLITE_GROUP_ID)),
    });
    // 200/201 = creado; 422 suele ser "ya existe" → idempotente, lo damos por bueno.
    if (!r.ok && r.status !== 422) {
      console.error("suscribir: MailerLite respondió", r.status, await r.text().catch(() => ""));
      return respondErr("servidor", 502);
    }
    return respondOk();
  } catch (e) {
    console.error("suscribir: error de red con MailerLite", e);
    return respondErr("servidor", 502);
  }
}
```

- [ ] **Step 2: Verificar que el proyecto sigue compilando (tipos)**

Run: `npm run check`
Expected: sin errores nuevos en `functions/api/suscribir.ts` ni en `src/lib/newsletter/`. (Si `astro check` no cubre `functions/`, basta con que `npx tsc --noEmit -p functions/tsconfig.json` no dé errores nuevos.)

- [ ] **Step 3: Commit**

```bash
git add functions/api/suscribir.ts
git commit -m "feat(newsletter): función Cloudflare /api/suscribir (alta en MailerLite) — KAN-38"
```

---

### Task 3: Componente reutilizable `SubscribeForm.astro`

**Files:**
- Create: `src/components/SubscribeForm.astro`

**Interfaces:**
- Consumes: endpoint `/api/suscribir` (Task 2), diccionario `useTranslations` (claves de Task 7).
- Produces: `<SubscribeForm origen="..." tone?="dark"|"light" idSuffix?="..." umamiEvent?="..." />`
  - Progresivamente mejorado: sin JS hace POST clásico a `/api/suscribir` (redirect). Con JS intercepta el submit, hace `fetch` y muestra el estado inline ("Te llega un correo para confirmar…") sin salir de página.

- [ ] **Step 1: Crear el componente**

Crear `src/components/SubscribeForm.astro`:

```astro
---
// Formulario de alta de newsletter → /api/suscribir (grupo general de la
// Sociedad). Progresivamente mejorado: sin JS hace POST clásico con redirect;
// con JS envía por fetch y muestra el estado sin salir de página. KPI nº1.
import { useTranslations } from "../i18n/ui";
import { currentLocale } from "../i18n/utils";

interface Props {
  origen: string;
  tone?: "dark" | "light";
  idSuffix?: string;
  umamiEvent?: string;
}
const { origen, tone = "dark", idSuffix = "", umamiEvent } = Astro.props;
const locale = currentLocale(Astro.url.pathname);
const t = useTranslations(locale);
const dark = tone === "dark";
const emailId = `sub-email${idSuffix}`;
const consentId = `sub-consent${idSuffix}`;
const privacyHref = locale === "es" ? "/privacidad" : `/${locale}/privacy`;

const inputClass = dark
  ? "w-full rounded-md border border-lino/20 bg-lino/10 px-4 py-3 text-sm text-lino placeholder:text-lino/50 transition-colors duration-150 ease-calma focus:border-champan/40 focus:bg-lino/[0.16] focus-visible:outline-champan"
  : "w-full rounded-md border border-niebla bg-lino/60 px-4 py-3 text-sm text-piedra placeholder:text-piedra-suave transition-colors duration-150 ease-calma focus:border-terracota/50 focus-visible:outline-terracota";
const btnClass = dark
  ? "press shrink-0 rounded-md bg-oro-vivo px-6 py-3 text-sm font-semibold text-tinta hover:bg-lino"
  : "press shrink-0 rounded-md bg-arcilla px-6 py-3 text-sm font-semibold text-lino hover:bg-tinta";
const subtle = dark ? "text-lino/70" : "text-piedra-suave";
const linkClass = dark ? "font-medium text-champan underline hover:text-lino" : "font-medium text-arcilla underline hover:text-terracota";
const accent = dark ? "accent-oro-vivo" : "accent-terracota";
---

<form class="cs-subscribe mx-auto mt-8 max-w-md text-left" action="/api/suscribir" method="POST" data-umami-event={umamiEvent}>
  <input type="hidden" name="locale" value={locale} />
  <input type="hidden" name="origen" value={origen} />
  {/* Honeypot: oculto a personas y a lectores de pantalla. Un bot lo rellena. */}
  <input type="text" name="web" tabindex="-1" autocomplete="off" aria-hidden="true" class="absolute left-[-9999px] h-0 w-0 opacity-0" />

  <div class="flex flex-col gap-3 sm:flex-row">
    <label for={emailId} class="sr-only">{t("newsletter.placeholder")}</label>
    <input id={emailId} type="email" name="email" required autocomplete="email" placeholder={t("newsletter.placeholder")} class={inputClass} />
    <button type="submit" class={btnClass}>{t("newsletter.cta")}</button>
  </div>

  <label class="mt-3 flex items-start gap-2.5 text-xs leading-relaxed" data-consent>
    <input id={consentId} type="checkbox" name="consent" value="acepto" required class={`mt-0.5 h-4 w-4 shrink-0 ${accent}`} />
    <span class={subtle}>{t("newsletter.consent")} <a href={privacyHref} class={linkClass}>{t("contact.consentLink")}</a>.</span>
  </label>

  {/* Aviso de doble opt-in + estado del envío (role=status para a11y).
      data-done/data-error los usa el script para el mensaje tras enviar. */}
  <p class={`cs-subscribe-note mt-3 text-xs ${subtle}`} role="status"
     data-done={t("newsletter.optinDone")} data-error={t("newsletter.optinError")}>{t("newsletter.doubleOptin")}</p>
</form>

<script>
  // Envío por fetch: no salir de página y avisar del doble opt-in. Sin JS, el
  // form hace POST clásico con redirect (el action ya apunta a /api/suscribir).
  document.querySelectorAll<HTMLFormElement>("form.cs-subscribe").forEach((form) => {
    const note = form.querySelector<HTMLElement>(".cs-subscribe-note");
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (btn) btn.disabled = true;
      try {
        const res = await fetch("/api/suscribir", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({ ok: res.ok }));
        if (data.ok) {
          if (note) note.textContent = note.dataset.done || note.textContent;
          form.querySelector<HTMLElement>("[data-consent]")?.setAttribute("hidden", "");
          const row = form.querySelector<HTMLElement>(".flex");
          if (row) row.setAttribute("hidden", "");
        } else {
          if (note) note.textContent = note.dataset.error || note.textContent;
          if (btn) btn.disabled = false;
        }
      } catch {
        // Red caída: envío clásico como último recurso (no perder el alta).
        form.submit();
      }
    });
  });
</script>
```

Los textos de éxito/error (`data-done` / `data-error`) ya vienen inyectados en el `<p>` de estado desde el diccionario; el script los lee con `note.dataset.done` / `note.dataset.error`.

- [ ] **Step 2: Verificar build**

Run: `npm run check`
Expected: sin errores nuevos. (Las claves `newsletter.doubleOptin`, `newsletter.optinDone`, `newsletter.optinError` se crean en la Task 7; si `check` se ejecuta antes, añadirlas primero o hacer la Task 7 antes de esta verificación.)

- [ ] **Step 3: Commit**

```bash
git add src/components/SubscribeForm.astro
git commit -m "feat(newsletter): componente SubscribeForm (fetch a /api/suscribir, doble opt-in) — KAN-38"
```

---

### Task 4: Reapuntar el gate del planificador a `/api/suscribir` + copy honesto

**Files:**
- Modify: `src/components/PlannerView.astro` (form del gate ~340-368; lógica del island ~630-678; copys ~63-66, 93; `captureEndpoint` ~151)

**Interfaces:**
- Consumes: endpoint `/api/suscribir` (Task 2).
- El evento Umami `planner-email` se conserva (mide la conversión del gate).

- [ ] **Step 1: Cambiar el destino del formulario del gate**

En `PlannerView.astro`, en el `<form id="planner-email-form">` (línea ~340):
- Cambiar `action={captureEndpoint}` por `action="/api/suscribir"`.
- Eliminar los hidden de Formspree `_subject` y `_next`.
- Mantener `plan_url` (informativo) y añadir el honeypot + `locale` + `origen`:

```astro
    <form id="planner-email-form" action="/api/suscribir" method="POST" class="mt-4 max-w-md">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="origen" value="planificador" />
      <input type="text" name="web" tabindex="-1" autocomplete="off" aria-hidden="true" class="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <div class="flex flex-col gap-3 sm:flex-row">
        <label for="planner-email" class="sr-only">{T.emailPlaceholder}</label>
        <input id="planner-email" type="email" name="email" required autocomplete="email" placeholder={T.emailPlaceholder}
          class="w-full rounded-md border border-niebla bg-lino/60 px-4 py-2.5 text-sm text-piedra placeholder:text-piedra-suave transition-colors duration-150 focus:border-terracota/50 focus-visible:outline-terracota" />
        <button type="submit" id="planner-email-btn" data-umami-event="planner-email" class="press shrink-0 rounded-md bg-arcilla px-5 py-2.5 text-sm font-semibold text-lino transition-colors hover:bg-tinta">
          {T.emailBtn}
        </button>
      </div>
      <label class="mt-2 flex items-start gap-2 text-xs leading-relaxed text-piedra-suave">
        <input type="checkbox" name="consent" required class="mt-0.5 accent-terracota" />
        <span>
          {T.consentPrefix}
          <a href={privacyHref} class="font-medium text-arcilla underline hover:text-terracota">{T.consentLink}</a>
          {" "}{T.consentSuffix}
        </span>
      </label>
      <p class="mt-2 text-xs text-piedra-suave">{T.doubleOptin} · {T.privacy}</p>
    </form>
```

> `T.doubleOptin` y `T.privacy` son claves del dataset de textos del planner (CFG/T). Añadirlas donde se definen los textos del planner (buscar `emailBtn`/`consentPrefix` en el mismo archivo o en el módulo de textos del planner) con: ES "Te llegará un correo para confirmar tu suscripción (revisa spam)." / "Sin spam · te das de baja cuando quieras."; EN equivalentes. Reutilizar `newsletter.doubleOptin` si el planner lee del diccionario global.

- [ ] **Step 2: Ajustar la lógica del island (fallback sin Formspree)**

En el `emailForm.addEventListener("submit", ...)` (línea ~658), el `fetch` ya usa `emailForm.action` (ahora `/api/suscribir`) y `Accept: application/json`. Cambiar solo el `catch`: en vez de `emailForm.submit()` (que antes redirigía por Formspree), **desbloquear igualmente el PDF** para no penalizar al usuario y avisar suave:

```ts
    } catch {
      // La función/red falló: no penalizamos al usuario (su gesto ya es suyo).
      // Desbloqueamos el dossier y avisamos con calma; el alta se reintenta si vuelve.
      unlockPdf();
      gateMsg(CFG.gateThanks);
      setTimeout(() => window.print(), 350);
    }
```

Verificar que la rama `if (!res.ok) throw new Error(...)` sigue: un 400/502 de la función lanza y cae al `catch` (desbloquea igualmente). Para el camino feliz (`res.ok`), no cambia: `unlockPdf()` + `window.print()`.

- [ ] **Step 3: Copy honesto del PDF y del gate**

- Botón del PDF (`#planner-pdf`, texto `T.savePdf`): que no prometa "descarga". Ajustar el texto del diccionario del planner de "Descargar el dossier (PDF)" a algo como "Abrir el dossier para guardar/imprimir" (ES) / "Open the dossier to save/print" (EN).
- Donde el gate mencione "Recibe tu plan por email" (líneas ~63-66, ~93): reescribir a "Guarda tu plan y entra en la Sociedad" (ES) / "Save your plan and join the Society" (EN). No prometer el plan por correo.
- Retirar la constante `captureEndpoint` (línea ~151) si ya no se usa en el archivo (grep en el archivo para confirmar que no queda otra referencia).

- [ ] **Step 4: Verificar build**

Run: `npm run check` y `npm run build`
Expected: build OK. Revisar en `npm run preview` que el gate renderiza, el candado está y el botón "Copiar enlace" sigue.

- [ ] **Step 5: Commit**

```bash
git add src/components/PlannerView.astro
git commit -m "feat(newsletter): el gate del planner da de alta en MailerLite + copy honesto — KAN-38"
```

---

### Task 5: Revivir el popup apuntando a `/api/suscribir`

**Files:**
- Modify: `src/components/NewsletterPopup.astro` (condición `show` línea ~19-20; el cuerpo usa `SocietyCaptureForm` línea ~58)

**Interfaces:**
- Consumes: `SubscribeForm` (Task 3).

- [ ] **Step 1: Cambiar la condición de render y el formulario interno**

- Línea ~14-20: sustituir el cálculo de `show`. Con MailerLite activo (`enabled:true`) el popup debe mostrarse; sigue respetando `popup.enabled`:

```ts
const { enabled, popup } = SITE.newsletter;
// El popup aparece cuando la newsletter está activa y el popup habilitado.
// (Anti-ruido: el script lo muestra tras scroll, una vez, cerrable.)
const show = enabled && popup.enabled;
const scrollPercent = popup.scrollPercent;
```

- Línea ~58: sustituir `<SocietyCaptureForm ... />` por el nuevo formulario:

```astro
import SubscribeForm from "./SubscribeForm.astro";
...
        <SubscribeForm origen="popup" tone="light" idSuffix="-popup" umamiEvent="newsletter-popup-submit" />
```

Quitar el import de `SocietyCaptureForm` de este archivo si ya no se usa. El resto (estilos, script de scroll/cierre, `localStorage`) NO se toca.

- [ ] **Step 2: Verificar que el script del popup sigue funcionando**

El script busca `el.querySelector("form")` para el `submit` → sigue existiendo (SubscribeForm renderiza un `<form>`). No cambia.

- [ ] **Step 3: Verificar build + humo**

Run: `npm run check` y `npm run build`, luego `npm run preview`.
Expected: en una página de artículo, al bajar ~35 % aparece el popup discreto; se cierra con X/ESC/clic fuera; no reaparece tras cerrar.

- [ ] **Step 4: Commit**

```bash
git add src/components/NewsletterPopup.astro
git commit -m "feat(newsletter): revivir el popup y darlo de alta en MailerLite — KAN-38"
```

---

### Task 6: CTA de fin de artículo = formulario, no enlace

**Files:**
- Modify: `src/components/NewsletterSignup.astro` (rama `variant === "inline"`, líneas ~68-96)

**Interfaces:**
- Consumes: `SubscribeForm` (Task 3).

- [ ] **Step 1: Sustituir el enlace por el formulario en la variante inline**

En la rama `show && variant === "inline"`, reemplazar el bloque `{captureMode ? (<SocietyCaptureForm/>) : (<a href=...>)}` por el formulario directo, de modo que el lector se suscriba sin clic extra:

```astro
        <SubscribeForm origen="articulo" tone="light" idSuffix="-inline" umamiEvent="newsletter-submit-inline" />
```

Importar `SubscribeForm` en el frontmatter. Mantener el `eyebrow`/`title`/`text` de la tarjeta (el gancho de la landing del imán se sigue pasando por props). La línea de privacidad de abajo (`t("newsletter.privacy")`) puede quedarse o retirarse (SubscribeForm ya trae su aviso de doble opt-in); retirarla para no duplicar.

> La variante `section` (home, /newsletter) NO se toca en esta tanda: su formulario embebido de MailerLite ya convierte. Unificarla en `/api/suscribir` queda como deuda registrada en el spec §5.

- [ ] **Step 2: Verificar build**

Run: `npm run check` y `npm run build`.
Expected: OK. En `preview`, al final de un artículo aparece el formulario (email + botón + consentimiento + aviso), no un enlace.

- [ ] **Step 3: Commit**

```bash
git add src/components/NewsletterSignup.astro
git commit -m "feat(newsletter): captación directa al final del artículo (sin clic extra) — KAN-38"
```

---

### Task 7: Copys i18n (doble opt-in, confianza, botón del imán) + página de gracias

**Files:**
- Modify: `src/i18n/ui.ts` (bloque `newsletter.*`, ~92-99)
- Modify: `src/pages/index.astro:160-163` (botón del imán en home)
- Modify: `src/pages/sociedad-bienvenida.astro` y `src/pages/en/society-welcome.astro` (mensaje coherente con doble opt-in)

**Interfaces:**
- Produces: claves `newsletter.doubleOptin`, `newsletter.optinDone`, `newsletter.optinError` (usadas por `SubscribeForm`, Task 3).

- [ ] **Step 1: Añadir las claves nuevas al diccionario**

En `src/i18n/ui.ts`, dentro de cada idioma (es, en, y fr si el bloque existe), añadir:

```ts
    "newsletter.doubleOptin": "Te llegará un correo para confirmar tu suscripción (revisa también spam).",
    "newsletter.optinDone": "Casi listo: te hemos enviado un correo para confirmar. Ábrelo y confirma (mira en spam).",
    "newsletter.optinError": "No hemos podido completar el alta. Inténtalo de nuevo en un momento.",
```

Y en inglés:

```ts
    "newsletter.doubleOptin": "You'll get an email to confirm your subscription (check spam too).",
    "newsletter.optinDone": "Almost there: we've sent you an email to confirm. Open it and confirm (check spam).",
    "newsletter.optinError": "We couldn't complete your sign-up. Please try again in a moment.",
```

- [ ] **Step 2: Botón del imán en home más concreto**

En `src/pages/index.astro` (~160-163), donde el bloque del imán enlaza a `/calas-tranquilas`, cambiar el texto del botón de "Unirme a la Sociedad" a "Quiero la guía" (ES) / "I want the guide" (EN). Usar la clave del diccionario si el texto viene de ahí; si está hardcodeado, sustituirlo respetando el idioma de la página.

- [ ] **Step 3: Coherencia de la página de gracias**

En `sociedad-bienvenida.astro` (y `society-welcome.astro`), revisar que el mensaje NO afirme "Ya formas parte" de forma que contradiga el doble opt-in. Ajustar a algo tipo: "Casi listo. Te hemos enviado un correo para confirmar tu suscripción — ábrelo y confirma." (ES) y equivalente EN. (Esta página la ve el respaldo sin JS tras el POST clásico.)

- [ ] **Step 4: Verificar build**

Run: `npm run check` y `npm run build`.
Expected: OK, sin claves i18n faltantes.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ui.ts src/pages/index.astro src/pages/sociedad-bienvenida.astro src/pages/en/society-welcome.astro
git commit -m "feat(newsletter): copys de doble opt-in, confianza y botón del imán — KAN-38"
```

---

### Task 8: Secretos de Cloudflare, verificación E2E y cierre

**Files:** ninguno de código (configuración externa + verificación + registros).

- [ ] **Step 1: Obtener credenciales del dueño**

Pedir a Cristian (guiándolo): en MailerLite → Integrations → API → generar una **API key**; y el **ID del grupo general** de la Sociedad (Subscribers → Groups → el grupo cuya bienvenida ya existe). Anotar ambos (no en el repo).

- [ ] **Step 2: Configurar los secretos en Cloudflare Pages**

En el panel de Cloudflare Pages del proyecto → Settings → Environment variables (Production y Preview):
- `MAILERLITE_API_KEY` = (la key)
- `MAILERLITE_GROUP_ID` = (el id del grupo)
Guardar. (Igual que `BOOKINGS_ENABLED` / `RESERVAS_ADMIN_KEY` de reservas.)

- [ ] **Step 3: Push y despliegue**

Con el visto bueno del dueño (§ commits: no hacer push antes):

```bash
git push
```

Esperar el deploy de Cloudflare Pages.

- [ ] **Step 4: Verificación extremo a extremo (la definición de hecho)**

En producción (o preview con los secretos), con un correo real de prueba:
1. **Gate del planner:** generar un plan → pulsar el PDF bloqueado (aparece la pista) → meter el correo + consentimiento → el candado se abre y salta el diálogo de guardar/imprimir.
2. Comprobar en MailerLite que ese correo **entró en el grupo** de la Sociedad y que **llegó el correo de confirmación** (doble opt-in). Confirmar → comprobar que llega la **bienvenida**.
3. **Popup:** en un artículo, bajar ~35 % → aparece → suscribirse → entra en el mismo grupo.
4. **Fin de artículo:** suscribirse desde la tarjeta → entra en el grupo.
5. **Sin JS** (o red caída): el POST clásico redirige a la página de gracias y el correo entra igual.

> **Punto de verificación crítico (riesgo del spec §8):** si la API de MailerLite **no dispara el correo de doble opt-in** (mete al suscriptor como "active" directo), parar y decidir con el dueño: (a) aceptar single opt-in por API (el consentimiento RGPD ya se recoge) y que la bienvenida haga de confirmación, o (b) pasar el popup/inline al formulario embebido oculto (Opción B del spec) para ese tramo. No dar por bueno el doble opt-in sin verlo en un correo real.

- [ ] **Step 5: Limpiar el suscriptor de prueba**

Borrar el correo de prueba de MailerLite (dejar la cuenta limpia, como se hizo con el lead magnet).

- [ ] **Step 6: Cierre de registros**

- **Jira KAN-38** → mover a **En revisión** (espera visto bueno humano del funcionamiento) o **Finalizado** si el dueño ya lo validó en el paso 4. Comentar el resultado del E2E. Referenciar también **KAN-39** (mini-backend) como avanzado.
- **Vault** (`Documentación Página Web Calma.md`): añadir línea en la "Bitácora de cambios de la web" con fecha 2026-07-07: nueva función `/api/suscribir`, gate+popup+inline conectados a MailerLite, secretos añadidos, y el resultado del E2E. Actualizar la sección de integraciones (MailerLite ahora también por API) y la de variables de entorno de Cloudflare.
- **Memoria `.claude`**: actualizar la nota del embudo/analítica con el estado nuevo (gate ya alimenta la newsletter).

---

## Notas de verificación global

- Suite de tests: `npm test` (los 7 de `subscribe.test.ts` + la suite existente en verde).
- Tipos/build: `npm run check` y `npm run build` sin errores nuevos.
- Rendimiento: no se añade JS de cliente pesado (SubscribeForm ~1 KB de script; el popup y el island del planner ya existían). Lighthouse sin regresión.
- Sin secretos en el repo (grep `MAILERLITE_API_KEY` solo debe aparecer en `functions/api/suscribir.ts` como `env.MAILERLITE_API_KEY`).
