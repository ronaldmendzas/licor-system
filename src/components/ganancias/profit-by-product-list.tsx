import { formatBs } from "@/lib/utils";
import type { ProductProfitRow } from "@/lib/ganancias";

interface Props {
  rows: ProductProfitRow[];
}

export default function ProfitByProductList({ rows }: Props) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 space-y-3">
      <h2 className="text-sm font-semibold">Ganancia por producto</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay ventas en este periodo.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((item) => (
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
  );
}
