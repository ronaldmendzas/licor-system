import { describe, expect, it } from "vitest";
import {
  calcMargin,
  calcProfit,
  formatBs,
  getNightRange,
  getStockBg,
  getStockColor,
  truncate,
} from "@/lib/utils";

describe("formatBs", () => {
  it("formatea moneda en bolivianos", () => {
    expect(formatBs(12)).toBe("Bs. 12.00");
    expect(formatBs(12.345)).toBe("Bs. 12.35");
  });
});

describe("profit helpers", () => {
  it("calcula margen y ganancia", () => {
    expect(calcMargin(10, 15)).toBe(50);
    expect(calcMargin(0, 20)).toBe(0);
    expect(calcProfit(8, 11)).toBe(3);
  });
});

describe("stock styles", () => {
  it("retorna color y fondo segun nivel", () => {
    expect(getStockColor(2, 5)).toBe("text-red-500");
    expect(getStockColor(5.5, 5)).toBe("text-amber-500");
    expect(getStockColor(10, 5)).toBe("text-emerald-500");
    expect(getStockBg(2, 5)).toContain("bg-red-500/10");
  });
});

describe("truncate", () => {
  it("recorta y agrega puntos suspensivos", () => {
    expect(truncate("hola", 10)).toBe("hola");
    expect(truncate("abcdefgh", 5)).toBe("abcde...");
  });
});

describe("getNightRange", () => {
  it("si es madrugada devuelve noche anterior 18:00 a 06:00", () => {
    const now = new Date(2026, 3, 5, 2, 15, 0);
    const range = getNightRange(now);
    const from = new Date(range.from);
    const to = new Date(range.to);

    expect(from.getHours()).toBe(18);
    expect(to.getHours()).toBe(6);
    expect(to.getTime() - from.getTime()).toBe(12 * 60 * 60 * 1000);
  });

  it("si es tarde devuelve noche actual 18:00 a 06:00 del siguiente dia", () => {
    const now = new Date(2026, 3, 5, 20, 30, 0);
    const range = getNightRange(now);
    const from = new Date(range.from);
    const to = new Date(range.to);

    expect(from.getHours()).toBe(18);
    expect(to.getHours()).toBe(6);
    expect(to.getTime() - from.getTime()).toBe(12 * 60 * 60 * 1000);
  });
});
