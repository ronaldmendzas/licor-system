"use client";

import { useState, useMemo } from "react";
import ShellApp from "@/components/layout/shell-app";
import { useAppStore } from "@/store/app-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, ChevronLeft, Tag, Package } from "lucide-react";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import Modal from "@/components/ui/modal";
import BarraBusqueda from "@/components/ui/barra-busqueda";
import TarjetaProducto from "@/components/productos/tarjeta-producto";
import FormularioProducto from "@/components/productos/formulario-producto";
import type { Producto } from "@/types";

export default function PaginaProductos() {
  const productos = useAppStore((s) => s.productos);
  const categorias = useAppStore((s) => s.categorias);
  const cargarProductos = useAppStore((s) => s.cargarProductos);
  const cargarCategorias = useAppStore((s) => s.cargarCategorias);

  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [cargandoCat, setCargandoCat] = useState(false);

  const categoriaSeleccionada = categorias.find((c) => c.id === categoriaActiva);

  const productosDeLaCategoria = useMemo(() => {
    if (!categoriaActiva) return [];
    return productos.filter(
      (p) => p.categoria_id === categoriaActiva && p.activo
    );
  }, [productos, categoriaActiva]);

  const productosBuscados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const termino = busqueda.toLowerCase();
    return productos.filter(
      (p) => p.activo && p.nombre.toLowerCase().includes(termino)
    );
  }, [productos, busqueda]);

  const conteosPorCategoria = useMemo(() => {
    const conteos = new Map<string, number>();
    for (const p of productos) {
      if (!p.activo) continue;
      const cat = p.categoria_id || "sin-categoria";
      conteos.set(cat, (conteos.get(cat) || 0) + 1);
    }
    return conteos;
  }, [productos]);

  function abrirCrearProducto() {
    setProductoEditando(null);
    setModalProducto(true);
  }

  function abrirEditar(producto: Producto) {
    setProductoEditando(producto);
    setModalProducto(true);
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

  async function crearCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    setCargandoCat(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("categorias")
      .insert({ nombre: nuevaCategoria.trim() });

    if (error) {
      toast.error("Error al crear categoria");
    } else {
      toast.success("Categoria creada");
      await cargarCategorias();
      setNuevaCategoria("");
      setModalCategoria(false);
    }
    setCargandoCat(false);
  }

  if (categoriaActiva && categoriaSeleccionada) {
    return (
      <ShellApp>
        <div className="pb-20 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCategoriaActiva(null)}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">
                {categoriaSeleccionada.nombre}
              </h1>
              <p className="text-xs text-neutral-500">
                {productosDeLaCategoria.length} producto{productosDeLaCategoria.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Boton onClick={abrirCrearProducto} icono={<Plus className="w-4 h-4" />}>
              Nuevo
            </Boton>
          </div>

          <div className="space-y-2">
            {productosDeLaCategoria.map((p) => (
              <TarjetaProducto
                key={p.id}
                producto={p}
                onEditar={abrirEditar}
                onEliminar={eliminarProducto}
              />
            ))}
          </div>

          {productosDeLaCategoria.length === 0 && (
            <div className="text-center py-16 text-neutral-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin productos en esta categoria</p>
              <p className="text-xs mt-1">Toca &ldquo;Nuevo&rdquo; para agregar uno</p>
            </div>
          )}

          {modalProducto && (
            <FormularioProducto
              abierto={modalProducto}
              onCerrar={() => setModalProducto(false)}
              producto={productoEditando}
              categoriaIdInicial={categoriaActiva}
            />
          )}
        </div>
      </ShellApp>
    );
  }

  return (
    <ShellApp>
      <div className="pb-20 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Productos</h1>
          <Boton
            onClick={() => setModalCategoria(true)}
            variante="secundario"
            icono={<Plus className="w-4 h-4" />}
          >
            Categoria
          </Boton>
        </div>

        <BarraBusqueda
          valor={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar producto en todas las categorias..."
        />

        {busqueda.trim() && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">
              {productosBuscados.length} resultado{productosBuscados.length !== 1 ? "s" : ""}
            </p>
            {productosBuscados.map((p) => (
              <TarjetaProducto
                key={p.id}
                producto={p}
                onEditar={abrirEditar}
                onEliminar={eliminarProducto}
              />
            ))}
            {productosBuscados.length === 0 && (
              <p className="text-center text-neutral-500 text-sm py-6">
                No se encontraron productos
              </p>
            )}
          </div>
        )}

        {!busqueda.trim() && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">
              Toca una categoria para ver y agregar productos
            </p>
            {categorias.map((c) => (
              <Tarjeta
                key={c.id}
                className="flex items-center justify-between cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => setCategoriaActiva(c.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <p className="text-[10px] text-neutral-500">
                      {conteosPorCategoria.get(c.id) || 0} productos
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-neutral-600 rotate-180" />
              </Tarjeta>
            ))}

            {categorias.length === 0 && (
              <div className="text-center py-16 text-neutral-500">
                <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay categorias aun</p>
                <p className="text-xs mt-1">Crea una para empezar a agregar productos</p>
              </div>
            )}
          </div>
        )}

        <Modal
          abierto={modalCategoria}
          onCerrar={() => setModalCategoria(false)}
          titulo="Nueva Categoria"
        >
          <form onSubmit={crearCategoria} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Nombre</label>
              <input
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Ej: Cervezas, Vodkas, Vinos..."
                required
              />
            </div>
            <Boton type="submit" cargando={cargandoCat} className="w-full">
              Crear categoria
            </Boton>
          </form>
        </Modal>

        {modalProducto && (
          <FormularioProducto
            abierto={modalProducto}
            onCerrar={() => setModalProducto(false)}
            producto={productoEditando}
          />
        )}
      </div>
    </ShellApp>
  );
}
