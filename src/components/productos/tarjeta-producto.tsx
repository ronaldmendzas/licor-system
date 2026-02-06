"use client";

import type { Producto } from "@/types";
import Tarjeta from "@/components/ui/tarjeta";
import IndicadorStock from "@/components/ui/indicador-stock";
import { formatearBs, calcularMargen } from "@/lib/utils";
import { Edit2, Trash2 } from "lucide-react";

interface Props {
  producto: Producto;
  onEditar: (producto: Producto) => void;
  onEliminar: (producto: Producto) => void;
}

export default function TarjetaProducto({ producto, onEditar, onEliminar }: Props) {
  const margen = calcularMargen(producto.precio_compra, producto.precio_venta);

  return (
    <Tarjeta>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{producto.nombre}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {producto.categoria?.nombre || "Sin categoría"}
          </p>
        </div>
        <IndicadorStock actual={producto.stock_actual} minimo={producto.stock_minimo} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800">
        <div className="flex gap-4 text-xs">
          <span className="text-neutral-500">
            Compra: <span className="text-neutral-300">{formatearBs(producto.precio_compra)}</span>
          </span>
          <span className="text-neutral-500">
            Venta: <span className="text-green-400">{formatearBs(producto.precio_venta)}</span>
          </span>
          <span className="text-neutral-500">
            Margen: <span className="text-purple-400">{margen}%</span>
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEditar(producto)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
          </button>
          <button
            onClick={() => onEliminar(producto)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </Tarjeta>
  );
}
