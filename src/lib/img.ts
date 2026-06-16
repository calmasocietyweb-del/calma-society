/**
 * Imágenes responsivas. Las fotos de /uploads se generan en 3 anchos
 * (base 1600, -960 y -480) con scripts/optimize-photos.mjs. Este helper
 * construye el `srcset` para que el navegador elija el tamaño adecuado
 * (clave para el LCP en móvil).
 */
export function srcset(src?: string): string | undefined {
  if (!src || !src.endsWith(".webp")) return undefined;
  const base = src.slice(0, -".webp".length);
  return `${base}-480.webp 480w, ${base}-960.webp 960w, ${src} 1600w`;
}
