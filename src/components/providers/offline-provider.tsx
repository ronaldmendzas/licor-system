"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import {
  saveToLocal,
  getFromLocal,
  isOnline,
  onConnectivityChange,
  getPendingMutations,
  clearPendingMutations,
} from "@/lib/offline-storage";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

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

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});

      // Listen for sync messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_NOW") {
          syncPendingMutations();
        }
      });
    }
  }, []);

  // Save data locally whenever store changes
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

  // Sync pending mutations when coming back online
  const syncPendingMutations = useCallback(async () => {
    const pending = await getPendingMutations();
    if (pending.length === 0) return;

    setSyncing(true);
    const supabase = createClient();
    let synced = 0;

    for (const mutation of pending.sort((a: any, b: any) => a.timestamp - b.timestamp)) {
      try {
        if (mutation.action === "insert") {
          await supabase.from(mutation.table).insert(mutation.data);
          synced++;
        } else if (mutation.action === "update") {
          const { id, ...rest } = mutation.data;
          await supabase.from(mutation.table).update(rest).eq("id", id);
          synced++;
        } else if (mutation.action === "delete") {
          await supabase.from(mutation.table).delete().eq("id", mutation.data.id);
          synced++;
        }
      } catch {
        // Will retry next time
      }
    }

    if (synced > 0) {
      await clearPendingMutations();
      await loadAll();
      toast.success(`${synced} cambio(s) sincronizado(s) con el servidor`);
    }
    setSyncing(false);
  }, [loadAll]);

  // Monitor connectivity
  useEffect(() => {
    setOnline(isOnline());
    const cleanup = onConnectivityChange((isNowOnline) => {
      setOnline(isNowOnline);
      if (isNowOnline) {
        if (wasOffline.current) {
          setShowBanner(true);
          syncPendingMutations();
          loadAll();
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
      {/* Offline/Online banner */}
      {showBanner && (
        <div
          className={`fixed top-0 left-0 right-0 z-[100] py-2 px-4 flex items-center justify-center gap-2 text-xs font-medium transition-all duration-300 ${
            online
              ? "bg-emerald-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {online ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              {syncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sincronizando datos...
                </>
              ) : (
                "Conexión restaurada — datos sincronizados"
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              Sin conexión — trabajando en modo offline
            </>
          )}
          <button
            onClick={() => setShowBanner(false)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Persistent small indicator when offline */}
      {!online && !showBanner && (
        <div className="fixed bottom-4 left-4 z-[100] bg-zinc-900 border border-red-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs text-red-400 shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          Offline
        </div>
      )}

      {children}
    </>
  );
}
