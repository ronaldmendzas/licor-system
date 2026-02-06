import { getStockBg, getStockColor } from "@/lib/utils";

interface Props {
  current: number;
  min: number;
}

export function StockBadge({ current, min }: Props) {
  const color = getStockColor(current, min);
  const bg = getStockBg(current, min);
  const label = current <= min ? "Crítico" : current <= min * 1.2 ? "Bajo" : "OK";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {current} ({label})
    </span>
  );
}
