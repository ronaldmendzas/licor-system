"use client";

import { useState, useEffect } from "react";
import ShellApp from "@/components/layout/shell-app";
import { createClient } from "@/lib/supabase/client";
import { formatearBs, formatearFechaHora } from "@/lib/utils";
import { Plus, Truck } from "lucide-react";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import FormularioLlegada from "@/components/llegadas/formulario-llegada";

interface LlegadaConDetalles {
  id: string;
  cantidad: number;
  precio_compra: number;
  numero_factura: string | null;
  fecha: string;
  producto: { nombre: string } | null;
  proveedor: { nombre: string } | null;
}

export default function PaginaLlegadas() {
  const [llegadas, setLlegadas] = useState<LlegadaConDetalles[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargarLlegadas() {
    const supabase = createClient();
    const { data } = await supabase
      .from("llegadas")
      .select("*, producto:productos(nombre), proveedor:proveedores(nombre)")
      .order("fecha", { ascending: false })
      .limit(50);
    if (data) setLlegadas(data);
  }

  useEffect(() => {
    cargarLlegadas();
  }, []);

  return (
    <ShellApp titulo="Llegadas">
      <div className="space-y-4">
        <Boton onClick={() => setModalAbierto(true)} icono={<Plus className="w-4 h-4" />}>
          Registrar llegada
        </Boton>

        <div className="space-y-2">
          {llegadas.map((l) => (
            <Tarjeta key={l.id} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Truck className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {l.cantidad}x {l.producto?.nombre || "Producto"}
                </p>
                <p className="text-xs text-neutral-500">
                  {l.proveedor?.nombre || "Sin proveedor"} · {formatearFechaHora(l.fecha)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatearBs(l.precio_compra * l.cantidad)}</p>
                {l.numero_factura && (
                  <p className="text-xs text-neutral-500">{l.numero_factura}</p>
                )}
              </div>
            </Tarjeta>
          ))}
        </div>

        {llegadas.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">Sin llegadas registradas</p>
          </div>
        )}

        <FormularioLlegada
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          onRegistrada={cargarLlegadas}
        />
      </div>
    </ShellApp>
  );
}
