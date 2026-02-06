"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Truck, Mic } from "lucide-react";

const LINKS = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/productos", icon: Package, label: "Productos" },
  { href: "/ventas", icon: ShoppingCart, label: "Ventas" },
  { href: "/llegadas", icon: Truck, label: "Llegadas" },
  { href: "/voz", icon: Mic, label: "Voz IA" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 lg:hidden">
      <div className="flex items-center justify-around px-1 py-1.5 max-w-lg mx-auto">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-[10px] transition-all duration-150 ${
                active
                  ? "text-violet-400 font-semibold"
                  : "text-zinc-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
