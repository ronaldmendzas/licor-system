export interface SaleRecord {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  productos: { nombre: string; precio_compra: number } | null;
}

export function getSaleProfit(sale: SaleRecord): number {
  const cost = (sale.productos?.precio_compra ?? 0) * sale.cantidad;
  return sale.total - cost;
}
