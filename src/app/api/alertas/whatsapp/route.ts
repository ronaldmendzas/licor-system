import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp";
import { formatBs } from "@/lib/utils";

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
    mensaje += `💰 Ventas: ${formatBs(totalVentas)}\n`;
    mensaje += `📦 Productos vendidos: ${totalProductos}\n`;

    if (criticos.length > 0) {
      mensaje += `\n🔴 *Stock crítico (${criticos.length}):*\n`;
      for (const p of criticos.slice(0, 5)) {
        mensaje += `  • ${p.nombre}: ${p.stock_actual}/${p.stock_minimo}\n`;
      }
    }

    const enviado = await sendWhatsApp(mensaje);

    if (!enviado) {
      const apiKey = process.env.NEXT_PUBLIC_CALLMEBOT_APIKEY ?? "";
      if (!apiKey) {
        return NextResponse.json({
          success: false,
          message: "WhatsApp no configurado. Necesitás obtener tu API key de CallMeBot. Enviá 'I allow callmebot to send me messages' al +34 644 51 22 23 en WhatsApp y te darán un apikey.",
          needsSetup: true,
        });
      }
      return NextResponse.json({
        success: false,
        message: "No se pudo enviar. Verificá tu número y API key de CallMeBot.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Alerta enviada a WhatsApp",
    });
  } catch {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 });
  }
}
