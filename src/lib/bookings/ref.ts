/** Localizador corto y legible por teléfono: CS-2026-XXXXXX (sin 0/O/1/I/L). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeBookingRef(date: Date, rand: () => number = Math.random): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  }
  return `CS-${date.getFullYear()}-${suffix}`;
}
