"use client";

import { useMemo } from "react";
import { Package, ShoppingCart, Truck, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { formatBs } from "@/lib/utils";

export default function SummaryCards() {
  const products = useAppStore((s) => s.products);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (sum, p) => sum + p.precio_venta * p.stock_actual,
      0
    );
    const lowStock = products.filter(
      (p) => p.stock_actual <= p.stock_minimo && p.stock_actual > 0
    ).length;
    const outOfStock = products.filter((p) => p.stock_actual === 0).length;
    return { totalProducts, totalValue, lowStock, outOfStock };
  }, [products]);

  const cards = [
    {
      label: "Productos",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Valor inventario",
      value: formatBs(stats.totalValue),
      icon: ShoppingCart,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Stock bajo",
      value: stats.lowStock.toString(),
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Sin stock",
      value: stats.outOfStock.toString(),
      icon: Truck,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-500">{c.label}</span>
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
          </div>
          <p className="text-xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
