import { formatBs } from "@/lib/utils";

interface Props {
  total: number;
  totalCost: number;
  unitProfit: number;
  totalProfit: number;
}

export default function SaleProfitBreakdown({ total, totalCost, unitProfit, totalProfit }: Props) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Total venta</span>
        <span className="font-bold text-emerald-400">{formatBs(total)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Costo total</span>
        <span className="text-zinc-300">{formatBs(totalCost)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Ganancia por unidad</span>
        <span className={unitProfit >= 0 ? "text-emerald-400" : "text-red-400"}>{formatBs(unitProfit)}</span>
      </div>
      <div className="flex items-center justify-between text-sm pt-1 border-t border-zinc-700/50">
        <span className="text-zinc-300 font-medium">Ganancia estimada</span>
        <span className={`font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {formatBs(totalProfit)}
        </span>
      </div>
    </div>
  );
}
