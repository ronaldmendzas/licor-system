"use client";

import { useAppStore } from "@/store/app-store";
import Tarjeta from "@/components/ui/tarjeta";
import IndicadorStock from "@/components/ui/indicador-stock";
import { AlertTriangle } from "lucide-react";

export default function AlertasStock() {
  const alertas = useAppStore((s) => s.obtenerAlertas());

  if (alertas.length === 0) {
    return (
      <Tarjeta className="text-center">
        <p className="text-green-400 text-sm">Todo el stock está saludable</p>
      </Tarjeta>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h3 className="font-semibold text-sm">Productos con stock bajo</h3>
      </div>
      {alertas.slice(0, 5).map(({ producto, nivel }) => (
        <Tarjeta key={producto.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{producto.nombre}</p>
            <p className="text-xs text-neutral-500">
              {producto.categoria?.nombre || "Sin categoría"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IndicadorStock actual={producto.stock_actual} minimo={producto.stock_minimo} />
            {nivel === "critico" && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
            )}
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}
