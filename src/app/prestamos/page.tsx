"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import LoanForm from "@/components/loans/loan-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { Plus, Handshake, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Loan } from "@/types";

export default function LoansPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const loans = useAppStore((s) => s.loans);
  const loadLoans = useAppStore((s) => s.loadLoans);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleReturn(loan: Loan) {
    if (!confirm(`¿Marcar como devuelto el préstamo de ${loan.persona}?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("prestamos")
      .update({ devuelto: true })
      .eq("id", loan.id);
    if (error) {
      toast.error("Error al actualizar");
    } else {
      toast.success("Préstamo marcado como devuelto");
    }
    await Promise.all([loadLoans(), loadProducts()]);
  }

  function handleClose() {
    setModalOpen(false);
  }

  if (loading) return <LoadingScreen />;

  const pending = loans.filter((l) => !l.devuelto);
  const returned = loans.filter((l) => l.devuelto);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Préstamos</h1>
            <p className="text-sm text-zinc-500">{pending.length} pendientes</p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        </div>

        {pending.length === 0 && returned.length === 0 ? (
          <div className="text-center py-12">
            <Handshake className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Sin préstamos</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Pendientes
                </h3>
                {pending.map((l) => (
                  <div
                    key={l.id}
                    className="bg-zinc-900 rounded-xl p-3 border border-amber-500/20 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Handshake className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {l.productos?.nombre ?? "Producto"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {l.cantidad} uds · {l.persona} · {formatDateTime(l.created_at)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReturn(l)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {returned.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Devueltos
                </h3>
                {returned.map((l) => (
                  <div
                    key={l.id}
                    className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 flex items-center gap-3 opacity-60"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {l.productos?.nombre ?? "Producto"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {l.cantidad} uds · {l.persona}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Préstamo">
        <LoanForm onClose={handleClose} />
      </Modal>
    </AppShell>
  );
}
