"use client";

import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const openCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  const clearImage = useCallback(() => {
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return { fileInputRef, imageSrc, openCamera, handleFileChange, clearImage };
}
