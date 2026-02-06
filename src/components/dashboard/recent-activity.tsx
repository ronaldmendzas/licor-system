"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBs, formatDateTime } from "@/lib/utils";
import type { RecentMovement } from "@/types";

export default function RecentActivity() {
  const [movements, setMovements] = useState<RecentMovement[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ data: sales }, { data: arrivals }] = await Promise.all([
        supabase
          .from("ventas")
          .select("id, producto_id, cantidad, precio_unitario, total, fecha, productos(nombre)")
          .order("fecha", { ascending: false })
          .limit(5),
        supabase
          .from("llegadas")
          .select("id, producto_id, cantidad, precio_compra, fecha, productos(nombre)")
          .order("fecha", { ascending: false })
          .limit(5),
      ]);

      const items: RecentMovement[] = [];

      sales?.forEach((s: any) => {
        items.push({
          id: s.id,
          type: "sale",
          productName: s.productos?.nombre ?? "Producto",
          quantity: s.cantidad,
          total: s.total ?? (s.precio_unitario * s.cantidad),
          date: s.fecha,
        });
      });

      arrivals?.forEach((a: any) => {
        items.push({
          id: a.id,
          type: "arrival",
          productName: a.productos?.nombre ?? "Producto",
          quantity: a.cantidad,
          total: a.precio_compra * a.cantidad,
          date: a.fecha,
        });
      });

      items.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMovements(items.slice(0, 8));
    }

    load();
  }, []);

  if (movements.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold">Actividad Reciente</h3>
        </div>
        <p className="text-sm text-zinc-500 text-center py-6">
          Sin actividad reciente
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm font-semibold">Actividad Reciente</h3>
      </div>
      <div className="space-y-3">
        {movements.map((m) => (
          <div key={`${m.type}-${m.id}`} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.type === "sale"
                  ? "bg-emerald-500/10"
                  : "bg-blue-500/10"
              }`}
            >
              {m.type === "sale" ? (
                <ArrowUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDown className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{m.productName}</p>
              <p className="text-xs text-zinc-500">
                {m.type === "sale" ? "Venta" : "Llegada"} · {m.quantity} uds
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-medium ${
                m.type === "sale" ? "text-emerald-400" : "text-blue-400"
              }`}>
                {m.type === "sale" ? "+" : "-"}{formatBs(m.total)}
              </p>
              <p className="text-[10px] text-zinc-600">
                {formatDateTime(m.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
