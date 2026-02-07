import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      <p className="text-sm text-zinc-500">Cargando...</p>
    </div>
  );
}
