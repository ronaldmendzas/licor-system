"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package, ShoppingCart, Truck, Handshake, Users,
  BarChart3, FileText, Settings, LogOut, X, Wine,
  Camera, TrendingUp, ClipboardList, FolderOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: "Principal",
    links: [
      { href: "/productos", icon: Package, label: "Productos" },
      { href: "/categorias", icon: FolderOpen, label: "Categorías" },
      { href: "/ventas", icon: ShoppingCart, label: "Ventas" },
      { href: "/llegadas", icon: Truck, label: "Llegadas" },
      { href: "/prestamos", icon: Handshake, label: "Préstamos" },
    ],
  },
  {
    title: "Gestión",
    links: [
      { href: "/proveedores", icon: Users, label: "Proveedores" },
      { href: "/analisis", icon: BarChart3, label: "Análisis" },
      { href: "/predicciones", icon: TrendingUp, label: "Predicciones" },
      { href: "/recomendaciones", icon: ClipboardList, label: "Compras" },
      { href: "/reportes", icon: FileText, label: "Reportes" },
    ],
  },
  {
    title: "Herramientas",
    links: [
      { href: "/imagen", icon: Camera, label: "IA Imagen" },
      { href: "/configuracion", icon: Settings, label: "Configuración" },
    ],
  },
];

export default function SideMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-zinc-950 border-r border-zinc-800/50 transform transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Wine className="w-5 h-5 text-violet-400" />
            </div>
            <span className="font-bold text-base">Licor System</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-130px)] py-3">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-1">
              <p className="px-5 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                {section.title}
              </p>
              {section.links.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                      active
                        ? "bg-violet-500/12 text-violet-400 font-medium"
                        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
