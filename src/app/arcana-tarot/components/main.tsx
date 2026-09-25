"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cinzel } from "../font";
import { useTarotReading } from "../hooks/use-reading";
import { CardDetailsModal } from "./card-modal";
import { ConsultCardsButton } from "./consult-button";
import { DrawAgainButton } from "./draw-button";
import { ArcanaHeader } from "./header";
import { Starfield } from "./ornaments";
import { ShuffleIndicator } from "./shuffle-indicator";
import { TarotSpread } from "./spread";

const stageTransition = { duration: 0.45, ease: [0.16, 1, 0.3, 1] } as const;

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

  const stage =
    spread.length === 0 && !isShuffling
      ? "consult"
      : isShuffling
        ? "shuffle"
        : "spread";

  return (
    <div
      className={`relative isolate flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-[#1a0b2e] px-4 py-10 font-serif text-[#e0b0ff] ${cinzel.className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_20%,#2a1147_0%,#1a0b2e_45%,#0d0519_100%)]"
      />
      <Starfield />

      <ArcanaHeader />

      <main className="relative z-10 flex w-full max-w-6xl flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={stageTransition}
            className="flex w-full flex-col items-center"
          >
            {stage === "consult" ? (
              <ConsultCardsButton onClick={startReading} />
            ) : stage === "shuffle" ? (
              <ShuffleIndicator />
            ) : (
              <TarotSpread
                spread={spread}
                onRevealCard={revealCard}
                onShowDetails={showCardDetails}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {hasCompletedReading && <DrawAgainButton onClick={startReading} />}
      </main>

      <AnimatePresence>
        {selectedCard && (
          <CardDetailsModal card={selectedCard} onClose={closeCardDetails} />
        )}
      </AnimatePresence>

      <div className="hidden h-16 shrink-0 md:block md:h-20" />
    </div>
  );
}
