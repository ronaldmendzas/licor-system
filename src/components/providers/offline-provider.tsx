"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import {
  saveToLocal,
  isOnline,
  onConnectivityChange,
} from "@/lib/offline-storage";
import { toast } from "sonner";
import { syncOfflineMutations } from "@/lib/offline-sync";
import OfflineStatus from "@/components/providers/offline-status";

export default function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const wasOffline = useRef(false);
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const suppliers = useAppStore((s) => s.suppliers);
  const loans = useAppStore((s) => s.loans);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_NOW") {
          syncPendingMutations();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (products.length > 0) saveToLocal("productos", products).catch(() => {});
  }, [products]);

  useEffect(() => {
    if (categories.length > 0) saveToLocal("categorias", categories).catch(() => {});
  }, [categories]);

  useEffect(() => {
    if (suppliers.length > 0) saveToLocal("proveedores", suppliers).catch(() => {});
  }, [suppliers]);

  useEffect(() => {
    if (loans.length > 0) saveToLocal("prestamos", loans).catch(() => {});
  }, [loans]);

  const syncPendingMutations = useCallback(async () => {
    setSyncing(true);
    const synced = await syncOfflineMutations();

    if (synced > 0) {
      await loadAll({ force: true });
      toast.success(`${synced} cambio(s) sincronizado(s) con el servidor`);
    }
    setSyncing(false);
  }, [loadAll]);

  useEffect(() => {
    setOnline(isOnline());
    const cleanup = onConnectivityChange((isNowOnline) => {
      setOnline(isNowOnline);
      if (isNowOnline) {
        if (wasOffline.current) {
          setShowBanner(true);
          syncPendingMutations();
          loadAll({ force: true });
          setTimeout(() => setShowBanner(false), 4000);
        }
        wasOffline.current = false;
      } else {
        wasOffline.current = true;
        setShowBanner(true);
      }
    });
    return cleanup;
  }, [syncPendingMutations, loadAll]);

  return (
    <>
      <OfflineStatus
        online={online}
        syncing={syncing}
        showBanner={showBanner}
        onCloseBanner={() => setShowBanner(false)}
      />
      {children}
    </>
  );
}
