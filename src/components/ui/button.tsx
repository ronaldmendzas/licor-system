import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

const STYLES: Record<Variant, string> = {
  primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/20",
  secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
  danger: "bg-red-600 hover:bg-red-500 text-white",
  ghost: "bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
};

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  icon,
  size = "md",
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] ${STYLES[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
