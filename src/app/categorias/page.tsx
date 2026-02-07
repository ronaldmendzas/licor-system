"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit3, FolderOpen, Package, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types";
import { useAppStore } from "@/store/app-store";
import { Modal } from "@/components/ui/modal";

export default function CategoriasPage() {
  const loadCategories = useAppStore((s) => s.loadCategories);
  const categories = useAppStore((s) => s.categories);
  const products = useAppStore((s) => s.products);
  const loadProducts = useAppStore((s) => s.loadProducts);

  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  async function addCategory() {
    if (!newCat.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("categorias").insert({ nombre: newCat.trim() });
    if (error) toast.error("Error al crear categoría (puede que ya exista)");
    else {
      toast.success(`Categoría "${newCat.trim()}" creada`);
      setNewCat("");
      setModalOpen(false);
    }
    await loadCategories();
    setSaving(false);
  }

  async function updateCategory(id: string) {
    if (!editName.trim()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("categorias")
      .update({ nombre: editName.trim() })
      .eq("id", id);
    if (error) toast.error("Error al actualizar");
    else toast.success("Categoría actualizada");
    setEditingId(null);
    await loadCategories();
  }

  async function deleteCategory(id: string, nombre: string) {
    const count = products.filter((p: any) => p.categoria_id === id).length;
    if (count > 0) {
      toast.error(`No se puede eliminar "${nombre}" porque tiene ${count} producto(s) asociado(s)`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) toast.error("Error al eliminar la categoría");
    else toast.success(`Categoría "${nombre}" eliminada`);
    await loadCategories();
  }

  function getProductCount(catId: string): number {
    return products.filter((p: any) => p.categoria_id === catId).length;
  }

  const filtered = search
    ? categories.filter((c: Category) =>
        c.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all";

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-pink-400" />
              Categorías
            </h1>
            <p className="text-xs text-zinc-500">
              {categories.length} categoría{categories.length !== 1 ? "s" : ""} registrada{categories.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nueva
          </Button>
        </div>

        {/* Search */}
        {categories.length > 5 && (
          <input
            className={inputClass}
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        {/* List */}
        {categories.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800/50 text-center">
            <FolderOpen className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-1">No hay categorías</p>
            <p className="text-xs text-zinc-600 mb-4">
              Creá categorías para organizar tus productos
            </p>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Crear primera categoría
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c: Category) => {
              const count = getProductCount(c.id);
              const isEditing = editingId === c.id;

              return (
                <div
                  key={c.id}
                  className="bg-zinc-900 rounded-2xl border border-zinc-800/50 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-pink-400" />
                    </div>

                    {isEditing ? (
                      <input
                        className="bg-zinc-800 border border-violet-500/40 rounded-lg px-2 py-1 text-sm flex-1 focus:outline-none"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateCategory(c.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.nombre}</p>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {count} producto{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => updateCategory(c.id)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditName(c.nombre);
                          }}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(c.id, c.nombre)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {search && filtered.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">
                No se encontraron categorías con &quot;{search}&quot;
              </p>
            )}
          </div>
        )}

        {/* Tip */}
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3">
          <p className="text-xs text-violet-300/70">
            💡 <strong>Tip:</strong> También podés crear categorías por voz diciendo{" "}
            <span className="text-violet-300">&quot;Crear categoría Cerveza&quot;</span> o crear un producto con categoría:{" "}
            <span className="text-violet-300">&quot;Crear producto Paceña en categoría Cervezas a 15 bs&quot;</span>
          </p>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Categoría">
        <div className="space-y-4">
          <input
            className={inputClass}
            placeholder="Nombre de la categoría"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory();
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={addCategory} disabled={saving || !newCat.trim()} className="flex-1">
              {saving ? "Creando..." : "Crear Categoría"}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
