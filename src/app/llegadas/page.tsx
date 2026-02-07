"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import ArrivalForm from "@/components/arrivals/arrival-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { Plus, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBs, formatDateTime } from "@/lib/utils";

interface ArrivalRecord {
  id: string;
  cantidad: number;
  precio_compra: number;
  created_at: string;
  productos: { nombre: string } | null;
  proveedores: { nombre: string } | null;
}

export default function ArrivalsPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadArrivals() {
    const supabase = createClient();
    const { data } = await supabase
      .from("llegadas")
      .select("id, cantidad, precio_compra, created_at, productos(nombre), proveedores(nombre)")
      .order("created_at", { ascending: false })
      .limit(50);
    setArrivals((data as any) ?? []);
  }

  useEffect(() => {
    loadAll();
    loadArrivals();
  }, [loadAll]);

  function handleClose() {
    setModalOpen(false);
    loadArrivals();
  }

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Llegadas</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{arrivals.length} registros</p>
          </div>
          <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Nueva Llegada
          </Button>
        </div>

        {arrivals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">No hay llegadas registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {arrivals.map((a) => (
              <div
                key={a.id}
                className="bg-zinc-900/80 rounded-xl p-3.5 border border-zinc-800/50 hover:bg-zinc-900 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <ArrowDown className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {a.productos?.nombre ?? "Producto"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {a.cantidad} uds
                    {a.proveedores?.nombre ? ` · ${a.proveedores.nombre}` : ""}
                    {" · "}
                    {formatDateTime(a.created_at)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-blue-400 shrink-0">
                  -{formatBs(a.precio_compra * a.cantidad)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Llegada">
        <ArrivalForm onClose={handleClose} />
      </Modal>
      </>)}
    </AppShell>
  );
}
