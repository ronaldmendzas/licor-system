"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import SaleForm from "@/components/sales/sale-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { Plus, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBs, formatDateTime } from "@/lib/utils";

interface SaleRecord {
  id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  productos: { nombre: string } | null;
}

export default function SalesPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadSales() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ventas")
      .select("id, cantidad, precio_unitario, total, fecha, productos(nombre)")
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
  }

  if (loading) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Ventas</h1>
            <p className="text-sm text-zinc-500">{sales.length} registros</p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nueva Venta
          </Button>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">No hay ventas registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sales.map((s) => (
              <div
                key={s.id}
                className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ArrowUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {s.productos?.nombre ?? "Producto"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {s.cantidad} uds · {formatDateTime(s.fecha)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-emerald-400 shrink-0">
                  +{formatBs(s.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Venta">
        <SaleForm onClose={handleClose} />
      </Modal>
    </AppShell>
  );
}
