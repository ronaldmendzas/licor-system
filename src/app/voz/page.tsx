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

interface VoiceResult {
  action: "sale" | "arrival" | "search" | "unknown";
  productName: string | null;
  quantity: number;
  matched: string | null;
}

function parseVoiceCommand(text: string, products: any[]): VoiceResult {
  const lower = text.toLowerCase();
  let action: VoiceResult["action"] = "unknown";
  let quantity = 1;

  if (lower.includes("vender") || lower.includes("venta") || lower.includes("vendé")) {
    action = "sale";
  } else if (lower.includes("llegó") || lower.includes("llegada") || lower.includes("recibir") || lower.includes("agregar")) {
    action = "arrival";
  } else if (lower.includes("buscar") || lower.includes("busca") || lower.includes("cuánto") || lower.includes("stock")) {
    action = "search";
  }

  const qtyMatch = lower.match(/(\d+)\s+(unidad|botella|caja|lata)/);
  if (qtyMatch) quantity = parseInt(qtyMatch[1]);
  else {
    const numMatch = lower.match(/(\d+)/);
    if (numMatch) quantity = parseInt(numMatch[1]);
  }

  const fuse = new Fuse(products, { keys: ["nombre"], threshold: 0.4 });
  const words = text.split(/\s+/);
  let bestMatch: string | null = null;

  for (let len = words.length; len >= 2; len--) {
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

  return {
    action,
    productName: bestMatch ? text : null,
    quantity,
    matched: bestMatch,
  };
}

export default function VoicePage() {
  const products = useAppStore((s) => s.products);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const loadProducts = useAppStore((s) => s.loadProducts);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta reconocimiento de voz");
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

    if (parsed.action === "sale" && parsed.matched) {
      const product = products.find((p) => p.nombre === parsed.matched);
      if (product && product.stock_actual >= parsed.quantity) {
        const supabase = createClient();
        await supabase.from("ventas").insert({
          producto_id: product.id,
          cantidad: parsed.quantity,
          precio_venta: product.precio_venta,
        });
        toast.success(`Venta: ${parsed.quantity}x ${product.nombre}`);
        await loadProducts();
      } else {
        toast.error("Stock insuficiente o producto no encontrado");
      }
    } else if (parsed.action === "arrival" && parsed.matched) {
      const product = products.find((p) => p.nombre === parsed.matched);
      if (product) {
        const supabase = createClient();
        await supabase.from("llegadas").insert({
          producto_id: product.id,
          cantidad: parsed.quantity,
          precio_compra: product.precio_compra,
        });
        toast.success(`Llegada: ${parsed.quantity}x ${product.nombre}`);
        await loadProducts();
      }
    } else if (parsed.action === "search" && parsed.matched) {
      const product = products.find((p) => p.nombre === parsed.matched);
      if (product) {
        toast.info(`${product.nombre}: ${product.stock_actual} en stock`);
      }
    } else {
      toast.info("No se pudo interpretar el comando");
    }

    setProcessing(false);
  }

  const actionLabels = {
    sale: "Venta",
    arrival: "Llegada",
    search: "Consulta",
    unknown: "Desconocido",
  };

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Voz IA</h1>
          <p className="text-sm text-zinc-500">Controla el inventario con tu voz</p>
        </div>

        <div className="flex flex-col items-center py-8 gap-4">
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
              <span className="text-sm font-medium">{actionLabels[result.action]}</span>
            </div>
            {result.matched && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Producto:</span>
                <span className="text-sm font-medium text-emerald-400">{result.matched}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Cantidad:</span>
              <span className="text-sm font-medium">{result.quantity}</span>
            </div>
          </div>
        )}

        <div className="bg-zinc-800/50 rounded-xl p-3">
          <p className="text-xs text-zinc-500 font-semibold mb-2">Ejemplos:</p>
          <div className="space-y-1.5 text-xs text-zinc-400">
            <p>• &quot;Vender 2 botellas de Singani Casa Real&quot;</p>
            <p>• &quot;Llegó 5 unidades de cerveza Paceña&quot;</p>
            <p>• &quot;¿Cuánto stock hay de ron?&quot;</p>
          </div>
        </div>
      </div>
      </>)}
    </AppShell>
  );
}
