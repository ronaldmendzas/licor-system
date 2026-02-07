/**
 * Voice AI — Motor de lenguaje natural para control de inventario
 *
 * Este módulo implementa un sistema de comprensión de lenguaje natural (NLU)
 * completo en español, capaz de interpretar CUALQUIER comando relacionado
 * con la gestión de inventario de una licorería.
 *
 * Arquitectura:
 *   1. Normalización del texto (acentos, sinónimos, números en palabras)
 *   2. Clasificación de intención (intent) por puntaje ponderado
 *   3. Extracción de entidades (productos, cantidades, personas, precios, nombres)
 *   4. Resolución de ambigüedad y contexto conversacional
 */

import Fuse from "fuse.js";

/* ------------------------------------------------------------------ */
/*                           TYPES                                     */
/* ------------------------------------------------------------------ */

export type Intent =
  | "register_sale"
  | "register_arrival"
  | "create_product"
  | "edit_product"
  | "delete_product"
  | "search_product"
  | "list_products"
  | "check_price"
  | "check_stock"
  | "create_category"
  | "delete_category"
  | "list_categories"
  | "create_supplier"
  | "delete_supplier"
  | "list_suppliers"
  | "create_loan"
  | "return_loan"
  | "list_loans"
  | "low_stock_alert"
  | "dashboard_summary"
  | "best_sellers"
  | "set_price"
  | "set_stock"
  | "navigate"
  | "help"
  | "unknown";

export interface ParsedCommand {
  intent: Intent;
  confidence: number;
  entities: {
    productName: string | null;
    matchedProduct: any | null;
    quantity: number | null;
    price: number | null;
    sellPrice: number | null;          // precio de venta
    buyPrice: number | null;           // precio de compra
    person: string | null;
    categoryName: string | null;
    matchedCategory: any | null;
    supplierName: string | null;
    matchedSupplier: any | null;
    destination: string | null;        // for navigation
    names: string[];                   // multiple names (batch create)
    newProductName: string | null;     // name for NEW product creation
  };
  raw: string;
}

interface IntentRule {
  intent: Intent;
  /** Palabras/frases que activan esta intención y su peso */
  triggers: { pattern: RegExp; weight: number }[];
  /** Palabras que DESCARTAN esta intención */
  antiPatterns?: RegExp[];
}

/* ------------------------------------------------------------------ */
/*                     TEXT NORMALIZATION                               */
/* ------------------------------------------------------------------ */

const NUMBER_WORDS: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, veinte: 20, treinta: 30,
  cuarenta: 40, cincuenta: 50, cien: 100, media: 0.5, medio: 0.5,
  par: 2, par_de: 2, docena: 12, media_docena: 6,
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")    // strip accents
    .replace(/[¿¡!?,;:.]/g, " ")        // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function replaceNumberWords(text: string): string {
  let result = text;
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    result = result.replace(new RegExp(`\\b${word}\\b`, "g"), num.toString());
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*                     INTENT RULES                                    */
/* ------------------------------------------------------------------ */

const INTENT_RULES: IntentRule[] = [

  // ── VENTAS ─────────────────────────────────────────────────────────
  {
    intent: "register_sale",
    triggers: [
      { pattern: /vend(er|e[rs]?|i|ido|emos)/, weight: 10 },
      { pattern: /registr(ar?|a|o)\s*(una?\s*)?venta/, weight: 12 },
      { pattern: /cobr(ar|a|o|e)/, weight: 8 },
      { pattern: /hacer\s*(una?\s*)?venta/, weight: 10 },
      { pattern: /descontar/, weight: 6 },
      { pattern: /sacar\s*del\s*inventario/, weight: 7 },
      { pattern: /necesito\s*vender/, weight: 10 },
      { pattern: /venta\s*de/, weight: 9 },
      { pattern: /compro|me\s*llev(o|a)|dame/, weight: 7 },
    ],
    antiPatterns: [/precio/, /cuesta/, /vale/, /cuanto\s*es/],
  },

  // ── LLEGADAS ───────────────────────────────────────────────────────
  {
    intent: "register_arrival",
    triggers: [
      { pattern: /lleg(o|ada|aron|ar)/, weight: 10 },
      { pattern: /recibi(r|mos|do|o)/, weight: 10 },
      { pattern: /entr(o|ada|aron|ar|ega)/, weight: 8 },
      { pattern: /ingres(ar?|o|aron)/, weight: 8 },
      { pattern: /repon(er|go|emos|er)/, weight: 8 },
      { pattern: /resurtir|reabastecer|abastecer/, weight: 9 },
      { pattern: /agreg(ar?|o)\s*(stock|inventario|unidad|producto)/, weight: 10 },
      { pattern: /sumar\s*al\s*(inventario|stock)/, weight: 9 },
      { pattern: /meter\s*al\s*(inventario|stock)/, weight: 8 },
      { pattern: /registr(ar?|a|o)\s*(una?\s*)?llegada/, weight: 12 },
    ],
    antiPatterns: [/categori/, /proveedor/],
  },

  // ── CREAR PRODUCTO ────────────────────────────────────────────────
  {
    intent: "create_product",
    triggers: [
      { pattern: /cre(ar?|o|a)\s*(un\s*)?(nuevo\s*)?producto/, weight: 12 },
      { pattern: /nuevo\s*producto/, weight: 10 },
      { pattern: /agreg(ar?|o|a)\s*(un\s*)?(nuevo\s*)?producto/, weight: 10 },
      { pattern: /registr(ar?|o|a)\s*(un\s*)?(nuevo\s*)?producto/, weight: 10 },
      { pattern: /anad(ir|e)\s*(un\s*)?producto/, weight: 10 },
      { pattern: /dar\s*de\s*alta\s*(un\s*)?producto/, weight: 10 },
    ],
  },

  // ── EDITAR PRODUCTO ───────────────────────────────────────────────
  {
    intent: "edit_product",
    triggers: [
      { pattern: /edit(ar?|o|a)\s*(el\s*)?producto/, weight: 10 },
      { pattern: /modific(ar?|o|a)\s*(el\s*)?producto/, weight: 10 },
      { pattern: /cambi(ar?|o|a)\s*(el\s*)?(nombre|precio|stock|dato)/, weight: 8 },
      { pattern: /actualiz(ar?|o|a)\s*(el\s*)?(producto|nombre|dato)/, weight: 9 },
      { pattern: /renombr(ar?|o|a)/, weight: 7 },
    ],
  },

  // ── ELIMINAR PRODUCTO ─────────────────────────────────────────────
  {
    intent: "delete_product",
    triggers: [
      { pattern: /elimin(ar?|o|a)\s*(el\s*)?producto/, weight: 10 },
      { pattern: /borr(ar?|o|a)\s*(el\s*)?producto/, weight: 10 },
      { pattern: /quit(ar?|o|a)\s*(el\s*)?producto/, weight: 9 },
      { pattern: /dar\s*de\s*baja\s*(el\s*)?producto/, weight: 10 },
      { pattern: /sac(ar?|o|a)\s*del\s*catalogo/, weight: 8 },
    ],
  },

  // ── BUSCAR PRODUCTO ───────────────────────────────────────────────
  {
    intent: "search_product",
    triggers: [
      { pattern: /busc(ar?|o|a)\s*(un\s*)?(producto)?/, weight: 7 },
      { pattern: /encontr(ar?|a|o)/, weight: 6 },
      { pattern: /donde\s*(esta|hay|queda|tienen)/, weight: 7 },
      { pattern: /necesito\s*(un|el|la)/, weight: 4 },
      { pattern: /tien(e[ns]?|o)\s*(el|la|un)/, weight: 4 },
    ],
    antiPatterns: [/stock/, /cuant/, /precio/, /cuesta/, /vale/],
  },

  // ── LISTAR PRODUCTOS ──────────────────────────────────────────────
  {
    intent: "list_products",
    triggers: [
      { pattern: /list(ar?|a|o)\s*(los?\s*)?(todo[s]?\s*)?(los?\s*)?producto/, weight: 10 },
      { pattern: /mostrar?\s*(todo[s]?\s*)?(los?\s*)?producto/, weight: 10 },
      { pattern: /ver\s*(todo[s]?\s*)?(los?\s*)?producto/, weight: 9 },
      { pattern: /que\s*productos?\s*(hay|tenemos|existen)/, weight: 10 },
      { pattern: /inventario\s*completo/, weight: 8 },
      { pattern: /catalogo/, weight: 7 },
    ],
  },

  // ── CONSULTAR PRECIO ──────────────────────────────────────────────
  {
    intent: "check_price",
    triggers: [
      { pattern: /preci(o|os)(\s*de)?/, weight: 10 },
      { pattern: /cuant(o|os?)\s*(cuesta|vale|es|sale)/, weight: 12 },
      { pattern: /a\s*cuanto\s*(esta|se\s*vende|se\s*da)/, weight: 10 },
      { pattern: /valor\s*(de|del)/, weight: 8 },
      { pattern: /cuanto\s*(cobr|pag)/, weight: 8 },
      { pattern: /a\s*como\s*(esta|se|lo|la|el)/, weight: 9 },
    ],
  },

  // ── CONSULTAR STOCK ───────────────────────────────────────────────
  {
    intent: "check_stock",
    triggers: [
      { pattern: /stock\s*(de|del|actual)?/, weight: 10 },
      { pattern: /cuant(o|a|os|as)\s*(hay|queda|tienen|tenemos|existe)/, weight: 12 },
      { pattern: /cuant(o|a|os|as)\s*\w+\s*(hay|queda)/, weight: 10 },
      { pattern: /disponib(le|ilidad)/, weight: 8 },
      { pattern: /hay\s+\w+\s*(en\s*)?(stock|inventario|bodega)/, weight: 9 },
      { pattern: /quedan?\s+\w*/, weight: 5 },
      { pattern: /existencia/, weight: 8 },
    ],
    antiPatterns: [/precio/, /cuesta/, /vale/],
  },

  // ── CAMBIAR PRECIO ────────────────────────────────────────────────
  {
    intent: "set_price",
    triggers: [
      { pattern: /cambi(ar?|o|a)\s*(el\s*)?preci/, weight: 10 },
      { pattern: /pon(er|le|go|ga)\s*(el\s*)?preci/, weight: 10 },
      { pattern: /actualiz(ar?|o|a)\s*(el\s*)?preci/, weight: 10 },
      { pattern: /subir\s*(el\s*)?preci/, weight: 9 },
      { pattern: /bajar\s*(el\s*)?preci/, weight: 9 },
      { pattern: /nuevo\s*preci/, weight: 8 },
      { pattern: /que\s*(cueste|valga)\s*\d/, weight: 10 },
    ],
  },

  // ── CAMBIAR STOCK ─────────────────────────────────────────────────
  {
    intent: "set_stock",
    triggers: [
      { pattern: /cambi(ar?|o|a)\s*(el\s*)?stock/, weight: 10 },
      { pattern: /pon(er|le|go|ga)\s*(el\s*)?stock/, weight: 10 },
      { pattern: /ajust(ar?|o|a)\s*(el\s*)?stock/, weight: 10 },
      { pattern: /actualiz(ar?|o|a)\s*(el\s*)?stock/, weight: 10 },
      { pattern: /corregir\s*(el\s*)?stock/, weight: 9 },
      { pattern: /fij(ar?|o|a)\s*(el\s*)?stock\s*(en\s*)?\d/, weight: 10 },
    ],
  },

  // ── CREAR CATEGORÍA ───────────────────────────────────────────────
  {
    intent: "create_category",
    triggers: [
      { pattern: /cre(ar?|o|a)\s*(una?\s*)?(nueva?\s*)?categori/, weight: 12 },
      { pattern: /nueva?\s*categori/, weight: 10 },
      { pattern: /agreg(ar?|o|a)\s*(una?\s*)?(nueva?\s*)?categori/, weight: 10 },
      { pattern: /anad(ir|e)\s*(una?\s*)?categori/, weight: 10 },
      { pattern: /registr(ar?|o|a)\s*(una?\s*)?categori/, weight: 10 },
      { pattern: /categori(a|as)\s*(que\s*(se\s*llame|diga)|llamada|nombre)/, weight: 11 },
      { pattern: /categori(a|as)\s+\w+/, weight: 6 },
    ],
    antiPatterns: [/elimin/, /borr/, /quit/],
  },

  // ── ELIMINAR CATEGORÍA ────────────────────────────────────────────
  {
    intent: "delete_category",
    triggers: [
      { pattern: /elimin(ar?|o|a)\s*(la\s*)?categori/, weight: 10 },
      { pattern: /borr(ar?|o|a)\s*(la\s*)?categori/, weight: 10 },
      { pattern: /quit(ar?|o|a)\s*(la\s*)?categori/, weight: 10 },
    ],
  },

  // ── LISTAR CATEGORÍAS ─────────────────────────────────────────────
  {
    intent: "list_categories",
    triggers: [
      { pattern: /list(ar?|a|o)\s*(las?\s*)?(toda[s]?\s*)?(las?\s*)?categori/, weight: 10 },
      { pattern: /mostrar?\s*(las?\s*)?categori/, weight: 10 },
      { pattern: /ver\s*(las?\s*)?categori/, weight: 9 },
      { pattern: /que\s*categori(a|as)\s*(hay|tenemos|existen)/, weight: 10 },
      { pattern: /cuales?\s*(son\s*)?(las?\s*)?categori/, weight: 10 },
    ],
  },

  // ── CREAR PROVEEDOR ───────────────────────────────────────────────
  {
    intent: "create_supplier",
    triggers: [
      { pattern: /cre(ar?|o|a)\s*(un\s*)?(nuevo\s*)?proveedor/, weight: 12 },
      { pattern: /nuevo\s*proveedor/, weight: 10 },
      { pattern: /agreg(ar?|o|a)\s*(un\s*)?(nuevo\s*)?proveedor/, weight: 10 },
      { pattern: /registr(ar?|o|a)\s*(un\s*)?(nuevo\s*)?proveedor/, weight: 10 },
    ],
  },

  // ── ELIMINAR PROVEEDOR ────────────────────────────────────────────
  {
    intent: "delete_supplier",
    triggers: [
      { pattern: /elimin(ar?|o|a)\s*(el\s*)?proveedor/, weight: 10 },
      { pattern: /borr(ar?|o|a)\s*(el\s*)?proveedor/, weight: 10 },
      { pattern: /quit(ar?|o|a)\s*(el\s*)?proveedor/, weight: 9 },
    ],
  },

  // ── LISTAR PROVEEDORES ────────────────────────────────────────────
  {
    intent: "list_suppliers",
    triggers: [
      { pattern: /list(ar?|a|o)\s*(los?\s*)?(todo[s]?\s*)?(los?\s*)?proveed/, weight: 10 },
      { pattern: /mostrar?\s*(los?\s*)?proveed/, weight: 10 },
      { pattern: /ver\s*(los?\s*)?proveed/, weight: 9 },
      { pattern: /que\s*proveedor(es)?\s*(hay|tenemos|existen)/, weight: 10 },
      { pattern: /quienes?\s*(son\s*)?(los?\s*)?proveedor/, weight: 10 },
    ],
  },

  // ── PRÉSTAMOS ─────────────────────────────────────────────────────
  {
    intent: "create_loan",
    triggers: [
      { pattern: /prest(ar?|o|a|ame|emos)/, weight: 10 },
      { pattern: /registr(ar?|o|a)\s*(un\s*)?prestamo/, weight: 12 },
      { pattern: /dar\s*(le\s*)?fi(ar|ado|o)/, weight: 10 },
      { pattern: /fi(ar|ado)/, weight: 10 },
      { pattern: /dar\s*a\s*credito/, weight: 9 },
      { pattern: /aplaz(ar?|o|a)\s*(el\s*)?pago/, weight: 8 },
    ],
  },

  {
    intent: "return_loan",
    triggers: [
      { pattern: /devolv(er|io|ieron|emos)/, weight: 10 },
      { pattern: /devolucion/, weight: 10 },
      { pattern: /pag(o|ar?|aron|amos)\s*(el\s*)?prestamo/, weight: 12 },
      { pattern: /cobr(ar?|o|e)\s*(el\s*)?prestamo/, weight: 10 },
      { pattern: /liquid(ar?|o|a)\s*(el\s*)?prestamo/, weight: 10 },
      { pattern: /saldar?\s*(la\s*)?deuda/, weight: 9 },
      { pattern: /ya\s*pag(o|aron)/, weight: 8 },
    ],
  },

  {
    intent: "list_loans",
    triggers: [
      { pattern: /list(ar?|a|o)\s*(los?\s*)?prestamo/, weight: 10 },
      { pattern: /mostrar?\s*(los?\s*)?prestamo/, weight: 10 },
      { pattern: /ver\s*(los?\s*)?prestamo/, weight: 9 },
      { pattern: /quien(es)?\s*(me\s*)?(deb|fian)/, weight: 10 },
      { pattern: /deuda|fiado|credito/, weight: 7 },
      { pattern: /prestamo(s)?\s*pendiente/, weight: 10 },
    ],
  },

  // ── ALERTAS STOCK BAJO ────────────────────────────────────────────
  {
    intent: "low_stock_alert",
    triggers: [
      { pattern: /alert(a|as)(\s*de\s*stock)?/, weight: 10 },
      { pattern: /stock\s*(bajo|critico|minimo)/, weight: 12 },
      { pattern: /que\s*(producto|se)\s*(est[ae]|anda)\s*(agotando|acabando|terminando)/, weight: 10 },
      { pattern: /product(o|os)\s*(con\s*)?(poco|bajo)\s*stock/, weight: 10 },
      { pattern: /que\s*(hace\s*)?falta|que\s*se\s*acab/, weight: 7 },
      { pattern: /necesit(o|amos)\s*(comprar|pedir|reponer)/, weight: 7 },
      { pattern: /reabastecer|resurtir/, weight: 7 },
    ],
  },

  // ── RESUMEN / DASHBOARD ───────────────────────────────────────────
  {
    intent: "dashboard_summary",
    triggers: [
      { pattern: /resumen(\s*de(l)?\s*(dia|hoy|ventas|negocio))?/, weight: 10 },
      { pattern: /como\s*(va|esta|estamos|anda|anduvo)\s*(el\s*)?(negocio|dia|tienda|local)?/, weight: 10 },
      { pattern: /reporte\s*(del?\s*)?(dia|hoy|diario)/, weight: 9 },
      { pattern: /estado\s*(del?\s*)?(negocio|tienda|inventario)/, weight: 9 },
      { pattern: /cuanto\s*(llev|vendi|gan)\w*\s*(hoy|hemos)/, weight: 10 },
      { pattern: /ventas\s*(de\s*)?(hoy|del\s*dia)/, weight: 8 },
      { pattern: /total\s*(de\s*)?(hoy|ventas|del\s*dia)/, weight: 8 },
      { pattern: /ganancia|utilidad|ingreso/, weight: 7 },
    ],
  },

  // ── MEJORES VENDIDOS ──────────────────────────────────────────────
  {
    intent: "best_sellers",
    triggers: [
      { pattern: /mas\s*vendid(o|os|a|as)/, weight: 12 },
      { pattern: /mejor(es)?\s*vendid/, weight: 12 },
      { pattern: /que\s*(se\s*)?(vend|sal)\w*\s*mas/, weight: 10 },
      { pattern: /product(o|os)\s*popular(es)?/, weight: 8 },
      { pattern: /top\s*(de\s*)?(venta|producto)/, weight: 9 },
    ],
  },

  // ── NAVEGACIÓN ────────────────────────────────────────────────────
  {
    intent: "navigate",
    triggers: [
      { pattern: /ir\s*a\s*(la\s*)?(pagina|seccion|pantalla)?\s*de?\s*/, weight: 8 },
      { pattern: /abr(ir|e|eme)\s*(la\s*)?(pagina|seccion)?\s*(de\s*)?/, weight: 8 },
      { pattern: /llev(ar|a|ame)\s*a\s*(la\s*)?/, weight: 7 },
      { pattern: /mostrar?\s*(la\s*)?(pagina|seccion)\s*(de\s*)?/, weight: 6 },
      { pattern: /quiero\s*(ir|ver)\s*(a\s*)?(la\s*)?/, weight: 5 },
    ],
  },

  // ── AYUDA ─────────────────────────────────────────────────────────
  {
    intent: "help",
    triggers: [
      { pattern: /ayuda/, weight: 10 },
      { pattern: /que\s*(puedo|puede[s]?)\s*(hacer|decir|pedir)/, weight: 12 },
      { pattern: /como\s*(funciona|uso|se\s*usa)/, weight: 10 },
      { pattern: /instrucciones|tutorial|guia|comandos/, weight: 8 },
      { pattern: /que\s*entiendes|que\s*sabes\s*hacer/, weight: 10 },
      { pattern: /capacidad(es)?|funcion(es)?/, weight: 6 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*                     ENTITY EXTRACTION                               */
/* ------------------------------------------------------------------ */

function extractQuantity(text: string): number | null {
  const processed = replaceNumberWords(text);

  // "X unidades/botellas/cajas/etc"
  const unitMatch = processed.match(/(\d+(?:\.\d+)?)\s*(unidad|botella|caja|lata|pieza|kilo|litro|paquete|pack|six|cajon)/);
  if (unitMatch) return parseFloat(unitMatch[1]);

  // Number near action words
  const nums = [...processed.matchAll(/\b(\d+(?:\.\d+)?)\b/g)];
  if (nums.length === 1) return parseFloat(nums[0][1]);

  // If multiple numbers, pick the one that looks like a quantity (not price)
  if (nums.length > 1) {
    for (const m of nums) {
      const val = parseFloat(m[1]);
      if (val >= 1 && val <= 1000) return val;
    }
  }

  return null;
}

function extractPrice(text: string): number | null {
  const processed = replaceNumberWords(text);

  // "a 15 bolivianos" / "por 20 bs" / "precio 30"
  const priceMatch = processed.match(/(?:a|por|precio|preci)\s*(\d+(?:\.\d+)?)\s*(bs|bolivian|pesos|bob)?/);
  if (priceMatch) return parseFloat(priceMatch[1]);

  // "15 bs" / "20 bolivianos"
  const bsMatch = processed.match(/(\d+(?:\.\d+)?)\s*(bs|bolivian|pesos|bob)/);
  if (bsMatch) return parseFloat(bsMatch[1]);

  return null;
}

function extractPerson(text: string): string | null {
  const norm = normalize(text);

  // "a Juan / para María / le presté a Pedro / fiado a Carlos"
  const patterns = [
    /(?:prest\w*|fi\w*|dar\w*|cobr\w*)\s+(?:a|para)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][\wáéíóúñ]*(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ][\wáéíóúñ]*)?)/i,
    /\b(?:a|para)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][\wáéíóúñ]*(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ][\wáéíóúñ]*)?)\s*$/i,
    /\bde\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][\wáéíóúñ]*)\s*(?:pago|devol)/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1].length > 1) {
      const name = m[1].trim();
      // Filter out common non-name words
      const stopWords = new Set(["el", "la", "los", "las", "un", "una", "del", "de", "en", "por", "con", "se", "mi", "su", "que", "como", "mas", "todo", "esta", "hay", "stock", "inventario", "producto", "categoria", "proveedor"]);
      if (!stopWords.has(name.toLowerCase())) return name;
    }
  }

  return null;
}

function extractNames(text: string): string[] {
  // Extract multiple names from text like "cerveza y chicles" or "1 que diga cerveza y otro que diga chicles"
  const norm = text;

  // Remove action keywords
  let cleaned = norm
    .replace(/^.*?(?:crear?|nueva?|agreg\w*|registr\w*|anadi\w*)\s*(?:las?\s*)?(?:categorias?\s*)?/i, "")
    .replace(/^.*?(?:que\s+(?:se\s+llam|dig)en?)\s*/i, "")
    .trim();

  if (!cleaned) cleaned = norm;

  // Split by: "y", commas, numbers+que, "otro que diga"
  const parts = cleaned
    .split(/(?:\s*,\s*|\s+y\s+|\s*\d+\s*(?:que\s+(?:se\s+llame|diga)\s+)?|(?:otr[oa]\s+(?:que\s+)?(?:se\s+llame|diga)\s+))/i)
    .map((p) =>
      p
        .replace(/^(?:que\s+(?:se\s+llame|diga)\s*)/i, "")
        .replace(/^(?:la\s+|el\s+|una?\s+)/i, "")
        .trim()
    )
    .filter((p) => p.length > 1 && !/^(?:otro|que|se|categori|proveedor)/i.test(p));

  return parts;
}

function extractDestination(text: string): string | null {
  const norm = normalize(text);

  const routes: Record<string, string> = {
    "producto": "/productos",
    "venta": "/ventas",
    "llegada": "/llegadas",
    "prestamo": "/prestamos",
    "proveedor": "/proveedores",
    "categoria": "/configuracion",
    "configuracion": "/configuracion",
    "reporte": "/reportes",
    "analisis": "/analisis",
    "prediccion": "/predicciones",
    "recomendacion": "/recomendaciones",
    "voz": "/voz",
    "imagen": "/imagen",
    "inicio": "/",
    "dashboard": "/",
    "panel": "/",
  };

  for (const [keyword, route] of Object.entries(routes)) {
    if (norm.includes(keyword)) return route;
  }

  return null;
}

/* ── Product creation entity extraction ─────────────────────────── */

function extractNewProductName(text: string): string | null {
  const norm = normalize(text);

  // Patterns: "crear producto X ...", "nuevo producto X ...", "agregar producto X ...", "registrar producto X ..."
  const triggers = [
    /(?:crear?|nuevo|nueva|agreg\w*|registr\w*|anadi\w*|meter)\s+(?:el\s+)?(?:producto\s+)?/,
    /(?:producto\s+(?:nuevo|nueva)\s+)/,
    /(?:nuevo\s+producto\s+)/,
  ];

  let afterTrigger = "";
  for (const trigger of triggers) {
    const m = norm.match(trigger);
    if (m && m.index !== undefined) {
      afterTrigger = norm.slice(m.index + m[0].length).trim();
      break;
    }
  }

  if (!afterTrigger) return null;

  // Remove everything from the first modifier keyword onwards
  const modifiers = /\s+(?:en\s+(?:la\s+)?categori|categori|precio|a\s+\d|por\s+\d|con\s+stock|stock\s+\d|compra|venta|minimo|bolivian|bs\b|\d+\s*bs)/;
  const modMatch = afterTrigger.match(modifiers);
  const productName = modMatch && modMatch.index !== undefined
    ? afterTrigger.slice(0, modMatch.index).trim()
    : afterTrigger.trim();

  if (!productName || productName.length < 2) return null;

  // Capitalize each word
  return productName
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractCategoryFromText(text: string): string | null {
  const norm = normalize(text);

  // "en categoría X", "de la categoría X", "categoría X"
  const patterns = [
    /(?:en\s+(?:la\s+)?|de\s+(?:la\s+)?)?categori\w*\s+(.+?)(?:\s+(?:precio|a\s+\d|por\s+\d|con\s+stock|stock|compra|venta|minimo|\d+\s*bs)|$)/,
  ];

  for (const p of patterns) {
    const m = norm.match(p);
    if (m && m[1]) {
      const catName = m[1].trim().replace(/\s+(?:y|,)\s*$/, "").trim();
      if (catName.length >= 2) {
        return catName.charAt(0).toUpperCase() + catName.slice(1);
      }
    }
  }

  return null;
}

function extractSellPrice(text: string): number | null {
  const processed = replaceNumberWords(normalize(text));

  // "precio venta 15" or "venta 15 bs" or "precio de venta 15"
  const sellMatch = processed.match(/(?:precio\s+(?:de\s+)?)?venta\s+(?:a\s+)?(\d+(?:\.\d+)?)/);
  if (sellMatch) return parseFloat(sellMatch[1]);

  // "a 15 bs" or "precio 15" (default = sell price if no "compra" nearby)
  const genericPriceMatch = processed.match(/(?:a|precio)\s+(\d+(?:\.\d+)?)\s*(?:bs|bolivian|pesos|bob)?/);
  if (genericPriceMatch) {
    // Make sure it's not marked as "compra"
    const before = processed.slice(0, genericPriceMatch.index ?? 0);
    if (!before.match(/compr\w*\s*$/)) {
      return parseFloat(genericPriceMatch[1]);
    }
  }

  // "15 bs" standalone (if no compra context)
  const bsMatch = processed.match(/(\d+(?:\.\d+)?)\s*(?:bs|bolivian|pesos|bob)/);
  if (bsMatch) {
    const idx = bsMatch.index ?? 0;
    const before = processed.slice(Math.max(0, idx - 20), idx);
    if (!before.match(/compr\w*/)) {
      return parseFloat(bsMatch[1]);
    }
  }

  return null;
}

function extractBuyPrice(text: string): number | null {
  const processed = replaceNumberWords(normalize(text));

  // "precio compra 10" or "compra 10 bs" or "costo 10"
  const buyMatch = processed.match(/(?:precio\s+(?:de\s+)?)?(?:compra|costo)\s+(?:a\s+)?(\d+(?:\.\d+)?)/);
  if (buyMatch) return parseFloat(buyMatch[1]);

  return null;
}

function extractInitialStock(text: string): number | null {
  const processed = replaceNumberWords(normalize(text));

  // "con stock 10" or "stock inicial 5" or "stock 20"
  const stockMatch = processed.match(/(?:con\s+)?stock\s+(?:inicial\s+)?(\d+)/);
  if (stockMatch) return parseInt(stockMatch[1]);

  return null;
}

function fuzzyMatchProduct(text: string, products: any[]): any | null {
  if (!products.length) return null;
  const fuse = new Fuse(products, {
    keys: ["nombre", "alias"],
    threshold: 0.4,
    includeScore: true,
  });

  const words = text.split(/\s+/);

  // Try multi-word phrases first (6 words down to 2)
  for (let len = Math.min(words.length, 6); len >= 2; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      const res = fuse.search(phrase);
      if (res.length > 0 && res[0].score !== undefined && res[0].score < 0.35) {
        return res[0].item;
      }
    }
  }

  // Single word fallback (stricter threshold)
  for (const word of words) {
    if (word.length >= 3) {
      const res = fuse.search(word);
      if (res.length > 0 && res[0].score !== undefined && res[0].score < 0.25) {
        return res[0].item;
      }
    }
  }

  return null;
}

function fuzzyMatchCategory(text: string, categories: any[]): any | null {
  if (!categories.length) return null;
  const fuse = new Fuse(categories, { keys: ["nombre"], threshold: 0.4, includeScore: true });

  const words = text.split(/\s+/);
  for (let len = Math.min(words.length, 4); len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      const res = fuse.search(phrase);
      if (res.length > 0 && res[0].score !== undefined && res[0].score < 0.3) {
        return res[0].item;
      }
    }
  }
  return null;
}

function fuzzyMatchSupplier(text: string, suppliers: any[]): any | null {
  if (!suppliers.length) return null;
  const fuse = new Fuse(suppliers, { keys: ["nombre"], threshold: 0.4, includeScore: true });

  const words = text.split(/\s+/);
  for (let len = Math.min(words.length, 4); len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      const res = fuse.search(phrase);
      if (res.length > 0 && res[0].score !== undefined && res[0].score < 0.3) {
        return res[0].item;
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*                     MAIN PARSE FUNCTION                             */
/* ------------------------------------------------------------------ */

export function parseCommand(
  text: string,
  context: { products: any[]; categories: any[]; suppliers: any[] }
): ParsedCommand {
  const norm = normalize(text);

  // ── 1. Score each intent ───────────────────────────────────────────
  const scores: { intent: Intent; score: number }[] = [];

  for (const rule of INTENT_RULES) {
    let score = 0;
    let blocked = false;

    if (rule.antiPatterns) {
      for (const ap of rule.antiPatterns) {
        if (ap.test(norm)) { blocked = true; break; }
      }
    }

    if (!blocked) {
      for (const trigger of rule.triggers) {
        if (trigger.pattern.test(norm)) {
          score += trigger.weight;
        }
      }
    }

    if (score > 0) {
      scores.push({ intent: rule.intent, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const bestIntent: Intent = scores.length > 0 ? scores[0].intent : "unknown";
  const bestScore = scores.length > 0 ? scores[0].score : 0;
  const maxPossible = 25; // rough max
  const confidence = Math.min(bestScore / maxPossible, 1);

  // ── 2. Extract entities ────────────────────────────────────────────
  const quantity = extractQuantity(norm);
  const price = extractPrice(norm);
  const person = extractPerson(text); // use original text for capitalization
  const destination = extractDestination(norm);
  const matchedProduct = fuzzyMatchProduct(text, context.products);
  const matchedCategory = fuzzyMatchCategory(text, context.categories);
  const matchedSupplier = fuzzyMatchSupplier(text, context.suppliers);

  // For create_category / create_supplier extract names
  let names: string[] = [];
  let categoryName: string | null = null;
  let supplierName: string | null = null;
  let newProductName: string | null = null;
  let sellPrice: number | null = null;
  let buyPrice: number | null = null;

  if (bestIntent === "create_category" || bestIntent === "delete_category") {
    names = extractNames(text);
    if (names.length > 0) categoryName = names[0];
  } else if (bestIntent === "create_supplier" || bestIntent === "delete_supplier") {
    names = extractNames(text);
    if (names.length > 0) supplierName = names[0];
  }

  // For create_product, extract the new product name, category, and prices
  if (bestIntent === "create_product") {
    newProductName = extractNewProductName(text);
    categoryName = extractCategoryFromText(text);
    sellPrice = extractSellPrice(text);
    buyPrice = extractBuyPrice(text);

    // If no explicit category match but we extracted a name, try fuzzy match
    if (categoryName && !matchedCategory) {
      const catMatch = fuzzyMatchCategory(categoryName, context.categories);
      if (catMatch) {
        // We have an existing category match — update matchedCategory below
      }
    }
  }

  // Also extract category for other intents that mention categories
  if (!categoryName && (bestIntent === "list_products" || bestIntent === "search_product")) {
    categoryName = extractCategoryFromText(text);
  }

  return {
    intent: bestIntent,
    confidence,
    entities: {
      productName: matchedProduct?.nombre ?? null,
      matchedProduct,
      quantity: quantity ?? (bestIntent === "register_sale" || bestIntent === "register_arrival" ? 1 : null),
      price,
      sellPrice,
      buyPrice,
      person,
      categoryName: categoryName ?? (matchedCategory?.nombre ?? null),
      matchedCategory: bestIntent === "create_product" && categoryName
        ? fuzzyMatchCategory(categoryName, context.categories) ?? matchedCategory
        : matchedCategory,
      supplierName,
      matchedSupplier,
      destination,
      names,
      newProductName,
    },
    raw: text,
  };
}

/* ------------------------------------------------------------------ */
/*                     HELP TEXT                                        */
/* ------------------------------------------------------------------ */

export const HELP_TEXT = `
Puedo entender comandos como:

🛒 **Ventas** — "Vender 2 Singani", "Cobrar una cerveza"
📦 **Llegadas** — "Llegaron 10 Paceñas", "Recibí 5 cajas de ron"
🔍 **Stock** — "¿Cuánto hay de whisky?", "¿Queda vodka?"
💰 **Precios** — "¿Cuánto cuesta el Singani?", "Precio del ron"
✏️ **Cambiar precio** — "Pon el precio del ron a 45 bs"
🆕 **Crear producto** — "Crear producto Cerveza Paceña en categoría Cervezas precio 15 bs"
📁 **Categorías** — "Crear categoría Cerveza", "¿Qué categorías hay?"
👤 **Proveedores** — "Nuevo proveedor Juan López", "Ver proveedores"
🤝 **Préstamos** — "Prestar 2 cervezas a Carlos", "Ya pagó María"
📊 **Resumen** — "¿Cómo va el negocio?", "Ventas de hoy"
⚠️ **Alertas** — "¿Qué se está agotando?", "Stock bajo"
🏆 **Top ventas** — "¿Qué se vende más?"
📱 **Navegar** — "Ir a productos", "Abrir reportes"
❓ **Ayuda** — "¿Qué puedes hacer?"

Solo habla naturalmente y yo lo interpreto.
`.trim();
