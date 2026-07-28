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

/** Marca temporal en el formato que espera MailerLite: "YYYY-MM-DD HH:MM:SS" (UTC). */
export function mailerliteTimestamp(now: Date): string {
  return now.toISOString().slice(0, 19).replace("T", " ");
}

export interface SubscriberPayload {
  email: string;
  groups: string[];
  status: "active";
  subscribed_at: string;
  opted_in_at: string;
  optin_ip?: string;
}

/**
 * Cuerpo del alta en MailerLite.
 *
 * `status: "active"` es DELIBERADO (decisión del dueño, 28-jul-2026). MailerLite
 * NO envía el correo de confirmación a las altas creadas por API — solo a las de
 * sus propios formularios. Al no mandar estado, el suscriptor se quedaba en
 * "sin confirmar" para siempre: ni recibía la confirmación, ni se disparaba la
 * bienvenida con el PDF. Es exactamente lo que le pasó al único suscriptor real
 * que ha tenido el proyecto (auditoría del 28-jul: "Enviados 0").
 *
 * La base legal RGPD no es el doble opt-in sino el consentimiento explícito, que
 * el formulario ya exige: casilla obligatoria + enlace a la política de
 * privacidad. Aquí dejamos constancia de CUÁNDO y DESDE DÓNDE se dio, que es lo
 * que hace ese consentimiento demostrable.
 */
export function buildSubscriberPayload(
  value: SubscribeInput,
  groupId: string,
  consent: { at: Date; ip?: string },
): SubscriberPayload {
  const at = mailerliteTimestamp(consent.at);
  // El grupo general de la Sociedad dispara la bienvenida ya existente.
  return {
    email: value.email,
    groups: [groupId],
    status: "active",
    subscribed_at: at,
    opted_in_at: at,
    ...(consent.ip ? { optin_ip: consent.ip } : {}),
  };
}
