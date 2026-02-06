"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatBs, formatDate, getStartOfDay, getStartOfWeek, getStartOfMonth } from "@/lib/utils";
import { FileText, Download } from "lucide-react";

type Period = "today" | "week" | "month" | "all";

interface ReportData {
  totalSales: number;
  salesCount: number;
  totalArrivals: number;
  arrivalsCount: number;
  profit: number;
}

export default function ReportsPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<ReportData>({
    totalSales: 0,
    salesCount: 0,
    totalArrivals: 0,
    arrivalsCount: 0,
    profit: 0,
  });

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    async function loadReport() {
      const supabase = createClient();
      let from: string | null = null;

      if (period === "today") from = getStartOfDay().toISOString();
      else if (period === "week") from = getStartOfWeek().toISOString();
      else if (period === "month") from = getStartOfMonth().toISOString();

      let salesQuery = supabase.from("ventas").select("cantidad, precio_venta");
      let arrivalsQuery = supabase.from("llegadas").select("cantidad, precio_compra");

      if (from) {
        salesQuery = salesQuery.gte("created_at", from);
        arrivalsQuery = arrivalsQuery.gte("created_at", from);
      }

      const [{ data: sales }, { data: arrivals }] = await Promise.all([
        salesQuery,
        arrivalsQuery,
      ]);

      const totalSales = (sales ?? []).reduce(
        (sum, s: any) => sum + s.precio_venta * s.cantidad,
        0
      );
      const totalArrivals = (arrivals ?? []).reduce(
        (sum, a: any) => sum + a.precio_compra * a.cantidad,
        0
      );

      setData({
        totalSales,
        salesCount: sales?.length ?? 0,
        totalArrivals,
        arrivalsCount: arrivals?.length ?? 0,
        profit: totalSales - totalArrivals,
      });
    }
    loadReport();
  }, [period]);

  if (loading) return <LoadingScreen />;

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "all", label: "Todo" },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Reportes</h1>
            <p className="text-sm text-zinc-500">Resumen financiero</p>
          </div>
          <FileText className="w-5 h-5 text-zinc-600" />
        </div>

        <div className="flex gap-2">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-1">Ventas</p>
            <p className="text-lg font-bold text-emerald-400">{formatBs(data.totalSales)}</p>
            <p className="text-xs text-zinc-600 mt-1">{data.salesCount} transacciones</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-1">Compras</p>
            <p className="text-lg font-bold text-blue-400">{formatBs(data.totalArrivals)}</p>
            <p className="text-xs text-zinc-600 mt-1">{data.arrivalsCount} llegadas</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 mb-1">Ganancia neta</p>
          <p className={`text-2xl font-bold ${data.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatBs(data.profit)}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
