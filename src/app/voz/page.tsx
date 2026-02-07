"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import Fuse from "fuse.js";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatBs } from "@/lib/utils";

type Action = "sale" | "arrival" | "search" | "price" | "category" | "unknown";

interface VoiceResult {
  action: Action;
  detail: string;
  quantity: number;
  matched: string | null;
}

function parseVoiceCommand(text: string, products: any[]): VoiceResult {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let action: Action = "unknown";
  let quantity = 1;
  let detail = "";

  // Detect action
  if (/vend(er|e|i)|registr(ar|a)\s*(una\s*)?venta|cobr(ar|a)/.test(lower)) {
    action = "sale";
  } else if (/lleg(o|ada|aron)|recibi(r|mos)|agreg(ar|a)|entr(o|ada|aron)|reponer/.test(lower)) {
    action = "arrival";
  } else if (/categori|crear?\s*(una\s*)?categori|nueva\s*categori|agregar?\s*categori/.test(lower)) {
    action = "category";
    // Extract category names after keywords
    const catMatch = text.match(/(?:categor[ií]a[s]?\s+(?:que\s+(?:se\s+llame|diga)\s+)?|llamada\s+|nombre\s+)(.+)/i);
    if (catMatch) detail = catMatch[1].trim();
    else {
      // Try to get everything after "crear" or "nueva"
      const altMatch = text.match(/(?:crear?|nueva|agregar?)\s+(.+)/i);
      if (altMatch) detail = altMatch[1].replace(/categor[ií]a[s]?\s*/i, "").trim();
    }
  } else if (/preci|cuant[oo]\s*(cuesta|vale|es)|valor/.test(lower)) {
    action = "price";
  } else if (/busca|stock|hay|queda|cuant[oo]\s*(hay|queda|tiene)|disponible|inventario/.test(lower)) {
    action = "search";
  }

  // Extract quantity
  const qtyMatch = lower.match(/(\d+)\s*(unidad|botella|caja|lata|pieza)/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1]);
  } else {
    const numMatch = lower.match(/(\d+)/);
    if (numMatch && action !== "category") quantity = parseInt(numMatch[1]);
  }

  // Match product name using fuzzy search
  const fuse = new Fuse(products, { keys: ["nombre"], threshold: 0.4 });
  const words = text.split(/\s+/);
  let bestMatch: string | null = null;

  for (let len = Math.min(words.length, 6); len >= 2; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(" ");
      const res = fuse.search(phrase);
      if (res.length > 0) {
        bestMatch = res[0].item.nombre;
        break;
      }
    }
    if (bestMatch) break;
  }

  // Single word match as fallback
  if (!bestMatch && action !== "category") {
    for (const word of words) {
      if (word.length >= 3) {
        const res = fuse.search(word);
        if (res.length > 0 && res[0].score !== undefined && res[0].score < 0.3) {
          bestMatch = res[0].item.nombre;
          break;
        }
      }
    }
  }

  return { action, detail, quantity, matched: bestMatch };
}

export default function VoicePage() {
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const loadProducts = useAppStore((s) => s.loadProducts);
  const loadCategories = useAppStore((s) => s.loadCategories);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState<{ text: string; ok: boolean }[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-BO";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
      toast.error("Error de reconocimiento");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
    setResult(null);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function processCommand() {
    if (!transcript.trim()) return;
    setProcessing(true);
    const parsed = parseVoiceCommand(transcript, products);
    setResult(parsed);
    let ok = false;

    const supabase = createClient();

    if (parsed.action === "sale" && parsed.matched) {
      const product = products.find((p) => p.nombre === parsed.matched);
      if (product && product.stock_actual >= parsed.quantity) {
        await supabase.from("ventas").insert({
          producto_id: product.id,
          cantidad: parsed.quantity,
          precio_unitario: product.precio_venta,
          total: product.precio_venta * parsed.quantity,
        });
        toast.success(`Venta registrada: ${parsed.quantity}x ${product.nombre} = ${formatBs(product.precio_venta * parsed.quantity)}`);
        await loadProducts();
        ok = true;
      } else {
        toast.error(product ? `Stock insuficiente (tiene ${product.stock_actual})` : "Producto no encontrado");
      }
    } else if (parsed.action === "arrival" && parsed.matched) {
      const product = products.find((p) => p.nombre === parsed.matched);
      if (product) {
        await supabase.from("llegadas").insert({
          producto_id: product.id,
          cantidad: parsed.quantity,
          precio_compra: product.precio_compra,
        });
        toast.success(`Llegada registrada: ${parsed.quantity}x ${product.nombre}`);
        await loadProducts();
        ok = true;
      }
    } else if (parsed.action === "category" && parsed.detail) {
      // Parse multiple categories separated by "y", commas, or numbered lists
      const names = parsed.detail
        .split(/(?:\s*,\s*|\s+y\s+|\s*\d+\s*(?:que\s+(?:diga|se\s+llame)\s+)?)/i)
        .map((n) => n.replace(/^(?:que\s+diga|que\s+se\s+llame)\s+/i, "").trim())
        .filter((n) => n.length > 1);

      if (names.length === 0) {
        // Fallback: try to get words after common patterns
        const fallback = parsed.detail.replace(/(?:que\s+diga|que\s+se\s+llame|otro\s+que\s+diga)/gi, ",").split(",").map(n => n.trim()).filter(n => n.length > 1);
        names.push(...fallback);
      }

      if (names.length > 0) {
        let created = 0;
        for (const name of names) {
          const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
          const { error } = await supabase.from("categorias").insert({ nombre: capitalized });
          if (!error) created++;
        }
        if (created > 0) {
          toast.success(`${created} categoría(s) creada(s): ${names.join(", ")}`);
          await loadCategories();
          ok = true;
        } else {
          toast.error("No se pudieron crear las categorías (ya existen?)");
        }
      } else {
        toast.error("No entendí los nombres de las categorías");
      }
    } else if (parsed.action === "price" && parsed.matched) {
      const product = products.find((p) => p.nombre === parsed.matched);
      if (product) {
        toast.info(`${product.nombre}: Venta ${formatBs(product.precio_venta)} | Compra ${formatBs(product.precio_compra)}`);
        ok = true;
      }
    } else if (parsed.action === "search" && parsed.matched) {
      const product = products.find((p) => p.nombre === parsed.matched);
      if (product) {
        toast.info(`${product.nombre}: ${product.stock_actual} en stock (mínimo: ${product.stock_minimo})`);
        ok = true;
      }
    } else if (parsed.action === "unknown") {
      toast.info("No entendí el comando. Mira los ejemplos abajo.");
    } else {
      toast.info("Comando reconocido pero falta el producto o detalle");
    }

    setHistory((prev) => [{ text: transcript, ok }, ...prev.slice(0, 4)]);
    setProcessing(false);
  }

  const actionLabels: Record<Action, string> = {
    sale: "Venta",
    arrival: "Llegada",
    search: "Consulta Stock",
    price: "Consulta Precio",
    category: "Crear Categoría",
    unknown: "Desconocido",
  };

  const actionColors: Record<Action, string> = {
    sale: "text-emerald-400",
    arrival: "text-blue-400",
    search: "text-violet-400",
    price: "text-amber-400",
    category: "text-pink-400",
    unknown: "text-zinc-500",
  };

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Voz IA</h1>
          <p className="text-sm text-zinc-500">Controla el inventario con tu voz</p>
        </div>

        <div className="flex flex-col items-center py-6 gap-3">
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              listening
                ? "bg-red-500/20 border-2 border-red-500 animate-pulse"
                : "bg-violet-500/15 border-2 border-violet-500/40 hover:border-violet-500"
            }`}
          >
            {listening ? (
              <MicOff className="w-8 h-8 text-red-400" />
            ) : (
              <Mic className="w-8 h-8 text-violet-400" />
            )}
          </button>
          <p className="text-sm text-zinc-500">
            {listening ? "Escuchando..." : "Toca para hablar"}
          </p>
        </div>

        {transcript && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-1">Transcripción</p>
            <p className="text-sm">{transcript}</p>
            {!result && (
              <Button
                onClick={processCommand}
                disabled={processing}
                className="mt-3 w-full"
                size="sm"
              >
                {processing ? "Procesando..." : "Ejecutar comando"}
              </Button>
            )}
          </div>
        )}

        {result && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 space-y-2">
            <p className="text-xs text-zinc-500">Resultado</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Acción:</span>
              <span className={`text-sm font-medium ${actionColors[result.action]}`}>
                {actionLabels[result.action]}
              </span>
            </div>
            {result.matched && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Producto:</span>
                <span className="text-sm font-medium text-emerald-400">{result.matched}</span>
              </div>
            )}
            {result.detail && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Detalle:</span>
                <span className="text-sm font-medium">{result.detail}</span>
              </div>
            )}
            {result.action !== "category" && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Cantidad:</span>
                <span className="text-sm font-medium">{result.quantity}</span>
              </div>
            )}
            <Button
              onClick={() => { setResult(null); setTranscript(""); }}
              variant="ghost"
              size="sm"
              className="w-full mt-2"
            >
              Nuevo comando
            </Button>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500 font-semibold">Historial</p>
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                <span className={h.ok ? "text-emerald-500" : "text-red-500"}>
                  {h.ok ? "✓" : "✗"}
                </span>
                <span className="truncate">{h.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-zinc-800/50 rounded-xl p-3">
          <p className="text-xs text-zinc-500 font-semibold mb-2">Comandos disponibles:</p>
          <div className="space-y-1.5 text-xs text-zinc-400">
            <p><span className="text-emerald-400">Ventas:</span> &quot;Vender 2 botellas de Singani&quot;</p>
            <p><span className="text-blue-400">Llegadas:</span> &quot;Llegaron 5 unidades de cerveza Paceña&quot;</p>
            <p><span className="text-violet-400">Stock:</span> &quot;¿Cuánto hay de ron?&quot;</p>
            <p><span className="text-amber-400">Precio:</span> &quot;¿Cuánto cuesta el whisky?&quot;</p>
            <p><span className="text-pink-400">Categorías:</span> &quot;Crear categoría cerveza&quot;</p>
          </div>
        </div>
      </div>
      </>)}
    </AppShell>
  );
}
