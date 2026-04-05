import { ArrowUp, Undo2 } from "lucide-react";
import { formatBs, formatDateTime } from "@/lib/utils";
import { getSaleProfit, type SaleRecord } from "@/lib/sales";

interface Props {
  sales: SaleRecord[];
  onAskCancel: (id: string) => void;
}

export default function SalesHistoryList({ sales, onAskCancel }: Props) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-16">
        <ArrowUp className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">No hay ventas registradas</p>
        <p className="text-zinc-600 text-xs mt-1">Las ventas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sales.map((sale) => {
        const profit = getSaleProfit(sale);

        return (
          <div
            key={sale.id}
            className="bg-zinc-900/80 rounded-xl p-3.5 border border-zinc-800/50 flex items-center gap-3 hover:bg-zinc-900 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{sale.productos?.nombre ?? "Producto"}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{sale.cantidad} uds · {formatDateTime(sale.fecha)}</p>
              <p className={`text-[11px] mt-0.5 ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                Ganancia: {formatBs(profit)}
              </p>
            </div>
            <p className="text-sm font-bold text-emerald-400 shrink-0">+{formatBs(sale.total)}</p>
            <button
              onClick={() => onAskCancel(sale.id)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
              title="Anular venta"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
