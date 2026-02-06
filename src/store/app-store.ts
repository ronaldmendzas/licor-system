import { create } from "zustand";
import type { Product, Category, Supplier, Loan, StockAlert, StockLevel } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface AppState {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  loans: Loan[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  loadCategories: () => Promise<void>;
  loadProducts: () => Promise<void>;
  loadSuppliers: () => Promise<void>;
  loadLoans: () => Promise<void>;
  loadAll: () => Promise<void>;
  getAlerts: () => StockAlert[];
}

function getStockLevel(product: Product): StockLevel {
  if (product.stock_actual <= product.stock_minimo) return "critical";
  if (product.stock_actual <= product.stock_minimo * 1.2) return "low";
  return "normal";
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  categories: [],
  suppliers: [],
  loans: [],
  loading: false,
  search: "",

  setSearch: (search) => set({ search }),

  loadCategories: async () => {
    const supabase = createClient();
    const { data } = await supabase.from("categorias").select("*").order("nombre");
    if (data) set({ categories: data });
  },

  loadProducts: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("productos")
      .select("*, categorias(*)")
      .eq("activo", true)
      .order("nombre");
    if (data) set({ products: data });
  },

  loadSuppliers: async () => {
    const supabase = createClient();
    const { data } = await supabase.from("proveedores").select("*").order("nombre");
    if (data) set({ suppliers: data });
  },

  loadLoans: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("prestamos")
      .select("*, productos(*)")
      .order("fecha_prestamo", { ascending: false });
    if (data) set({ loans: data });
  },

  loadAll: async () => {
    set({ loading: true });
    const state = get();
    await Promise.all([
      state.loadCategories(),
      state.loadProducts(),
      state.loadSuppliers(),
      state.loadLoans(),
    ]);
    set({ loading: false });
  },

  getAlerts: () => {
    const { products } = get();
    return products
      .filter((p) => getStockLevel(p) !== "normal")
      .map((p) => ({
        product: p,
        level: getStockLevel(p),
        percentage: p.stock_minimo > 0
          ? Math.round((p.stock_actual / p.stock_minimo) * 100)
          : 0,
      }))
      .sort((a, b) => a.percentage - b.percentage);
  },
}));
