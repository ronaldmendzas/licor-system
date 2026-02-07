"use client";

import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { formatBs, calcMargin } from "@/lib/utils";

export default function AnalysisPage() {
  const products = useAppStore((s) => s.products);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const analysis = useMemo(() => {
    const byCategory = new Map<string, { name: string; count: number; value: number }>();
    let highestMargin = { name: "", margin: 0 };
    let lowestMargin = { name: "", margin: 100 };

    products.forEach((p) => {
      const catName = p.categorias?.nombre ?? "Sin categoría";
      const catId = p.categoria_id ?? "none";
      const existing = byCategory.get(catId) ?? { name: catName, count: 0, value: 0 };
      existing.count += 1;
      existing.value += p.precio_venta * p.stock_actual;
      byCategory.set(catId, existing);

      const margin = calcMargin(p.precio_compra, p.precio_venta);
      if (margin > highestMargin.margin) highestMargin = { name: p.nombre, margin };
      if (margin < lowestMargin.margin && p.precio_compra > 0) lowestMargin = { name: p.nombre, margin };
    });

    const categoryStats = Array.from(byCategory.values()).sort((a, b) => b.value - a.value);

    return { categoryStats, highestMargin, lowestMargin };
  }, [products]);

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Análisis</h1>
          <p className="text-sm text-zinc-500">Métricas del inventario</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-500">Mayor margen</span>
            </div>
            <p className="text-sm font-medium truncate">{analysis.highestMargin.name || "—"}</p>
            <p className="text-lg font-bold text-emerald-400">
              {analysis.highestMargin.margin.toFixed(1)}%
            </p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-zinc-500">Menor margen</span>
            </div>
            <p className="text-sm font-medium truncate">{analysis.lowestMargin.name || "—"}</p>
            <p className="text-lg font-bold text-red-400">
              {analysis.lowestMargin.margin.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold">Valor por Categoría</h3>
          </div>
          {analysis.categoryStats.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {analysis.categoryStats.map((cat) => {
                const maxVal = analysis.categoryStats[0]?.value ?? 1;
                const pct = maxVal > 0 ? (cat.value / maxVal) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400">{cat.name}</span>
                      <span className="text-xs font-medium">{formatBs(cat.value)}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{cat.count} productos</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </>)}
    </AppShell>
  );
}
