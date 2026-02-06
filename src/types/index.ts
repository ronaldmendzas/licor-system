export interface Categoria {
  id: string;
  nombre: string;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  alias: string[];
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  categoria?: Categoria;
}

export interface Proveedor {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  created_at: string;
}

export interface Llegada {
  id: string;
  producto_id: string;
  proveedor_id: string;
  cantidad: number;
  precio_compra: number;
  numero_factura: string | null;
  fecha: string;
  created_at: string;
  producto?: Producto;
  proveedor?: Proveedor;
}

export interface Venta {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  created_at: string;
  producto?: Producto;
}

export interface Prestamo {
  id: string;
  producto_id: string;
  persona: string;
  cantidad: number;
  garantia_bs: number;
  estado: "pendiente" | "devuelto";
  fecha_prestamo: string;
  fecha_devolucion: string | null;
  created_at: string;
  producto?: Producto;
}

export type NivelStock = "critico" | "bajo" | "normal";

export interface AlertaStock {
  producto: Producto;
  nivel: NivelStock;
  porcentaje: number;
}

export interface ResumenDiario {
  total_ventas: number;
  cantidad_productos_vendidos: number;
  ingreso_total: number;
  productos_top: { nombre: string; cantidad: number }[];
}

export interface MovimientoReciente {
  tipo: "venta" | "llegada" | "prestamo";
  descripcion: string;
  fecha: string;
  cantidad: number;
}
