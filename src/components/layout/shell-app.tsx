"use client";

import { useState, useEffect } from "react";
import BarraNavegacion from "@/components/navegacion/barra-navegacion";
import BarraSuperior from "@/components/navegacion/barra-superior";
import MenuLateral from "@/components/navegacion/menu-lateral";
import { useAppStore } from "@/store/app-store";

interface Props {
  children: React.ReactNode;
  titulo?: string;
}

export default function ShellApp({ children, titulo }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cargarTodo = useAppStore((s) => s.cargarTodo);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  return (
    <div className="min-h-screen pb-16">
      <BarraSuperior onAbrirMenu={() => setMenuAbierto(true)} titulo={titulo} />
      <MenuLateral abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <main className="px-4 py-4 max-w-lg mx-auto animate-fade-in">
        {children}
      </main>
      <BarraNavegacion />
    </div>
  );
}
