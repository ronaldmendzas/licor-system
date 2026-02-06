"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseReconocimientoVozReturn {
  escuchando: boolean;
  texto: string;
  error: string | null;
  iniciar: () => void;
  detener: () => void;
  soportado: boolean;
}

export function useReconocimientoVoz(): UseReconocimientoVozReturn {
  const [escuchando, setEscuchando] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reconocimientoRef = useRef<SpeechRecognition | null>(null);
  const [soportado, setSoportado] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSoportado(!!SpeechRecognition);

    if (SpeechRecognition) {
      const reconocimiento = new SpeechRecognition();
      reconocimiento.lang = "es-BO";
      reconocimiento.continuous = false;
      reconocimiento.interimResults = true;
      reconocimiento.maxAlternatives = 1;

      reconocimiento.onresult = (evento: SpeechRecognitionEvent) => {
        const resultado = evento.results[evento.results.length - 1];
        setTexto(resultado[0].transcript);
      };

      reconocimiento.onerror = (evento: SpeechRecognitionErrorEvent) => {
        setError(evento.error);
        setEscuchando(false);
      };

      reconocimiento.onend = () => {
        setEscuchando(false);
      };

      reconocimientoRef.current = reconocimiento;
    }
  }, []);

  const iniciar = useCallback(() => {
    if (!reconocimientoRef.current) return;
    setError(null);
    setTexto("");
    reconocimientoRef.current.start();
    setEscuchando(true);
  }, []);

  const detener = useCallback(() => {
    if (!reconocimientoRef.current) return;
    reconocimientoRef.current.stop();
    setEscuchando(false);
  }, []);

  return { escuchando, texto, error, iniciar, detener, soportado };
}
