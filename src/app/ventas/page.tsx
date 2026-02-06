"use client";

import { useState, useEffect } from "react";
import ShellApp from "@/components/layout/shell-app";
import { createClient } from "@/lib/supabase/client";
import { formatearBs, formatearFechaHora, obtnerInicioDelDia, obtenerInicioSemana } from "@/lib/utils";
import { Plus, ShoppingCart } from "lucide-react";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import FormularioVenta from "@/components/ventas/formulario-venta";

interface VentaConProducto {
  id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  producto: { nombre: string } | null;
}

export default function PaginaVentas() {
  const [ventas, setVentas] = useState<VentaConProducto[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtro, setFiltro] = useState<"hoy" | "semana" | "todas">("hoy");

  async function cargarVentas() {
    const supabase = createClient();
    let query = supabase
      .from("ventas")
      .select("*, producto:productos(nombre)")
      .order("fecha", { ascending: false });

    if (filtro === "hoy") {
      query = query.gte("fecha", obtnerInicioDelDia());
    } else if (filtro === "semana") {
      query = query.gte("fecha", obtenerInicioSemana());
    } else {
      query = query.limit(50);
    }

    const { data } = await query;
    if (data) setVentas(data);
  }

  useEffect(() => {
    cargarVentas();
  }, [filtro]);

  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalProductos = ventas.reduce((sum, v) => sum + v.cantidad, 0);

  return (
    <ShellApp titulo="Ventas">
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Boton onClick={() => setModalAbierto(true)} icono={<Plus className="w-4 h-4" />}>
            Nueva venta
          </Boton>
        </div>

        <div className="flex gap-2">
          {(["hoy", "semana", "todas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtro === f
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {f === "hoy" ? "Hoy" : f === "semana" ? "Semana" : "Todas"}
            </button>
          ))}
        </div>

        <Tarjeta>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Total vendido</p>
              <p className="text-xl font-bold text-green-400">{formatearBs(totalVentas)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Productos</p>
              <p className="text-xl font-bold">{totalProductos}</p>
            </div>
          </div>
        </Tarjeta>

        <div className="space-y-2">
          {ventas.map((v) => (
            <Tarjeta key={v.id} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {v.cantidad}x {v.producto?.nombre || "Producto"}
                </p>
                <p className="text-xs text-neutral-500">{formatearFechaHora(v.fecha)}</p>
              </div>
              <p className="text-sm font-medium text-green-400">{formatearBs(v.total)}</p>
            </Tarjeta>
          ))}
        </div>

        {ventas.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">Sin ventas registradas</p>
          </div>
        )}

        <FormularioVenta
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          onRegistrada={cargarVentas}
        />
      </div>
    </ShellApp>
  );
}
