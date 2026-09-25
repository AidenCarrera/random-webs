import styles from "../styles.module.css";
import { CornerFlourish } from "./ornaments";

interface ConsultCardsButtonProps {
  readonly onClick: () => void;
}

export function ConsultCardsButton({ onClick }: ConsultCardsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden border-2 border-[#ffd700] bg-[#1a0b2e]/60 px-7 py-5 text-lg font-bold uppercase tracking-[0.14em] whitespace-nowrap text-[#ffd700] shadow-[0_0_40px_rgba(255,215,0,0.12),inset_0_0_24px_rgba(255,215,0,0.08)] backdrop-blur-sm transition-[color,box-shadow,transform] duration-500 hover:text-[#1a0b2e] hover:shadow-[0_0_60px_rgba(255,215,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#ffd700] active:scale-[0.98] sm:px-12 sm:py-6 sm:text-2xl sm:tracking-[0.2em] ${styles.consult}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-1.5 border border-[#ffd700]/35 transition-colors duration-500 group-hover:border-[#1a0b2e]/30"
      />
      {(
        [
          "left-0 top-0",
          "right-0 top-0 rotate-90",
          "bottom-0 right-0 rotate-180",
          "bottom-0 left-0 -rotate-90",
        ] as const
      ).map((position) => (
        <CornerFlourish
          key={position}
          className={`pointer-events-none absolute z-20 h-5 w-5 transition-opacity duration-300 group-hover:opacity-0 ${position}`}
        />
      ))}
      <span className="relative z-10 flex items-center gap-4">
        Consult the Cards
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 z-0 origin-left scale-x-0 transform bg-linear-to-r from-[#e6b800] via-[#ffd700] to-[#fff1a8] transition-transform duration-500 ease-out group-hover:scale-x-100"
      />
    </button>
  );
}
