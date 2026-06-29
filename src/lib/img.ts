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

/**
 * Variante AVIF del `srcset` (mismo esquema de anchos 480/960/1600). SOLO para
 * imágenes que tengan generadas sus `.avif` (hoy: el hero de la home,
 * `navegar-menorca`). AVIF pesa ~40 % menos que WebP → clave para el LCP en
 * móvil. Se sirve con `<picture>`: el navegador usa AVIF si lo soporta (~95 %) y
 * cae a WebP si no. La ruta de entrada es la `.webp` base (única fuente).
 */
export function avifSrcset(src?: string): string | undefined {
  if (!src || !src.endsWith(".webp")) return undefined;
  const base = src.slice(0, -".webp".length);
  return `${base}-480.avif 480w, ${base}-960.avif 960w, ${base}.avif 1600w`;
}
