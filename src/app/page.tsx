"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import SummaryCards from "@/components/dashboard/summary-cards";
import StockAlerts from "@/components/dashboard/stock-alerts";
import RecentActivity from "@/components/dashboard/recent-activity";
import { LoadingScreen } from "@/components/ui/loading";

export default function DashboardPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-500">Resumen del inventario</p>
        </div>
        <SummaryCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StockAlerts />
          <RecentActivity />
        </div>
      </div>
    </AppShell>
  );
}
