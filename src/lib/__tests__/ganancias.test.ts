import { describe, expect, it } from "vitest";
import {
  calculateTotals,
  getProfitRange,
  groupByProductProfit,
  type SaleProfitRow,
} from "@/lib/ganancias";

const baseSales: SaleProfitRow[] = [
  {
    id: "s1",
    fecha: "2026-04-05T01:00:00.000Z",
    cantidad: 2,
    precio_unitario: 10,
    total: 20,
    productos: { nombre: "A", precio_compra: 6 },
  },
  {
    id: "s2",
    fecha: "2026-04-05T02:00:00.000Z",
    cantidad: 1,
    precio_unitario: 12,
    total: 12,
    productos: { nombre: "B", precio_compra: 4 },
  },
  {
    id: "s3",
    fecha: "2026-04-05T03:00:00.000Z",
    cantidad: 1,
    precio_unitario: 9,
    total: 9,
    productos: { nombre: "A", precio_compra: 6 },
  },
];

describe("calculateTotals", () => {
  it("resume ingresos, costo y ganancia neta", () => {
    const totals = calculateTotals(baseSales);
    expect(totals.revenue).toBe(41);
    expect(totals.cost).toBe(22);
    expect(totals.profit).toBe(19);
  });
});

describe("groupByProductProfit", () => {
  it("agrupa por producto y ordena por mayor ganancia", () => {
    const grouped = groupByProductProfit(baseSales);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].productName).toBe("A");
    expect(grouped[0].profit).toBe(11);
    expect(grouped[0].quantity).toBe(3);
    expect(grouped[1].productName).toBe("B");
    expect(grouped[1].profit).toBe(8);
  });
});

describe("getProfitRange", () => {
  it("devuelve etiqueta correcta para periodo all", () => {
    const range = getProfitRange("all");
    expect(range.label).toBe("Historial completo");
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });

  it("devuelve rango con from y to para periodo night", () => {
    const range = getProfitRange("night");
    expect(range.label).toBe("Turno noche (18:00 a 06:00)");
    expect(typeof range.from).toBe("string");
    expect(typeof range.to).toBe("string");
  });
});
