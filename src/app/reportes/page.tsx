"use client";

import { useState } from "react";
import ShellApp from "@/components/layout/shell-app";
import { useAppStore } from "@/store/app-store";
import { createClient } from "@/lib/supabase/client";
import { formatearBs, obtenerInicioMes, obtenerInicioSemana, obtnerInicioDelDia } from "@/lib/utils";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaginaReportes() {
  const productos = useAppStore((s) => s.productos);
  const [generando, setGenerando] = useState<string | null>(null);

  async function generarReporteInventario() {
    setGenerando("inventario");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Licor System - Reporte de Inventario", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleDateString("es-BO")}`, 20, 28);

      doc.setFontSize(12);
      doc.text("Resumen General", 20, 40);

      const totalInversion = productos.reduce((s, p) => s + p.precio_compra * p.stock_actual, 0);
      const totalVenta = productos.reduce((s, p) => s + p.precio_venta * p.stock_actual, 0);
      const totalGanancia = totalVenta - totalInversion;

      doc.setFontSize(10);
      doc.text(`Total productos: ${productos.length}`, 20, 48);
      doc.text(`Inversión en stock: ${formatearBs(totalInversion)}`, 20, 54);
      doc.text(`Valor de venta potencial: ${formatearBs(totalVenta)}`, 20, 60);
      doc.text(`Ganancia potencial: ${formatearBs(totalGanancia)}`, 20, 66);

      let y = 80;
      doc.setFontSize(12);
      doc.text("Detalle de Productos", 20, y);
      y += 10;

      doc.setFontSize(8);
      doc.text("Producto", 20, y);
      doc.text("Stock", 100, y);
      doc.text("Mín", 115, y);
      doc.text("P.Compra", 130, y);
      doc.text("P.Venta", 155, y);
      doc.text("Estado", 180, y);
      y += 6;

      for (const p of productos) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        const estado = p.stock_actual <= p.stock_minimo ? "CRITICO" : p.stock_actual <= p.stock_minimo * 1.2 ? "BAJO" : "OK";
        doc.text(p.nombre.substring(0, 35), 20, y);
        doc.text(p.stock_actual.toString(), 100, y);
        doc.text(p.stock_minimo.toString(), 115, y);
        doc.text(formatearBs(p.precio_compra), 130, y);
        doc.text(formatearBs(p.precio_venta), 155, y);
        doc.text(estado, 180, y);
        y += 5;
      }

      doc.save("reporte-inventario.pdf");
      toast.success("Reporte descargado");
    } catch {
      toast.error("Error al generar reporte");
    }
    setGenerando(null);
  }

  async function generarReporteVentas() {
    setGenerando("ventas");
    try {
      const supabase = createClient();
      const inicioMes = obtenerInicioMes();

      const { data: ventas } = await supabase
        .from("ventas")
        .select("cantidad, total, fecha, producto:productos(nombre)")
        .gte("fecha", inicioMes)
        .order("fecha", { ascending: false });

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Licor System - Reporte de Ventas", 20, 20);
      doc.setFontSize(10);
      doc.text(`Período: Este mes`, 20, 28);
      doc.text(`Generado: ${new Date().toLocaleDateString("es-BO")}`, 20, 34);

      const totalVentas = ventas?.reduce((s, v) => s + v.total, 0) || 0;
      const totalProductos = ventas?.reduce((s, v) => s + v.cantidad, 0) || 0;

      doc.setFontSize(12);
      doc.text("Resumen", 20, 46);
      doc.setFontSize(10);
      doc.text(`Total facturado: ${formatearBs(totalVentas)}`, 20, 54);
      doc.text(`Productos vendidos: ${totalProductos}`, 20, 60);
      doc.text(`Transacciones: ${ventas?.length || 0}`, 20, 66);

      let y = 80;
      doc.setFontSize(8);
      doc.text("Fecha", 20, y);
      doc.text("Producto", 60, y);
      doc.text("Cantidad", 130, y);
      doc.text("Total", 160, y);
      y += 6;

      for (const v of ventas || []) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(new Date(v.fecha).toLocaleDateString("es-BO"), 20, y);
        doc.text(((v.producto as unknown as { nombre: string } | null)?.nombre || "").substring(0, 30), 60, y);
        doc.text(v.cantidad.toString(), 130, y);
        doc.text(formatearBs(v.total), 160, y);
        y += 5;
      }

      doc.save("reporte-ventas.pdf");
      toast.success("Reporte descargado");
    } catch {
      toast.error("Error al generar reporte");
    }
    setGenerando(null);
  }

  const reportes = [
    {
      id: "inventario",
      titulo: "Reporte de Inventario",
      descripcion: "Stock actual, valores, productos críticos",
      accion: generarReporteInventario,
    },
    {
      id: "ventas",
      titulo: "Reporte de Ventas",
      descripcion: "Ventas del mes, totales, desglose",
      accion: generarReporteVentas,
    },
  ];

  return (
    <ShellApp titulo="Reportes">
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">
          Genera reportes profesionales en PDF
        </p>

        {reportes.map((r) => (
          <Tarjeta key={r.id} className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{r.titulo}</p>
              <p className="text-xs text-neutral-500">{r.descripcion}</p>
            </div>
            <Boton
              onClick={r.accion}
              variante="secundario"
              cargando={generando === r.id}
              icono={generando === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            >
              PDF
            </Boton>
          </Tarjeta>
        ))}
      </div>
    </ShellApp>
  );
}
