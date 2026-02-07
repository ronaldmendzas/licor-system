"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import AppShell from "@/components/layout/app-shell";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatBs } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Truck,
  Handshake,
  PartyPopper,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar as CalendarIcon,
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
  Share2,
  X,
  Star,
} from "lucide-react";
import type { Loan } from "@/types";

/* ------------------------------------------------------------------ */
/*  FESTIVE  — reuse from festive-dates.ts                            */
/* ------------------------------------------------------------------ */
import type { FestiveDate } from "@/lib/festive-dates";

// We need all festive dates for a year (not just upcoming)
// Inline the core builder so we get the full list for any year
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function getGranPoderDate(year: number): Date {
  const easter = getEasterDate(year);
  return addDays(easter, 55); // Saturday before Trinity
}

interface FestiveInfo {
  name: string;
  date: Date;
  icon: string;
  description: string;
  tips: string[];
  priority: "high" | "medium" | "low";
}

function getAllFestiveDatesForYear(year: number): FestiveInfo[] {
  const easter = getEasterDate(year);
  return [
    { name: "Año Nuevo", date: new Date(year, 0, 1), icon: "🎆", description: "Celebración de Año Nuevo", tips: ["Champagne", "Vino", "Singani", "Cerveza", "Whisky"], priority: "high" },
    { name: "Alasita", date: new Date(year, 0, 24), icon: "🪙", description: "Feria de Alasita en La Paz", tips: ["Cerveza", "Singani", "Alcohol para ch'alla", "Vino"], priority: "medium" },
    { name: "Jueves de Compadre", date: addDays(easter, -59), icon: "🤝", description: "Fiesta entre hombres, alto consumo", tips: ["Cerveza", "Singani", "Whisky", "Ron"], priority: "high" },
    { name: "Día de la Comadre", date: addDays(easter, -52), icon: "👩", description: "Celebración entre mujeres", tips: ["Cerveza", "Singani", "Cocktails", "Vino"], priority: "high" },
    { name: "Carnaval", date: addDays(easter, -48), icon: "🎭", description: "Entrada de Carnaval — máxima fiesta", tips: ["Cerveza (MUCHA)", "Singani", "Vino", "Ron", "Whisky"], priority: "high" },
    { name: "Martes de Ch'alla", date: addDays(easter, -45), icon: "🏠", description: "Se ch'alla casas y negocios", tips: ["Cerveza", "Alcohol puro", "Singani", "Vino"], priority: "high" },
    { name: "San Valentín", date: new Date(year, 1, 14), icon: "💕", description: "Día de los Enamorados", tips: ["Vino tinto", "Espumante", "Licores dulces", "Whisky"], priority: "medium" },
    { name: "Aniversario El Alto", date: new Date(year, 2, 6), icon: "🏙️", description: "Aniversario de El Alto", tips: ["Cerveza", "Singani", "Ron"], priority: "medium" },
    { name: "Día del Padre", date: new Date(year, 2, 19), icon: "👨", description: "Regalos de licor para papá", tips: ["Whisky", "Singani premium", "Vino", "Ron añejo"], priority: "medium" },
    { name: "Semana Santa", date: addDays(easter, -2), icon: "✝️", description: "Reuniones familiares", tips: ["Vino", "Cerveza", "Singani"], priority: "low" },
    { name: "Día de la Madre", date: new Date(year, 4, 27), icon: "💐", description: "Celebración importante", tips: ["Vino", "Espumante", "Licores dulces", "Singani"], priority: "high" },
    { name: "Año Nuevo Aymara", date: new Date(year, 5, 21), icon: "🌄", description: "Willkakuti — celebración andina", tips: ["Singani", "Cerveza", "Alcohol para ritual"], priority: "medium" },
    { name: "San Juan", date: new Date(year, 5, 24), icon: "🔥", description: "Fogatas y fiesta nocturna", tips: ["Singani", "Vino caliente", "Cerveza", "Ron"], priority: "high" },
    { name: "Gran Poder", date: getGranPoderDate(year), icon: "🎺", description: "Entrada folkórica masiva", tips: ["Cerveza (MUCHA)", "Singani", "Ron"], priority: "high" },
    { name: "Fiestas Patrias", date: new Date(year, 7, 6), icon: "🇧🇴", description: "Día de la Independencia", tips: ["Cerveza", "Singani", "Vino", "Whisky"], priority: "medium" },
    { name: "Halloween", date: new Date(year, 9, 31), icon: "🎃", description: "Fiestas temáticas", tips: ["Ron", "Vodka", "Cerveza"], priority: "low" },
    { name: "Todos Santos", date: new Date(year, 10, 2), icon: "💀", description: "Día de los Difuntos", tips: ["Cerveza", "Singani", "Vino"], priority: "medium" },
    { name: "Navidad", date: new Date(year, 11, 25), icon: "🎄", description: "Nochebuena — brindis familiar", tips: ["Espumante", "Vino", "Singani", "Cerveza", "Whisky", "Sidra"], priority: "high" },
    { name: "Fin de Año", date: new Date(year, 11, 31), icon: "🥂", description: "Mayor venta del año", tips: ["Espumante (MUCHO)", "Vino", "Singani", "Cerveza", "Whisky", "Sidra"], priority: "high" },
  ];
}

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */
interface SaleRecord {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  productos: { nombre: string } | null;
}

interface ArrivalRecord {
  id: string;
  cantidad: number;
  precio_compra: number;
  fecha: string;
  created_at: string;
  productos: { nombre: string } | null;
  proveedores: { nombre: string } | null;
}

interface DayData {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  sales: SaleRecord[];
  arrivals: ArrivalRecord[];
  loans: Loan[];
  loanReturns: Loan[];
  festive: FestiveInfo[];
  totalRevenue: number;
  totalItems: number;
}

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseLocalDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/20 border-red-500/40 text-red-400",
  medium: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  low: "bg-blue-500/20 border-blue-500/40 text-blue-400",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */
export default function CalendarPage() {
  const storeLoading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const loans = useAppStore((s) => s.loans);

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Load store data
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Fetch sales & arrivals for the current month view (± 7 days for grid edges)
  const fetchMonthData = useCallback(async () => {
    setDataLoading(true);
    const supabase = createClient();
    const from = new Date(currentYear, currentMonth, 1);
    from.setDate(from.getDate() - 7);
    const to = new Date(currentYear, currentMonth + 1, 0);
    to.setDate(to.getDate() + 8);

    const fromISO = from.toISOString();
    const toISO = to.toISOString();

    const [salesRes, arrivalsRes] = await Promise.all([
      supabase
        .from("ventas")
        .select("id, producto_id, cantidad, precio_unitario, total, fecha, productos(nombre)")
        .gte("fecha", fromISO)
        .lte("fecha", toISO)
        .order("fecha", { ascending: false }),
      supabase
        .from("llegadas")
        .select("id, cantidad, precio_compra, fecha, created_at, productos(nombre), proveedores(nombre)")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false }),
    ]);

    setSales((salesRes.data as any) ?? []);
    setArrivals((arrivalsRes.data as any) ?? []);
    setDataLoading(false);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  // Build festive dates for current year (and next if viewing Dec)
  const festiveDatesMap = useMemo(() => {
    const map = new Map<string, FestiveInfo[]>();
    const years = [currentYear];
    if (currentMonth === 11) years.push(currentYear + 1);
    if (currentMonth === 0) years.push(currentYear - 1);

    for (const y of years) {
      for (const f of getAllFestiveDatesForYear(y)) {
        const key = dateKey(f.date);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(f);
      }
    }
    return map;
  }, [currentMonth, currentYear]);

  // Build calendar grid
  const calendarDays: DayData[] = useMemo(() => {
    // First day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Day of week (Monday=0)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    // Start from the Monday before (or on) the 1st
    const gridStart = new Date(currentYear, currentMonth, 1 - startDow);
    // 6 rows × 7 cols = 42 cells
    const days: DayData[] = [];

    // Index sales/arrivals/loans by dateKey
    const salesByDay = new Map<string, SaleRecord[]>();
    for (const s of sales) {
      const key = dateKey(parseLocalDate(s.fecha));
      if (!salesByDay.has(key)) salesByDay.set(key, []);
      salesByDay.get(key)!.push(s);
    }

    const arrivalsByDay = new Map<string, ArrivalRecord[]>();
    for (const a of arrivals) {
      const key = dateKey(parseLocalDate(a.created_at));
      if (!arrivalsByDay.has(key)) arrivalsByDay.set(key, []);
      arrivalsByDay.get(key)!.push(a);
    }

    const loansByDay = new Map<string, Loan[]>();
    const loanReturnsByDay = new Map<string, Loan[]>();
    for (const l of loans) {
      const key = dateKey(parseLocalDate(l.fecha_prestamo));
      if (!loansByDay.has(key)) loansByDay.set(key, []);
      loansByDay.get(key)!.push(l);
      if (l.fecha_devolucion) {
        const rKey = dateKey(parseLocalDate(l.fecha_devolucion));
        if (!loanReturnsByDay.has(rKey)) loanReturnsByDay.set(rKey, []);
        loanReturnsByDay.get(rKey)!.push(l);
      }
    }

    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = dateKey(d);
      const daySales = salesByDay.get(key) ?? [];

      days.push({
        date: d,
        dateKey: key,
        isCurrentMonth: d.getMonth() === currentMonth,
        isToday: isSameDay(d, today),
        sales: daySales,
        arrivals: arrivalsByDay.get(key) ?? [],
        loans: loansByDay.get(key) ?? [],
        loanReturns: loanReturnsByDay.get(key) ?? [],
        festive: festiveDatesMap.get(key) ?? [],
        totalRevenue: daySales.reduce((sum, s) => sum + s.total, 0),
        totalItems: daySales.reduce((sum, s) => sum + s.cantidad, 0),
      });
    }
    return days;
  }, [currentMonth, currentYear, sales, arrivals, loans, festiveDatesMap, today]);

  // Month summary stats
  const monthStats = useMemo(() => {
    const monthDays = calendarDays.filter((d) => d.isCurrentMonth);
    const totalRevenue = monthDays.reduce((s, d) => s + d.totalRevenue, 0);
    const totalSales = monthDays.reduce((s, d) => s + d.sales.length, 0);
    const totalArrivals = monthDays.reduce((s, d) => s + d.arrivals.length, 0);
    const totalLoans = monthDays.reduce((s, d) => s + d.loans.length, 0);
    const bestDay = monthDays.reduce((best, d) => (d.totalRevenue > best.totalRevenue ? d : best), monthDays[0]);
    const activeDays = monthDays.filter((d) => d.sales.length > 0 || d.arrivals.length > 0).length;
    const upcomingFestive = monthDays.filter((d) => d.festive.length > 0 && d.date >= today);

    return { totalRevenue, totalSales, totalArrivals, totalLoans, bestDay, activeDays, upcomingFestive };
  }, [calendarDays, today]);

  // Revenue heatmap — max revenue for color scaling
  const maxRevenue = useMemo(() => {
    return Math.max(...calendarDays.map((d) => d.totalRevenue), 1);
  }, [calendarDays]);

  // Pending loans (global)
  const pendingLoans = useMemo(() => loans.filter((l) => l.estado === "pendiente"), [loans]);

  // Navigation
  function prevMonth() {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }
  function goToday() {
    setSelectedDay(null);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }

  // Revenue intensity for heatmap
  function getRevenueIntensity(revenue: number): string {
    if (revenue === 0) return "";
    const ratio = revenue / maxRevenue;
    if (ratio > 0.7) return "bg-violet-500/30";
    if (ratio > 0.4) return "bg-violet-500/18";
    if (ratio > 0.15) return "bg-violet-500/10";
    return "bg-violet-500/5";
  }

  const loading = storeLoading || dataLoading;

  return (
    <AppShell>
      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="space-y-4 pb-20 lg:pb-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-violet-400" />
                Calendario
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Actividad, llegadas esperadas y fechas festivas
              </p>
            </div>
            <Button onClick={goToday} variant="secondary" size="sm">
              Hoy
            </Button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-3 border border-zinc-800/50">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <h2 className="text-lg font-bold">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Month Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard icon={<DollarSign className="w-4 h-4" />} label="Ingresos" value={formatBs(monthStats.totalRevenue)} color="text-emerald-400" bg="bg-emerald-500/10" />
            <StatCard icon={<ShoppingCart className="w-4 h-4" />} label="Ventas" value={String(monthStats.totalSales)} color="text-violet-400" bg="bg-violet-500/10" />
            <StatCard icon={<Truck className="w-4 h-4" />} label="Llegadas" value={String(monthStats.totalArrivals)} color="text-blue-400" bg="bg-blue-500/10" />
            <StatCard icon={<PartyPopper className="w-4 h-4" />} label="Fiestas" value={`${monthStats.upcomingFestive.length} próx.`} color="text-amber-400" bg="bg-amber-500/10" />
          </div>

          {/* Pending Loans Banner */}
          {pendingLoans.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">
                  {pendingLoans.length} préstamo{pendingLoans.length > 1 ? "s" : ""} pendiente{pendingLoans.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1">
                {pendingLoans.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="truncate">
                      <strong className="text-zinc-300">{l.persona}</strong> — {l.cantidad}× {l.productos?.nombre ?? "Producto"}
                      {l.garantia_bs > 0 && <span className="text-amber-400/80 ml-1">(Garantía {formatBs(l.garantia_bs)})</span>}
                    </span>
                  </div>
                ))}
                {pendingLoans.length > 3 && (
                  <p className="text-xs text-zinc-500 mt-1">+{pendingLoans.length - 3} más...</p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Festive Dates (this month) */}
          {monthStats.upcomingFestive.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Fechas Festivas este Mes
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {monthStats.upcomingFestive.map((d) =>
                  d.festive.map((f) => {
                    const daysLeft = Math.ceil(
                      (f.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={f.name}
                        className={`shrink-0 border rounded-xl p-3 min-w-[180px] ${PRIORITY_COLORS[f.priority]}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{f.icon}</span>
                          <span className="text-[10px] font-bold uppercase">
                            {daysLeft === 0 ? "¡HOY!" : daysLeft === 1 ? "¡MAÑANA!" : `${daysLeft}d`}
                          </span>
                        </div>
                        <p className="text-xs font-bold mt-1">{f.name}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">
                          {f.date.getDate()} de {MONTH_NAMES[f.date.getMonth()]}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {f.tips.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800/50 overflow-hidden">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-zinc-800/50">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const hasActivity = day.sales.length > 0 || day.arrivals.length > 0 || day.loans.length > 0 || day.loanReturns.length > 0;
                const hasFestive = day.festive.length > 0;
                const isSelected = selectedDay?.dateKey === day.dateKey;

                return (
                  <button
                    key={day.dateKey}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] border-b border-r border-zinc-800/30 text-left transition-all duration-100 hover:bg-zinc-800/40 ${
                      !day.isCurrentMonth ? "opacity-30" : ""
                    } ${isSelected ? "!bg-violet-500/15 ring-1 ring-violet-500/40" : ""} ${
                      day.isToday ? "ring-1 ring-violet-500/60" : ""
                    } ${getRevenueIntensity(day.totalRevenue)}`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          day.isToday
                            ? "w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-[11px]"
                            : hasFestive
                            ? "text-amber-400 font-bold"
                            : "text-zinc-400"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {/* Festive emoji — top right */}
                      {hasFestive && (
                        <span className="text-[10px] sm:text-sm leading-none">
                          {day.festive[0].icon}
                        </span>
                      )}
                    </div>

                    {/* Activity indicators */}
                    {hasActivity && day.isCurrentMonth && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {day.sales.length > 0 && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" title={`${day.sales.length} ventas`} />
                        )}
                        {day.arrivals.length > 0 && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" title={`${day.arrivals.length} llegadas`} />
                        )}
                        {day.loans.length > 0 && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" title={`${day.loans.length} préstamos`} />
                        )}
                        {day.loanReturns.length > 0 && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-500" title={`${day.loanReturns.length} devoluciones`} />
                        )}
                      </div>
                    )}

                    {/* Festive priority dot */}
                    {hasFestive && day.isCurrentMonth && (
                      <div className="absolute bottom-1 right-1">
                        <span className={`block w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[day.festive[0].priority]}`} />
                      </div>
                    )}

                    {/* Revenue amount on desktop */}
                    {day.totalRevenue > 0 && day.isCurrentMonth && (
                      <p className="hidden sm:block text-[9px] text-emerald-400/70 mt-0.5 truncate">
                        {formatBs(day.totalRevenue)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-3 py-2 border-t border-zinc-800/50 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Ventas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Llegadas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Préstamos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Devoluciones</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Fiesta alta</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Fiesta media</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Fiesta baja</span>
            </div>
          </div>

          {/* Best Day Highlight */}
          {monthStats.bestDay && monthStats.bestDay.totalRevenue > 0 && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Mejor día del mes</p>
                <p className="text-sm font-bold">
                  {monthStats.bestDay.date.getDate()} de {MONTH_NAMES[currentMonth]} — {formatBs(monthStats.bestDay.totalRevenue)}
                </p>
                <p className="text-xs text-zinc-400">
                  {monthStats.bestDay.sales.length} ventas, {monthStats.bestDay.totalItems} unidades
                </p>
              </div>
            </div>
          )}

          {/* Selected Day Detail Panel */}
          {selectedDay && (
            <div className="bg-zinc-900 border border-zinc-800/50 rounded-xl overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-violet-400" />
                  <h3 className="font-bold text-sm">
                    {selectedDay.date.getDate()} de {MONTH_NAMES[selectedDay.date.getMonth()]} {selectedDay.date.getFullYear()}
                  </h3>
                  {selectedDay.isToday && (
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-full">HOY</span>
                  )}
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-1 rounded hover:bg-zinc-800 transition-colors">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Quick Stats for the day */}
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat label="Ingresos" value={formatBs(selectedDay.totalRevenue)} icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />} />
                  <MiniStat label="Ventas" value={`${selectedDay.sales.length}`} icon={<ShoppingCart className="w-3.5 h-3.5 text-violet-400" />} />
                  <MiniStat label="Llegadas" value={`${selectedDay.arrivals.length}`} icon={<Truck className="w-3.5 h-3.5 text-blue-400" />} />
                </div>

                {/* Festive dates for this day */}
                {selectedDay.festive.length > 0 && (
                  <div className="space-y-2">
                    <SectionTitle icon={<PartyPopper className="w-3.5 h-3.5 text-amber-400" />} text="Fecha Festiva" />
                    {selectedDay.festive.map((f) => (
                      <div key={f.name} className={`border rounded-xl p-3 ${PRIORITY_COLORS[f.priority]}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{f.icon}</span>
                          <div>
                            <p className="text-sm font-bold">{f.name}</p>
                            <p className="text-xs opacity-80">{f.description}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">
                            Productos para tener en stock:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {f.tips.map((t) => (
                              <span key={t} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const text = `${f.icon} ${f.name} — ${f.description}\n\n📦 Stock sugerido:\n${f.tips.map((t) => `• ${t}`).join("\n")}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                          className="flex items-center gap-1 mt-2 text-[10px] font-medium text-white/70 hover:text-white/90 transition-colors"
                        >
                          <Share2 className="w-3 h-3" /> Compartir a proveedor
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sales list */}
                {selectedDay.sales.length > 0 && (
                  <div className="space-y-2">
                    <SectionTitle icon={<ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />} text={`Ventas (${selectedDay.sales.length})`} />
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedDay.sales.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2">
                          <ShoppingCart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{s.productos?.nombre ?? "Producto"}</p>
                            <p className="text-[10px] text-zinc-500">{s.cantidad} uds × {formatBs(s.precio_unitario)}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 shrink-0">{formatBs(s.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Arrivals list */}
                {selectedDay.arrivals.length > 0 && (
                  <div className="space-y-2">
                    <SectionTitle icon={<ArrowDownCircle className="w-3.5 h-3.5 text-blue-400" />} text={`Llegadas (${selectedDay.arrivals.length})`} />
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedDay.arrivals.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2">
                          <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{a.productos?.nombre ?? "Producto"}</p>
                            <p className="text-[10px] text-zinc-500">
                              {a.cantidad} uds · {a.proveedores?.nombre ?? "Sin proveedor"}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-blue-400 shrink-0">{formatBs(a.precio_compra * a.cantidad)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loans */}
                {selectedDay.loans.length > 0 && (
                  <div className="space-y-2">
                    <SectionTitle icon={<Handshake className="w-3.5 h-3.5 text-amber-400" />} text={`Préstamos (${selectedDay.loans.length})`} />
                    <div className="space-y-1.5">
                      {selectedDay.loans.map((l) => (
                        <div key={l.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2">
                          <Handshake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{l.productos?.nombre ?? "Producto"}</p>
                            <p className="text-[10px] text-zinc-500">{l.cantidad} uds → {l.persona}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            l.estado === "pendiente" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            {l.estado === "pendiente" ? "Pendiente" : "Devuelto"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loan returns */}
                {selectedDay.loanReturns.length > 0 && (
                  <div className="space-y-2">
                    <SectionTitle icon={<TrendingUp className="w-3.5 h-3.5 text-teal-400" />} text={`Devoluciones (${selectedDay.loanReturns.length})`} />
                    <div className="space-y-1.5">
                      {selectedDay.loanReturns.map((l) => (
                        <div key={`ret-${l.id}`} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2">
                          <Package className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{l.productos?.nombre ?? "Producto"}</p>
                            <p className="text-[10px] text-zinc-500">{l.cantidad} uds devueltas por {l.persona}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {selectedDay.sales.length === 0 &&
                  selectedDay.arrivals.length === 0 &&
                  selectedDay.loans.length === 0 &&
                  selectedDay.loanReturns.length === 0 &&
                  selectedDay.festive.length === 0 && (
                    <div className="text-center py-6">
                      <CalendarIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500">Sin actividad este día</p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/*  SUB-COMPONENTS                                                     */
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string; color: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-3 border border-zinc-800/30`}>
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="text-xs font-bold mt-0.5">{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-semibold text-zinc-400">{text}</span>
    </div>
  );
}
