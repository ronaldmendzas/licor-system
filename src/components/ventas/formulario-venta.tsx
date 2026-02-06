"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import Modal from "@/components/ui/modal";
import Boton from "@/components/ui/boton";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onRegistrada: () => void;
}

export default function FormularioVenta({ abierto, onCerrar, onRegistrada }: Props) {
  const productos = useAppStore((s) => s.productos);
  const cargarProductos = useAppStore((s) => s.cargarProductos);

  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [cargando, setCargando] = useState(false);

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const total = productoSeleccionado
    ? productoSeleccionado.precio_venta * (parseInt(cantidad) || 0)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productoSeleccionado) return;

    const cantidadNum = parseInt(cantidad);
    if (cantidadNum > productoSeleccionado.stock_actual) {
      toast.error(`Solo hay ${productoSeleccionado.stock_actual} en stock`);
      return;
    }

    setCargando(true);
    const supabase = createClient();

    const { error } = await supabase.from("ventas").insert({
      producto_id: productoId,
      cantidad: cantidadNum,
      precio_unitario: productoSeleccionado.precio_venta,
      total,
    });

    if (error) {
      toast.error("Error al registrar venta");
    } else {
      toast.success(`Vendido: ${cantidadNum}x ${productoSeleccionado.nombre}`);
      await cargarProductos();
      onRegistrada();
      setProductoId("");
      setCantidad("1");
    }
    setCargando(false);
    onCerrar();
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar Venta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Producto</label>
          <select value={productoId} onChange={(e) => setProductoId(e.target.value)} required>
            <option value="">Seleccionar producto...</option>
            {productos
              .filter((p) => p.stock_actual > 0)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Stock: {p.stock_actual})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Cantidad</label>
          <input
            type="number"
            min="1"
            max={productoSeleccionado?.stock_actual || 999}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        {productoSeleccionado && (
          <div className="bg-neutral-800/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Precio unitario:</span>
              <span>Bs. {productoSeleccionado.precio_venta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>Total:</span>
              <span className="text-green-400">Bs. {total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Boton type="submit" cargando={cargando} className="w-full">
          Registrar venta
        </Boton>
      </form>
    </Modal>
  );
}
