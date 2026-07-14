import type { TarotCard as TarotCardData } from "../data/cards";
import type { DrawnCard } from "../types";
import { TarotCard } from "./card";

interface TarotSpreadProps {
  readonly spread: readonly DrawnCard<TarotCardData>[];
  readonly onRevealCard: (index: number) => void;
  readonly onShowDetails: (card: TarotCardData) => void;
}

export function TarotSpread({
  spread,
  onRevealCard,
  onShowDetails,
}: TarotSpreadProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full perspective-1000">
      {spread.map((drawnCard, index) => (
        <div
          key={drawnCard.position.id}
          className="flex flex-col items-center gap-6"
        >
          <p className="text-xl font-bold uppercase text-purple-300/50 tracking-widest border-b border-purple-300/20 pb-2 w-full text-center">
            {drawnCard.position.label}
          </p>

          <TarotCard
            card={drawnCard.card}
            position={drawnCard.position}
            revealed={drawnCard.revealed}
            onReveal={() => onRevealCard(index)}
            onShowDetails={onShowDetails}
          />
        </div>
      ))}
    </div>
  );
}
