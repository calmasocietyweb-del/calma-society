/**
 * Dinero y meses del registro de socios (KAN-122). Los importes viajan SIEMPRE
 * en céntimos (enteros): nunca coma flotante en dinero.
 */

/** "1.200,50" | "350" | "250 €" → céntimos. Inválido o negativo → null. */
export function parseEuros(input: string): number | null {
  const clean = input.trim().replace(/€/g, "").replace(/\s+/g, "");
  if (clean === "") return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(clean)) return null;
  const [entero, dec = ""] = clean.replace(/\./g, "").split(",");
  const cents = Number(entero) * 100 + Number((dec + "00").slice(0, 2));
  return Number.isSafeInteger(cents) ? cents : null;
}

/**
 * Céntimos → "1.234,50 €" (estilo es-ES); sin decimales si son ,00.
 * Separador de miles a mano (no toLocaleString): la regla CLDR española no
 * separa los números de 4 cifras y además varía entre el Windows local y el
 * CI de Linux — aquí queremos SIEMPRE el mismo formato.
 */
export function formatEuros(cents: number): string {
  const euros = Math.trunc(cents / 100);
  const dec = Math.abs(cents % 100);
  const signo = cents < 0 ? "-" : "";
  const miles = String(Math.abs(euros)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec === 0 ? `${signo}${miles} €` : `${signo}${miles},${String(dec).padStart(2, "0")} €`;
}

/** Mes anterior al de la fecha dada (UTC), como "YYYY-MM". */
export function mesAnterior(hoy: Date): string {
  const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

/** "YYYY-MM" → rango [startAt, endAt] en ms UTC (mes completo), o null si no es válido. */
export function mesRango(mes: string): { startAt: number; endAt: number } | null {
  const m = mes.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const startAt = Date.UTC(y, mo - 1, 1);
  const endAt = Date.UTC(y, mo, 1) - 1;
  return { startAt, endAt };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-07" → "jul 2026" (para la curva del panel). */
export function mesLabel(mes: string): string {
  const r = mesRango(mes);
  if (!r) return mes;
  return `${MESES[new Date(r.startAt).getUTCMonth()]} ${mes.slice(0, 4)}`;
}
