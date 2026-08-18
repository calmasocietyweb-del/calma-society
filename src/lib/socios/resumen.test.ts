// Tests de la composición del panel de socios (KAN-122): dinero, curva,
// avisos y filas. La regla de oro (cobros=verdad, medición=argumento) se
// verifica aquí: nada del compromiso ni de la medición engorda lo cobrado.
import test from "node:test";
import assert from "node:assert/strict";
import { tratoVigente, resumenDinero, curvaMensual, avisos, filasSocios } from "./resumen.ts";

const HOY = new Date(Date.UTC(2026, 7, 18)); // 18-ago-2026 → mes pasado = 2026-07
const socios: any[] = [
  { id: "torralbenc", nombre: "Torralbenc", tipo: "restaurante", estado: "socio" },
  { id: "smoix", nombre: "Smoix", tipo: "restaurante", estado: "pendiente" },
];
const tratos: any[] = [
  { id: 1, socio_id: "torralbenc", modelo: "trueque", estado: "terminado", precio_anual_cents: 0, inicio: "2026-07-01", fin: "", renovable: 0 },
  { id: 2, socio_id: "torralbenc", modelo: "cuota-directorio", estado: "activo", precio_anual_cents: 30000, inicio: "2026-08-01", fin: "2026-09-15", renovable: 1 },
];
const cobros: any[] = [
  { id: 1, socio_id: "torralbenc", fecha: "2026-08-05", importe_cents: 30000, facturado: 1, cobrado: 1, fecha_cobro: "2026-08-10" },
  { id: 2, socio_id: "torralbenc", fecha: "2026-06-01", importe_cents: 5000, facturado: 1, cobrado: 0, fecha_cobro: "" },
  { id: 3, socio_id: "smoix", fecha: "2025-12-20", importe_cents: 9900, facturado: 1, cobrado: 1, fecha_cobro: "2025-12-30" },
];
const mediciones: any[] = [
  { socio_id: "torralbenc", mes: "2026-07", visitas_ficha: 40, clics_web: 9, fuente: "umami-auto" },
  { socio_id: "smoix", mes: "2026-07", visitas_ficha: 10, clics_web: 2, fuente: "umami-auto" },
  { socio_id: "torralbenc", mes: "2026-06", visitas_ficha: 20, clics_web: 3, fuente: "umami-auto" },
];

test("tratoVigente elige el activo más reciente", () => {
  assert.equal(tratoVigente(tratos as any, "torralbenc")?.id, 2);
  assert.equal(tratoVigente(tratos as any, "smoix"), null);
});

test("resumenDinero: cobrado por fecha_cobro del año, facturado sin cobrar, compromiso y valor", () => {
  const r = resumenDinero(socios as any, tratos as any, cobros as any, mediciones as any, HOY);
  assert.equal(r.anyo, 2026);
  assert.equal(r.cobradoAnyoCents, 30000); // el de 2025 no cuenta
  assert.equal(r.facturadoSinCobrarCents, 5000);
  assert.equal(r.comprometidoAnualCents, 30000);
  assert.equal(r.mesPasado, "2026-07");
  assert.equal(r.clicsMesPasado, 11);
  assert.equal(r.visitasMesPasado, 50);
  assert.equal(r.nSocios, 2);
  assert.equal(r.nTratoActivo, 1);
});

test("curvaMensual: 12 meses ascendentes con cobros (por fecha_cobro) y clics", () => {
  const c = curvaMensual(cobros as any, mediciones as any, HOY, 12);
  assert.equal(c.length, 12);
  assert.equal(c.at(-1)?.mes, "2026-08");
  assert.equal(c.at(-1)?.cobradoCents, 30000);
  assert.equal(c.at(-2)?.mes, "2026-07");
  assert.equal(c.at(-2)?.clics, 11);
  assert.equal(c.at(-3)?.clics, 3); // 2026-06
});

test("avisos: renovación a ≤60 días y factura sin cobrar de >30", () => {
  const a = avisos(socios as any, tratos as any, cobros as any, HOY);
  assert.equal(a.renovaciones.length, 1);
  assert.equal(a.renovaciones[0].socio_id, "torralbenc");
  assert.equal(a.facturasSinCobrar.length, 1);
  assert.equal(a.facturasSinCobrar[0].importe_cents, 5000);
});

test("filasSocios: trato activo primero y datos compuestos", () => {
  const f = filasSocios(socios as any, tratos as any, cobros as any, mediciones as any, HOY);
  assert.equal(f[0].id, "torralbenc");
  assert.equal(f[0].modelo, "cuota-directorio");
  assert.equal(f[0].precioAnualCents, 30000);
  assert.equal(f[0].cobradoAnyoCents, 30000);
  assert.equal(f[0].clicsMesPasado, 9);
  assert.equal(f[1].id, "smoix");
  assert.equal(f[1].modelo, "");
});
