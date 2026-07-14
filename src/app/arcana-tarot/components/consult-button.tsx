interface ConsultCardsButtonProps {
  readonly onClick: () => void;
}

export function ConsultCardsButton({ onClick }: ConsultCardsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative px-12 py-6 bg-transparent border-2 border-[#ffd700] text-[#ffd700] text-2xl font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#ffd700] hover:text-[#1a0b2e] overflow-hidden"
    >
      <span className="relative z-10 flex items-center gap-4">
        Consult the Cards
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[#ffd700] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 z-0"
      />
    </button>
  );
}
