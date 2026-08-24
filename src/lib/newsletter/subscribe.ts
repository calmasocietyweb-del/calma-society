/**
 * Alta de suscriptor de la newsletter (servidor). Lógica pura y sin
 * dependencias (CLAUDE.md §11): la usa functions/api/suscribir.ts para
 * validar el formulario y construir el cuerpo de la API de MailerLite.
 * El origen del alta se mide por eventos de Umami, no por campos de ML.
 */
import type { Locale } from "../../config/site";

export const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

export interface SubscribeInput {
  email: string;
  locale: Locale;
  origen: string;
}

/* Idiomas que el alta reconoce. Es un `Record<Locale, true>` a propósito: si se
   da de alta un idioma nuevo en `site.ts` y no se añade aquí, ESTO NO COMPILA.
   La alternativa (una escalera de ternarios) ya falló una vez con el francés y
   habría vuelto a fallar con el alemán: el idioma no reconocido caía a "es" sin
   avisar y el lector acababa en el grupo español recibiendo la guía en
   castellano (KAN-133). */
const LOCALE_RECONOCIDO: Record<Locale, true> = { es: true, en: true, fr: true, de: true };

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

  // Cualquier idioma activo se reconoce; lo que no esté en la lista cae a "es".
  const locale: Locale = LOCALE_RECONOCIDO[raw.locale as Locale] ? (raw.locale as Locale) : "es";
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
  groups: string[],
  consent: { at: Date; ip?: string },
): SubscriberPayload {
  const at = mailerliteTimestamp(consent.at);
  return {
    email: value.email,
    // Sin duplicados y sin vacíos: un id repetido o una variable sin definir
    // haría que MailerLite rechazara el alta entera.
    groups: [...new Set(groups.filter(Boolean))],
    status: "active",
    subscribed_at: at,
    opted_in_at: at,
    ...(consent.ip ? { optin_ip: consent.ip } : {}),
  };
}

/**
 * Grupos a los que entra un alta.
 *
 * Siempre el **general** (la lista maestra de la Sociedad) y, si existe para su
 * idioma, el del **imán de las calas** — porque es ese grupo el que dispara la
 * automatización de bienvenida que ENTREGA la guía. El grupo general no tiene
 * automatización, así que por sí solo no envía nada (comprobado el 28-jul-2026:
 * las dos únicas automatizaciones activas escuchan a los grupos del imán).
 *
 * En francés todavía no hay guía ni automatización: esas altas quedan en el
 * grupo general y **no reciben bienvenida**. Es una carencia conocida, no un
 * descuido: mejor guardarlas que prometerles algo que no existe.
 */
export function groupsForLocale(
  locale: SubscribeInput["locale"],
  env: { general?: string; magnetEs?: string; magnetEn?: string },
): string[] {
  const magnet = locale === "en" ? env.magnetEn : locale === "es" ? env.magnetEs : undefined;
  return [env.general, magnet].filter((g): g is string => Boolean(g));
}
