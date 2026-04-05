"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import type { Product } from "@/types";
import { toast } from "sonner";

export function useSaleForm(onClose: () => void) {
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
        (p.nombre.toLowerCase().includes(q) || p.categorias?.nombre?.toLowerCase().includes(q))
    );
  }, [products, search]);

  const qty = parseInt(quantity) || 0;
  const total = selected ? selected.precio_venta * qty : 0;
  const totalCost = selected ? selected.precio_compra * qty : 0;
  const totalProfit = total - totalCost;
  const unitProfit = selected ? selected.precio_venta - selected.precio_compra : 0;

  async function submitSale() {
    if (!selected) return toast.error("Selecciona un producto");
    if (!qty || qty <= 0) return toast.error("Cantidad inválida");
    if (qty > selected.stock_actual) return toast.error("Stock insuficiente");

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("ventas").insert({
      producto_id: selected.id,
      cantidad: qty,
      precio_unitario: selected.precio_venta,
      total: selected.precio_venta * qty,
    });

    if (error) toast.error("Error al registrar venta");
    else toast.success(`Venta registrada: ${qty}x ${selected.nombre}`);

    await loadProducts();
    setSaving(false);
    onClose();
  }

  return {
    search,
    selected,
    quantity,
    saving,
    filtered,
    total,
    totalCost,
    totalProfit,
    unitProfit,
    setSearch,
    setSelected,
    setQuantity,
    submitSale,
  };
}
