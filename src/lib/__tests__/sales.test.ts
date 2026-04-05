import { describe, expect, it } from "vitest";
import { getSaleProfit, type SaleRecord } from "@/lib/sales";

describe("getSaleProfit", () => {
  it("calcula ganancia usando costo de compra por cantidad", () => {
    const sale: SaleRecord = {
      id: "1",
      producto_id: "p1",
      cantidad: 3,
      precio_unitario: 10,
      total: 30,
      fecha: "2026-04-05T00:00:00.000Z",
      productos: { nombre: "Paceña", precio_compra: 7 },
    };

    expect(getSaleProfit(sale)).toBe(9);
  });

  it("usa costo cero cuando falta relacion de producto", () => {
    const sale: SaleRecord = {
      id: "2",
      producto_id: "p2",
      cantidad: 2,
      precio_unitario: 8,
      total: 16,
      fecha: "2026-04-05T00:00:00.000Z",
      productos: null,
    };

    expect(getSaleProfit(sale)).toBe(16);
  });
});
