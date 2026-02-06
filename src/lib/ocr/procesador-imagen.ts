import Tesseract from "tesseract.js";

interface ResultadoOCR {
  texto: string;
  confianza: number;
  lineas: string[];
}

interface DatosFactura {
  proveedor: string | null;
  fecha: string | null;
  numero: string | null;
  items: ItemFactura[];
  total: number | null;
}

interface ItemFactura {
  descripcion: string;
  cantidad: number;
  precio: number;
}

export async function procesarImagenOCR(
  imagen: File | string,
  onProgreso?: (progreso: number) => void
): Promise<ResultadoOCR> {
  const resultado = await Tesseract.recognize(imagen, "spa", {
    logger: (info) => {
      if (info.status === "recognizing text" && onProgreso) {
        onProgreso(Math.round(info.progress * 100));
      }
    },
  });

  const lineas = resultado.data.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    texto: resultado.data.text,
    confianza: resultado.data.confidence,
    lineas,
  };
}

export function extraerDatosFactura(lineas: string[]): DatosFactura {
  const datos: DatosFactura = {
    proveedor: null,
    fecha: null,
    numero: null,
    items: [],
    total: null,
  };

  for (const linea of lineas) {
    const lineaLower = linea.toLowerCase();

    if (!datos.fecha) {
      const fechaMatch = linea.match(
        /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/
      );
      if (fechaMatch) {
        datos.fecha = fechaMatch[0];
      }
    }

    if (!datos.numero) {
      const numMatch = linea.match(
        /(?:factura|nro|n[°ú]mero|nota|recibo)\s*[:#]?\s*(\d+)/i
      );
      if (numMatch) {
        datos.numero = numMatch[1];
      }
    }

    if (lineaLower.includes("total") && !datos.total) {
      const totalMatch = linea.match(/[\d,.]+/);
      if (totalMatch) {
        datos.total = parseFloat(totalMatch[0].replace(",", "."));
      }
    }

    const itemMatch = linea.match(
      /(\d+)\s+(.+?)\s+([\d,.]+)\s*(?:bs|bob)?$/i
    );
    if (itemMatch) {
      datos.items.push({
        cantidad: parseInt(itemMatch[1]),
        descripcion: itemMatch[2].trim(),
        precio: parseFloat(itemMatch[3].replace(",", ".")),
      });
    }
  }

  if (!datos.proveedor && lineas.length > 0) {
    datos.proveedor = lineas[0];
  }

  return datos;
}
