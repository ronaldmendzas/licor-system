"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { formatearBs, obtnerInicioDelDia } from "@/lib/utils";
import Tarjeta from "@/components/ui/tarjeta";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
} from "lucide-react";
import type { Venta } from "@/types";

interface EstadisticasHoy {
  ventasHoy: number;
  ingresoHoy: number;
  productosVendidosHoy: number;
}

export default function TarjetasResumen() {
  const productos = useAppStore((s) => s.productos);
  const alertas = useAppStore((s) => s.obtenerAlertas());
  const [stats, setStats] = useState<EstadisticasHoy>({
    ventasHoy: 0,
    ingresoHoy: 0,
    productosVendidosHoy: 0,
  });

  useEffect(() => {
    async function cargarVentasHoy() {
      const supabase = createClient();
      const inicio = obtnerInicioDelDia();
      const { data } = await supabase
        .from("ventas")
        .select("cantidad, total")
        .gte("fecha", inicio);

      if (data) {
        setStats({
          ventasHoy: data.length,
          ingresoHoy: data.reduce((sum, v) => sum + (v.total ?? 0), 0),
          productosVendidosHoy: data.reduce((sum, v) => sum + (v.cantidad ?? 0), 0),
        });
      }
    }
    cargarVentasHoy();
  }, []);

  const tarjetas = [
    {
      titulo: "Ventas hoy",
      valor: stats.ventasHoy.toString(),
      subtitulo: `${stats.productosVendidosHoy} productos`,
      icono: ShoppingCart,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      titulo: "Ingreso hoy",
      valor: formatearBs(stats.ingresoHoy),
      subtitulo: "Total facturado",
      icono: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      titulo: "Productos",
      valor: productos.length.toString(),
      subtitulo: "En inventario",
      icono: Package,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      titulo: "Alertas",
      valor: alertas.length.toString(),
      subtitulo: "Stock bajo",
      icono: AlertTriangle,
      color: alertas.length > 0 ? "text-red-400" : "text-green-400",
      bg: alertas.length > 0 ? "bg-red-500/10" : "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tarjetas.map((t) => (
        <Tarjeta key={t.titulo}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-neutral-500">{t.titulo}</span>
            <div className={`p-1.5 rounded-lg ${t.bg}`}>
              <t.icono className={`w-3.5 h-3.5 ${t.color}`} />
            </div>
          </div>
          <p className="text-xl font-bold">{t.valor}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{t.subtitulo}</p>
        </Tarjeta>
      ))}
    </div>
  );
}
