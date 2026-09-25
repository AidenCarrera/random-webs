"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CardBack } from "./ornaments";

const DECK = [0, 1, 2, 3, 4];

export function ShuffleIndicator() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex flex-col items-center gap-10"
      role="status"
      aria-live="polite"
    >
      <div aria-hidden="true" className="relative h-48 w-32">
        {DECK.map((index) => {
          const side = index % 2 === 0 ? -1 : 1;
          return (
            <motion.div
              key={index}
              className="absolute inset-0 overflow-hidden rounded-xl border-2 border-[#ffd700]/60 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
              style={{ zIndex: index }}
              initial={{ rotate: (index - 2) * 2, y: -index * 2 }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: [0, side * (70 + index * 8), 0],
                      rotate: [
                        (index - 2) * 2,
                        side * (12 + index * 3),
                        (index - 2) * 2,
                      ],
                      y: [-index * 2, -18 - index * 4, -index * 2],
                    }
              }
              transition={{
                duration: 0.75,
                delay: index * 0.07,
                repeat: Infinity,
                repeatDelay: 0.05,
                ease: [0.65, 0, 0.35, 1],
              }}
            >
              <CardBack className="h-full w-full" />
            </motion.div>
          );
        })}
      </div>
      <p className="text-xl tracking-[0.3em] text-[#ffd700]/80 motion-safe:animate-pulse">
        SHUFFLING...
      </p>
    </div>
  );
}
