"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import SupplierForm from "@/components/suppliers/supplier-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { Plus, Users, Phone, MapPin } from "lucide-react";
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const suppliers = useAppStore((s) => s.suppliers);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setModalOpen(true);
  }

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Proveedores</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{suppliers.length} proveedores</p>
          </div>
          <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>
            Nuevo
          </Button>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No hay proveedores</p>
          </div>
        ) : (
          <div className="space-y-2">
            {suppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => openEdit(s)}
                className="w-full text-left bg-zinc-900 rounded-xl p-4 border border-zinc-800/50 hover:bg-zinc-900/80 active:scale-[0.99] transition-all"
              >
                <p className="text-sm font-medium">{s.nombre}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  {s.telefono && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Phone className="w-3 h-3" />
                      {s.telefono}
                    </span>
                  )}
                  {s.direccion && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="w-3 h-3" />
                      {s.direccion}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Proveedor" : "Nuevo Proveedor"}
      >
        <SupplierForm supplier={editing} onClose={() => setModalOpen(false)} />
      </Modal>
      </>)}
    </AppShell>
  );
}
