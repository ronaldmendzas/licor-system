import { formatBs } from "@/lib/utils";
import type { ProfitTotals } from "@/lib/ganancias";

interface Props {
  totals: ProfitTotals;
}

export default function ProfitSummaryCards({ totals }: Props) {
  return (
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
  );
}
