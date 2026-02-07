"use client";

import { useEffect, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { TrendingUp, AlertTriangle, ShoppingCart } from "lucide-react";

export default function PredictionsPage() {
  const products = useAppStore((s) => s.products);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const predictions = useMemo(() => {
    return products
      .filter((p) => p.stock_actual > 0 && p.stock_minimo > 0)
      .map((p) => {
        const ratio = p.stock_actual / p.stock_minimo;
        let daysEstimate: number;
        let risk: "high" | "medium" | "low";

        if (ratio <= 1) {
          daysEstimate = Math.round(ratio * 5);
          risk = "high";
        } else if (ratio <= 2) {
          daysEstimate = Math.round(ratio * 7);
          risk = "medium";
        } else {
          daysEstimate = Math.round(ratio * 10);
          risk = "low";
        }

        return { product: p, daysEstimate, risk };
      })
      .sort((a, b) => a.daysEstimate - b.daysEstimate)
      .slice(0, 15);
  }, [products]);

  const riskColors = {
    high: "text-red-400 bg-red-500/10",
    medium: "text-amber-400 bg-amber-500/10",
    low: "text-emerald-400 bg-emerald-500/10",
  };

  const riskLabels = { high: "Alto", medium: "Medio", low: "Bajo" };

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Predicciones</h1>
          <p className="text-sm text-zinc-500">Estimación de agotamiento de stock</p>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
          <p className="text-xs text-amber-400">
            Las predicciones son estimaciones basadas en niveles de stock actuales.
          </p>
        </div>

        {predictions.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Sin datos para predicciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.map(({ product, daysEstimate, risk }) => (
              <div
                key={product.id}
                className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50 flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${riskColors[risk].split(" ")[1]}`}>
                  {risk === "high" ? (
                    <AlertTriangle className={`w-4 h-4 ${riskColors[risk].split(" ")[0]}`} />
                  ) : (
                    <ShoppingCart className={`w-4 h-4 ${riskColors[risk].split(" ")[0]}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.nombre}</p>
                  <p className="text-xs text-zinc-500">
                    Stock: {product.stock_actual} / Mín: {product.stock_minimo}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${riskColors[risk].split(" ")[0]}`}>
                    ~{daysEstimate}d
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    Riesgo {riskLabels[risk]}
                  </p>
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
