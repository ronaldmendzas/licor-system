"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Truck,
  Handshake,
  Users,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  X,
  Wine,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

const SECCIONES = [
  {
    titulo: "Principal",
    enlaces: [
      { href: "/productos", icono: Package, etiqueta: "Productos" },
      { href: "/ventas", icono: ShoppingCart, etiqueta: "Ventas" },
      { href: "/llegadas", icono: Truck, etiqueta: "Llegadas" },
      { href: "/prestamos", icono: Handshake, etiqueta: "Préstamos" },
    ],
  },
  {
    titulo: "Gestión",
    enlaces: [
      { href: "/proveedores", icono: Users, etiqueta: "Proveedores" },
      { href: "/analisis", icono: BarChart3, etiqueta: "Análisis" },
      { href: "/reportes", icono: FileText, etiqueta: "Reportes" },
    ],
  },
  {
    titulo: "Sistema",
    enlaces: [
      { href: "/configuracion", icono: Settings, etiqueta: "Configuración" },
    ],
  },
];

export default function MenuLateral({ abierto, onCerrar }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onCerrar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#0a0a0a] border-r border-neutral-800 transform transition-transform duration-300 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Wine className="w-6 h-6 text-purple-500" />
            <span className="font-bold text-lg">Licor System</span>
          </div>
          <button onClick={onCerrar} className="text-neutral-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-130px)] py-2">
          {SECCIONES.map((seccion) => (
            <div key={seccion.titulo} className="mb-2">
              <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {seccion.titulo}
              </p>
              {seccion.enlaces.map(({ href, icono: Icono, etiqueta }) => {
                const activo = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onCerrar}
                    className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activo
                        ? "bg-purple-500/10 text-purple-400"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    <Icono className="w-4 h-4" />
                    {etiqueta}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-neutral-800">
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
