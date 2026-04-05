"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SaleRecord } from "@/lib/sales";
import { toast } from "sonner";

export function useSalesHistory(loadProducts: () => Promise<void>) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [deleting, setDeleting] = useState(false);

  const loadSales = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("ventas")
      .select("id, producto_id, cantidad, precio_unitario, total, fecha, productos(nombre, precio_compra)")
      .order("fecha", { ascending: false })
      .limit(50);

    setSales((data as SaleRecord[]) ?? []);
  }, []);

  const cancelSale = useCallback(async (sale: SaleRecord) => {
    setDeleting(true);
    const supabase = createClient();

    const { data: product } = await supabase
      .from("productos")
      .select("stock_actual")
      .eq("id", sale.producto_id)
      .single();

    if (!product) {
      toast.error("No se encontró el producto asociado");
      setDeleting(false);
      return;
    }

    const { error: stockError } = await supabase
      .from("productos")
      .update({ stock_actual: product.stock_actual + sale.cantidad, updated_at: new Date().toISOString() })
      .eq("id", sale.producto_id);

    if (stockError) {
      toast.error("Error al restaurar el stock");
      setDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase.from("ventas").delete().eq("id", sale.id);
    if (deleteError) {
      await supabase.from("productos").update({ stock_actual: product.stock_actual }).eq("id", sale.producto_id);
      toast.error("Error al anular la venta");
    } else {
      toast.success(`Venta anulada: ${sale.cantidad}x ${sale.productos?.nombre ?? "producto"} — stock restaurado`);
    }

    setDeleting(false);
    await Promise.all([loadSales(), loadProducts()]);
  }, [loadProducts, loadSales]);

  return { sales, deleting, loadSales, cancelSale };
}
