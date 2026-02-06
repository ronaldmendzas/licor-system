"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import ProductCard from "@/components/products/product-card";
import ProductForm from "@/components/products/product-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { LoadingScreen } from "@/components/ui/loading";
import { Plus } from "lucide-react";
import type { Product, Category } from "@/types";

export default function ProductsPage() {
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categoria_id === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.categorias?.nombre?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, selectedCategory, search]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setModalOpen(true);
  }

  if (loading) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Productos</h1>
            <p className="text-sm text-zinc-500">{products.length} productos</p>
          </div>
          <Button onClick={openNew} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Buscar productos..." />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-violet-500/15 text-violet-400"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todos
          </button>
          {categories.map((c: Category) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === c.id
                  ? "bg-violet-500/15 text-violet-400"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => openEdit(p)} />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Producto" : "Nuevo Producto"}
      >
        <ProductForm
          product={editing}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </AppShell>
  );
}
