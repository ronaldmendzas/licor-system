"use client";

import { useState, useMemo } from "react";
import ShellApp from "@/components/layout/shell-app";
import { useAppStore } from "@/store/app-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Boton from "@/components/ui/boton";
import BarraBusqueda from "@/components/ui/barra-busqueda";
import TarjetaProducto from "@/components/productos/tarjeta-producto";
import FormularioProducto from "@/components/productos/formulario-producto";
import type { Producto } from "@/types";

export default function PaginaProductos() {
  const productos = useAppStore((s) => s.productos);
  const categorias = useAppStore((s) => s.categorias);
  const cargarProductos = useAppStore((s) => s.cargarProductos);

  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = !categoriaFiltro || p.categoria_id === categoriaFiltro;
      return coincideNombre && coincideCategoria;
    });
  }, [productos, busqueda, categoriaFiltro]);

  function abrirCrear() {
    setProductoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(producto: Producto) {
    setProductoEditando(producto);
    setModalAbierto(true);
  }

  async function eliminarProducto(producto: Producto) {
    const supabase = createClient();
    const { error } = await supabase
      .from("productos")
      .update({ activo: false })
      .eq("id", producto.id);

    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success(`${producto.nombre} eliminado`);
      await cargarProductos();
    }
  }

  return (
    <ShellApp titulo="Productos">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <BarraBusqueda
              valor={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar producto..."
            />
          </div>
          <Boton onClick={abrirCrear} icono={<Plus className="w-4 h-4" />}>
            Nuevo
          </Boton>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoriaFiltro("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !categoriaFiltro
                ? "bg-purple-600 text-white"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaFiltro(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoriaFiltro === c.id
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <p className="text-xs text-neutral-500">
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-2">
          {productosFiltrados.map((p) => (
            <TarjetaProducto
              key={p.id}
              producto={p}
              onEditar={abrirEditar}
              onEliminar={eliminarProducto}
            />
          ))}
        </div>

        {productosFiltrados.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}

        {modalAbierto && (
          <FormularioProducto
            abierto={modalAbierto}
            onCerrar={() => setModalAbierto(false)}
            producto={productoEditando}
          />
        )}
      </div>
    </ShellApp>
  );
}
