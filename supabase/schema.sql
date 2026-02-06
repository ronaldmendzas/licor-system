-- =============================================
-- LICOR SYSTEM - Schema de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Categorías
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Productos
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  precio_compra DECIMAL(10,2) DEFAULT 0,
  precio_venta DECIMAL(10,2) DEFAULT 0,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  alias TEXT[] DEFAULT '{}',
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Proveedores
CREATE TABLE proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ventas
CREATE TABLE ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Llegadas (ingresos de mercancía)
CREATE TABLE llegadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  cantidad INTEGER NOT NULL,
  precio_compra DECIMAL(10,2) DEFAULT 0,
  numero_factura TEXT,
  fecha TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Préstamos
CREATE TABLE prestamos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  persona TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  garantia_bs DECIMAL(10,2) DEFAULT 0,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'devuelto')),
  fecha_prestamo TIMESTAMPTZ DEFAULT now(),
  fecha_devolucion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TRIGGERS: Actualizar stock automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION fn_venta_descontar_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET stock_actual = stock_actual - NEW.cantidad,
      updated_at = now()
  WHERE id = NEW.producto_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_venta_descontar_stock
AFTER INSERT ON ventas
FOR EACH ROW
EXECUTE FUNCTION fn_venta_descontar_stock();

CREATE OR REPLACE FUNCTION fn_llegada_sumar_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET stock_actual = stock_actual + NEW.cantidad,
      updated_at = now()
  WHERE id = NEW.producto_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_llegada_sumar_stock
AFTER INSERT ON llegadas
FOR EACH ROW
EXECUTE FUNCTION fn_llegada_sumar_stock();

CREATE OR REPLACE FUNCTION fn_prestamo_descontar_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'pendiente' AND (TG_OP = 'INSERT') THEN
    UPDATE productos
    SET stock_actual = stock_actual - NEW.cantidad,
        updated_at = now()
    WHERE id = NEW.producto_id;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.estado = 'pendiente' AND NEW.estado = 'devuelto' THEN
    UPDATE productos
    SET stock_actual = stock_actual + NEW.cantidad,
        updated_at = now()
    WHERE id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_prestamo_stock
AFTER INSERT OR UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION fn_prestamo_descontar_stock();

-- =============================================
-- INDICES
-- =============================================
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_producto ON ventas(producto_id);
CREATE INDEX idx_llegadas_fecha ON llegadas(fecha);
CREATE INDEX idx_llegadas_producto ON llegadas(producto_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);
CREATE INDEX idx_prestamos_fecha ON prestamos(fecha_prestamo);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE llegadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso completo categorias" ON categorias FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso completo productos" ON productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso completo proveedores" ON proveedores FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso completo ventas" ON ventas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso completo llegadas" ON llegadas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso completo prestamos" ON prestamos FOR ALL USING (auth.role() = 'authenticated');

-- Sin datos iniciales: el usuario creara categorias y productos manualmente
