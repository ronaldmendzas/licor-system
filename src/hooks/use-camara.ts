"use client";

import { useState, useRef, useCallback } from "react";

interface UseCamaraOpciones {
  facingMode?: "user" | "environment";
}

export function useCamara(opciones: UseCamaraOpciones = {}) {
  const [activa, setActiva] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const iniciar = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: opciones.facingMode || "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActiva(true);
    } catch {
      setError("No se pudo acceder a la camara");
    }
  }, [opciones.facingMode]);

  const detener = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActiva(false);
  }, []);

  const capturar = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  return { videoRef, activa, error, iniciar, detener, capturar };
}
