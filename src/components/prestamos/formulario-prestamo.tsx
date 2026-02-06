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
  onRegistrado: () => void;
}

export default function FormularioPrestamo({ abierto, onCerrar, onRegistrado }: Props) {
  const productos = useAppStore((s) => s.productos);
  const cargarProductos = useAppStore((s) => s.cargarProductos);

  const [productoId, setProductoId] = useState("");
  const [persona, setPersona] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [garantia, setGarantia] = useState("");
  const [cargando, setCargando] = useState(false);

  const productoSeleccionado = productos.find((p) => p.id === productoId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cantidadNum = parseInt(cantidad);

    if (productoSeleccionado && cantidadNum > productoSeleccionado.stock_actual) {
      toast.error(`Solo hay ${productoSeleccionado.stock_actual} en stock`);
      return;
    }

    setCargando(true);
    const supabase = createClient();

    const { error } = await supabase.from("prestamos").insert({
      producto_id: productoId,
      persona,
      cantidad: cantidadNum,
      garantia_bs: parseFloat(garantia) || 0,
    });

    if (error) {
      toast.error("Error al registrar préstamo");
    } else {
      toast.success(`Préstamo registrado: ${cantidadNum}x ${productoSeleccionado?.nombre} → ${persona}`);
      await cargarProductos();
      onRegistrado();
    }
    setCargando(false);
    onCerrar();
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar Préstamo">
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
          <label className="block text-sm text-neutral-400 mb-1">Persona</label>
          <input
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Nombre de quien se lleva el producto"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Garantía (Bs)</label>
            <input
              type="number"
              step="0.01"
              value={garantia}
              onChange={(e) => setGarantia(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <Boton type="submit" cargando={cargando} className="w-full">
          Registrar préstamo
        </Boton>
      </form>
    </Modal>
  );
}
