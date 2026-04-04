"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/client";
import { formatBs, formatDateTime, getNightRange, getStartOfDay, getStartOfMonth, getStartOfWeek } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { BadgeDollarSign, MoonStar } from "lucide-react";

type Period = "today" | "night" | "week" | "month" | "all";

interface SaleRow {
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

interface ProductProfit {
  productName: string;
  quantity: number;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

export default function GananciasPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const [period, setPeriod] = useState<Period>("today");
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [rangeLabel, setRangeLabel] = useState("");

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    async function loadProfitData() {
      const supabase = createClient();
      let query = supabase
        .from("ventas")
        .select("id, fecha, cantidad, precio_unitario, total, productos(nombre, precio_compra)")
        .order("fecha", { ascending: false });

      if (period === "today") {
        const from = getStartOfDay();
        query = query.gte("fecha", from);
        setRangeLabel("Desde las 00:00 de hoy");
      } else if (period === "week") {
        const from = getStartOfWeek();
        query = query.gte("fecha", from);
        setRangeLabel("Semana actual");
      } else if (period === "month") {
        const from = getStartOfMonth();
        query = query.gte("fecha", from);
        setRangeLabel("Mes actual");
      } else if (period === "night") {
        const { from, to } = getNightRange();
        query = query.gte("fecha", from).lt("fecha", to);
        setRangeLabel("Turno noche (18:00 a 06:00)");
      } else {
        setRangeLabel("Historial completo");
      }

      const { data } = await query;
      setSales((data as SaleRow[]) ?? []);
    }

    loadProfitData();
  }, [period]);

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, s) => sum + s.total, 0);
    const cost = sales.reduce((sum, s) => sum + (s.productos?.precio_compra ?? 0) * s.cantidad, 0);
    const profit = revenue - cost;
    return { revenue, cost, profit };
  }, [sales]);

  const byProduct = useMemo<ProductProfit[]>(() => {
    const map = new Map<string, ProductProfit>();

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
  }, [sales]);

  const periods: Array<{ key: Period; label: string }> = [
    { key: "today", label: "Hoy" },
    { key: "night", label: "Noche" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "all", label: "Todo" },
  ];

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Ganancias</h1>
              <p className="text-sm text-zinc-500">Ganancia por venta, producto y turno</p>
            </div>
            <BadgeDollarSign className="w-5 h-5 text-zinc-600" />
          </div>

          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p.key
                    ? "bg-violet-500/15 text-violet-400"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="bg-zinc-900 rounded-2xl p-3 border border-zinc-800/50 flex items-center gap-2 text-xs text-zinc-400">
            <MoonStar className="w-4 h-4 text-violet-400" />
            {rangeLabel}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">Ventas</p>
              <p className="text-lg font-bold text-emerald-400">{formatBs(totals.revenue)}</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">Costo de productos</p>
              <p className="text-lg font-bold text-blue-400">{formatBs(totals.cost)}</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">Ganancia neta</p>
              <p className={`text-lg font-bold ${totals.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatBs(totals.profit)}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 space-y-3">
            <h2 className="text-sm font-semibold">Ganancia por producto</h2>
            {byProduct.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay ventas en este periodo.</p>
            ) : (
              <div className="space-y-2">
                {byProduct.map((item) => (
                  <div key={item.productName} className="bg-zinc-800/50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.quantity} uds · {item.salesCount} venta(s)
                        </p>
                      </div>
                      <p className={`text-sm font-bold shrink-0 ${item.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatBs(item.profit)}
                      </p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-500">
                      <p>Vendido: <span className="text-zinc-300">{formatBs(item.revenue)}</span></p>
                      <p>Costo: <span className="text-zinc-300">{formatBs(item.cost)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 space-y-3">
            <h2 className="text-sm font-semibold">Detalle por venta</h2>
            {sales.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay ventas en este periodo.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sales.map((sale) => {
                  const cost = (sale.productos?.precio_compra ?? 0) * sale.cantidad;
                  const profit = sale.total - cost;
                  return (
                    <div key={sale.id} className="bg-zinc-800/50 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{sale.productos?.nombre ?? "Producto"}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {sale.cantidad} uds · {formatDateTime(sale.fecha)}
                          </p>
                        </div>
                        <p className={`text-sm font-bold shrink-0 ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatBs(profit)}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-zinc-500">
                        <p>Venta: <span className="text-zinc-300">{formatBs(sale.total)}</span></p>
                        <p>Costo: <span className="text-zinc-300">{formatBs(cost)}</span></p>
                        <p>P. unit: <span className="text-zinc-300">{formatBs(sale.precio_unitario)}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
