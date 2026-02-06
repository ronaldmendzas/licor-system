"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Supplier } from "@/types";

interface Props {
  supplier?: Supplier | null;
  onClose: () => void;
}

export default function SupplierForm({ supplier, onClose }: Props) {
  const loadSuppliers = useAppStore((s) => s.loadSuppliers);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    notas: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        nombre: supplier.nombre,
        telefono: supplier.telefono ?? "",
        direccion: supplier.direccion ?? "",
        notas: supplier.notas ?? "",
      });
    }
  }, [supplier]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const data = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      direccion: form.direccion.trim() || null,
      notas: form.notas.trim() || null,
    };

    if (supplier) {
      const { error } = await supabase
        .from("proveedores")
        .update(data)
        .eq("id", supplier.id);
      if (error) toast.error("Error al actualizar");
      else toast.success("Proveedor actualizado");
    } else {
      const { error } = await supabase.from("proveedores").insert(data);
      if (error) toast.error("Error al crear proveedor");
      else toast.success("Proveedor creado");
    }

    await loadSuppliers();
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!supplier) return;
    if (!confirm("¿Eliminar este proveedor?")) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", supplier.id);
    if (error) toast.error("Error al eliminar");
    else toast.success("Proveedor eliminado");
    await loadSuppliers();
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
          placeholder="Nombre del proveedor"
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Teléfono</label>
        <input
          className={inputClass}
          placeholder="+591 ..."
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Dirección</label>
        <input
          className={inputClass}
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => set("direccion", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Notas</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          placeholder="Opcional"
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        {supplier && (
          <Button type="button" variant="danger" onClick={handleDelete} disabled={saving}>
            Eliminar
          </Button>
        )}
        <div className="flex-1" />
        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : supplier ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
