import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatBs, formatDateTime } from "@/lib/utils";
import type { SaleRecord } from "@/lib/sales";

interface Props {
  sale: SaleRecord | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelSaleModal({ sale, deleting, onClose, onConfirm }: Props) {
  return (
    <Modal open={!!sale} onClose={onClose} title="Anular Venta">
      {sale && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">¿Anular esta venta?</p>
              <p className="text-xs text-zinc-400 mt-1">
                Se eliminará el registro y se devolverán <strong>{sale.cantidad} unidades</strong> de <strong>{sale.productos?.nombre ?? "producto"}</strong> al stock.
              </p>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Producto</span><span>{sale.productos?.nombre ?? "—"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Cantidad</span><span>{sale.cantidad} uds</span></div>
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Total</span><span className="text-emerald-400 font-semibold">{formatBs(sale.total)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Fecha</span><span>{formatDateTime(sale.fecha)}</span></div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {deleting ? "Anulando..." : "Sí, anular venta"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
