"use client";

import { cinzel } from "../font";
import { useTarotReading } from "../hooks/use-reading";
import { CardDetailsModal } from "./card-modal";
import { ConsultCardsButton } from "./consult-button";
import { DrawAgainButton } from "./draw-button";
import { ArcanaHeader } from "./header";
import { ShuffleIndicator } from "./shuffle-indicator";
import { TarotSpread } from "./spread";

export function TarotReadingMain() {
  const {
    spread,
    isShuffling,
    selectedCard,
    hasCompletedReading,
    startReading,
    revealCard,
    showCardDetails,
    closeCardDetails,
  } = useTarotReading();

  return (
    <div
      className={`min-h-dvh bg-[#1a0b2e] text-[#e0b0ff] font-serif flex flex-col items-center justify-center py-8 px-4 overflow-x-hidden ${cinzel.className}`}
    >
      <ArcanaHeader />

      <main className="max-w-6xl w-full flex flex-col items-center">
        {spread.length === 0 && !isShuffling ? (
          <ConsultCardsButton onClick={startReading} />
        ) : isShuffling ? (
          <ShuffleIndicator />
        ) : (
          <TarotSpread
            spread={spread}
            onRevealCard={revealCard}
            onShowDetails={showCardDetails}
          />
        )}

        {hasCompletedReading && <DrawAgainButton onClick={startReading} />}
      </main>

      {selectedCard && (
        <CardDetailsModal card={selectedCard} onClose={closeCardDetails} />
      )}

      <div className="hidden md:block h-16 md:h-20 shrink-0" />
    </div>
  );
}
