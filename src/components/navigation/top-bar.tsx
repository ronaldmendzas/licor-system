"use client";

import { useMemo } from "react";
import { Menu, Bell } from "lucide-react";
import { useAppStore } from "@/store/app-store";

interface Props {
  onOpenMenu: () => void;
  title?: string;
}

export default function TopBar({ onOpenMenu, title }: Props) {
  const products = useAppStore((s) => s.products);
  const alerts = useMemo(
    () => products.filter((p) => p.stock_actual <= p.stock_minimo),
    [products]
  );

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60">
      <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto lg:max-w-none lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && <h1 className="font-semibold text-lg">{title}</h1>}
        </div>

        <button className="relative p-2 -mr-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors">
          <Bell className="w-5 h-5" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
