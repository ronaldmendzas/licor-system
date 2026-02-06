interface Props {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title: string;
}

export function Modal({ children, open, onClose, title }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
