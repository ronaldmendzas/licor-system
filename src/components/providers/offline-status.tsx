import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface Props {
  online: boolean;
  syncing: boolean;
  showBanner: boolean;
  onCloseBanner: () => void;
}

export default function OfflineStatus({ online, syncing, showBanner, onCloseBanner }: Props) {
  return (
    <>
      {showBanner && (
        <div
          className={`fixed top-0 left-0 right-0 z-[100] py-2 px-4 flex items-center justify-center gap-2 text-xs font-medium transition-all duration-300 ${
            online ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
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
          <button onClick={onCloseBanner} className="ml-2 opacity-70 hover:opacity-100" title="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      {!online && !showBanner && (
        <div className="fixed bottom-4 left-4 z-[100] bg-zinc-900 border border-red-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs text-red-400 shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          Offline
        </div>
      )}
    </>
  );
}
