import { create } from "zustand";
import type { Producto, Categoria, Proveedor, Prestamo, AlertaStock, NivelStock } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface AppState {
  productos: Producto[];
  categorias: Categoria[];
  proveedores: Proveedor[];
  prestamos: Prestamo[];
  cargando: boolean;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  cargarCategorias: () => Promise<void>;
  cargarProductos: () => Promise<void>;
  cargarProveedores: () => Promise<void>;
  cargarPrestamos: () => Promise<void>;
  cargarTodo: () => Promise<void>;
  obtenerAlertas: () => AlertaStock[];
}

function calcularNivelStock(producto: Producto): NivelStock {
  if (producto.stock_actual <= producto.stock_minimo) return "critico";
  const umbral = producto.stock_minimo * 1.2;
  if (producto.stock_actual <= umbral) return "bajo";
  return "normal";
}

export const useAppStore = create<AppState>((set, get) => ({
  productos: [],
  categorias: [],
  proveedores: [],
  prestamos: [],
  cargando: false,
  busqueda: "",

  setBusqueda: (busqueda) => set({ busqueda }),

  cargarCategorias: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .order("nombre");
    if (data) set({ categorias: data });
  },

  cargarProductos: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("productos")
      .select("*, categoria:categorias(*)")
      .eq("activo", true)
      .order("nombre");
    if (data) set({ productos: data });
  },

  cargarProveedores: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("proveedores")
      .select("*")
      .order("nombre");
    if (data) set({ proveedores: data });
  },

  cargarPrestamos: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("prestamos")
      .select("*, producto:productos(*)")
      .order("fecha_prestamo", { ascending: false });
    if (data) set({ prestamos: data });
  },

  cargarTodo: async () => {
    set({ cargando: true });
    const state = get();
    await Promise.all([
      state.cargarCategorias(),
      state.cargarProductos(),
      state.cargarProveedores(),
      state.cargarPrestamos(),
    ]);
    set({ cargando: false });
  },

  obtenerAlertas: () => {
    const { productos } = get();
    return productos
      .filter((p) => calcularNivelStock(p) !== "normal")
      .map((p) => ({
        producto: p,
        nivel: calcularNivelStock(p),
        porcentaje: p.stock_minimo > 0
          ? Math.round((p.stock_actual / p.stock_minimo) * 100)
          : 0,
      }))
      .sort((a, b) => a.porcentaje - b.porcentaje);
  },
}));
