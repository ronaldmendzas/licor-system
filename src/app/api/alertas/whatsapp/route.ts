import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { formatearBs } from "@/lib/utils";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [ventasRes, productosRes] = await Promise.all([
      supabase
        .from("ventas")
        .select("cantidad, total, producto:productos(nombre)")
        .gte("fecha", hoy.toISOString()),
      supabase
        .from("productos")
        .select("nombre, stock_actual, stock_minimo")
        .eq("activo", true),
    ]);

    const ventas = ventasRes.data || [];
    const productos = productosRes.data || [];

    const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
    const totalProductos = ventas.reduce((s, v) => s + v.cantidad, 0);
    const criticos = productos.filter((p) => p.stock_actual <= p.stock_minimo);

    let mensaje = `📊 *Resumen del día*\n`;
    mensaje += `💰 Ventas: ${formatearBs(totalVentas)}\n`;
    mensaje += `📦 Productos vendidos: ${totalProductos}\n`;

    if (criticos.length > 0) {
      mensaje += `\n🔴 *Stock crítico (${criticos.length}):*\n`;
      for (const p of criticos.slice(0, 5)) {
        mensaje += `  • ${p.nombre}: ${p.stock_actual}/${p.stock_minimo}\n`;
      }
    }

    const enviado = await enviarWhatsApp(mensaje);

    return NextResponse.json({
      success: enviado,
      message: enviado ? "Alerta enviada a WhatsApp" : "No se pudo enviar",
    });
  } catch {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 });
  }
}
