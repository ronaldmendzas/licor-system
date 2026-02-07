"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { createWorker } from "tesseract.js";
import Fuse from "fuse.js";
import { toast } from "sonner";

export default function ImagePage() {
  const products = useAppStore((s) => s.products);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [matches, setMatches] = useState<{ name: string; match: string | null }[]>([]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      processImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function processImage(src: string) {
    setProcessing(true);
    setResults([]);
    setMatches([]);

    try {
      const worker = await createWorker("spa");
      const { data } = await worker.recognize(src);
      await worker.terminate();

      const lines = data.text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 2);

      setResults(lines);

      const fuse = new Fuse(products, {
        keys: ["nombre"],
        threshold: 0.4,
      });

      const matched = lines.map((line) => {
        const res = fuse.search(line);
        return {
          name: line,
          match: res.length > 0 ? res[0].item.nombre : null,
        };
      });

      setMatches(matched);
      toast.success(`${lines.length} líneas detectadas`);
    } catch {
      toast.error("Error al procesar la imagen");
    }

    setProcessing(false);
  }

  function clear() {
    setImgSrc(null);
    setResults([]);
    setMatches([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <AppShell>
      {loading ? <LoadingScreen /> : (<>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">IA Imagen</h1>
          <p className="text-sm text-zinc-500">
            Escanea listas de productos con la cámara
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />

        {!imgSrc ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Camera className="w-12 h-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">Toma una foto o sube una imagen</p>
            <div className="flex gap-2">
              <Button onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                Subir imagen
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={imgSrc}
                alt="Imagen escaneada"
                className="w-full max-h-64 object-contain bg-zinc-900 rounded-xl"
              />
              <button
                onClick={clear}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {processing && (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                <span className="text-sm text-zinc-400">Procesando imagen...</span>
              </div>
            )}

            {matches.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Resultados</h3>
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50"
                  >
                    <p className="text-sm">{m.name}</p>
                    {m.match ? (
                      <p className="text-xs text-emerald-400 mt-0.5">
                        ✓ Coincide: {m.match}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Sin coincidencia
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      </>)}
    </AppShell>
  );
}
