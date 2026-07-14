import type { KeyboardEvent, MouseEvent } from "react";
import { BookOpenText, Eye } from "lucide-react";
import type { TarotCard as TarotCardData } from "../data/cards";
import type { SpreadPositionDefinition } from "../types";

interface TarotCardProps {
  readonly card: TarotCardData;
  readonly position: SpreadPositionDefinition;
  readonly revealed: boolean;
  readonly onReveal: () => void;
  readonly onShowDetails: (card: TarotCardData) => void;
}

export function TarotCard({
  card,
  position,
  revealed,
  onReveal,
  onShowDetails,
}: TarotCardProps) {
  const revealIfHidden = () => {
    if (!revealed) {
      onReveal();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!revealed && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onReveal();
    }
  };

  const handleDetailsClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onShowDetails(card);
  };

  return (
    <div
      onClick={revealIfHidden}
      onKeyDown={handleKeyDown}
      role={revealed ? undefined : "button"}
      tabIndex={revealed ? undefined : 0}
      aria-label={revealed ? undefined : `Reveal ${position.label} card`}
      className={`relative w-64 h-96 cursor-pointer [transform-style:preserve-3d] transition-transform duration-700 ${
        revealed ? "[transform:rotateY(180deg)]" : "hover:scale-105"
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 [backface-visibility:hidden] w-full h-full rounded-xl border-4 border-[#ffd700]/50 bg-[#2d1b4e] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"
      >
        <div className="border-2 border-[#ffd700]/20 w-[90%] h-[90%] flex items-center justify-center">
          <Eye className="w-16 h-16 text-[#ffd700]/40" />
        </div>
      </div>

      <div className="absolute inset-0 [backface-visibility:hidden] w-full h-full rounded-xl border-4 border-[#ffd700] bg-[#150a26] flex flex-col items-center justify-between p-6 shadow-[0_0_50px_rgba(255,215,0,0.2)] [transform:rotateY(180deg)] bg-linear-to-b from-[#150a26] to-[#2d1b4e]">
        <div className="text-center w-full">
          <span aria-hidden="true" className="text-xl opacity-50 block mb-1">
            ✦
          </span>
          <h3 className="text-2xl font-bold text-[#ffd700] leading-tight mb-2">
            {card.name}
          </h3>
          <div
            aria-hidden="true"
            className="w-full h-px bg-linear-to-r from-transparent via-[#ffd700]/50 to-transparent my-2"
          />
        </div>

        <p className="text-center text-sm md:text-base leading-relaxed italic text-purple-100/90 font-serif px-2">
          &quot;{card.meaning}&quot;
        </p>

        <button
          type="button"
          onClick={handleDetailsClick}
          aria-label={`View details for ${card.name}`}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#ffd700] hover:text-[#1a0b2e] rounded-sm text-xs font-serif uppercase tracking-widest transition-all duration-300 active:scale-95 z-10"
        >
          <span className="flex h-4 w-4 items-center justify-center">
            <BookOpenText className="h-4 w-4" />
          </span>
          Details
        </button>
      </div>
    </div>
  );
}
