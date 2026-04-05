"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { BadgeDollarSign, MoonStar } from "lucide-react";
import ProfitPeriodTabs from "@/components/ganancias/profit-period-tabs";
import ProfitSummaryCards from "@/components/ganancias/profit-summary-cards";
import ProfitByProductList from "@/components/ganancias/profit-by-product-list";
import ProfitSaleList from "@/components/ganancias/profit-sale-list";
import { useGananciasData } from "@/hooks/use-ganancias-data";
import type { ProfitPeriod } from "@/lib/ganancias";

export default function GananciasPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const [period, setPeriod] = useState<ProfitPeriod>("today");
  const { sales, totals, byProduct, rangeLabel } = useGananciasData(period);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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

          <ProfitPeriodTabs period={period} onChange={setPeriod} />

          <div className="bg-zinc-900 rounded-2xl p-3 border border-zinc-800/50 flex items-center gap-2 text-xs text-zinc-400">
            <MoonStar className="w-4 h-4 text-violet-400" />
            {rangeLabel}
          </div>

          <ProfitSummaryCards totals={totals} />
          <ProfitByProductList rows={byProduct} />
          <ProfitSaleList sales={sales} />
        </div>
      )}
    </AppShell>
  );
}
