export interface Category {
  id: string;
  nombre: string;
  created_at: string;
}

export interface Product {
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
  categorias?: Category;
}

export interface Supplier {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  created_at: string;
}

export interface Arrival {
  id: string;
  producto_id: string;
  proveedor_id: string;
  cantidad: number;
  precio_compra: number;
  numero_factura: string | null;
  fecha: string;
  created_at: string;
  producto?: Product;
  proveedor?: Supplier;
}

export interface Sale {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  created_at: string;
  productos?: Product;
}

export interface Loan {
  id: string;
  producto_id: string;
  persona: string;
  cantidad: number;
  garantia_bs: number;
  estado: "pendiente" | "devuelto";
  fecha_prestamo: string;
  fecha_devolucion: string | null;
  created_at: string;
  productos?: Product;
}

export type StockLevel = "critical" | "low" | "normal";

export interface StockAlert {
  product: Product;
  level: StockLevel;
  percentage: number;
}

export interface DailySummary {
  totalSales: number;
  productsSold: number;
  totalRevenue: number;
  topProducts: { name: string; quantity: number }[];
}

export interface RecentMovement {
  id: string;
  type: "sale" | "arrival";
  productName: string;
  quantity: number;
  total: number;
  date: string;
}
