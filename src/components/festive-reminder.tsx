"use client";

import { useMemo, useState } from "react";
import { getUpcomingFestiveDates, buildFestiveNotification } from "@/lib/festive-dates";
import type { FestiveDate } from "@/lib/festive-dates";
import { useAppStore } from "@/store/app-store";
import { X, PartyPopper, ChevronDown, ChevronUp, MessageCircle, Bell } from "lucide-react";
import { toast } from "sonner";

export default function FestiveReminder() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const products = useAppStore((s) => s.products);

  const upcoming = useMemo(() => getUpcomingFestiveDates(14), []);

  const visible = upcoming.filter((f) => !dismissed.includes(f.name));

  const topProducts = useMemo(() => {
    return products
      .sort((a, b) => b.precio_venta - a.precio_venta)
      .slice(0, 5)
      .map((p) => p.nombre);
  }, [products]);

  if (visible.length === 0) return null;

  const primary = visible[0];
  const rest = visible.slice(1);

  const priorityColors = {
    high: "border-amber-500/30 bg-amber-500/5",
    medium: "border-violet-500/20 bg-violet-500/5",
    low: "border-zinc-700 bg-zinc-900/50",
  };

  const priorityBadge = {
    high: "bg-amber-500/20 text-amber-400",
    medium: "bg-violet-500/20 text-violet-400",
    low: "bg-zinc-700 text-zinc-400",
  };

  function dayLabel(d: FestiveDate) {
    if (d.daysUntil === 0) return "¡Hoy!";
    if (d.daysUntil === 1) return "Mañana";
    return `En ${d.daysUntil} días`;
  }

  function shareWhatsApp(f: FestiveDate) {
    const msg = buildFestiveNotification(f, topProducts);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Abriendo WhatsApp...");
  }

  function sendBrowserNotification(f: FestiveDate) {
    if (!("Notification" in window)) {
      toast.error("Tu navegador no soporta notificaciones");
      return;
    }
    if (Notification.permission === "granted") {
      new Notification(`${f.icon} ${f.name} — ${dayLabel(f)}`, {
        body: `${f.description}\nProductos: ${f.tips.slice(0, 3).join(", ")}`,
        icon: "/icon-192.png",
      });
    } else {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") sendBrowserNotification(f);
        else toast.error("Permiso de notificaciones denegado");
      });
    }
  }

  function renderCard(f: FestiveDate) {
    return (
      <div
        key={f.name}
        className={`rounded-xl border p-3 ${priorityColors[f.priority]} transition-all`}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{f.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{f.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityBadge[f.priority]}`}>
                {dayLabel(f)}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{f.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {f.tips.map((tip) => (
                <span
                  key={tip}
                  className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700/50"
                >
                  {tip}
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => shareWhatsApp(f)}
                className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </button>
              <button
                onClick={() => sendBrowserNotification(f)}
                className="text-[10px] flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Bell className="w-3 h-3" />
                Notificar
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed((d) => [...d, f.name])}
            className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors shrink-0"
            title="Descartar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <PartyPopper className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Próximas Fechas Festivas
        </h3>
        {rest.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {rest.length} más
          </button>
        )}
      </div>

      {renderCard(primary)}

      {expanded && rest.map((f) => renderCard(f))}
    </div>
  );
}
