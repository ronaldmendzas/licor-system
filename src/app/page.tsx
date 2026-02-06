"use client";

import ShellApp from "@/components/layout/shell-app";
import TarjetasResumen from "@/components/dashboard/tarjetas-resumen";
import AlertasStock from "@/components/dashboard/alertas-stock";
import MovimientosRecientes from "@/components/dashboard/movimientos-recientes";

export default function PaginaInicio() {
  return (
    <ShellApp titulo="Dashboard">
      <div className="space-y-6">
        <TarjetasResumen />
        <AlertasStock />
        <MovimientosRecientes />
      </div>
    </ShellApp>
  );
}
