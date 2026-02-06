interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 ${
        onClick
          ? "cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-150 active:scale-[0.99]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
