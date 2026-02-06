"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Mic,
} from "lucide-react";

const ENLACES = [
  { href: "/", icono: LayoutDashboard, etiqueta: "Inicio" },
  { href: "/productos", icono: Package, etiqueta: "Productos" },
  { href: "/ventas", icono: ShoppingCart, etiqueta: "Ventas" },
  { href: "/llegadas", icono: Truck, etiqueta: "Llegadas" },
  { href: "/voz", icono: Mic, etiqueta: "Voz IA" },
];

export default function BarraNavegacion() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-neutral-800">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {ENLACES.map(({ href, icono: Icono, etiqueta }) => {
          const activo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                activo
                  ? "text-purple-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icono className="w-5 h-5" />
              <span className="text-[10px] font-medium">{etiqueta}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
