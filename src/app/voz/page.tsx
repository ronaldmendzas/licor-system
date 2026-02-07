"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatBs } from "@/lib/utils";
import { parseCommand, HELP_TEXT, type Intent, type ParsedCommand } from "@/lib/voice-ai";

/* ------------------------------------------------------------------ */
/*                           TYPES                                     */
/* ------------------------------------------------------------------ */

interface HistoryEntry {
  text: string;
  intent: Intent;
  success: boolean;
  response: string;
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/*                     COMMAND EXECUTOR                                 */
/* ------------------------------------------------------------------ */

async function executeCommand(
  cmd: ParsedCommand,
  helpers: {
    products: any[];
    categories: any[];
    suppliers: any[];
    loans: any[];
    loadProducts: () => Promise<void>;
    loadCategories: () => Promise<void>;
    loadSuppliers: () => Promise<void>;
    loadLoans: () => Promise<void>;
    loadAll: () => Promise<void>;
    getAlerts: () => any[];
    router: ReturnType<typeof useRouter>;
  }
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();
  const { intent, entities } = cmd;

  switch (intent) {
    // ── VENTA ──────────────────────────────────────────────────────
    case "register_sale": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré el producto. ¿Cuál querés vender?" };
      const qty = entities.quantity ?? 1;
      if (product.stock_actual < qty) {
        return { success: false, message: `Stock insuficiente de ${product.nombre}. Solo quedan ${product.stock_actual}` };
      }
      const total = product.precio_venta * qty;
      const { error } = await supabase.from("ventas").insert({
        producto_id: product.id,
        cantidad: qty,
        precio_unitario: product.precio_venta,
        total,
      });
      if (error) return { success: false, message: "Error al registrar la venta" };
      await helpers.loadProducts();
      return { success: true, message: `✅ Venta: ${qty}× ${product.nombre} = ${formatBs(total)}` };
    }

    // ── LLEGADA ────────────────────────────────────────────────────
    case "register_arrival": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré el producto. ¿Cuál recibiste?" };
      const qty = entities.quantity ?? 1;
      const { error } = await supabase.from("llegadas").insert({
        producto_id: product.id,
        cantidad: qty,
        precio_compra: entities.price ?? product.precio_compra,
      });
      if (error) return { success: false, message: "Error al registrar la llegada" };
      await helpers.loadProducts();
      return { success: true, message: `✅ Llegada: ${qty}× ${product.nombre} registrada` };
    }

    // ── CONSULTAR PRECIO ──────────────────────────────────────────
    case "check_price": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré el producto" };
      return {
        success: true,
        message: `💰 ${product.nombre}:\n• Venta: ${formatBs(product.precio_venta)}\n• Compra: ${formatBs(product.precio_compra)}\n• Ganancia: ${formatBs(product.precio_venta - product.precio_compra)}`,
      };
    }

    // ── CONSULTAR STOCK ───────────────────────────────────────────
    case "check_stock": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré el producto" };
      const status =
        product.stock_actual <= product.stock_minimo ? "⚠️ BAJO" :
        product.stock_actual <= product.stock_minimo * 1.2 ? "⚡ Precaución" :
        "✅ Normal";
      return {
        success: true,
        message: `📦 ${product.nombre}: ${product.stock_actual} unidades\n• Mínimo: ${product.stock_minimo}\n• Estado: ${status}`,
      };
    }

    // ── CAMBIAR PRECIO ────────────────────────────────────────────
    case "set_price": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré el producto" };
      const newPrice = entities.price;
      if (!newPrice || newPrice <= 0) return { success: false, message: "No entendí el nuevo precio. Dí algo como 'Pon el precio de X a 50 bs'" };
      const { error } = await supabase.from("productos").update({ precio_venta: newPrice }).eq("id", product.id);
      if (error) return { success: false, message: "Error al actualizar el precio" };
      await helpers.loadProducts();
      return { success: true, message: `✅ Precio de ${product.nombre} actualizado a ${formatBs(newPrice)}` };
    }

    // ── CAMBIAR STOCK ─────────────────────────────────────────────
    case "set_stock": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré el producto" };
      const qty = entities.quantity;
      if (qty === null || qty < 0) return { success: false, message: "No entendí la cantidad" };
      const { error } = await supabase.from("productos").update({ stock_actual: qty }).eq("id", product.id);
      if (error) return { success: false, message: "Error al actualizar el stock" };
      await helpers.loadProducts();
      return { success: true, message: `✅ Stock de ${product.nombre} ajustado a ${qty} unidades` };
    }

    // ── BUSCAR PRODUCTO ───────────────────────────────────────────
    case "search_product": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré ese producto en el inventario" };
      const cat = product.categorias?.nombre ?? "Sin categoría";
      return {
        success: true,
        message: `🔍 ${product.nombre}\n• Categoría: ${cat}\n• Precio: ${formatBs(product.precio_venta)}\n• Stock: ${product.stock_actual}\n• Compra: ${formatBs(product.precio_compra)}`,
      };
    }

    // ── LISTAR PRODUCTOS ──────────────────────────────────────────
    case "list_products": {
      const count = helpers.products.length;
      if (count === 0) return { success: true, message: "No hay productos registrados" };
      const top5 = helpers.products.slice(0, 5).map((p: any) => `• ${p.nombre} (${p.stock_actual})`).join("\n");
      return { success: true, message: `📋 ${count} productos. Primeros 5:\n${top5}${count > 5 ? `\n... y ${count - 5} más` : ""}` };
    }

    // ── CREAR CATEGORÍA ───────────────────────────────────────────
    case "create_category": {
      const names = entities.names.length > 0 ? entities.names : entities.categoryName ? [entities.categoryName] : [];
      if (names.length === 0) return { success: false, message: "No entendí el nombre de la categoría. Dí algo como 'Crear categoría cerveza'" };

      let created = 0;
      const createdNames: string[] = [];
      for (const name of names) {
        const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const { error } = await supabase.from("categorias").insert({ nombre: capitalized });
        if (!error) { created++; createdNames.push(capitalized); }
      }
      await helpers.loadCategories();
      if (created === 0) return { success: false, message: "No se pudieron crear las categorías (puede que ya existan)" };
      return { success: true, message: `✅ ${created} categoría(s) creada(s): ${createdNames.join(", ")}` };
    }

    // ── ELIMINAR CATEGORÍA ────────────────────────────────────────
    case "delete_category": {
      const cat = entities.matchedCategory;
      if (!cat && entities.names.length === 0) return { success: false, message: "No encontré esa categoría" };

      if (cat) {
        const { error } = await supabase.from("categorias").delete().eq("id", cat.id);
        if (error) return { success: false, message: "Error al eliminar la categoría (puede tener productos asociados)" };
        await helpers.loadCategories();
        return { success: true, message: `✅ Categoría "${cat.nombre}" eliminada` };
      }
      return { success: false, message: "No encontré esa categoría" };
    }

    // ── LISTAR CATEGORÍAS ─────────────────────────────────────────
    case "list_categories": {
      if (helpers.categories.length === 0) return { success: true, message: "No hay categorías registradas" };
      const list = helpers.categories.map((c: any) => `• ${c.nombre}`).join("\n");
      return { success: true, message: `📁 Categorías (${helpers.categories.length}):\n${list}` };
    }

    // ── CREAR PROVEEDOR ───────────────────────────────────────────
    case "create_supplier": {
      const name = entities.supplierName || (entities.names.length > 0 ? entities.names[0] : null);
      if (!name) return { success: false, message: "No entendí el nombre del proveedor" };
      const capitalized = name.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const { error } = await supabase.from("proveedores").insert({ nombre: capitalized });
      if (error) return { success: false, message: "Error al crear el proveedor" };
      await helpers.loadSuppliers();
      return { success: true, message: `✅ Proveedor "${capitalized}" creado` };
    }

    // ── ELIMINAR PROVEEDOR ────────────────────────────────────────
    case "delete_supplier": {
      const sup = entities.matchedSupplier;
      if (!sup) return { success: false, message: "No encontré ese proveedor" };
      const { error } = await supabase.from("proveedores").delete().eq("id", sup.id);
      if (error) return { success: false, message: "Error al eliminar el proveedor" };
      await helpers.loadSuppliers();
      return { success: true, message: `✅ Proveedor "${sup.nombre}" eliminado` };
    }

    // ── LISTAR PROVEEDORES ────────────────────────────────────────
    case "list_suppliers": {
      if (helpers.suppliers.length === 0) return { success: true, message: "No hay proveedores registrados" };
      const list = helpers.suppliers.map((s: any) => `• ${s.nombre}${s.telefono ? ` (${s.telefono})` : ""}`).join("\n");
      return { success: true, message: `👤 Proveedores (${helpers.suppliers.length}):\n${list}` };
    }

    // ── CREAR PRÉSTAMO ────────────────────────────────────────────
    case "create_loan": {
      const product = entities.matchedProduct;
      const person = entities.person;
      if (!product) return { success: false, message: "No encontré el producto. ¿Qué querés prestar?" };
      if (!person) return { success: false, message: "¿A quién le prestás? Dí 'Prestar X a [nombre]'" };
      const qty = entities.quantity ?? 1;
      if (product.stock_actual < qty) {
        return { success: false, message: `Stock insuficiente de ${product.nombre}. Solo quedan ${product.stock_actual}` };
      }
      const { error } = await supabase.from("prestamos").insert({
        producto_id: product.id,
        cantidad: qty,
        persona: person,
      });
      if (error) return { success: false, message: "Error al registrar el préstamo" };
      await Promise.all([helpers.loadProducts(), helpers.loadLoans()]);
      return { success: true, message: `✅ Préstamo: ${qty}× ${product.nombre} a ${person}` };
    }

    // ── DEVOLVER PRÉSTAMO ─────────────────────────────────────────
    case "return_loan": {
      const person = entities.person;
      const pendingLoans = helpers.loans.filter((l: any) => l.estado === "pendiente");

      let targetLoan = null;
      if (person) {
        targetLoan = pendingLoans.find((l: any) => l.persona.toLowerCase().includes(person.toLowerCase()));
      }
      if (!targetLoan && entities.matchedProduct) {
        targetLoan = pendingLoans.find((l: any) => l.producto_id === entities.matchedProduct.id);
      }
      if (!targetLoan) {
        if (pendingLoans.length === 0) return { success: true, message: "No hay préstamos pendientes" };
        return { success: false, message: `No encontré ese préstamo. Pendientes:\n${pendingLoans.slice(0, 5).map((l: any) => `• ${l.productos?.nombre ?? "?"} → ${l.persona}`).join("\n")}` };
      }

      const { error } = await supabase.from("prestamos").update({ estado: "devuelto", fecha_devolucion: new Date().toISOString() }).eq("id", targetLoan.id);
      if (error) return { success: false, message: "Error al actualizar el préstamo" };
      await helpers.loadLoans();
      return { success: true, message: `✅ Préstamo de ${targetLoan.persona} marcado como devuelto` };
    }

    // ── LISTAR PRÉSTAMOS ──────────────────────────────────────────
    case "list_loans": {
      const pending = helpers.loans.filter((l: any) => l.estado === "pendiente");
      if (pending.length === 0) return { success: true, message: "🎉 No hay préstamos pendientes" };
      const list = pending.slice(0, 8).map((l: any) =>
        `• ${l.cantidad}× ${l.productos?.nombre ?? "?"} → ${l.persona}`
      ).join("\n");
      return { success: true, message: `🤝 Préstamos pendientes (${pending.length}):\n${list}` };
    }

    // ── ALERTAS STOCK BAJO ────────────────────────────────────────
    case "low_stock_alert": {
      const alerts = helpers.getAlerts();
      if (alerts.length === 0) return { success: true, message: "✅ Todo el inventario está en niveles normales" };
      const list = alerts.slice(0, 8).map((a: any) =>
        `• ${a.level === "critical" ? "🔴" : "🟡"} ${a.product.nombre}: ${a.product.stock_actual}/${a.product.stock_minimo}`
      ).join("\n");
      return { success: true, message: `⚠️ ${alerts.length} producto(s) con stock bajo:\n${list}` };
    }

    // ── RESUMEN / DASHBOARD ───────────────────────────────────────
    case "dashboard_summary": {
      const today = new Date().toISOString().split("T")[0];
      const { data: sales } = await supabase
        .from("ventas")
        .select("cantidad, total")
        .gte("fecha", today);

      const totalRevenue = sales?.reduce((s: number, v: any) => s + (v.total || 0), 0) ?? 0;
      const totalItems = sales?.reduce((s: number, v: any) => s + (v.cantidad || 0), 0) ?? 0;
      const totalSales = sales?.length ?? 0;

      const alerts = helpers.getAlerts();

      return {
        success: true,
        message: `📊 Resumen de hoy:\n• Ventas: ${totalSales}\n• Productos vendidos: ${totalItems}\n• Ingreso: ${formatBs(totalRevenue)}\n• Alertas stock: ${alerts.length} producto(s)\n• Productos totales: ${helpers.products.length}`,
      };
    }

    // ── MÁS VENDIDOS ─────────────────────────────────────────────
    case "best_sellers": {
      const { data: sales } = await supabase
        .from("ventas")
        .select("producto_id, cantidad");

      if (!sales || sales.length === 0) return { success: true, message: "Aún no hay ventas registradas" };

      const counts: Record<string, number> = {};
      for (const s of sales) {
        counts[s.producto_id] = (counts[s.producto_id] || 0) + s.cantidad;
      }

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const list = sorted.map(([pid, qty], i) => {
        const p = helpers.products.find((pr: any) => pr.id === pid);
        return `${i + 1}. ${p?.nombre ?? "Desconocido"}: ${qty} vendidos`;
      }).join("\n");

      return { success: true, message: `🏆 Top 5 más vendidos:\n${list}` };
    }

    // ── CREAR PRODUCTO ────────────────────────────────────────────
    case "create_product": {
      helpers.router.push("/productos");
      return { success: true, message: "📱 Te llevé a Productos. Usa el botón + para crear uno nuevo." };
    }

    // ── EDITAR PRODUCTO ───────────────────────────────────────────
    case "edit_product": {
      helpers.router.push("/productos");
      return { success: true, message: `📱 Te llevé a Productos. Toca el producto que querés editar.${entities.matchedProduct ? ` Busca: ${entities.matchedProduct.nombre}` : ""}` };
    }

    // ── ELIMINAR PRODUCTO ─────────────────────────────────────────
    case "delete_product": {
      const product = entities.matchedProduct;
      if (!product) return { success: false, message: "No encontré el producto a eliminar" };
      const { error } = await supabase.from("productos").update({ activo: false }).eq("id", product.id);
      if (error) return { success: false, message: "Error al eliminar el producto" };
      await helpers.loadProducts();
      return { success: true, message: `✅ Producto "${product.nombre}" eliminado del catálogo` };
    }

    // ── NAVEGAR ───────────────────────────────────────────────────
    case "navigate": {
      const dest = entities.destination;
      if (!dest) return { success: false, message: "No entendí a dónde querés ir" };
      helpers.router.push(dest);
      return { success: true, message: `📱 Navegando a ${dest}` };
    }

    // ── AYUDA ─────────────────────────────────────────────────────
    case "help": {
      return { success: true, message: HELP_TEXT };
    }

    // ── DESCONOCIDO ───────────────────────────────────────────────
    default: {
      return {
        success: false,
        message: "🤔 No estoy seguro de qué querés hacer. Intentá ser más específico o decí 'ayuda' para ver lo que puedo hacer.",
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/*                           UI LABELS                                 */
/* ------------------------------------------------------------------ */

const intentLabels: Record<Intent, string> = {
  register_sale: "Registrar Venta",
  register_arrival: "Registrar Llegada",
  create_product: "Crear Producto",
  edit_product: "Editar Producto",
  delete_product: "Eliminar Producto",
  search_product: "Buscar Producto",
  list_products: "Listar Productos",
  check_price: "Consultar Precio",
  check_stock: "Consultar Stock",
  create_category: "Crear Categoría",
  delete_category: "Eliminar Categoría",
  list_categories: "Listar Categorías",
  create_supplier: "Crear Proveedor",
  delete_supplier: "Eliminar Proveedor",
  list_suppliers: "Listar Proveedores",
  create_loan: "Registrar Préstamo",
  return_loan: "Devolver Préstamo",
  list_loans: "Listar Préstamos",
  low_stock_alert: "Alertas de Stock",
  dashboard_summary: "Resumen del Día",
  best_sellers: "Más Vendidos",
  set_price: "Cambiar Precio",
  set_stock: "Ajustar Stock",
  navigate: "Navegar",
  help: "Ayuda",
  unknown: "No Interpretado",
};

const intentColors: Record<Intent, string> = {
  register_sale: "text-emerald-400",
  register_arrival: "text-blue-400",
  create_product: "text-violet-400",
  edit_product: "text-violet-400",
  delete_product: "text-red-400",
  search_product: "text-cyan-400",
  list_products: "text-cyan-400",
  check_price: "text-amber-400",
  check_stock: "text-indigo-400",
  create_category: "text-pink-400",
  delete_category: "text-red-400",
  list_categories: "text-pink-400",
  create_supplier: "text-orange-400",
  delete_supplier: "text-red-400",
  list_suppliers: "text-orange-400",
  create_loan: "text-yellow-400",
  return_loan: "text-lime-400",
  list_loans: "text-yellow-400",
  low_stock_alert: "text-red-400",
  dashboard_summary: "text-teal-400",
  best_sellers: "text-fuchsia-400",
  set_price: "text-amber-400",
  set_stock: "text-indigo-400",
  navigate: "text-sky-400",
  help: "text-zinc-400",
  unknown: "text-zinc-500",
};

/* ------------------------------------------------------------------ */
/*                         COMPONENT                                   */
/* ------------------------------------------------------------------ */

export default function VoicePage() {
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const suppliers = useAppStore((s) => s.suppliers);
  const loans = useAppStore((s) => s.loans);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const loadCategories = useAppStore((s) => s.loadCategories);
  const loadSuppliers = useAppStore((s) => s.loadSuppliers);
  const loadLoans = useAppStore((s) => s.loadLoans);
  const getAlerts = useAppStore((s) => s.getAlerts);
  const router = useRouter();

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);
  const [lastSuccess, setLastSuccess] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usá Chrome o Edge.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "es-BO";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      toast.error("Error de reconocimiento de voz");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
    setResponse(null);
    setLastIntent(null);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const processVoiceCommand = useCallback(async () => {
    if (!transcript.trim()) return;
    setProcessing(true);
    setResponse(null);

    const parsed = parseCommand(transcript, { products, categories, suppliers });
    setLastIntent(parsed.intent);

    const result = await executeCommand(parsed, {
      products, categories, suppliers, loans,
      loadProducts, loadCategories, loadSuppliers, loadLoans, loadAll,
      getAlerts, router,
    });

    setResponse(result.message);
    setLastSuccess(result.success);

    if (result.success) {
      toast.success(result.message.split("\n")[0]);
    } else {
      toast.error(result.message.split("\n")[0]);
    }

    setHistory((prev) => [
      {
        text: transcript,
        intent: parsed.intent,
        success: result.success,
        response: result.message,
        timestamp: new Date(),
      },
      ...prev.slice(0, 9),
    ]);

    setProcessing(false);
  }, [transcript, products, categories, suppliers, loans, loadProducts, loadCategories, loadSuppliers, loadLoans, loadAll, getAlerts, router]);

  const resetState = useCallback(() => {
    setTranscript("");
    setResponse(null);
    setLastIntent(null);
  }, []);

  return (
    <AppShell>
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-400" />
                  Asistente IA
                </h1>
                <p className="text-xs text-zinc-500">
                  Hablame naturalmente — entiendo todo
                </p>
              </div>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {showHelp ? "Ocultar ayuda" : "¿Qué puedo hacer?"}
              </button>
            </div>

            {/* Help panel */}
            {showHelp && (
              <div className="bg-zinc-900 rounded-2xl p-4 border border-violet-500/20 text-xs text-zinc-400 whitespace-pre-line leading-relaxed">
                {HELP_TEXT}
              </div>
            )}

            {/* Mic button */}
            <div className="flex flex-col items-center py-5 gap-2">
              <button
                onClick={listening ? stopListening : startListening}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  listening
                    ? "bg-red-500/20 border-2 border-red-500 animate-pulse"
                    : "bg-violet-500/15 border-2 border-violet-500/40 hover:border-violet-500 hover:bg-violet-500/25"
                }`}
              >
                {listening ? (
                  <MicOff className="w-8 h-8 text-red-400" />
                ) : (
                  <Mic className="w-8 h-8 text-violet-400" />
                )}
                {listening && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                )}
              </button>
              <p className="text-sm text-zinc-500">
                {listening ? "Escuchando..." : processing ? "Procesando..." : "Toca para hablar"}
              </p>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Transcripción</p>
                <p className="text-sm">{transcript}</p>
                {!response && (
                  <Button
                    onClick={processVoiceCommand}
                    disabled={processing}
                    className="mt-3 w-full"
                    size="sm"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Pensando...
                      </span>
                    ) : (
                      "Ejecutar comando"
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Response */}
            {response && (
              <div
                className={`bg-zinc-900 rounded-2xl p-4 border space-y-3 ${
                  lastSuccess ? "border-emerald-500/20" : "border-red-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    {lastIntent && (
                      <>
                        Acción:{" "}
                        <span className={intentColors[lastIntent] ?? "text-zinc-400"}>
                          {intentLabels[lastIntent] ?? lastIntent}
                        </span>
                      </>
                    )}
                  </p>
                  <span className={`text-xs ${lastSuccess ? "text-emerald-400" : "text-red-400"}`}>
                    {lastSuccess ? "✓ Éxito" : "✗ Error"}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-line leading-relaxed">{response}</div>
                <Button
                  onClick={resetState}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Nuevo comando
                </Button>
              </div>
            )}

            {/* History */}
            {history.length > 0 && !showHelp && (
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500 font-semibold">
                  Historial reciente
                </p>
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-500"
                  >
                    <span
                      className={`mt-0.5 shrink-0 ${
                        h.success ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {h.success ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate">{h.text}</p>
                      <p className={`text-[10px] ${intentColors[h.intent]}`}>
                        {intentLabels[h.intent]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick commands */}
            {!response && !transcript && !showHelp && (
              <div className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-xs text-zinc-500 font-semibold mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Prueba decir:
                </p>
                <div className="space-y-1.5 text-xs text-zinc-400">
                  <p>
                    <span className="text-emerald-400">Venta:</span>{" "}
                    &quot;Vender 2 botellas de Singani&quot;
                  </p>
                  <p>
                    <span className="text-blue-400">Llegada:</span>{" "}
                    &quot;Llegaron 10 cervezas Paceña&quot;
                  </p>
                  <p>
                    <span className="text-amber-400">Precio:</span>{" "}
                    &quot;¿Cuánto cuesta el whisky?&quot;
                  </p>
                  <p>
                    <span className="text-indigo-400">Stock:</span>{" "}
                    &quot;¿Cuánto hay de ron?&quot;
                  </p>
                  <p>
                    <span className="text-pink-400">Categoría:</span>{" "}
                    &quot;Crear categoría cerveza&quot;
                  </p>
                  <p>
                    <span className="text-yellow-400">Préstamo:</span>{" "}
                    &quot;Prestar 2 cervezas a Carlos&quot;
                  </p>
                  <p>
                    <span className="text-teal-400">Resumen:</span>{" "}
                    &quot;¿Cómo va el negocio?&quot;
                  </p>
                  <p>
                    <span className="text-red-400">Alertas:</span>{" "}
                    &quot;¿Qué se está agotando?&quot;
                  </p>
                  <p>
                    <span className="text-fuchsia-400">Top:</span>{" "}
                    &quot;¿Qué se vende más?&quot;
                  </p>
                  <p>
                    <span className="text-zinc-400">Y mucho más...</span>{" "}
                    Hablame naturalmente
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
