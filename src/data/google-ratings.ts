/**
 * Valoraciones de Google (estrellas + nº de reseñas) de los locales de la noche.
 *
 * Recogidas A MANO en Google Maps el 2026-06-26 (verificación humana, una por
 * una; ver la nota fechada que se muestra en la herramienta). Son un dato de
 * referencia honesto y ATRIBUIDO —cambian con el tiempo—, no una afirmación
 * eterna; por eso van fechadas y separadas del contenido editorial. Refrescar
 * con el mismo método (Google Maps) y actualizar `GOOGLE_RATINGS_AS_OF`.
 *
 * Clave = `translationKey` de la ficha (lugares) para los locales con ficha, o
 * el `id` del punto en línea del mapa de la noche (NightlifeMap). Solo NEGOCIOS
 * (beach clubs, coctelerías, clubs): los miradores y calas naturales no llevan
 * valoración de "negocio".
 *
 * Único origen: cámbialas solo aquí. Lo usan NightlifeMap y PlaceLayout.
 */
export interface GoogleRating {
  /** Nota media (0-5). */
  score: number;
  /** Número de reseñas. */
  reviews: number;
}

/** Fecha de la última verificación manual en Google Maps (ISO). */
export const GOOGLE_RATINGS_AS_OF = "2026-06-26";

export const googleRatings: Record<string, GoogleRating> = {
  // ── Locales con ficha (clave = translationKey) ──
  "cova-den-xoroi": { score: 4.1, reviews: 16499 },
  "coral-menorca": { score: 4.5, reviews: 990 },
  "artrutx-sea-club": { score: 4.2, reviews: 3481 },
  "isabella-beach-club": { score: 3.8, reviews: 9196 },
  "purobeach-menorca": { score: 3.9, reviews: 176 },
  "vida-una": { score: 4.5, reviews: 428 },
  "contrabandu": { score: 4.5, reviews: 112 },
  "jigger": { score: 4.4, reviews: 192 },
  "bb-cocktail-bar": { score: 4.4, reviews: 874 },
  "jazzbah": { score: 4.5, reviews: 608 },
  "kopas-club": { score: 4.1, reviews: 1326 },
  "akelarre": { score: 4.5, reviews: 470 },

  // ── Puntos en línea del mapa de la noche (clave = id) ──
  // Beach clubs ya existentes
  "bambu-menorca": { score: 4.3, reviews: 2672 },
  "arena-beach": { score: 4.0, reviews: 766 },
  "cape-nao": { score: 4.6, reviews: 368 },
  // Beach clubs nuevos (jun 2026)
  "es-corb-mari": { score: 4.0, reviews: 1315 },
  "es-bruc": { score: 3.9, reviews: 4968 },
  "ivette-beach-club": { score: 4.0, reviews: 8679 },
  "hola-ola": { score: 4.4, reviews: 2655 },
  "chiringuito-aire": { score: 4.1, reviews: 792 },
  // Coctelerías nuevas
  "can-vermut": { score: 4.6, reviews: 642 },
  "sacardiu": { score: 4.5, reviews: 38 },
  "bar-es-cau": { score: 4.4, reviews: 511 },
};

/** Nota media formateada por idioma ("4,1" en ES; "4.1" en EN). */
export function fmtScore(score: number, locale: "es" | "en"): string {
  return score.toLocaleString(locale === "es" ? "es-ES" : "en-GB", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Nº de reseñas formateado por idioma ("16.499" en ES; "16,499" en EN). */
export function fmtReviews(reviews: number, locale: "es" | "en"): string {
  return reviews.toLocaleString(locale === "es" ? "es-ES" : "en-GB");
}
