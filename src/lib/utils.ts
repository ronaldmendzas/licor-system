export function formatBs(amount: number): string {
  return `Bs. ${amount.toFixed(2)}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calcMargin(buy: number, sell: number): number {
  if (buy === 0) return 0;
  return Math.round(((sell - buy) / buy) * 100);
}

export function calcProfit(buy: number, sell: number): number {
  return sell - buy;
}

export function getStockColor(current: number, min: number): string {
  if (current <= min) return "text-red-500";
  if (current <= min * 1.2) return "text-amber-500";
  return "text-emerald-500";
}

export function getStockBg(current: number, min: number): string {
  if (current <= min) return "bg-red-500/10 border-red-500/20";
  if (current <= min * 1.2) return "bg-amber-500/10 border-amber-500/20";
  return "bg-emerald-500/10 border-emerald-500/20";
}

export function truncate(text: string, length: number = 30): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function getStartOfDay(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

export function getStartOfWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export function getStartOfMonth(): string {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
}
