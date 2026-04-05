import { formatBs, formatDateTime } from "@/lib/utils";
import type { SaleProfitRow } from "@/lib/ganancias";

interface Props {
  sales: SaleProfitRow[];
}

export default function ProfitSaleList({ sales }: Props) {
  return (
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
  );
}
