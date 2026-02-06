import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variante?: "primario" | "secundario" | "peligro" | "fantasma";
  cargando?: boolean;
  disabled?: boolean;
  className?: string;
  icono?: React.ReactNode;
}

const ESTILOS = {
  primario: "bg-purple-600 hover:bg-purple-700 text-white",
  secundario: "bg-neutral-800 hover:bg-neutral-700 text-white",
  peligro: "bg-red-600 hover:bg-red-700 text-white",
  fantasma: "bg-transparent hover:bg-neutral-800 text-neutral-400",
};

export default function Boton({
  children,
  onClick,
  type = "button",
  variante = "primario",
  cargando = false,
  disabled = false,
  className = "",
  icono,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || cargando}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
    >
      {cargando ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icono
      )}
      {children}
    </button>
  );
}
