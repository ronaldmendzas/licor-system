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

export default function FormularioLlegada({ abierto, onCerrar, onRegistrada }: Props) {
  const productos = useAppStore((s) => s.productos);
  const proveedores = useAppStore((s) => s.proveedores);
  const cargarProductos = useAppStore((s) => s.cargarProductos);

  const [productoId, setProductoId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precioCompra, setPrecioCompra] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [cargando, setCargando] = useState(false);

  const productoSeleccionado = productos.find((p) => p.id === productoId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.from("llegadas").insert({
      producto_id: productoId,
      proveedor_id: proveedorId || null,
      cantidad: parseInt(cantidad),
      precio_compra: parseFloat(precioCompra) || productoSeleccionado?.precio_compra || 0,
      numero_factura: numeroFactura || null,
    });

    if (error) {
      toast.error("Error al registrar llegada");
    } else {
      toast.success(`Registrado: ${cantidad}x ${productoSeleccionado?.nombre}`);
      await cargarProductos();
      onRegistrada();
      resetearFormulario();
    }
    setCargando(false);
    onCerrar();
  }

  function resetearFormulario() {
    setProductoId("");
    setProveedorId("");
    setCantidad("1");
    setPrecioCompra("");
    setNumeroFactura("");
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar Llegada">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Producto</label>
          <select value={productoId} onChange={(e) => setProductoId(e.target.value)} required>
            <option value="">Seleccionar producto...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Proveedor</label>
          <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
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
            <label className="block text-sm text-neutral-400 mb-1">Precio compra (Bs)</label>
            <input
              type="number"
              step="0.01"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value)}
              placeholder={productoSeleccionado?.precio_compra?.toString() || "0.00"}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">N° Factura (opcional)</label>
          <input
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            placeholder="Ej: FAC-001"
          />
        </div>

        <Boton type="submit" cargando={cargando} className="w-full">
          Registrar llegada
        </Boton>
      </form>
    </Modal>
  );
}
