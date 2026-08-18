-- Esquema del registro de socios y dinero (KAN-122).
-- Copia ejecutable de src/lib/socios/sql.ts (fuente de verdad) para cargarla
-- con wrangler al encender: npx wrangler d1 execute calma-db --remote --file=db/socios-schema.sql
-- La API tambien crea las tablas sola en el primer uso (ensureSchema).

CREATE TABLE IF NOT EXISTS socios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'otro',
    zona TEXT NOT NULL DEFAULT '',
    web TEXT NOT NULL DEFAULT '',
    contacto TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    telefono TEXT NOT NULL DEFAULT '',
    relacion TEXT NOT NULL DEFAULT 'captacion-ficha',
    tanda TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'pendiente',
    dijo TEXT NOT NULL DEFAULT '',
    fecha_primer_email TEXT NOT NULL DEFAULT '',
    fecha_seguimiento TEXT NOT NULL DEFAULT '',
    proxima_accion TEXT NOT NULL DEFAULT '',
    slug_ficha TEXT NOT NULL DEFAULT '',
    url_ficha TEXT NOT NULL DEFAULT '',
    datos_ok INTEGER NOT NULL DEFAULT 0,
    fotos_ok INTEGER NOT NULL DEFAULT 0,
    enlace_ok INTEGER NOT NULL DEFAULT 0,
    notas TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL
  );

CREATE TABLE IF NOT EXISTS tratos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id TEXT NOT NULL REFERENCES socios(id),
    modelo TEXT NOT NULL DEFAULT 'trueque',
    estado TEXT NOT NULL DEFAULT 'propuesto',
    trato TEXT NOT NULL DEFAULT '',
    condiciones_aceptadas TEXT NOT NULL DEFAULT '',
    contraprestacion TEXT NOT NULL DEFAULT '',
    precio_anual_cents INTEGER NOT NULL DEFAULT 0,
    inicio TEXT NOT NULL DEFAULT '',
    fin TEXT NOT NULL DEFAULT '',
    renovable INTEGER NOT NULL DEFAULT 0,
    etiquetado TEXT NOT NULL DEFAULT 'editorial',
    notas TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL
  );

CREATE TABLE IF NOT EXISTS cobros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id TEXT NOT NULL REFERENCES socios(id),
    trato_id INTEGER,
    fecha TEXT NOT NULL,
    concepto TEXT NOT NULL,
    importe_cents INTEGER NOT NULL,
    facturado INTEGER NOT NULL DEFAULT 0,
    factura_ref TEXT NOT NULL DEFAULT '',
    cobrado INTEGER NOT NULL DEFAULT 0,
    fecha_cobro TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    creado_en TEXT NOT NULL
  );

CREATE TABLE IF NOT EXISTS medicion_mensual (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id TEXT NOT NULL,
    mes TEXT NOT NULL,
    visitas_ficha INTEGER NOT NULL DEFAULT 0,
    clics_web INTEGER NOT NULL DEFAULT 0,
    fuente TEXT NOT NULL DEFAULT 'umami-auto',
    calculado_en TEXT NOT NULL,
    UNIQUE (socio_id, mes)
  );
