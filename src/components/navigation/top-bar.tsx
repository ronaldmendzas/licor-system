"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Menu, Bell, AlertTriangle, Package, X, Send, MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { formatBs } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  onOpenMenu: () => void;
  title?: string;
}

export default function TopBar({ onOpenMenu, title }: Props) {
  const products = useAppStore((s) => s.products);
  const [open, setOpen] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const alerts = useMemo(() => {
    return products
      .filter((p) => p.stock_actual <= p.stock_minimo)
      .map((p) => ({
        product: p,
        level:
          p.stock_actual === 0
            ? "sin_stock"
            : p.stock_actual <= p.stock_minimo * 0.5
            ? "critico"
            : "bajo",
      }))
      .sort((a, b) => a.product.stock_actual - b.product.stock_actual);
  }, [products]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function sendWhatsAppAlert() {
    setSendingWa(true);
    try {
      const res = await fetch("/api/alertas/whatsapp");
      const data = await res.json();
      if (data.success) {
        toast.success("Alerta enviada a WhatsApp");
      } else {
        toast.error(data.message || "No se pudo enviar. Configurá CallMeBot primero.");
      }
    } catch {
      toast.error("Error al enviar alerta");
    }
    setSendingWa(false);
  }

  const levelColors: Record<string, string> = {
    sin_stock: "text-red-400",
    critico: "text-red-400",
    bajo: "text-amber-400",
  };

  const levelLabels: Record<string, string> = {
    sin_stock: "Sin stock",
    critico: "Crítico",
    bajo: "Bajo",
  };

  const levelBg: Record<string, string> = {
    sin_stock: "bg-red-500/10",
    critico: "bg-red-500/10",
    bajo: "bg-amber-500/10",
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && <h1 className="font-semibold text-lg">{title}</h1>}
        </div>

        {/* Bell + notification panel */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 -mr-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold">Alertas de Stock</h3>
                  {alerts.length > 0 && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alert list */}
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">Todo en orden</p>
                    <p className="text-xs text-zinc-600">No hay alertas de stock</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {alerts.map((alert) => (
                      <div
                        key={alert.product.id}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg ${levelBg[alert.level]} flex items-center justify-center shrink-0`}>
                          <AlertTriangle className={`w-4 h-4 ${levelColors[alert.level]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate font-medium">{alert.product.nombre}</p>
                          <p className="text-[11px] text-zinc-500">
                            Stock: {alert.product.stock_actual} / Mín: {alert.product.stock_minimo}
                            {alert.product.precio_compra > 0 && (
                              <> · Reposición: {formatBs(alert.product.precio_compra)}</>
                            )}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBg[alert.level]} ${levelColors[alert.level]}`}>
                          {levelLabels[alert.level]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with WhatsApp button */}
              {alerts.length > 0 && (
                <div className="px-4 py-3 border-t border-zinc-800/50">
                  <button
                    onClick={sendWhatsAppAlert}
                    disabled={sendingWa}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {sendingWa ? "Enviando..." : "Enviar resumen a WhatsApp"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
