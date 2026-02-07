"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types";
import { useAppStore } from "@/store/app-store";
import { Modal } from "@/components/ui/modal";

export default function ConfigPage() {
  const loadCategories = useAppStore((s) => s.loadCategories);
  const categories = useAppStore((s) => s.categories);
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function addCategory() {
    if (!newCat.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("categorias").insert({ nombre: newCat.trim() });
    if (error) toast.error("Error al crear categoría");
    else {
      toast.success("Categoría creada");
      setNewCat("");
    }
    await loadCategories();
    setSaving(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) toast.error("No se puede eliminar (tiene productos asociados)");
    else toast.success("Categoría eliminada");
    await loadCategories();
  }

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all";

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-zinc-500">Gestión del sistema</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Categorías</h3>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">
              No hay categorías
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((c: Category) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-3 py-2.5"
                >
                  <span className="text-sm">{c.nombre}</span>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
          <h3 className="text-sm font-semibold mb-3">Información</h3>
          <div className="space-y-2 text-xs text-zinc-500">
            <p>Versión: 1.0.0</p>
            <p>Sistema: Licor System</p>
            <p>Base de datos: Supabase</p>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Categoría">
        <div className="space-y-4">
          <input
            className={inputClass}
            placeholder="Nombre de la categoría"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={addCategory} disabled={saving} className="flex-1">
              {saving ? "Creando..." : "Crear"}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
