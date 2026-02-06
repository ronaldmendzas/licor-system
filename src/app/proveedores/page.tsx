"use client";

import { useState } from "react";
import ShellApp from "@/components/layout/shell-app";
import { useAppStore } from "@/store/app-store";
import { createClient } from "@/lib/supabase/client";
import { Plus, Users, Edit2, Trash2, Phone, MapPin } from "lucide-react";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import FormularioProveedor from "@/components/proveedores/formulario-proveedor";
import { toast } from "sonner";
import type { Proveedor } from "@/types";

export default function PaginaProveedores() {
  const proveedores = useAppStore((s) => s.proveedores);
  const cargarProveedores = useAppStore((s) => s.cargarProveedores);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);

  function abrirCrear() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(proveedor: Proveedor) {
    setEditando(proveedor);
    setModalAbierto(true);
  }

  async function eliminar(proveedor: Proveedor) {
    const supabase = createClient();
    const { error } = await supabase.from("proveedores").delete().eq("id", proveedor.id);
    if (error) toast.error("Error al eliminar");
    else {
      toast.success(`${proveedor.nombre} eliminado`);
      await cargarProveedores();
    }
  }

  return (
    <ShellApp titulo="Proveedores">
      <div className="space-y-4">
        <Boton onClick={abrirCrear} icono={<Plus className="w-4 h-4" />}>
          Nuevo proveedor
        </Boton>

        <div className="space-y-2">
          {proveedores.map((p) => (
            <Tarjeta key={p.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.nombre}</p>
                    {p.telefono && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {p.telefono}
                      </p>
                    )}
                    {p.direccion && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {p.direccion}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirEditar(p)}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button
                    onClick={() => eliminar(p)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </Tarjeta>
          ))}
        </div>

        {proveedores.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">Sin proveedores registrados</p>
          </div>
        )}

        {modalAbierto && (
          <FormularioProveedor
            abierto={modalAbierto}
            onCerrar={() => setModalAbierto(false)}
            proveedor={editando}
          />
        )}
      </div>
    </ShellApp>
  );
}
