"use client";

import { StockBadge } from "@/components/ui/stock-badge";
import { formatBs } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700/50 active:scale-[0.99] transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate group-hover:text-white transition-colors">{product.nombre}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {product.categorias?.nombre ?? "Sin categoría"}
          </p>
        </div>
        <StockBadge current={product.stock_actual} min={product.stock_minimo} />
      </div>
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-800/50">
        <div className="flex-1">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Compra</p>
          <p className="text-sm text-zinc-400 font-medium">{formatBs(product.precio_compra)}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Venta</p>
          <p className="text-sm font-bold text-emerald-400">
            {formatBs(product.precio_venta)}
          </p>
        </div>
      </div>
    </button>
  );
}
