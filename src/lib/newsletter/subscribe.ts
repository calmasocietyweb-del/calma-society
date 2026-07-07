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
