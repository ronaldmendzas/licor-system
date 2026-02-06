"use client";

import { useState, useEffect } from "react";
import ShellApp from "@/components/layout/shell-app";
import Tarjeta from "@/components/ui/tarjeta";
import Boton from "@/components/ui/boton";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { formatearBs } from "@/lib/utils";
import { ShoppingCart, Download, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Recomendacion {
  productoId: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  promedioDiario: number;
  cantidadSugerida: number;
  costoEstimado: number;
  proveedor: string | null;
  urgencia: "critico" | "bajo" | "preventivo";
}

export default function PaginaRecomendaciones() {
  const productos = useAppStore((s) => s.productos);
  const proveedores = useAppStore((s) => s.proveedores);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function cargar() {
      if (productos.length === 0) return;
      setCargando(true);
      const supabase = createClient();
      const hace30dias = new Date();
      hace30dias.setDate(hace30dias.getDate() - 30);

      const { data: ventas } = await supabase
        .from("ventas")
        .select("producto_id, cantidad")
        .gte("fecha", hace30dias.toISOString());

      const { data: llegadas } = await supabase
        .from("llegadas")
        .select("producto_id, proveedor_id")
        .order("fecha", { ascending: false });

      const proveedorPorProducto = new Map<string, string>();
      for (const ll of llegadas || []) {
        if (!proveedorPorProducto.has(ll.producto_id)) {
          proveedorPorProducto.set(ll.producto_id, ll.proveedor_id);
        }
      }

      const ventasPorProducto = new Map<string, number>();
      for (const v of ventas || []) {
        ventasPorProducto.set(
          v.producto_id,
          (ventasPorProducto.get(v.producto_id) || 0) + v.cantidad
        );
      }

      const recs: Recomendacion[] = productos
        .filter((p) => p.activo)
        .map((p) => {
          const totalVendido = ventasPorProducto.get(p.id) || 0;
          const promedioDiario = totalVendido / 30;
          const diasCobertura = 14;
          const necesario = Math.ceil(promedioDiario * diasCobertura);
          const cantidadSugerida = Math.max(
            necesario - p.stock_actual + p.stock_minimo,
            0
          );

          let urgencia: Recomendacion["urgencia"] = "preventivo";
          if (p.stock_actual <= p.stock_minimo * 0.5) urgencia = "critico";
          else if (p.stock_actual <= p.stock_minimo) urgencia = "bajo";

          const provId = proveedorPorProducto.get(p.id);
          const provNombre = provId
            ? proveedores.find((pr) => pr.id === provId)?.nombre || null
            : null;

          return {
            productoId: p.id,
            nombre: p.nombre,
            stockActual: p.stock_actual,
            stockMinimo: p.stock_minimo,
            promedioDiario: Math.round(promedioDiario * 100) / 100,
            cantidadSugerida,
            costoEstimado: cantidadSugerida * p.precio_compra,
            proveedor: provNombre,
            urgencia,
          };
        })
        .filter((r) => r.cantidadSugerida > 0)
        .sort((a, b) => {
          const orden = { critico: 0, bajo: 1, preventivo: 2 };
          return orden[a.urgencia] - orden[b.urgencia];
        });

      setRecomendaciones(recs);
      setCargando(false);
    }
    cargar();
  }, [productos, proveedores]);

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function seleccionarTodos() {
    if (seleccionados.size === recomendaciones.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(recomendaciones.map((r) => r.productoId)));
    }
  }

  function generarOrdenCompra() {
    const items = recomendaciones.filter((r) =>
      seleccionados.has(r.productoId)
    );
    if (items.length === 0) {
      toast.error("Selecciona al menos un producto");
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Orden de Compra Sugerida", 20, 20);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-BO")}`, 20, 28);

    let y = 40;
    doc.setFontSize(8);
    doc.text("Producto", 20, y);
    doc.text("Cantidad", 100, y);
    doc.text("Costo Est.", 130, y);
    doc.text("Proveedor", 160, y);
    y += 6;

    let totalGeneral = 0;

    for (const item of items) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.nombre.substring(0, 35), 20, y);
      doc.text(item.cantidadSugerida.toString(), 100, y);
      doc.text(formatearBs(item.costoEstimado), 130, y);
      doc.text((item.proveedor || "-").substring(0, 20), 160, y);
      totalGeneral += item.costoEstimado;
      y += 5;
    }

    y += 5;
    doc.setFontSize(10);
    doc.text(`Total Estimado: ${formatearBs(totalGeneral)}`, 20, y);

    doc.save("orden-compra.pdf");
    toast.success("Orden de compra generada");
  }

  const totalEstimado = recomendaciones
    .filter((r) => seleccionados.has(r.productoId))
    .reduce((s, r) => s + r.costoEstimado, 0);

  const coloresUrgencia = {
    critico: "bg-red-500/20 text-red-400 border-red-500/30",
    bajo: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    preventivo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <ShellApp>
      <div className="p-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Recomendaciones de Compra</h1>
          <span className="text-xs text-neutral-500">
            {recomendaciones.length} productos
          </span>
        </div>

        {cargando ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-purple-400 animate-pulse" />
            <p className="text-sm text-neutral-400">Analizando inventario...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Tarjeta className="text-center p-3">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-400" />
                <p className="text-lg font-bold">
                  {recomendaciones.filter((r) => r.urgencia === "critico").length}
                </p>
                <p className="text-[10px] text-neutral-500">Criticos</p>
              </Tarjeta>
              <Tarjeta className="text-center p-3">
                <Package className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <p className="text-lg font-bold">
                  {formatearBs(
                    recomendaciones.reduce((s, r) => s + r.costoEstimado, 0)
                  )}
                </p>
                <p className="text-[10px] text-neutral-500">Inversion total</p>
              </Tarjeta>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={seleccionarTodos}
                className="text-xs text-purple-400"
              >
                {seleccionados.size === recomendaciones.length
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
              {seleccionados.size > 0 && (
                <span className="text-xs text-neutral-400">
                  {seleccionados.size} sel. | {formatearBs(totalEstimado)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {recomendaciones.map((r) => (
                <Tarjeta
                  key={r.productoId}
                  className={`p-3 cursor-pointer transition-colors ${
                    seleccionados.has(r.productoId)
                      ? "border-purple-500"
                      : ""
                  }`}
                  onClick={() => toggleSeleccion(r.productoId)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(r.productoId)}
                        readOnly
                        className="accent-purple-500"
                      />
                      <div>
                        <h3 className="text-sm font-medium">{r.nombre}</h3>
                        {r.proveedor && (
                          <p className="text-[10px] text-neutral-500">
                            {r.proveedor}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${coloresUrgencia[r.urgencia]}`}
                    >
                      {r.urgencia}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                    <div>
                      <p className="text-neutral-500">Stock</p>
                      <p className="font-medium">{r.stockActual}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Min</p>
                      <p className="font-medium">{r.stockMinimo}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Comprar</p>
                      <p className="font-medium text-yellow-400">
                        {r.cantidadSugerida}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Costo</p>
                      <p className="font-medium">{formatearBs(r.costoEstimado)}</p>
                    </div>
                  </div>
                </Tarjeta>
              ))}
            </div>

            {seleccionados.size > 0 && (
              <div className="fixed bottom-20 left-4 right-4 z-30">
                <Boton
                  onClick={generarOrdenCompra}
                  variante="primario"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generar Orden de Compra ({seleccionados.size})
                </Boton>
              </div>
            )}
          </>
        )}
      </div>
    </ShellApp>
  );
}
