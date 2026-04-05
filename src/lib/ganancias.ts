import { getNightRange, getStartOfDay, getStartOfMonth, getStartOfWeek } from "@/lib/utils";

export type ProfitPeriod = "today" | "night" | "week" | "month" | "all";

export interface SaleProfitRow {
  id: string;
  fecha: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  productos: {
    nombre: string;
    precio_compra: number;
  } | null;
}

export interface ProductProfitRow {
  productName: string;
  quantity: number;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProfitTotals {
  revenue: number;
  cost: number;
  profit: number;
}

export function getProfitRange(period: ProfitPeriod): { from?: string; to?: string; label: string } {
  if (period === "today") return { from: getStartOfDay(), label: "Desde las 00:00 de hoy" };
  if (period === "week") return { from: getStartOfWeek(), label: "Semana actual" };
  if (period === "month") return { from: getStartOfMonth(), label: "Mes actual" };
  if (period === "night") {
    const { from, to } = getNightRange();
    return { from, to, label: "Turno noche (18:00 a 06:00)" };
  }
  return { label: "Historial completo" };
}

export function calculateTotals(sales: SaleProfitRow[]): ProfitTotals {
  const revenue = sales.reduce((sum, s) => sum + s.total, 0);
  const cost = sales.reduce((sum, s) => sum + (s.productos?.precio_compra ?? 0) * s.cantidad, 0);
  return { revenue, cost, profit: revenue - cost };
}

export function groupByProductProfit(sales: SaleProfitRow[]): ProductProfitRow[] {
  const map = new Map<string, ProductProfitRow>();

  for (const sale of sales) {
    const productName = sale.productos?.nombre ?? "Producto";
    const saleCost = (sale.productos?.precio_compra ?? 0) * sale.cantidad;
    const current = map.get(productName) ?? {
      productName,
      quantity: 0,
      salesCount: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };

    current.quantity += sale.cantidad;
    current.salesCount += 1;
    current.revenue += sale.total;
    current.cost += saleCost;
    current.profit = current.revenue - current.cost;
    map.set(productName, current);
  }

  return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
}
