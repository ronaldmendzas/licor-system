interface DatosVenta {
  fecha: string;
  cantidad: number;
  total: number;
}

interface PrediccionProducto {
  productoId: string;
  nombre: string;
  promediodiario: number;
  tendencia: "subiendo" | "estable" | "bajando";
  diasParaAgotarse: number | null;
  cantidadRecomendada: number;
  ventaEstimadaSemana: number;
}

export function calcularPromedioMovil(
  datos: DatosVenta[],
  ventana: number = 7
): number[] {
  if (datos.length < ventana) return [];
  const resultado: number[] = [];
  for (let i = ventana - 1; i < datos.length; i++) {
    const slice = datos.slice(i - ventana + 1, i + 1);
    const promedio = slice.reduce((s, d) => s + d.cantidad, 0) / ventana;
    resultado.push(Math.round(promedio * 100) / 100);
  }
  return resultado;
}

export function detectarTendencia(promedios: number[]): "subiendo" | "estable" | "bajando" {
  if (promedios.length < 2) return "estable";
  const mitad = Math.floor(promedios.length / 2);
  const primera = promedios.slice(0, mitad);
  const segunda = promedios.slice(mitad);
  const promPrimera = primera.reduce((a, b) => a + b, 0) / primera.length;
  const promSegunda = segunda.reduce((a, b) => a + b, 0) / segunda.length;
  const cambio = ((promSegunda - promPrimera) / promPrimera) * 100;
  if (cambio > 10) return "subiendo";
  if (cambio < -10) return "bajando";
  return "estable";
}

export function estimarDiasParaAgotarse(
  stockActual: number,
  promedioDiario: number
): number | null {
  if (promedioDiario <= 0) return null;
  return Math.ceil(stockActual / promedioDiario);
}

export function calcularRecomendacionCompra(
  promedioDiario: number,
  diasCobertura: number = 14,
  stockActual: number = 0,
  stockMinimo: number = 0
): number {
  const necesario = Math.ceil(promedioDiario * diasCobertura);
  const recomendado = Math.max(necesario - stockActual + stockMinimo, 0);
  return recomendado;
}

export function generarPrediccion(
  productoId: string,
  nombre: string,
  ventas: DatosVenta[],
  stockActual: number,
  stockMinimo: number
): PrediccionProducto {
  const promedios = calcularPromedioMovil(ventas);
  const promedioDiario =
    ventas.length > 0
      ? ventas.reduce((s, v) => s + v.cantidad, 0) / Math.max(ventas.length, 1)
      : 0;

  return {
    productoId,
    nombre,
    promediodiario: Math.round(promedioDiario * 100) / 100,
    tendencia: detectarTendencia(promedios),
    diasParaAgotarse: estimarDiasParaAgotarse(stockActual, promedioDiario),
    cantidadRecomendada: calcularRecomendacionCompra(
      promedioDiario,
      14,
      stockActual,
      stockMinimo
    ),
    ventaEstimadaSemana: Math.round(promedioDiario * 7),
  };
}

export function clasificarABC(
  productos: { id: string; nombre: string; totalVentas: number }[]
): Map<string, "A" | "B" | "C"> {
  const ordenados = [...productos].sort((a, b) => b.totalVentas - a.totalVentas);
  const totalGeneral = ordenados.reduce((s, p) => s + p.totalVentas, 0);

  const clasificacion = new Map<string, "A" | "B" | "C">();
  let acumulado = 0;

  for (const producto of ordenados) {
    acumulado += producto.totalVentas;
    const porcentaje = totalGeneral > 0 ? (acumulado / totalGeneral) * 100 : 0;

    if (porcentaje <= 80) {
      clasificacion.set(producto.id, "A");
    } else if (porcentaje <= 95) {
      clasificacion.set(producto.id, "B");
    } else {
      clasificacion.set(producto.id, "C");
    }
  }

  return clasificacion;
}
