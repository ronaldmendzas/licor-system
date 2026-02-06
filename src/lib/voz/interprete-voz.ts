import Fuse from "fuse.js";
import type { Producto } from "@/types";

interface ComandoVoz {
  tipo: "venta" | "llegada" | "prestamo" | "consulta" | "correccion" | "desconocido";
  productos: { nombre: string; cantidad: number; productoId?: string }[];
  persona?: string;
  garantia?: number;
  proveedor?: string;
  consultaTipo?: "stock" | "ventas_hoy" | "ventas_semana" | "bajo_minimo" | "mejor_producto" | "dinero_hoy";
  textoOriginal: string;
}

const PATRONES_VENTA = [
  /vend[ií]\s/i,
  /salieron?\s/i,
  /se\s+(?:fueron?|llevaron?)\s/i,
  /venta[:\s]/i,
];

const PATRONES_LLEGADA = [
  /llegaron?\s/i,
  /ingreso[:\s]/i,
  /recib[ií]\s/i,
  /entr(?:ó|aron)\s/i,
];

const PATRONES_PRESTAMO = [
  /pr[eé]stamo[:\s]/i,
  /prest[eéó]\s/i,
  /fi(?:ó|aron)\s/i,
];

const PATRONES_DEVOLUCION = [
  /devolvieron?\s/i,
  /devoluci[oó]n/i,
  /regres(?:ó|aron)\s/i,
];

const PATRONES_CONSULTA: [RegExp, ComandoVoz["consultaTipo"]][] = [
  [/cu[aá]nt[ao]s?\s.*tengo/i, "stock"],
  [/stock\s/i, "stock"],
  [/qu[eé]\s+se\s+vendi[oó]\s+hoy/i, "ventas_hoy"],
  [/qu[eé]\s+vend[ií]\s+hoy/i, "ventas_hoy"],
  [/cu[aá]nto\s+vend[ií]\s+esta\s+semana/i, "ventas_semana"],
  [/cu[aá]nto\s+dinero\s+hice\s+hoy/i, "dinero_hoy"],
  [/qu[eé]\s+debo\s+pedir/i, "bajo_minimo"],
  [/bajo\s+(?:el\s+)?m[ií]nimo/i, "bajo_minimo"],
  [/mejor\s+producto/i, "mejor_producto"],
  [/qu[eé]\s+vend[ií]\s+m[aá]s/i, "mejor_producto"],
];

const PATRONES_CORRECCION = [
  /no[,]?\s+(?:espera|eran?|fueron?)\s/i,
  /correg(?:ir|ido)\s/i,
  /era[n]?\s+\d+/i,
];

function extraerProductosYCantidades(texto: string): { nombre: string; cantidad: number }[] {
  const resultados: { nombre: string; cantidad: number }[] = [];
  const patron = /(\d+)\s+([a-záéíóúñü\s]+?)(?:,|y\s|\.|$)/gi;
  let match;

  while ((match = patron.exec(texto)) !== null) {
    const cantidad = parseInt(match[1]);
    const nombre = match[2].trim();
    if (cantidad > 0 && nombre.length > 1) {
      resultados.push({ cantidad, nombre });
    }
  }

  if (resultados.length === 0) {
    const patronSimple = /(\d+)\s+([a-záéíóúñü]+)/gi;
    while ((match = patronSimple.exec(texto)) !== null) {
      const cantidad = parseInt(match[1]);
      const nombre = match[2].trim();
      if (cantidad > 0 && nombre.length > 1) {
        resultados.push({ cantidad, nombre });
      }
    }
  }

  return resultados;
}

function extraerPersona(texto: string): string | undefined {
  const patron = /(?:a|para)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/;
  const match = texto.match(patron);
  return match ? match[1] : undefined;
}

function extraerGarantia(texto: string): number | undefined {
  const patron = /(\d+(?:\.\d+)?)\s*(?:bolivianos?|bs\.?|bob)/i;
  const match = texto.match(patron);
  return match ? parseFloat(match[1]) : undefined;
}

export function resolverProductos(
  items: { nombre: string; cantidad: number }[],
  productosDB: Producto[]
): ComandoVoz["productos"] {
  const fuse = new Fuse(productosDB, {
    keys: ["nombre", "alias"],
    threshold: 0.4,
    includeScore: true,
  });

  return items.map((item) => {
    const resultados = fuse.search(item.nombre);
    if (resultados.length > 0) {
      return {
        nombre: resultados[0].item.nombre,
        cantidad: item.cantidad,
        productoId: resultados[0].item.id,
      };
    }
    return { nombre: item.nombre, cantidad: item.cantidad };
  });
}

export function interpretarComando(texto: string): ComandoVoz {
  const base: ComandoVoz = {
    tipo: "desconocido",
    productos: [],
    textoOriginal: texto,
  };

  for (const patron of PATRONES_CORRECCION) {
    if (patron.test(texto)) {
      const items = extraerProductosYCantidades(texto);
      return { ...base, tipo: "correccion", productos: items.map((i) => ({ ...i })) };
    }
  }

  for (const [patron, consultaTipo] of PATRONES_CONSULTA) {
    if (patron.test(texto)) {
      const items = extraerProductosYCantidades(texto);
      return {
        ...base,
        tipo: "consulta",
        consultaTipo,
        productos: items.map((i) => ({ ...i })),
      };
    }
  }

  for (const patron of PATRONES_PRESTAMO) {
    if (patron.test(texto)) {
      const items = extraerProductosYCantidades(texto);
      return {
        ...base,
        tipo: "prestamo",
        productos: items.map((i) => ({ ...i })),
        persona: extraerPersona(texto),
        garantia: extraerGarantia(texto),
      };
    }
  }

  if (PATRONES_DEVOLUCION.some((p) => p.test(texto))) {
    const items = extraerProductosYCantidades(texto);
    return {
      ...base,
      tipo: "prestamo",
      productos: items.map((i) => ({ ...i })),
      persona: extraerPersona(texto),
    };
  }

  for (const patron of PATRONES_LLEGADA) {
    if (patron.test(texto)) {
      const items = extraerProductosYCantidades(texto);
      return { ...base, tipo: "llegada", productos: items.map((i) => ({ ...i })) };
    }
  }

  for (const patron of PATRONES_VENTA) {
    if (patron.test(texto)) {
      const items = extraerProductosYCantidades(texto);
      return { ...base, tipo: "venta", productos: items.map((i) => ({ ...i })) };
    }
  }

  const items = extraerProductosYCantidades(texto);
  if (items.length > 0) {
    return { ...base, tipo: "venta", productos: items.map((i) => ({ ...i })) };
  }

  return base;
}
