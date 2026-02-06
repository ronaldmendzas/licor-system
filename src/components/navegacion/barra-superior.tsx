"use client";

import { Menu, Bell } from "lucide-react";
import { useAppStore } from "@/store/app-store";

interface Props {
  onAbrirMenu: () => void;
  titulo?: string;
}

export default function BarraSuperior({ onAbrirMenu, titulo }: Props) {
  const alertas = useAppStore((s) => s.obtenerAlertas());

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-neutral-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onAbrirMenu}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {titulo && <h1 className="font-semibold text-lg">{titulo}</h1>}
        </div>

        <div className="relative">
          <Bell className="w-5 h-5 text-neutral-400" />
          {alertas.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
              {alertas.length}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
