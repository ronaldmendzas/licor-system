"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import SaleForm from "@/components/sales/sale-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { Plus } from "lucide-react";
import { useSalesHistory } from "@/hooks/use-sales-history";
import SalesHistoryList from "@/components/sales/sales-history-list";
import CancelSaleModal from "@/components/sales/cancel-sale-modal";

export default function SalesPage() {
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { sales, deleting, loadSales, cancelSale } = useSalesHistory(loadProducts);

  useEffect(() => {
    loadAll();
    loadSales();
  }, [loadAll]);

  function handleClose() {
    setModalOpen(false);
    loadSales();
    loadProducts();
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

        <SalesHistoryList sales={sales} onAskCancel={setConfirmId} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Venta">
        <SaleForm onClose={handleClose} />
      </Modal>

      <CancelSaleModal
        sale={confirmSale ?? null}
        deleting={deleting}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmSale && cancelSale(confirmSale).then(() => setConfirmId(null))}
      />
      </>)}
    </AppShell>
  );
}
