"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { StockBadge } from "@/components/ui/stock-badge";
import type { StockAlert } from "@/types";

export default function StockAlerts() {
  const products = useAppStore((s) => s.products);

  const alerts: StockAlert[] = useMemo(() => {
    return products
      .filter((p) => p.stock_actual <= p.stock_minimo)
      .map((p) => ({
        product: p,
        level:
          p.stock_actual === 0
            ? ("critical" as const)
            : p.stock_actual <= p.stock_minimo * 0.5
            ? ("critical" as const)
            : ("low" as const),
        percentage: p.stock_minimo > 0 ? Math.round((p.stock_actual / p.stock_minimo) * 100) : 0,
      }))
      .sort((a, b) => a.product.stock_actual - b.product.stock_actual)
      .slice(0, 5);
  }, [products]);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Alertas de Stock</h3>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.product.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{alert.product.nombre}</p>
              <p className="text-xs text-zinc-500">
                Mín: {alert.product.stock_minimo}
              </p>
            </div>
            <StockBadge
              current={alert.product.stock_actual}
              min={alert.product.stock_minimo}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
