export function formatearBs(monto: number): string {
  return `Bs. ${monto.toFixed(2)}`;
}

export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatearFechaHora(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calcularMargen(compra: number, venta: number): number {
  if (compra === 0) return 0;
  return Math.round(((venta - compra) / compra) * 100);
}

export function calcularGanancia(compra: number, venta: number): number {
  return venta - compra;
}

export function obtenerColorStock(actual: number, minimo: number): string {
  if (actual <= minimo) return "text-red-500";
  if (actual <= minimo * 1.2) return "text-yellow-500";
  return "text-green-500";
}

export function obtenerBgStock(actual: number, minimo: number): string {
  if (actual <= minimo) return "bg-red-500/10 border-red-500/20";
  if (actual <= minimo * 1.2) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-green-500/10 border-green-500/20";
}

export function truncar(texto: string, largo: number = 30): string {
  if (texto.length <= largo) return texto;
  return texto.substring(0, largo) + "...";
}

export function generarId(): string {
  return crypto.randomUUID();
}

export function esMismodia(fecha1: string, fecha2: string): boolean {
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function obtnerInicioDelDia(): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy.toISOString();
}

export function obtenerInicioSemana(): string {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
  const lunes = new Date(hoy.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  return lunes.toISOString();
}

export function obtenerInicioMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
}
