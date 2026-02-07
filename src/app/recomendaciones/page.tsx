"use client";

import { useEffect, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { ClipboardList, ShoppingCart, AlertTriangle } from "lucide-react";
import { formatBs } from "@/lib/utils";

export default function RecommendationsPage() {
  const products = useAppStore((s) => s.products);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const recommendations = useMemo(() => {
    return products
      .filter((p) => p.stock_actual <= p.stock_minimo)
      .map((p) => {
        const suggestedQty = Math.max(p.stock_minimo * 2 - p.stock_actual, 1);
        const estimatedCost = suggestedQty * p.precio_compra;
        return { product: p, suggestedQty, estimatedCost };
      })
      .sort((a, b) => a.product.stock_actual - b.product.stock_actual);
  }, [products]);

  const totalCost = useMemo(
    () => recommendations.reduce((sum, r) => sum + r.estimatedCost, 0),
    [recommendations]
  );

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Compras Sugeridas</h1>
          <p className="text-sm text-zinc-500">
            {recommendations.length} productos necesitan reposición
          </p>
        </div>

        {recommendations.length > 0 && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">Inversión estimada total</p>
            <p className="text-xl font-bold text-violet-400">{formatBs(totalCost)}</p>
          </div>
        )}

        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Todo el stock está bien</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map(({ product, suggestedQty, estimatedCost }) => (
              <div
                key={product.id}
                className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.nombre}</p>
                  <p className="text-xs text-zinc-500">
                    Stock: {product.stock_actual} / Mín: {product.stock_minimo}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">+{suggestedQty}</p>
                  <p className="text-[10px] text-zinc-500">{formatBs(estimatedCost)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>)}
    </AppShell>
  );
}
