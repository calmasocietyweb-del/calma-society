/**
 * Composición del panel de socios (KAN-122): funciones PURAS que convierten las
 * filas de las 4 tablas en lo que se pinta (tarjetas de dinero, curva mensual,
 * avisos y tabla de socios). Sin red y sin D1: todo testeable.
 *
 * La regla de oro se aplica aquí: lo COBRADO sale solo de `cobros` con
 * cobrado=1 (atribuido al mes de fecha_cobro); el compromiso de los tratos y
 * la medición de Umami nunca lo engordan.
 */
import { mesAnterior } from "./money.ts";

export interface SocioRow {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  [k: string]: unknown;
}
export interface TratoRow {
  id: number;
  socio_id: string;
  modelo: string;
  estado: string;
  precio_anual_cents: number;
  inicio: string;
  fin: string;
  renovable: number;
  [k: string]: unknown;
}
export interface CobroRow {
  id: number;
  socio_id: string;
  fecha: string;
  importe_cents: number;
  facturado: number;
  cobrado: number;
  fecha_cobro: string;
  [k: string]: unknown;
}
export interface MedicionRow {
  socio_id: string;
  mes: string;
  visitas_ficha: number;
  clics_web: number;
  fuente: string;
}

/** El trato `activo` más reciente de un socio (por inicio y, si empatan, id). */
export function tratoVigente(tratos: TratoRow[], socioId: string): TratoRow | null {
  const activos = tratos
    .filter((t) => t.socio_id === socioId && t.estado === "activo")
    .sort((a, b) => (b.inicio || "").localeCompare(a.inicio || "") || b.id - a.id);
  return activos[0] ?? null;
}

export interface ResumenDinero {
  anyo: number;
  cobradoAnyoCents: number;
  facturadoSinCobrarCents: number;
  comprometidoAnualCents: number;
  mesPasado: string;
  clicsMesPasado: number;
  visitasMesPasado: number;
  nSocios: number;
  nTratoActivo: number;
}

export function resumenDinero(
  socios: SocioRow[],
  tratos: TratoRow[],
  cobros: CobroRow[],
  mediciones: MedicionRow[],
  hoy: Date,
): ResumenDinero {
  const anyo = hoy.getUTCFullYear();
  const mesPasado = mesAnterior(hoy);
  const cobradoAnyoCents = cobros
    .filter((c) => c.cobrado === 1 && c.fecha_cobro.startsWith(String(anyo)))
    .reduce((n, c) => n + c.importe_cents, 0);
  const facturadoSinCobrarCents = cobros
    .filter((c) => c.facturado === 1 && c.cobrado !== 1)
    .reduce((n, c) => n + c.importe_cents, 0);
  const conActivo = new Set(tratos.filter((t) => t.estado === "activo").map((t) => t.socio_id));
  const comprometidoAnualCents = [...conActivo].reduce(
    (n, id) => n + (tratoVigente(tratos, id)?.precio_anual_cents ?? 0),
    0,
  );
  const delMes = mediciones.filter((m) => m.mes === mesPasado);
  return {
    anyo,
    cobradoAnyoCents,
    facturadoSinCobrarCents,
    comprometidoAnualCents,
    mesPasado,
    clicsMesPasado: delMes.reduce((n, m) => n + m.clics_web, 0),
    visitasMesPasado: delMes.reduce((n, m) => n + m.visitas_ficha, 0),
    nSocios: socios.length,
    nTratoActivo: conActivo.size,
  };
}

/** Últimos N meses (ascendente, termina en el mes de `hoy`): € cobrado y clics. */
export function curvaMensual(
  cobros: CobroRow[],
  mediciones: MedicionRow[],
  hoy: Date,
  nMeses = 12,
): { mes: string; cobradoCents: number; clics: number }[] {
  const out: { mes: string; cobradoCents: number; clics: number }[] = [];
  const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  for (let i = 0; i < nMeses; i++) {
    const mes = d.toISOString().slice(0, 7);
    out.unshift({
      mes,
      cobradoCents: cobros
        .filter((c) => c.cobrado === 1 && c.fecha_cobro.startsWith(mes))
        .reduce((n, c) => n + c.importe_cents, 0),
      clics: mediciones.filter((m) => m.mes === mes).reduce((n, m) => n + m.clics_web, 0),
    });
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out;
}

const DIA_MS = 24 * 60 * 60 * 1000;
/** Días transcurridos desde una fecha "YYYY-MM-DD" hasta `hasta` (negativo = futuro). */
const dias = (desde: string, hasta: Date): number =>
  Math.floor((hasta.getTime() - new Date(`${desde}T00:00:00Z`).getTime()) / DIA_MS);

/** Renovaciones cercanas (tratos activos con fin a ≤60 días) y facturas viejas sin cobrar (>30 días). */
export function avisos(_socios: SocioRow[], tratos: TratoRow[], cobros: CobroRow[], hoy: Date) {
  const renovaciones = tratos
    .filter((t) => t.estado === "activo" && t.fin !== "" && -dias(t.fin, hoy) <= 60)
    .map((t) => ({ socio_id: t.socio_id, fin: t.fin, dias: -dias(t.fin, hoy) }))
    .sort((a, b) => a.dias - b.dias);
  const facturasSinCobrar = cobros
    .filter((c) => c.facturado === 1 && c.cobrado !== 1 && dias(c.fecha, hoy) > 30)
    .map((c) => ({ socio_id: c.socio_id, fecha: c.fecha, importe_cents: c.importe_cents, dias: dias(c.fecha, hoy) }));
  return { renovaciones, facturasSinCobrar };
}

export interface FilaSocio {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  modelo: string;
  precioAnualCents: number;
  cobradoAnyoCents: number;
  clicsMesPasado: number;
  visitasMesPasado: number;
}

/** Filas de la tabla de socios: trato activo primero, luego clics, luego nombre. */
export function filasSocios(
  socios: SocioRow[],
  tratos: TratoRow[],
  cobros: CobroRow[],
  mediciones: MedicionRow[],
  hoy: Date,
): FilaSocio[] {
  const anyo = String(hoy.getUTCFullYear());
  const mesPasado = mesAnterior(hoy);
  return socios
    .map((s) => {
      const t = tratoVigente(tratos, s.id);
      const m = mediciones.find((x) => x.socio_id === s.id && x.mes === mesPasado);
      return {
        id: s.id,
        nombre: s.nombre,
        tipo: s.tipo,
        estado: s.estado,
        modelo: t?.modelo ?? "",
        precioAnualCents: t?.precio_anual_cents ?? 0,
        cobradoAnyoCents: cobros
          .filter((c) => c.socio_id === s.id && c.cobrado === 1 && c.fecha_cobro.startsWith(anyo))
          .reduce((n, c) => n + c.importe_cents, 0),
        clicsMesPasado: m?.clics_web ?? 0,
        visitasMesPasado: m?.visitas_ficha ?? 0,
      };
    })
    .sort(
      (a, b) =>
        Number(b.modelo !== "") - Number(a.modelo !== "") ||
        b.clicsMesPasado - a.clicsMesPasado ||
        a.nombre.localeCompare(b.nombre),
    );
}
