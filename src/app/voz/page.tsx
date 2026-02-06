"use client";

import { useState, useEffect } from "react";
import ShellApp from "@/components/layout/shell-app";
import { useReconocimientoVoz } from "@/hooks/use-reconocimiento-voz";
import { interpretarComando, resolverProductos } from "@/lib/voz/interprete-voz";
import { useAppStore } from "@/store/app-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Tarjeta from "@/components/ui/tarjeta";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface MensajeChat {
  rol: "usuario" | "sistema";
  texto: string;
}

export default function PaginaVoz() {
  const { escuchando, texto, iniciar, detener, soportado } = useReconocimientoVoz();
  const productos = useAppStore((s) => s.productos);
  const cargarProductos = useAppStore((s) => s.cargarProductos);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [procesando, setProcesando] = useState(false);

  function agregarMensaje(rol: MensajeChat["rol"], texto: string) {
    setMensajes((prev) => [...prev, { rol, texto }]);
  }

  async function procesarComando(textoVoz: string) {
    if (!textoVoz.trim() || procesando) return;
    setProcesando(true);
    agregarMensaje("usuario", textoVoz);

    const comando = interpretarComando(textoVoz);
    const productosResueltos = resolverProductos(comando.productos, productos);
    comando.productos = productosResueltos;

    const supabase = createClient();

    switch (comando.tipo) {
      case "venta": {
        const exitosos: string[] = [];
        for (const p of comando.productos) {
          if (!p.productoId) {
            agregarMensaje("sistema", `No encontré "${p.nombre}" en el inventario`);
            continue;
          }
          const { error } = await supabase.from("ventas").insert({
            producto_id: p.productoId,
            cantidad: p.cantidad,
            precio_unitario: productos.find((pr) => pr.id === p.productoId)?.precio_venta || 0,
            total: (productos.find((pr) => pr.id === p.productoId)?.precio_venta || 0) * p.cantidad,
          });
          if (!error) exitosos.push(`${p.cantidad}x ${p.nombre}`);
        }
        if (exitosos.length > 0) {
          agregarMensaje("sistema", `Registrado: ${exitosos.join(", ")} vendidas`);
          toast.success("Venta registrada por voz");
          await cargarProductos();
        }
        break;
      }

      case "llegada": {
        const exitosos: string[] = [];
        for (const p of comando.productos) {
          if (!p.productoId) {
            agregarMensaje("sistema", `No encontré "${p.nombre}"`);
            continue;
          }
          const prod = productos.find((pr) => pr.id === p.productoId);
          const { error } = await supabase.from("llegadas").insert({
            producto_id: p.productoId,
            cantidad: p.cantidad,
            precio_compra: prod?.precio_compra || 0,
          });
          if (!error) exitosos.push(`${p.cantidad}x ${p.nombre}`);
        }
        if (exitosos.length > 0) {
          agregarMensaje("sistema", `Llegada registrada: ${exitosos.join(", ")}`);
          toast.success("Llegada registrada por voz");
          await cargarProductos();
        }
        break;
      }

      case "prestamo": {
        if (!comando.persona) {
          agregarMensaje("sistema", "¿A quién se le presta? Dime el nombre");
          break;
        }
        for (const p of comando.productos) {
          if (!p.productoId) continue;
          await supabase.from("prestamos").insert({
            producto_id: p.productoId,
            persona: comando.persona,
            cantidad: p.cantidad,
            garantia_bs: comando.garantia || 0,
          });
        }
        agregarMensaje("sistema",
          `Préstamo registrado a ${comando.persona}${comando.garantia ? `, garantía Bs. ${comando.garantia}` : ""}`
        );
        await cargarProductos();
        break;
      }

      case "consulta": {
        await procesarConsulta(comando.consultaTipo, comando.productos);
        break;
      }

      default:
        agregarMensaje("sistema", "No entendí el comando. Intenta: 'Vendí 5 Pilsen' o '¿Cuántas Pilsen tengo?'");
    }

    setProcesando(false);
  }

  async function procesarConsulta(
    tipo: string | undefined,
    prods: { nombre: string; productoId?: string }[]
  ) {
    const supabase = createClient();

    switch (tipo) {
      case "stock": {
        if (prods.length > 0 && prods[0].productoId) {
          const p = productos.find((pr) => pr.id === prods[0].productoId);
          agregarMensaje("sistema", p ? `${p.nombre}: ${p.stock_actual} unidades en stock` : "Producto no encontrado");
        } else {
          const bajos = productos.filter((p) => p.stock_actual <= p.stock_minimo);
          agregarMensaje("sistema",
            bajos.length > 0
              ? `${bajos.length} productos con stock bajo: ${bajos.map((p) => `${p.nombre} (${p.stock_actual})`).join(", ")}`
              : "Todo el stock está bien"
          );
        }
        break;
      }
      case "ventas_hoy": {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const { data } = await supabase
          .from("ventas")
          .select("cantidad, total, producto:productos(nombre)")
          .gte("fecha", hoy.toISOString());
        if (data && data.length > 0) {
          const total = data.reduce((s, v) => s + v.total, 0);
          agregarMensaje("sistema", `Hoy se vendieron ${data.length} items. Total: Bs. ${total.toFixed(2)}`);
        } else {
          agregarMensaje("sistema", "Hoy no se ha vendido nada aún");
        }
        break;
      }
      case "dinero_hoy": {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const { data } = await supabase
          .from("ventas")
          .select("total")
          .gte("fecha", hoy.toISOString());
        const total = data?.reduce((s, v) => s + v.total, 0) || 0;
        agregarMensaje("sistema", `Hoy has facturado Bs. ${total.toFixed(2)}`);
        break;
      }
      case "bajo_minimo": {
        const bajos = productos.filter((p) => p.stock_actual <= p.stock_minimo);
        if (bajos.length === 0) {
          agregarMensaje("sistema", "No hay productos por debajo del mínimo");
        } else {
          const lista = bajos.map((p) => `${p.nombre}: ${p.stock_actual}/${p.stock_minimo}`).join("\n");
          agregarMensaje("sistema", `Debes pedir:\n${lista}`);
        }
        break;
      }
      default:
        agregarMensaje("sistema", "No tengo datos suficientes para responder eso aún");
    }
  }

  useEffect(() => {
    if (!escuchando && texto) {
      procesarComando(texto);
    }
  }, [escuchando]);

  return (
    <ShellApp titulo="Asistente de Voz">
      <div className="space-y-4">
        <Tarjeta className="text-center">
          <p className="text-xs text-neutral-500 mb-4">
            {soportado
              ? "Presiona el micrófono y habla naturalmente"
              : "Tu navegador no soporta reconocimiento de voz"}
          </p>

          <button
            onClick={escuchando ? detener : iniciar}
            disabled={!soportado || procesando}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
              escuchando
                ? "bg-red-500 animate-pulse scale-110"
                : "bg-purple-600 hover:bg-purple-700"
            } disabled:opacity-50`}
          >
            {escuchando ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {escuchando && (
            <p className="text-sm text-purple-400 mt-3 animate-pulse">
              Escuchando...
            </p>
          )}

          {texto && escuchando && (
            <p className="text-sm text-neutral-300 mt-2 italic">{texto}</p>
          )}
        </Tarjeta>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Conversación
          </h3>

          {mensajes.length === 0 && (
            <Tarjeta className="text-center">
              <p className="text-xs text-neutral-500">
                Prueba diciendo: &ldquo;Vendí 5 Pilsen&rdquo; o &ldquo;¿Qué se vendió hoy?&rdquo;
              </p>
            </Tarjeta>
          )}

          {mensajes.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.rol === "usuario" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-line ${
                  m.rol === "usuario"
                    ? "bg-purple-600 text-white rounded-br-sm"
                    : "bg-neutral-800 text-neutral-200 rounded-bl-sm"
                }`}
              >
                {m.texto}
              </div>
            </div>
          ))}
        </div>

        <Tarjeta>
          <p className="text-xs font-semibold text-neutral-400 mb-2">Comandos de ejemplo:</p>
          <div className="space-y-1 text-xs text-neutral-500">
            <p>&ldquo;Vendí 5 cervezas Pilsen&rdquo;</p>
            <p>&ldquo;Llegaron 50 Pilsen del proveedor&rdquo;</p>
            <p>&ldquo;Préstamo: 2 Pilsen a Juan, dejó 20 bolivianos&rdquo;</p>
            <p>&ldquo;¿Cuántas Pilsen tengo?&rdquo;</p>
            <p>&ldquo;¿Qué se vendió hoy?&rdquo;</p>
            <p>&ldquo;¿Qué debo pedir?&rdquo;</p>
          </div>
        </Tarjeta>
      </div>
    </ShellApp>
  );
}
