"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Product, Category } from "@/types";

interface Props {
  product?: Product | null;
  onClose: () => void;
}

const EMPTY = {
  nombre: "",
  categoria_id: "",
  precio_compra: "",
  precio_venta: "",
  stock_actual: "",
  stock_minimo: "",
};

export default function ProductForm({ product, onClose }: Props) {
  const categories = useAppStore((s) => s.categories);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (product) {
      setForm({
        nombre: product.nombre,
        categoria_id: product.categoria_id ?? "",
        precio_compra: product.precio_compra.toString(),
        precio_venta: product.precio_venta.toString(),
        stock_actual: product.stock_actual.toString(),
        stock_minimo: product.stock_minimo.toString(),
      });
    }
  }, [product]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.categoria_id || !form.precio_compra || !form.precio_venta) {
      toast.error("Completa los campos requeridos");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const data = {
      nombre: form.nombre.trim(),
      categoria_id: form.categoria_id,
      precio_compra: parseFloat(form.precio_compra),
      precio_venta: parseFloat(form.precio_venta),
      stock_actual: parseInt(form.stock_actual) || 0,
      stock_minimo: parseInt(form.stock_minimo) || 0,
    };

    if (product) {
      const { error } = await supabase
        .from("productos")
        .update(data)
        .eq("id", product.id);
      if (error) toast.error("Error al actualizar");
      else toast.success("Producto actualizado");
    } else {
      const { error } = await supabase.from("productos").insert(data);
      if (error) toast.error("Error al crear producto");
      else toast.success("Producto creado");
    }

    await loadProducts();
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm("¿Eliminar este producto?")) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", product.id);
    if (error) toast.error("Error al eliminar");
    else toast.success("Producto eliminado");
    await loadProducts();
    setSaving(false);
    onClose();
  }

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Nombre *</label>
        <input
          className={inputClass}
          placeholder="Ej: Singani Casa Real"
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Categoría *</label>
        <select
          className={inputClass}
          value={form.categoria_id}
          onChange={(e) => set("categoria_id", e.target.value)}
        >
          <option value="">Seleccionar</option>
          {categories.map((c: Category) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">P. Compra *</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            placeholder="0.00"
            value={form.precio_compra}
            onChange={(e) => set("precio_compra", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">P. Venta *</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            placeholder="0.00"
            value={form.precio_venta}
            onChange={(e) => set("precio_venta", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Stock actual</label>
          <input
            type="number"
            className={inputClass}
            placeholder="0"
            value={form.stock_actual}
            onChange={(e) => set("stock_actual", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Stock mínimo</label>
          <input
            type="number"
            className={inputClass}
            placeholder="0"
            value={form.stock_minimo}
            onChange={(e) => set("stock_minimo", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {product && (
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={saving}
          >
            Eliminar
          </Button>
        )}
        <div className="flex-1" />
        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : product ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
