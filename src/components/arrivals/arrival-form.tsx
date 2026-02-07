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

export default function ArrivalForm({ onClose }: Props) {
  const products = useAppStore((s) => s.products);
  const suppliers = useAppStore((s) => s.suppliers);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [cost, setCost] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.categorias?.nombre?.toLowerCase().includes(q)
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

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("llegadas").insert({
      producto_id: selected.id,
      cantidad: qty,
      precio_compra: parseFloat(cost) || selected.precio_compra,
      proveedor_id: supplierId || null,
    });

    if (error) {
      toast.error("Error al registrar llegada");
    } else {
      toast.success(`Llegada registrada: ${qty}x ${selected.nombre}`);
    }

    await loadProducts();
    setSaving(false);
    onClose();
  }

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all";

  return (
    <div className="space-y-4">
      {!selected ? (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">
                No hay productos
              </p>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelected(p);
                  setCost(p.precio_compra.toString());
                }}
                className="w-full text-left p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <p className="text-sm font-medium truncate">{p.nombre}</p>
                <p className="text-xs text-zinc-500">
                  Stock: {p.stock_actual} · Compra: {formatBs(p.precio_compra)}
                </p>
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
                <p className="text-xs text-zinc-500">Stock actual: {selected.stock_actual}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-violet-400 hover:underline"
              >
                Cambiar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Cantidad</label>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Costo unit.</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Proveedor</label>
            <select
              className={`${inputClass} appearance-none bg-[length:1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat`}
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")" }}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Sin proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={saving} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="flex-1">
              {saving ? "Registrando..." : "Registrar Llegada"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
