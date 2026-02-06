"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Tarjeta from "@/components/ui/tarjeta";
import { formatearFechaHora } from "@/lib/utils";
import type { MovimientoReciente } from "@/types";
import { ShoppingCart, Truck, Handshake } from "lucide-react";

const ICONOS = {
  venta: ShoppingCart,
  llegada: Truck,
  prestamo: Handshake,
};

const COLORES = {
  venta: "text-blue-400 bg-blue-500/10",
  llegada: "text-green-400 bg-green-500/10",
  prestamo: "text-yellow-400 bg-yellow-500/10",
};

export default function MovimientosRecientes() {
  const [movimientos, setMovimientos] = useState<MovimientoReciente[]>([]);

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();

      const [ventas, llegadas, prestamos] = await Promise.all([
        supabase
          .from("ventas")
          .select("*, producto:productos(nombre)")
          .order("fecha", { ascending: false })
          .limit(5),
        supabase
          .from("llegadas")
          .select("*, producto:productos(nombre)")
          .order("fecha", { ascending: false })
          .limit(5),
        supabase
          .from("prestamos")
          .select("*, producto:productos(nombre)")
          .order("fecha_prestamo", { ascending: false })
          .limit(3),
      ]);

      const todos: MovimientoReciente[] = [
        ...(ventas.data?.map((v) => ({
          tipo: "venta" as const,
          descripcion: `${v.cantidad}x ${v.producto?.nombre}`,
          fecha: v.fecha,
          cantidad: v.cantidad,
        })) || []),
        ...(llegadas.data?.map((l) => ({
          tipo: "llegada" as const,
          descripcion: `${l.cantidad}x ${l.producto?.nombre}`,
          fecha: l.fecha,
          cantidad: l.cantidad,
        })) || []),
        ...(prestamos.data?.map((p) => ({
          tipo: "prestamo" as const,
          descripcion: `${p.cantidad}x ${p.producto?.nombre} → ${p.persona}`,
          fecha: p.fecha_prestamo,
          cantidad: p.cantidad,
        })) || []),
      ];

      todos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setMovimientos(todos.slice(0, 8));
    }
    cargar();
  }, []);

  if (movimientos.length === 0) {
    return (
      <Tarjeta className="text-center">
        <p className="text-neutral-500 text-sm">Sin movimientos recientes</p>
      </Tarjeta>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm mb-2">Movimientos recientes</h3>
      {movimientos.map((m, i) => {
        const Icono = ICONOS[m.tipo];
        const color = COLORES[m.tipo];
        return (
          <Tarjeta key={`${m.tipo}-${i}`} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color.split(" ")[1]}`}>
              <Icono className={`w-4 h-4 ${color.split(" ")[0]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.descripcion}</p>
              <p className="text-xs text-neutral-500">{formatearFechaHora(m.fecha)}</p>
            </div>
          </Tarjeta>
        );
      })}
    </div>
  );
}
