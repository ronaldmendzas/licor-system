import { create } from "zustand";
import type { Product, Category, Supplier, Loan, StockAlert, StockLevel } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface AppState {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  loans: Loan[];
  loading: boolean;
  lastLoadedAt: number;
  search: string;
  setSearch: (s: string) => void;
  loadCategories: () => Promise<void>;
  loadProducts: () => Promise<void>;
  loadSuppliers: () => Promise<void>;
  loadLoans: () => Promise<void>;
  loadAll: (options?: { force?: boolean }) => Promise<void>;
  getAlerts: () => StockAlert[];
}

const LOAD_TTL_MS = 45_000;

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
  lastLoadedAt: 0,
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

  loadAll: async (options) => {
    const force = options?.force ?? false;
    const state = get();

    if (state.loading) return;

    const hasCache =
      state.products.length > 0 ||
      state.categories.length > 0 ||
      state.suppliers.length > 0 ||
      state.loans.length > 0;

    const isFresh =
      state.lastLoadedAt > 0 && Date.now() - state.lastLoadedAt < LOAD_TTL_MS;

    if (!force && hasCache && isFresh) return;

    const shouldShowLoading = !hasCache;

    if (get().loading) return;
    if (shouldShowLoading) set({ loading: true });

    try {
      const current = get();
      await Promise.all([
        current.loadCategories(),
        current.loadProducts(),
        current.loadSuppliers(),
        current.loadLoans(),
      ]);
      set({ lastLoadedAt: Date.now() });
    } finally {
      if (shouldShowLoading) set({ loading: false });
    }
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
