"use client";

import { motion, useReducedMotion } from "framer-motion";

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
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid w-full grid-cols-1 gap-10 [perspective:1000px] md:grid-cols-3 md:gap-12">
      {spread.map((drawnCard, index) => (
        <motion.div
          key={drawnCard.position.id}
          className="flex flex-col items-center gap-6"
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: -80, rotate: (index - 1) * 8, scale: 0.9 }
          }
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 18,
            delay: index * 0.16,
          }}
        >
          <p className="flex w-full items-center justify-center gap-3 pb-2 text-center text-xl font-bold uppercase tracking-widest text-purple-300/60">
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-linear-to-r from-transparent to-purple-300/30"
            />
            {drawnCard.position.label}
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-linear-to-l from-transparent to-purple-300/30"
            />
          </p>

          <TarotCard
            card={drawnCard.card}
            position={drawnCard.position}
            revealed={drawnCard.revealed}
            onReveal={() => onRevealCard(index)}
            onShowDetails={onShowDetails}
          />
        </motion.div>
      ))}
    </div>
  );
}
