"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import SaleForm from "@/components/sales/sale-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { Plus, ArrowUp, Undo2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBs, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface SaleRecord {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  productos: { nombre: string } | null;
}

export default function SalesPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadSales() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ventas")
      .select("id, producto_id, cantidad, precio_unitario, total, fecha, productos(nombre)")
      .order("fecha", { ascending: false })
      .limit(50);
    setSales((data as any) ?? []);
  }

  useEffect(() => {
    loadAll();
    loadSales();
  }, [loadAll]);

  function handleClose() {
    setModalOpen(false);
    loadSales();
    loadProducts();
  }

  async function anularVenta(sale: SaleRecord) {
    setDeleting(true);
    const supabase = createClient();

    // 1. Get current stock
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

    // 2. Restore stock (add back the sold quantity)
    const { error: stockError } = await supabase
      .from("productos")
      .update({
        stock_actual: product.stock_actual + sale.cantidad,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sale.producto_id);

    if (stockError) {
      toast.error("Error al restaurar el stock");
      setDeleting(false);
      return;
    }

    // 3. Delete the sale record
    const { error: deleteError } = await supabase
      .from("ventas")
      .delete()
      .eq("id", sale.id);

    if (deleteError) {
      // Rollback stock if delete fails
      await supabase
        .from("productos")
        .update({ stock_actual: product.stock_actual })
        .eq("id", sale.producto_id);
      toast.error("Error al anular la venta");
    } else {
      toast.success(`Venta anulada: ${sale.cantidad}× ${sale.productos?.nombre ?? "producto"} — stock restaurado`);
    }

    setConfirmId(null);
    setDeleting(false);
    await Promise.all([loadSales(), loadProducts()]);
  }

  const confirmSale = sales.find((s) => s.id === confirmId);

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Ventas</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{sales.length} registros</p>
          </div>
          <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Nueva Venta
          </Button>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-16">
            <ArrowUp className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No hay ventas registradas</p>
            <p className="text-zinc-600 text-xs mt-1">Las ventas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sales.map((s) => (
              <div
                key={s.id}
                className="bg-zinc-900/80 rounded-xl p-3.5 border border-zinc-800/50 flex items-center gap-3 hover:bg-zinc-900 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ArrowUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {s.productos?.nombre ?? "Producto"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {s.cantidad} uds · {formatDateTime(s.fecha)}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-400 shrink-0">
                  +{formatBs(s.total)}
                </p>
                <button
                  onClick={() => setConfirmId(s.id)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                  title="Anular venta"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Venta">
        <SaleForm onClose={handleClose} />
      </Modal>

      {/* Confirm anular modal */}
      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Anular Venta">
        {confirmSale && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">¿Anular esta venta?</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Se eliminará el registro y se devolverán <strong>{confirmSale.cantidad} unidades</strong> de{" "}
                  <strong>{confirmSale.productos?.nombre ?? "producto"}</strong> al stock.
                </p>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Producto</span>
                <span>{confirmSale.productos?.nombre ?? "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Cantidad</span>
                <span>{confirmSale.cantidad} uds</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Total</span>
                <span className="text-emerald-400 font-semibold">{formatBs(confirmSale.total)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Fecha</span>
                <span>{formatDateTime(confirmSale.fecha)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmId(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <button
                onClick={() => anularVenta(confirmSale)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? "Anulando..." : "Sí, anular venta"}
              </button>
            </div>
          </div>
        )}
      </Modal>
      </>)}
    </AppShell>
  );
}
