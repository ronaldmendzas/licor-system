"use client";

import { useMemo } from "react";
import { Package, DollarSign, AlertTriangle, XCircle } from "lucide-react";
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
      borderColor: "border-violet-500/20",
    },
    {
      label: "Valor inventario",
      value: formatBs(stats.totalValue),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Stock bajo",
      value: stats.lowStock.toString(),
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Sin stock",
      value: stats.outOfStock.toString(),
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-zinc-900/80 rounded-2xl p-4 border ${card.borderColor} hover:bg-zinc-900 transition-colors`}
        >
          <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="text-2xl font-bold tracking-tight">{card.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
