interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Tarjeta({ children, className = "", onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#141414] border border-neutral-800 rounded-xl p-4 ${
        onClick ? "cursor-pointer hover:border-neutral-700 transition-colors" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
