import type { KeyboardEvent, MouseEvent } from "react";
import { BookOpenText } from "lucide-react";
import { TAROT_CARDS, type TarotCard as TarotCardData } from "../data/cards";
import { CARD_INTERPRETATIONS } from "../data/interpretations";
import styles from "../styles.module.css";
import type { SpreadPositionDefinition } from "../types";
import { CardBack, ElementEmblem, toRomanNumeral } from "./ornaments";

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

  const interpretation = CARD_INTERPRETATIONS[card.name];
  const numeral = toRomanNumeral(TAROT_CARDS.indexOf(card));

  return (
    <div className="group/card relative [perspective:1200px]">
      {revealed ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle,rgba(255,215,0,0.45),transparent_65%)] ${styles.revealFlash}`}
        />
      ) : null}
      <div
        onClick={revealIfHidden}
        onKeyDown={handleKeyDown}
        role={revealed ? undefined : "button"}
        tabIndex={revealed ? undefined : 0}
        aria-label={revealed ? undefined : `Reveal ${position.label} card`}
        className={`relative h-96 w-64 cursor-pointer rounded-xl transition-transform duration-700 ease-[cubic-bezier(0.34,1.3,0.64,1)] [transform-style:preserve-3d] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#ffd700] ${
          revealed
            ? "cursor-default [transform:rotateY(180deg)]"
            : "hover:[transform:translateY(-10px)_rotateX(6deg)]"
        }`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl border-4 border-[#ffd700]/60 bg-[#2d1b4e] shadow-[0_18px_40px_rgba(0,0,0,0.6)] transition-shadow duration-500 [backface-visibility:hidden] group-hover/card:shadow-[0_24px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(255,215,0,0.22)]"
        >
          <CardBack className="h-full w-full" />
          <span className="pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent via-white/0 to-white/0 opacity-0 transition-opacity duration-500 group-hover/card:via-white/10 group-hover/card:opacity-100" />
        </div>

        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-xl border-4 border-[#ffd700] bg-linear-to-b from-[#150a26] via-[#1f0f38] to-[#2d1b4e] p-5 shadow-[0_0_50px_rgba(255,215,0,0.2)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-2 rounded-md border border-[#ffd700]/25"
          />
          <div className="relative w-full text-center">
            <span
              aria-hidden="true"
              className="mb-1 block font-serif text-xs tracking-[0.4em] text-[#ffd700]/60"
            >
              {numeral}
            </span>
            <h3 className="mb-2 text-2xl font-bold leading-tight text-[#ffd700]">
              {card.name}
            </h3>
            <div
              aria-hidden="true"
              className="my-2 h-px w-full bg-linear-to-r from-transparent via-[#ffd700]/50 to-transparent"
            />
          </div>

          {interpretation ? (
            <ElementEmblem
              element={interpretation.element}
              className="relative h-20 w-20 drop-shadow-[0_0_12px_rgba(255,215,0,0.35)]"
            />
          ) : null}

          <p className="relative px-2 text-center font-serif text-sm italic leading-relaxed text-purple-100/90 md:text-base">
            &quot;{card.meaning}&quot;
          </p>

          <button
            type="button"
            onClick={handleDetailsClick}
            aria-label={`View details for ${card.name}`}
            className="relative z-10 inline-flex items-center gap-1.5 rounded-sm border border-[#ffd700]/40 px-4 py-1.5 font-serif text-xs uppercase tracking-widest text-[#ffd700] transition-all duration-300 hover:border-[#ffd700] hover:bg-[#ffd700] hover:text-[#1a0b2e] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd700] active:scale-95"
          >
            <span className="flex h-4 w-4 items-center justify-center">
              <BookOpenText className="h-4 w-4" />
            </span>
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
