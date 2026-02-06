import type { Product } from "@/types";

interface Prediction {
  product: Product;
  daysUntilDepletion: number;
  risk: "high" | "medium" | "low";
  suggestedReorder: number;
}

export function generatePredictions(products: Product[]): Prediction[] {
  return products
    .filter((p) => p.stock_minimo > 0)
    .map((p) => {
      const ratio = p.stock_actual / Math.max(p.stock_minimo, 1);
      let daysUntilDepletion: number;
      let risk: Prediction["risk"];

      if (ratio <= 1) {
        daysUntilDepletion = Math.round(ratio * 5);
        risk = "high";
      } else if (ratio <= 2) {
        daysUntilDepletion = Math.round(ratio * 7);
        risk = "medium";
      } else {
        daysUntilDepletion = Math.round(ratio * 10);
        risk = "low";
      }

      const suggestedReorder = Math.max(p.stock_minimo * 2 - p.stock_actual, 0);

      return { product: p, daysUntilDepletion, risk, suggestedReorder };
    })
    .sort((a, b) => a.daysUntilDepletion - b.daysUntilDepletion);
}
