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
      className="w-full text-left bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 hover:bg-zinc-900/80 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{product.nombre}</p>
          <p className="text-xs text-zinc-500 truncate">
            {product.categorias?.nombre ?? "Sin categoría"}
          </p>
        </div>
        <StockBadge current={product.stock_actual} min={product.stock_minimo} />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
        <div>
          <p className="text-[10px] text-zinc-500">Compra</p>
          <p className="text-xs text-zinc-400">{formatBs(product.precio_compra)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500">Venta</p>
          <p className="text-xs font-semibold text-emerald-400">
            {formatBs(product.precio_venta)}
          </p>
        </div>
      </div>
    </button>
  );
}
