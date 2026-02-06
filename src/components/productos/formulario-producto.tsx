"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import Modal from "@/components/ui/modal";
import Boton from "@/components/ui/boton";
import type { Producto } from "@/types";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  producto?: Producto | null;
  categoriaIdInicial?: string;
}

export default function FormularioProducto({ abierto, onCerrar, producto, categoriaIdInicial }: Props) {
  const categorias = useAppStore((s) => s.categorias);
  const cargarProductos = useAppStore((s) => s.cargarProductos);

  const [nombre, setNombre] = useState(producto?.nombre || "");
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id || categoriaIdInicial || "");
  const [precioCompra, setPrecioCompra] = useState(producto?.precio_compra?.toString() || "");
  const [precioVenta, setPrecioVenta] = useState(producto?.precio_venta?.toString() || "");
  const [stockActual, setStockActual] = useState(producto?.stock_actual?.toString() || "0");
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo?.toString() || "5");
  const [alias, setAlias] = useState(producto?.alias?.join(", ") || "");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);

    const supabase = createClient();
    const datos = {
      nombre,
      categoria_id: categoriaId || null,
      precio_compra: parseFloat(precioCompra) || 0,
      precio_venta: parseFloat(precioVenta) || 0,
      stock_actual: parseInt(stockActual) || 0,
      stock_minimo: parseInt(stockMinimo) || 5,
      alias: alias.split(",").map((a) => a.trim()).filter(Boolean),
    };

    if (producto) {
      const { error } = await supabase
        .from("productos")
        .update(datos)
        .eq("id", producto.id);
      if (error) {
        toast.error("Error al actualizar producto");
      } else {
        toast.success("Producto actualizado");
      }
    } else {
      const { error } = await supabase.from("productos").insert(datos);
      if (error) {
        toast.error("Error al crear producto");
      } else {
        toast.success("Producto creado");
      }
    }

    await cargarProductos();
    setCargando(false);
    onCerrar();
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={producto ? "Editar Producto" : "Nuevo Producto"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Cerveza Pilsen 620ml"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Categoría</label>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Seleccionar...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Precio compra (Bs)</label>
            <input
              type="number"
              step="0.01"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Precio venta (Bs)</label>
            <input
              type="number"
              step="0.01"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Stock actual</label>
            <input
              type="number"
              value={stockActual}
              onChange={(e) => setStockActual(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Stock mínimo</label>
            <input
              type="number"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">
            Alias (separados por coma)
          </label>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Pili, Pilse, Cerveza verde"
          />
        </div>

        <Boton type="submit" cargando={cargando} className="w-full">
          {producto ? "Guardar cambios" : "Crear producto"}
        </Boton>
      </form>
    </Modal>
  );
}
