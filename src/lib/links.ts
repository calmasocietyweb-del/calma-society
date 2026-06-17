/**
 * Enlaces a negocios propios con parámetros UTM.
 *
 * Permite MEDIR en el panel del propio negocio (Menorca Bus / Shuttle Spain:
 * Google Analytics, plugin de reservas, etc.) qué tráfico de la revista acaba
 * en reserva, y desde qué página salió. En la revista, los clics ya se miden
 * con Umami (data-umami-event); el UTM cierra el círculo en el lado del negocio.
 */
import { SITE } from "../config/site";

/**
 * URL de Menorca Bus con UTM.
 * @param campaign  Colocación del enlace: "cta", "home", "footer"…
 * @param content   Origen opcional (p. ej. la ruta del artículo) para saber qué página convierte.
 */
export function menorcaBusUrl(campaign: string, content?: string): string {
  const u = new URL(SITE.partners.menorcaBus.url);
  u.searchParams.set("utm_source", "calmasociety");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", campaign);
  if (content) u.searchParams.set("utm_content", content.replace(/^\/|\/$/g, ""));
  return u.toString();
}
