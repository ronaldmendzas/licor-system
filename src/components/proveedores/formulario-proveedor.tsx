"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import Modal from "@/components/ui/modal";
import Boton from "@/components/ui/boton";
import type { Proveedor } from "@/types";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  proveedor?: Proveedor | null;
}

export default function FormularioProveedor({ abierto, onCerrar, proveedor }: Props) {
  const cargarProveedores = useAppStore((s) => s.cargarProveedores);

  const [nombre, setNombre] = useState(proveedor?.nombre || "");
  const [telefono, setTelefono] = useState(proveedor?.telefono || "");
  const [direccion, setDireccion] = useState(proveedor?.direccion || "");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);

    const supabase = createClient();
    const datos = { nombre, telefono, direccion };

    if (proveedor) {
      const { error } = await supabase
        .from("proveedores")
        .update(datos)
        .eq("id", proveedor.id);
      if (error) toast.error("Error al actualizar");
      else toast.success("Proveedor actualizado");
    } else {
      const { error } = await supabase.from("proveedores").insert(datos);
      if (error) toast.error("Error al crear proveedor");
      else toast.success("Proveedor creado");
    }

    await cargarProveedores();
    setCargando(false);
    onCerrar();
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={proveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Distribuidora Central"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Teléfono</label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+591 7XXXXXXX"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Dirección</label>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle, zona, ciudad"
          />
        </div>

        <Boton type="submit" cargando={cargando} className="w-full">
          {proveedor ? "Guardar cambios" : "Crear proveedor"}
        </Boton>
      </form>
    </Modal>
  );
}
