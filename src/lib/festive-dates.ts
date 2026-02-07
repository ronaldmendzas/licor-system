// Festive dates reminder system for licorería in El Alto, La Paz, Bolivia
// Includes moveable dates (Carnaval, Compadres) calculated from Easter

export interface FestiveDate {
  name: string;
  date: Date;
  daysUntil: number;
  icon: string;
  description: string;
  /** Product suggestions for this date */
  tips: string[];
  /** Priority: high = huge party, medium = good sales, low = moderate */
  priority: "high" | "medium" | "low";
}

/**
 * Calculate Easter Sunday using the Anonymous Gregorian algorithm
 */
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

function daysUntil(target: Date, from: Date): number {
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.ceil((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get all festive dates for the given year in El Alto / La Paz, Bolivia
 */
function getFestiveDatesForYear(year: number): Omit<FestiveDate, "daysUntil">[] {
  const easter = getEasterDate(year);

  return [
    // ===== JANUARY =====
    {
      name: "Año Nuevo",
      date: new Date(year, 0, 1),
      icon: "🎆",
      description: "Celebración de Año Nuevo — ventas fuertes de brindis",
      tips: ["Champagne/espumante", "Vino", "Singani", "Cerveza", "Whisky"],
      priority: "high",
    },
    {
      name: "Alasita",
      date: new Date(year, 0, 24),
      icon: "🪙",
      description: "Feria de Alasita en La Paz — mucha gente en la calle",
      tips: ["Cerveza", "Singani", "Alcohol para ch'alla", "Vino"],
      priority: "medium",
    },
    // ===== FEBRUARY =====
    {
      name: "Día de la Comadre",
      date: addDays(easter, -52), // Jueves, 2 semanas antes de Carnaval
      icon: "👩",
      description: "Jueves de Comadre — celebración entre mujeres, ¡se toma mucho!",
      tips: ["Cerveza (mucha)", "Singani", "Cocktails preparados", "Vino"],
      priority: "high",
    },
    {
      name: "Jueves de Compadre",
      date: addDays(easter, -59), // Jueves, 3 semanas antes de Carnaval
      icon: "🤝",
      description: "Jueves de Compadre — fiesta entre hombres, alto consumo",
      tips: ["Cerveza (mucha)", "Singani", "Whisky", "Ron"],
      priority: "high",
    },
    {
      name: "Carnaval (entrada)",
      date: addDays(easter, -48), // Sábado de Carnaval
      icon: "🎭",
      description: "Entrada de Carnaval — la fiesta más grande, ventas al máximo",
      tips: ["Cerveza (MUCHA)", "Singani", "Vino", "Ron", "Whisky", "Agua", "Refrescos"],
      priority: "high",
    },
    {
      name: "Martes de Ch'alla",
      date: addDays(easter, -45), // Martes de Carnaval
      icon: "🏠",
      description: "Martes de Ch'alla — se ch'alla casas y negocios con alcohol",
      tips: ["Cerveza", "Alcohol puro para ch'alla", "Singani", "Vino para mesa"],
      priority: "high",
    },
    {
      name: "San Valentín",
      date: new Date(year, 1, 14),
      icon: "💕",
      description: "Día de los Enamorados — ventas de vino y espumante",
      tips: ["Vino tinto", "Espumante/Champagne", "Licores dulces", "Whisky"],
      priority: "medium",
    },
    // ===== MARCH =====
    {
      name: "Día del Padre (Bolivia)",
      date: new Date(year, 2, 19),
      icon: "👨",
      description: "Día del Padre — regalos de licor",
      tips: ["Whisky", "Singani premium", "Vino", "Ron añejo"],
      priority: "medium",
    },
    // ===== APRIL / MOVABLE =====
    {
      name: "Semana Santa",
      date: addDays(easter, -2), // Viernes Santo
      icon: "✝️",
      description: "Semana Santa — bajan las ventas pero hay reuniones familiares",
      tips: ["Vino", "Cerveza", "Singani"],
      priority: "low",
    },
    // ===== MAY =====
    {
      name: "Día de la Madre (Bolivia)",
      date: new Date(year, 4, 27),
      icon: "💐",
      description: "Día de la Madre — celebración importante, regalos y fiestas",
      tips: ["Vino", "Espumante", "Licores dulces", "Singani", "Cerveza"],
      priority: "high",
    },
    // ===== JUNE =====
    {
      name: "Año Nuevo Aymara",
      date: new Date(year, 5, 21),
      icon: "🌄",
      description: "Willkakuti / Año Nuevo Aymara — celebración andina en El Alto",
      tips: ["Singani", "Cerveza", "Alcohol para ritual"],
      priority: "medium",
    },
    {
      name: "San Juan",
      date: new Date(year, 5, 24),
      icon: "🔥",
      description: "Noche de San Juan — fogatas y fiesta, alto consumo de bebidas calientes",
      tips: ["Singani", "Vino caliente (sucumbé)", "Cerveza", "Ron", "Whisky"],
      priority: "high",
    },
    // ===== JULY =====
    {
      name: "Gran Poder",
      date: getGranPoderDate(year),
      icon: "🎺",
      description: "Fiesta del Gran Poder — entrada folkórica masiva en La Paz, ventas altísimas",
      tips: ["Cerveza (MUCHA)", "Singani", "Ron", "Agua", "Refrescos"],
      priority: "high",
    },
    {
      name: "Fiestas Patrias",
      date: new Date(year, 7, 6),
      icon: "🇧🇴",
      description: "Día de la independencia de Bolivia — feriado con celebraciones",
      tips: ["Cerveza", "Singani", "Vino", "Whisky"],
      priority: "medium",
    },
    // ===== SEPTEMBER =====
    {
      name: "Aniversario El Alto",
      date: new Date(year, 2, 6), // 6 de marzo
      icon: "🏙️",
      description: "Aniversario de la ciudad de El Alto — fiestas locales",
      tips: ["Cerveza", "Singani", "Ron"],
      priority: "medium",
    },
    // ===== OCTOBER =====
    {
      name: "Halloween",
      date: new Date(year, 9, 31),
      icon: "🎃",
      description: "Halloween — fiestas temáticas, especialmente jóvenes",
      tips: ["Ron", "Vodka", "Cerveza", "Licores para cocktails"],
      priority: "low",
    },
    // ===== NOVEMBER =====
    {
      name: "Todos Santos",
      date: new Date(year, 10, 2),
      icon: "💀",
      description: "Día de los Difuntos / Todos Santos — visitas, reuniones familiares",
      tips: ["Cerveza", "Singani", "Vino", "Alcohol para mesa"],
      priority: "medium",
    },
    // ===== DECEMBER =====
    {
      name: "Navidad",
      date: new Date(year, 11, 25),
      icon: "🎄",
      description: "Nochebuena y Navidad — cenas familiares con brindis",
      tips: ["Espumante/Champagne", "Vino", "Singani", "Cerveza", "Whisky", "Sidra"],
      priority: "high",
    },
    {
      name: "Fin de Año",
      date: new Date(year, 11, 31),
      icon: "🥂",
      description: "Noche de Fin de Año — la noche de mayor venta del año",
      tips: ["Espumante/Champagne (MUCHO)", "Vino", "Singani", "Cerveza", "Whisky", "Sidra"],
      priority: "high",
    },
  ];
}

/**
 * Gran Poder: Saturday closest to the Feast of the Holy Trinity
 * (first Sunday after Pentecost = Easter + 56 days)
 * The entrada is traditionally the Saturday before
 */
function getGranPoderDate(year: number): Date {
  const easter = getEasterDate(year);
  const trinity = addDays(easter, 56); // Trinity Sunday
  // Saturday before Trinity Sunday
  const saturday = addDays(trinity, -1);
  return saturday;
}

/**
 * Get upcoming festive dates within the next N days
 */
export function getUpcomingFestiveDates(
  withinDays: number = 14,
  fromDate?: Date
): FestiveDate[] {
  const now = fromDate ?? new Date();
  const year = now.getFullYear();

  // Get dates for current year and next year (for Dec/Jan overlap)
  const allDates = [
    ...getFestiveDatesForYear(year),
    ...getFestiveDatesForYear(year + 1),
  ];

  return allDates
    .map((d) => ({
      ...d,
      daysUntil: daysUntil(d.date, now),
    }))
    .filter((d) => d.daysUntil >= 0 && d.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Get the next festive date regardless of how far away
 */
export function getNextFestiveDate(fromDate?: Date): FestiveDate | null {
  const now = fromDate ?? new Date();
  const year = now.getFullYear();

  const allDates = [
    ...getFestiveDatesForYear(year),
    ...getFestiveDatesForYear(year + 1),
  ];

  const upcoming = allDates
    .map((d) => ({
      ...d,
      daysUntil: daysUntil(d.date, now),
    }))
    .filter((d) => d.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return upcoming[0] ?? null;
}

/**
 * Build a notification message for an upcoming festive date
 */
export function buildFestiveNotification(
  festive: FestiveDate,
  topProducts?: string[]
): string {
  const dayText =
    festive.daysUntil === 0
      ? "¡Es HOY!"
      : festive.daysUntil === 1
      ? "¡Es MAÑANA!"
      : `en ${festive.daysUntil} días`;

  let msg = `${festive.icon} ${festive.name} ${dayText}\n`;
  msg += `${festive.description}\n\n`;
  msg += `📦 Productos sugeridos para tener en stock:\n`;
  for (const tip of festive.tips) {
    msg += `  • ${tip}\n`;
  }

  if (topProducts && topProducts.length > 0) {
    msg += `\n🏆 Tus productos más vendidos:\n`;
    for (const p of topProducts.slice(0, 5)) {
      msg += `  • ${p}\n`;
    }
  }

  msg += `\n💡 No te olvides de hacer pedido a tiempo a tus proveedores.`;
  return msg;
}
