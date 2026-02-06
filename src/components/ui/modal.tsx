interface Props {
  children: React.ReactNode;
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
}

export default function Modal({ children, abierto, onCerrar, titulo }: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCerrar}
      />
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-neutral-800 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="text-neutral-500 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
