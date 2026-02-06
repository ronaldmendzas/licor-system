import Fuse from "fuse.js";
import type { Product } from "@/types";

export interface VoiceCommand {
  action: "sale" | "arrival" | "search" | "unknown";
  productName: string | null;
  quantity: number;
  matchedProduct: Product | null;
}

export function interpretVoiceCommand(
  text: string,
  products: Product[]
): VoiceCommand {
  const lower = text.toLowerCase();
  let action: VoiceCommand["action"] = "unknown";
  let quantity = 1;

  if (lower.includes("vender") || lower.includes("venta") || lower.includes("vendé")) {
    action = "sale";
  } else if (lower.includes("llegó") || lower.includes("llegada") || lower.includes("recibir")) {
    action = "arrival";
  } else if (lower.includes("buscar") || lower.includes("cuánto") || lower.includes("stock")) {
    action = "search";
  }

  const qtyMatch = lower.match(/(\d+)\s*(unidad|botella|caja|lata)/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1]);
  } else {
    const numMatch = lower.match(/(\d+)/);
    if (numMatch) quantity = parseInt(numMatch[1]);
  }

  const fuse = new Fuse(products, { keys: ["nombre"], threshold: 0.4 });
  const words = text.split(/\s+/);
  let matchedProduct: Product | null = null;

  for (let len = words.length; len >= 2; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      const results = fuse.search(phrase);
      if (results.length > 0) {
        matchedProduct = results[0].item;
        break;
      }
    }
    if (matchedProduct) break;
  }

  return {
    action,
    productName: matchedProduct?.nombre ?? null,
    quantity,
    matchedProduct,
  };
}
