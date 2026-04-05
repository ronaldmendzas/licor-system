import type { ProfitPeriod } from "@/lib/ganancias";

interface Props {
  period: ProfitPeriod;
  onChange: (value: ProfitPeriod) => void;
}

const PERIODS: Array<{ key: ProfitPeriod; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "night", label: "Noche" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "all", label: "Todo" },
];

export default function ProfitPeriodTabs({ period, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            period === p.key
              ? "bg-violet-500/15 text-violet-400"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
