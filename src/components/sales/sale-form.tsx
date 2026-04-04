"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { formatBs } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types";

interface Props {
  onClose: () => void;
}

export default function SaleForm({ onClose }: Props) {
  const products = useAppStore((s) => s.products);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return products.filter((p) => p.stock_actual > 0);
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.stock_actual > 0 &&
        (p.nombre.toLowerCase().includes(q) ||
          p.categorias?.nombre?.toLowerCase().includes(q))
    );
  }, [products, search]);

  async function handleSubmit() {
    if (!selected) {
      toast.error("Selecciona un producto");
      return;
    }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    if (qty > selected.stock_actual) {
      toast.error("Stock insuficiente");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("ventas").insert({
      producto_id: selected.id,
      cantidad: qty,
      precio_unitario: selected.precio_venta,
      total: selected.precio_venta * qty,
    });

    if (error) {
      toast.error("Error al registrar venta");
    } else {
      toast.success(`Venta registrada: ${qty}x ${selected.nombre}`);
    }

    await loadProducts();
    setSaving(false);
    onClose();
  }

  const qty = parseInt(quantity) || 0;
  const total = selected ? selected.precio_venta * qty : 0;
  const totalCost = selected ? selected.precio_compra * qty : 0;
  const totalProfit = total - totalCost;
  const unitProfit = selected ? selected.precio_venta - selected.precio_compra : 0;

  return (
    <div className="space-y-4">
      {!selected ? (
        <>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar producto..."
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">
                No hay productos disponibles
              </p>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="w-full text-left p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.nombre}</p>
                    <p className="text-xs text-zinc-500">
                      Stock: {p.stock_actual}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">
                    {formatBs(p.precio_venta)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selected.nombre}</p>
                <p className="text-xs text-zinc-500">
                  Stock: {selected.stock_actual} · Venta: {formatBs(selected.precio_venta)} · Compra: {formatBs(selected.precio_compra)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-violet-400 hover:underline"
              >
                Cambiar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Cantidad</label>
            <input
              type="number"
              min="1"
              max={selected.stock_actual}
              title="Cantidad a vender"
              placeholder="Cantidad"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

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

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={saving} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="flex-1">
              {saving ? "Registrando..." : "Registrar Venta"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
