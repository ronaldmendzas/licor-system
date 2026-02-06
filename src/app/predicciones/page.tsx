"use client";

import { useState, useEffect } from "react";
import ShellApp from "@/components/layout/shell-app";
import Tarjeta from "@/components/ui/tarjeta";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { formatearBs } from "@/lib/utils";
import {
  generarPrediccion,
  clasificarABC,
} from "@/lib/predicciones/motor-prediccion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

interface PrediccionUI {
  productoId: string;
  nombre: string;
  promediodiario: number;
  tendencia: "subiendo" | "estable" | "bajando";
  diasParaAgotarse: number | null;
  cantidadRecomendada: number;
  ventaEstimadaSemana: number;
  clasificacionABC: "A" | "B" | "C";
}

const ICONOS_TENDENCIA = {
  subiendo: <TrendingUp className="w-4 h-4 text-green-400" />,
  estable: <Minus className="w-4 h-4 text-yellow-400" />,
  bajando: <TrendingDown className="w-4 h-4 text-red-400" />,
};

const COLORES_ABC = {
  A: "text-green-400 bg-green-400/10",
  B: "text-yellow-400 bg-yellow-400/10",
  C: "text-neutral-400 bg-neutral-400/10",
};

export default function PaginaPredicciones() {
  const productos = useAppStore((s) => s.productos);
  const [predicciones, setPredicciones] = useState<PrediccionUI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "urgente" | "comprar">("todos");

  useEffect(() => {
    async function cargar() {
      if (productos.length === 0) return;
      setCargando(true);
      const supabase = createClient();
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);

      const { data: ventas } = await supabase
        .from("ventas")
        .select("producto_id, cantidad, total, fecha")
        .gte("fecha", hace30dias.toISOString());

      if (!ventas) {
        setCargando(false);
        return;
      }

      const ventasPorProducto = new Map<
        string,
        { fecha: string; cantidad: number; total: number }[]
      >();
      const totalesPorProducto = new Map<string, number>();

      for (const v of ventas) {
        const lista = ventasPorProducto.get(v.producto_id) || [];
        lista.push({ fecha: v.fecha, cantidad: v.cantidad, total: v.total });
        ventasPorProducto.set(v.producto_id, lista);
        totalesPorProducto.set(
          v.producto_id,
          (totalesPorProducto.get(v.producto_id) || 0) + v.total
        );
      }

      const abc = clasificarABC(
        productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          totalVentas: totalesPorProducto.get(p.id) || 0,
        }))
      );

      const resultado: PrediccionUI[] = productos
        .filter((p) => p.activo)
        .map((p) => {
          const ventasProducto = ventasPorProducto.get(p.id) || [];
          const pred = generarPrediccion(
            p.id,
            p.nombre,
            ventasProducto,
            p.stock_actual,
            p.stock_minimo
          );
          return {
            ...pred,
            clasificacionABC: abc.get(p.id) || "C",
          };
        })
        .sort((a, b) => {
          if (a.diasParaAgotarse === null) return 1;
          if (b.diasParaAgotarse === null) return -1;
          return a.diasParaAgotarse - b.diasParaAgotarse;
        });

      setPredicciones(resultado);
      setCargando(false);
    }
    cargar();
  }, [productos]);

  const urgentes = predicciones.filter(
    (p) => p.diasParaAgotarse !== null && p.diasParaAgotarse <= 7
  );
  const paraComprar = predicciones.filter((p) => p.cantidadRecomendada > 0);

  const prediccionesFiltradas =
    filtro === "urgente"
      ? urgentes
      : filtro === "comprar"
        ? paraComprar
        : predicciones;

  if (cargando) {
    return (
      <ShellApp>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-400 animate-pulse" />
            <p className="text-sm text-neutral-400">Calculando predicciones...</p>
          </div>
        </div>
      </ShellApp>
    );
  }

  return (
    <ShellApp>
      <div className="p-4 pb-24 space-y-4">
        <h1 className="text-xl font-bold">Predicciones</h1>

        <div className="grid grid-cols-3 gap-2">
          <Tarjeta className="text-center p-3">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-400" />
            <p className="text-lg font-bold">{urgentes.length}</p>
            <p className="text-[10px] text-neutral-500">Se agotan pronto</p>
          </Tarjeta>
          <Tarjeta className="text-center p-3">
            <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold">{paraComprar.length}</p>
            <p className="text-[10px] text-neutral-500">Necesitan compra</p>
          </Tarjeta>
          <Tarjeta className="text-center p-3">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <p className="text-lg font-bold">
              {predicciones.filter((p) => p.tendencia === "subiendo").length}
            </p>
            <p className="text-[10px] text-neutral-500">Tendencia alta</p>
          </Tarjeta>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["todos", "urgente", "comprar"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                filtro === f
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {f === "todos"
                ? `Todos (${predicciones.length})`
                : f === "urgente"
                  ? `Urgentes (${urgentes.length})`
                  : `Comprar (${paraComprar.length})`}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {prediccionesFiltradas.map((p) => (
            <Tarjeta key={p.productoId} className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium truncate">{p.nombre}</h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${COLORES_ABC[p.clasificacionABC]}`}
                    >
                      {p.clasificacionABC}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {ICONOS_TENDENCIA[p.tendencia]}
                    <span className="text-xs text-neutral-400 capitalize">
                      {p.tendencia}
                    </span>
                  </div>
                </div>
                {p.diasParaAgotarse !== null && p.diasParaAgotarse <= 7 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                    {p.diasParaAgotarse}d
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-neutral-500">Prom/dia</p>
                  <p className="text-sm font-medium">{p.promediodiario}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Est. semana</p>
                  <p className="text-sm font-medium">{p.ventaEstimadaSemana}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Comprar</p>
                  <p
                    className={`text-sm font-medium ${
                      p.cantidadRecomendada > 0 ? "text-yellow-400" : "text-neutral-500"
                    }`}
                  >
                    {p.cantidadRecomendada || "-"}
                  </p>
                </div>
              </div>
            </Tarjeta>
          ))}

          {prediccionesFiltradas.length === 0 && (
            <p className="text-center text-neutral-500 py-8 text-sm">
              No hay productos en esta categoria
            </p>
          )}
        </div>
      </div>
    </ShellApp>
  );
}
