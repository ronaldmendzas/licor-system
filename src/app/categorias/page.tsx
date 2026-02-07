"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/products/product-card";
import ProductForm from "@/components/products/product-form";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  Trash2,
  Edit3,
  FolderOpen,
  Package,
  Check,
  X,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, Product } from "@/types";
import { useAppStore } from "@/store/app-store";

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

  // Category detail view
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
    // Update active category name if it's the one being edited
    if (activeCategory?.id === id) {
      setActiveCategory((prev) => prev ? { ...prev, nombre: editName.trim() } : null);
    }
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
    if (activeCategory?.id === id) setActiveCategory(null);
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

  // Products for the active category
  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];
    return products.filter((p) => p.categoria_id === activeCategory.id);
  }, [products, activeCategory]);

  function openNewProduct() {
    setEditingProduct(null);
    setProductModalOpen(true);
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductModalOpen(true);
  }

  function handleProductClose() {
    setProductModalOpen(false);
    setEditingProduct(null);
    loadProducts();
  }

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all";

  // ─── Category Detail View ───
  if (activeCategory) {
    return (
      <AppShell>
        <div className="space-y-4">
          {/* Header with back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveCategory(null)}
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold flex items-center gap-2 truncate">
                <FolderOpen className="w-5 h-5 text-pink-400 shrink-0" />
                {activeCategory.nombre}
              </h1>
              <p className="text-xs text-zinc-500">
                {categoryProducts.length} producto{categoryProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button size="sm" onClick={openNewProduct}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          {/* Products grid */}
          {categoryProducts.length === 0 ? (
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800/50 text-center">
              <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 mb-1">Sin productos en esta categoría</p>
              <p className="text-xs text-zinc-600 mb-4">
                Agregá productos directamente aquí
              </p>
              <Button size="sm" onClick={openNewProduct}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar primer producto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryProducts.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => openEditProduct(p)} />
              ))}
            </div>
          )}
        </div>

        {/* Product form modal pre-filled with this category */}
        <Modal
          open={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          title={editingProduct ? "Editar Producto" : `Nuevo Producto en ${activeCategory.nombre}`}
        >
          <ProductForm
            product={editingProduct}
            defaultCategoryId={activeCategory.id}
            onClose={handleProductClose}
          />
        </Modal>
      </AppShell>
    );
  }

  // ─── Category List View ───
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
                  className="bg-zinc-900 rounded-2xl border border-zinc-800/50 px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-900/80 transition-colors"
                >
                  {/* Clickable left area to enter the category */}
                  <div
                    role="button"
                    tabIndex={isEditing ? -1 : 0}
                    onClick={() => !isEditing && setActiveCategory(c)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !isEditing) setActiveCategory(c); }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    aria-label={`Ver productos de ${c.nombre}`}
                  >
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
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.nombre}</p>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {count} producto{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                    {!isEditing && (
                      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(c.id);
                            setEditName(c.nombre);
                          }}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(c.id, c.nombre);
                          }}
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
            💡 <strong>Tip:</strong> Tocá una categoría para ver sus productos y agregar nuevos directamente.
            También podés usar voz: <span className="text-violet-300">&quot;Crear producto Paceña en categoría Cervezas a 15 bs&quot;</span>
          </p>
        </div>
      </div>

      {/* New Category Modal */}
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
