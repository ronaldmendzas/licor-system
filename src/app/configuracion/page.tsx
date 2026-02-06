"use client";

import { useState } from "react";
import ShellApp from "@/components/layout/shell-app";
import { useAppStore } from "@/store/app-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import Modal from "@/components/ui/modal";
import { Plus, Tag, Trash2 } from "lucide-react";

export default function PaginaConfiguracion() {
  const categorias = useAppStore((s) => s.categorias);
  const cargarCategorias = useAppStore((s) => s.cargarCategorias);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crearCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("categorias")
      .insert({ nombre: nuevaCategoria.trim() });

    if (error) {
      toast.error("Error al crear categoría");
    } else {
      toast.success("Categoría creada");
      await cargarCategorias();
      setNuevaCategoria("");
      setModalAbierto(false);
    }
    setCargando(false);
  }

  async function eliminarCategoria(id: string, nombre: string) {
    const supabase = createClient();
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      toast.error("No se puede eliminar: tiene productos asociados");
    } else {
      toast.success(`${nombre} eliminada`);
      await cargarCategorias();
    }
  }

  return (
    <ShellApp titulo="Configuración">
      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Categorías</h2>
            <Boton
              onClick={() => setModalAbierto(true)}
              variante="secundario"
              icono={<Plus className="w-4 h-4" />}
            >
              Nueva
            </Boton>
          </div>

          <div className="space-y-2">
            {categorias.map((c) => (
              <Tarjeta key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">{c.nombre}</span>
                </div>
                <button
                  onClick={() => eliminarCategoria(c.id, c.nombre)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </Tarjeta>
            ))}
          </div>
        </section>

        <section>
          <Tarjeta>
            <h3 className="font-semibold text-sm mb-2">WhatsApp Alertas</h3>
            <p className="text-xs text-neutral-500">
              Número configurado: +591 68004297
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Para activar alertas de WhatsApp:
            </p>
            <ol className="text-xs text-neutral-500 mt-1 space-y-1 list-decimal list-inside">
              <li>Agrega +34 644 71 81 99 a tus contactos</li>
              <li>Envíale: &ldquo;I allow callmebot to send me messages&rdquo;</li>
              <li>Copia tu apikey y agrégala en las variables de entorno</li>
            </ol>
          </Tarjeta>
        </section>

        <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo="Nueva Categoría">
          <form onSubmit={crearCategoria} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Nombre</label>
              <input
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                placeholder="Ej: Licores Premium"
                required
              />
            </div>
            <Boton type="submit" cargando={cargando} className="w-full">
              Crear categoría
            </Boton>
          </form>
        </Modal>
      </div>
    </ShellApp>
  );
}
