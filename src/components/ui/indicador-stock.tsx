import { obtenerBgStock, obtenerColorStock } from "@/lib/utils";

interface Props {
  actual: number;
  minimo: number;
}

export default function IndicadorStock({ actual, minimo }: Props) {
  const color = obtenerColorStock(actual, minimo);
  const bg = obtenerBgStock(actual, minimo);
  const etiqueta = actual <= minimo ? "Crítico" : actual <= minimo * 1.2 ? "Bajo" : "OK";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${bg} ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {actual} ({etiqueta})
    </span>
  );
}
