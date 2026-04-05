"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateTotals,
  getProfitRange,
  groupByProductProfit,
  type ProductProfitRow,
  type ProfitPeriod,
  type ProfitTotals,
  type SaleProfitRow,
} from "@/lib/ganancias";

export function useGananciasData(period: ProfitPeriod) {
  const [sales, setSales] = useState<SaleProfitRow[]>([]);
  const [rangeLabel, setRangeLabel] = useState("");

  useEffect(() => {
    async function loadSales() {
      const supabase = createClient();
      const range = getProfitRange(period);
      setRangeLabel(range.label);

      let query = supabase
        .from("ventas")
        .select("id, fecha, cantidad, precio_unitario, total, productos(nombre, precio_compra)")
        .order("fecha", { ascending: false });

      if (range.from) query = query.gte("fecha", range.from);
      if (range.to) query = query.lt("fecha", range.to);

      const { data } = await query;
      setSales((data as SaleProfitRow[]) ?? []);
    }

    loadSales();
  }, [period]);

  const totals: ProfitTotals = useMemo(() => calculateTotals(sales), [sales]);
  const byProduct: ProductProfitRow[] = useMemo(() => groupByProductProfit(sales), [sales]);

  return { sales, totals, byProduct, rangeLabel };
}
