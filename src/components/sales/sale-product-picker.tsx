import { formatBs } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (product: Product) => void;
}

export default function SaleProductPicker({ products, search, onSearchChange, onSelect }: Props) {
  return (
    <>
      <input
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
        value={search}
        placeholder="Buscar producto..."
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="max-h-64 overflow-y-auto space-y-2">
        {products.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-4">No hay productos disponibles</p>
        )}
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full text-left p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.nombre}</p>
                <p className="text-xs text-zinc-500">Stock: {p.stock_actual}</p>
              </div>
              <p className="text-sm font-semibold text-emerald-400">{formatBs(p.precio_venta)}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
