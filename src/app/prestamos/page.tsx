"use client";

import { useState, useEffect } from "react";
import ShellApp from "@/components/layout/shell-app";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { formatearBs, formatearFecha } from "@/lib/utils";
import { Plus, Handshake, Check } from "lucide-react";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import FormularioPrestamo from "@/components/prestamos/formulario-prestamo";
import { toast } from "sonner";

interface PrestamoConProducto {
  id: string;
  persona: string;
  cantidad: number;
  garantia_bs: number;
  estado: "pendiente" | "devuelto";
  fecha_prestamo: string;
  producto: { nombre: string } | null;
}

export default function PaginaPrestamos() {
  const [prestamos, setPrestamos] = useState<PrestamoConProducto[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtro, setFiltro] = useState<"pendiente" | "devuelto" | "todos">("pendiente");
  const cargarProductos = useAppStore((s) => s.cargarProductos);

  async function cargarPrestamos() {
    const supabase = createClient();
    let query = supabase
      .from("prestamos")
      .select("*, producto:productos(nombre)")
      .order("fecha_prestamo", { ascending: false });

    if (filtro !== "todos") {
      query = query.eq("estado", filtro);
    }

    const { data } = await query;
    if (data) setPrestamos(data);
  }

  useEffect(() => {
    cargarPrestamos();
  }, [filtro]);

  async function marcarDevuelto(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("prestamos")
      .update({ estado: "devuelto", fecha_devolucion: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Error al marcar como devuelto");
    } else {
      toast.success("Préstamo marcado como devuelto");
      await cargarProductos();
      await cargarPrestamos();
    }
  }

  const totalGarantias = prestamos
    .filter((p) => p.estado === "pendiente")
    .reduce((sum, p) => sum + p.garantia_bs, 0);

  return (
    <ShellApp titulo="Préstamos">
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Boton onClick={() => setModalAbierto(true)} icono={<Plus className="w-4 h-4" />}>
            Nuevo préstamo
          </Boton>
        </div>

        <div className="flex gap-2">
          {(["pendiente", "devuelto", "todos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtro === f
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {f === "pendiente" ? "Pendientes" : f === "devuelto" ? "Devueltos" : "Todos"}
            </button>
          ))}
        </div>

        {totalGarantias > 0 && (
          <Tarjeta>
            <p className="text-xs text-neutral-500">Total garantías pendientes</p>
            <p className="text-xl font-bold text-yellow-400">{formatearBs(totalGarantias)}</p>
          </Tarjeta>
        )}

        <div className="space-y-2">
          {prestamos.map((p) => (
            <Tarjeta key={p.id} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                p.estado === "pendiente" ? "bg-yellow-500/10" : "bg-green-500/10"
              }`}>
                <Handshake className={`w-4 h-4 ${
                  p.estado === "pendiente" ? "text-yellow-400" : "text-green-400"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {p.cantidad}x {p.producto?.nombre} → {p.persona}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatearFecha(p.fecha_prestamo)} · Garantía: {formatearBs(p.garantia_bs)}
                </p>
              </div>
              {p.estado === "pendiente" && (
                <button
                  onClick={() => marcarDevuelto(p.id)}
                  className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  <Check className="w-4 h-4 text-green-400" />
                </button>
              )}
            </Tarjeta>
          ))}
        </div>

        {prestamos.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">Sin préstamos</p>
          </div>
        )}

        <FormularioPrestamo
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          onRegistrado={cargarPrestamos}
        />
      </div>
    </ShellApp>
  );
}
