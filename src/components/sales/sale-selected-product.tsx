import { formatBs } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
  quantity: string;
  onQuantityChange: (value: string) => void;
  onChangeProduct: () => void;
}

export default function SaleSelectedProduct({ product, quantity, onQuantityChange, onChangeProduct }: Props) {
  return (
    <>
      <div className="bg-zinc-800/50 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{product.nombre}</p>
            <p className="text-xs text-zinc-500">
              Stock: {product.stock_actual} · Venta: {formatBs(product.precio_venta)} · Compra: {formatBs(product.precio_compra)}
            </p>
          </div>
          <button onClick={onChangeProduct} className="text-xs text-violet-400 hover:underline">
            Cambiar
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Cantidad</label>
        <input
          type="number"
          min="1"
          max={product.stock_actual}
          title="Cantidad a vender"
          placeholder="Cantidad"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
        />
      </div>
    </>
  );
}
