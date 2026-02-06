"use client";

import { useState, useRef } from "react";
import ShellApp from "@/components/layout/shell-app";
import Boton from "@/components/ui/boton";
import Tarjeta from "@/components/ui/tarjeta";
import { procesarImagenOCR, extraerDatosFactura } from "@/lib/ocr/procesador-imagen";
import { useCamara } from "@/hooks/use-camara";
import { Camera, Upload, FileText, Loader2, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type ModoCaptura = "archivo" | "camara" | null;

export default function PaginaImagenIA() {
  const [modo, setModo] = useState<ModoCaptura>(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState<ReturnType<typeof extraerDatosFactura> | null>(null);
  const [textoOCR, setTextoOCR] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { videoRef, activa, error: errorCamara, iniciar, detener, capturar } = useCamara();

  async function procesarImagen(fuente: File | string) {
    setProcesando(true);
    setProgreso(0);
    setResultado(null);
    setTextoOCR(null);

    try {
      const ocr = await procesarImagenOCR(fuente, setProgreso);
      setTextoOCR(ocr.texto);
      const datos = extraerDatosFactura(ocr.lineas);
      setResultado(datos);
      toast.success(`OCR completado (${ocr.confianza.toFixed(0)}% confianza)`);
    } catch {
      toast.error("Error al procesar imagen");
    }
    setProcesando(false);
  }

  function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo) {
      setModo("archivo");
      procesarImagen(archivo);
    }
  }

  function manejarCaptura() {
    const foto = capturar();
    if (foto) {
      detener();
      setModo("camara");
      procesarImagen(foto);
    }
  }

  function reiniciar() {
    setModo(null);
    setResultado(null);
    setTextoOCR(null);
    setProcesando(false);
    detener();
  }

  return (
    <ShellApp>
      <div className="p-4 pb-24 space-y-4">
        <h1 className="text-xl font-bold">IA de Imagen</h1>
        <p className="text-sm text-neutral-400">
          Escanea facturas o fotos de productos con OCR
        </p>

        {!modo && !procesando && (
          <div className="grid grid-cols-2 gap-3">
            <Tarjeta
              className="text-center cursor-pointer hover:border-purple-500 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-sm font-medium">Subir Imagen</p>
              <p className="text-xs text-neutral-500 mt-1">Galeria o archivos</p>
            </Tarjeta>

            <Tarjeta
              className="text-center cursor-pointer hover:border-purple-500 transition-colors"
              onClick={iniciar}
            >
              <Camera className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-sm font-medium">Usar Camara</p>
              <p className="text-xs text-neutral-500 mt-1">Foto en vivo</p>
            </Tarjeta>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={manejarArchivo}
        />

        {activa && (
          <div className="relative rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
              <Boton onClick={manejarCaptura} variante="primario">
                <Camera className="w-4 h-4 mr-2" />
                Capturar
              </Boton>
              <Boton onClick={detener} variante="secundario">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Boton>
            </div>
            {errorCamara && (
              <p className="absolute top-2 left-2 text-red-400 text-xs bg-black/70 px-2 py-1 rounded">
                {errorCamara}
              </p>
            )}
          </div>
        )}

        {procesando && (
          <Tarjeta className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-purple-400 animate-spin" />
            <p className="text-sm font-medium mb-2">Procesando imagen...</p>
            <div className="w-48 mx-auto bg-neutral-700 rounded-full h-2">
              <div
                className="bg-purple-500 rounded-full h-2 transition-all"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">{progreso}%</p>
          </Tarjeta>
        )}

        {resultado && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="font-semibold">Datos Extraidos</h2>
              <Boton onClick={reiniciar} variante="fantasma" className="ml-auto text-xs">
                Nueva lectura
              </Boton>
            </div>

            <Tarjeta>
              <div className="space-y-2 text-sm">
                <DatoExtraido label="Proveedor" valor={resultado.proveedor} />
                <DatoExtraido label="Fecha" valor={resultado.fecha} />
                <DatoExtraido label="Nro. Factura" valor={resultado.numero} />
                <DatoExtraido
                  label="Total"
                  valor={resultado.total ? `Bs ${resultado.total.toFixed(2)}` : null}
                />
              </div>
            </Tarjeta>

            {resultado.items.length > 0 && (
              <Tarjeta>
                <h3 className="text-sm font-medium mb-2">Items detectados</h3>
                <div className="space-y-1">
                  {resultado.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-neutral-300">
                      <span>
                        {item.cantidad}x {item.descripcion}
                      </span>
                      <span>Bs {item.precio.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Tarjeta>
            )}

            {textoOCR && (
              <details className="text-sm">
                <summary className="cursor-pointer text-neutral-400 hover:text-neutral-200">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Ver texto completo
                </summary>
                <pre className="mt-2 p-3 bg-neutral-800 rounded-lg text-xs text-neutral-300 whitespace-pre-wrap overflow-auto max-h-48">
                  {textoOCR}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </ShellApp>
  );
}

function DatoExtraido({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={valor ? "text-white" : "text-neutral-600"}>
        {valor || "No detectado"}
      </span>
    </div>
  );
}
