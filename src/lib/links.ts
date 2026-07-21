/**
 * Enlaces a negocios propios con parámetros UTM.
 *
 * Permite MEDIR en el panel del propio negocio (Menorca Bus / Shuttle Spain:
 * Google Analytics, plugin de reservas, etc.) qué tráfico de la revista acaba
 * en reserva, y desde qué página salió. En la revista, los clics ya se miden
 * con Umami (data-umami-event); el UTM cierra el círculo en el lado del negocio.
 */
// Extensión .ts explícita: igual que planner/bookings, para que node --test
// pueda cargar este módulo (KAN-78 le puso test).
import { SITE } from "../config/site.ts";

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

/**
 * URL saliente a la web de un negocio de la isla (KAN-78): ficha de lugar,
 * mapa de copas, planificador. El colaborador ve «calmasociety / referral» en
 * SU propia analítica y verifica el tráfico que le enviamos sin fiarse de
 * nuestros números — el argumento de venta del directorio. En nuestro lado el
 * clic se mide con Umami (`click-salida-web` + dato `negocio`).
 * @param campaign  Superficie del enlace: "ficha" | "atardeceres" | "planificador"…
 */
export function partnerUrl(website: string, campaign: string): string {
  try {
    const u = new URL(website);
    u.searchParams.set("utm_source", "calmasociety");
    u.searchParams.set("utm_medium", "referral");
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    // Dato raro en la colección: mejor el enlace limpio que romper la build.
    return website;
  }
}
