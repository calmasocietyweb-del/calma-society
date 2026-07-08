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
        // .trim() por robustez: al pegar la key en el panel de Cloudflare puede
        // colarse un salto de línea o espacio que invalidaría la cabecera.
        authorization: `Bearer ${env.MAILERLITE_API_KEY.trim()}`,
      },
      body: JSON.stringify(buildSubscriberPayload(result.value, env.MAILERLITE_GROUP_ID.trim())),
    });
    // 200/201 = creado; 422 suele ser "ya existe" → idempotente, lo damos por bueno.
    if (!r.ok && r.status !== 422) {
      const detail = await r.text().catch(() => "");
      console.error("suscribir: MailerLite respondió", r.status, detail);
      // El detalle de MailerLite (status + mensaje, NO el token) ayuda a diagnosticar
      // desde el cliente cuando algo falla; se puede retirar cuando esté estable.
      return asJson
        ? json({ ok: false, error: "servidor", mlStatus: r.status, mlBody: detail.slice(0, 300) }, 502)
        : respondErr("servidor", 502);
    }
    return respondOk();
  } catch (e) {
    console.error("suscribir: error de red con MailerLite", e);
    return asJson
      ? json({ ok: false, error: "servidor", detail: String(e).slice(0, 200) }, 502)
      : respondErr("servidor", 502);
  }
}
