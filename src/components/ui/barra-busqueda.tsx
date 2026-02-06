import { Search } from "lucide-react";

interface Props {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

export default function BarraBusqueda({ valor, onChange, placeholder = "Buscar..." }: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
