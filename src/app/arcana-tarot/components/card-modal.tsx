"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import { TAROT_CARDS, type TarotCard } from "../data/cards";
import { CARD_INTERPRETATIONS } from "../data/interpretations";
import { CornerFlourish, ElementEmblem, toRomanNumeral } from "./ornaments";

interface CardDetailsModalProps {
  readonly card: TarotCard;
  readonly onClose: () => void;
}

const CORNERS = [
  "left-2 top-2",
  "right-2 top-2 rotate-90",
  "bottom-2 right-2 rotate-180",
  "bottom-2 left-2 -rotate-90",
];

export function CardDetailsModal({ card, onClose }: CardDetailsModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButton.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  const interpretation = CARD_INTERPRETATIONS[card.name];
  const numeral = toRomanNumeral(TAROT_CARDS.indexOf(card));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#07020f]/80 p-4 backdrop-blur-md"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative my-auto flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-xl border-2 border-[#ffd700] bg-linear-to-b from-[#1f0d38] to-[#150826] p-8 text-center shadow-[0_0_60px_rgba(255,215,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-1.5 rounded-lg border border-[#ffd700]/20"
        />
        {CORNERS.map((position) => (
          <CornerFlourish
            key={position}
            className={`pointer-events-none absolute h-6 w-6 opacity-70 ${position}`}
          />
        ))}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#ffd700]/10 blur-3xl"
        />

        <div className="relative text-xs uppercase tracking-[0.3em] text-[#ffd700]/60">
          ✦ The Arcana Reveal ✦
        </div>

        <div className="relative">
          {interpretation ? (
            <ElementEmblem
              element={interpretation.element}
              className="mx-auto mb-3 h-16 w-16 drop-shadow-[0_0_14px_rgba(255,215,0,0.4)]"
            />
          ) : null}
          <p
            aria-hidden="true"
            className="font-serif text-xs tracking-[0.4em] text-[#ffd700]/55"
          >
            {numeral}
          </p>
          <h2
            id={titleId}
            className="mb-1 text-3xl font-extrabold tracking-wider text-[#ffd700]"
          >
            {card.name}
          </h2>
          <div
            aria-hidden="true"
            className="mx-auto my-3 h-px w-24 bg-linear-to-r from-transparent via-[#ffd700]/60 to-transparent"
          />

          <div className="mb-4 flex justify-center gap-2">
            <span className="rounded-sm border border-purple-400/30 bg-purple-950/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-200">
              {interpretation.element}
            </span>
            <span className="rounded-sm border border-purple-400/30 bg-purple-950/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-200">
              {interpretation.astrology}
            </span>
          </div>

          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-purple-300/60">
            Short Meaning
          </p>
          <p className="mb-4 font-serif text-sm italic text-purple-100/75">
            &ldquo;{card.meaning}&rdquo;
          </p>
        </div>

        <div className="relative border-t border-[#ffd700]/20 pt-5 text-left">
          <p className="mb-2 text-center font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#ffd700]/80">
            Mystical Interpretation
          </p>
          <p
            id={descriptionId}
            className="text-pretty font-serif text-sm leading-relaxed text-purple-100/90"
          >
            {card.details}
          </p>
        </div>

        <div className="relative border-t border-[#ffd700]/10 pt-4 text-left">
          <p className="mb-2 text-center font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#ffd700]/70">
            Sacred Symbols
          </p>
          <ul className="flex flex-col gap-1.5 pl-2 font-serif text-xs text-purple-200/80">
            {interpretation.symbols.map((symbol) => (
              <li key={symbol} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1 text-[8px] text-[#ffd700]"
                >
                  ✦
                </span>
                <span>{symbol}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="relative mt-2 rounded-sm border border-[#ffd700]/50 bg-purple-950/40 px-6 py-2.5 font-serif text-xs uppercase tracking-widest text-[#ffd700] transition-all hover:bg-[#ffd700] hover:text-[#1a0b2e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd700] active:scale-95"
        >
          Close Revelation
        </button>
      </motion.div>
    </motion.div>
  );
}
