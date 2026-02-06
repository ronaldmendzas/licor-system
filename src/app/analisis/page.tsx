"use client";

import { useState, useEffect } from "react";
import ShellApp from "@/components/layout/shell-app";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { formatearBs } from "@/lib/utils";
import Tarjeta from "@/components/ui/tarjeta";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Award, DollarSign } from "lucide-react";

interface VentaAgrupada {
  nombre: string;
  cantidad: number;
  total: number;
}

const COLORES = ["#8b5cf6", "#3b82f6", "#22c55e", "#eab308", "#ef4444", "#ec4899"];

export default function PaginaAnalisis() {
  const productos = useAppStore((s) => s.productos);
  const [ventasPorProducto, setVentasPorProducto] = useState<VentaAgrupada[]>([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState<{ nombre: string; total: number }[]>([]);
  const [periodo, setPeriodo] = useState<"semana" | "mes">("semana");

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const desde = new Date();
      if (periodo === "semana") desde.setDate(desde.getDate() - 7);
      else desde.setMonth(desde.getMonth() - 1);

      const { data: ventas } = await supabase
        .from("ventas")
        .select("cantidad, total, producto:productos(nombre, categoria:categorias(nombre))")
        .gte("fecha", desde.toISOString());

      if (!ventas) return;

      const porProducto = new Map<string, VentaAgrupada>();
      const porCategoria = new Map<string, number>();

      for (const v of ventas) {
        const producto = v.producto as unknown as { nombre: string; categoria: { nombre: string } | null } | null;
        const nombre = producto?.nombre || "Desconocido";
        const cat = producto?.categoria?.nombre || "Otros";

        const existing = porProducto.get(nombre) || { nombre, cantidad: 0, total: 0 };
        existing.cantidad += v.cantidad;
        existing.total += v.total;
        porProducto.set(nombre, existing);

        porCategoria.set(cat, (porCategoria.get(cat) || 0) + v.total);
      }

      setVentasPorProducto(
        Array.from(porProducto.values())
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5)
      );

      setVentasPorCategoria(
        Array.from(porCategoria.entries())
          .map(([nombre, total]) => ({ nombre, total }))
          .sort((a, b) => b.total - a.total)
      );
    }
    cargar();
  }, [periodo]);

  const valorInventario = productos.reduce(
    (sum, p) => sum + p.precio_compra * p.stock_actual,
    0
  );
  const valorVentaPotencial = productos.reduce(
    (sum, p) => sum + p.precio_venta * p.stock_actual,
    0
  );
  const gananciaPotencial = valorVentaPotencial - valorInventario;

  return (
    <ShellApp titulo="Análisis">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(["semana", "mes"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                periodo === p ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {p === "semana" ? "Esta semana" : "Este mes"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Tarjeta>
            <DollarSign className="w-4 h-4 text-blue-400 mb-1" />
            <p className="text-[10px] text-neutral-500">Inversión</p>
            <p className="text-sm font-bold">{formatearBs(valorInventario)}</p>
          </Tarjeta>
          <Tarjeta>
            <TrendingUp className="w-4 h-4 text-green-400 mb-1" />
            <p className="text-[10px] text-neutral-500">Valor venta</p>
            <p className="text-sm font-bold">{formatearBs(valorVentaPotencial)}</p>
          </Tarjeta>
          <Tarjeta>
            <Award className="w-4 h-4 text-purple-400 mb-1" />
            <p className="text-[10px] text-neutral-500">Ganancia</p>
            <p className="text-sm font-bold text-green-400">{formatearBs(gananciaPotencial)}</p>
          </Tarjeta>
        </div>

        {ventasPorProducto.length > 0 && (
          <Tarjeta>
            <h3 className="text-sm font-semibold mb-3">Top productos vendidos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventasPorProducto} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={100}
                  tick={{ fontSize: 11, fill: "#a3a3a3" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Tarjeta>
        )}

        {ventasPorCategoria.length > 0 && (
          <Tarjeta>
            <h3 className="text-sm font-semibold mb-3">Ventas por categoría</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ventasPorCategoria}
                  dataKey="total"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name }) => name}
                >
                  {ventasPorCategoria.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => formatearBs(value as number)}
                />
              </PieChart>
            </ResponsiveContainer>
          </Tarjeta>
        )}

        {ventasPorProducto.length === 0 && (
          <Tarjeta className="text-center py-8">
            <p className="text-neutral-500 text-sm">No hay datos de ventas para este período</p>
          </Tarjeta>
        )}
      </div>
    </ShellApp>
  );
}
