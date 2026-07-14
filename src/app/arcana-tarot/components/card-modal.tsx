"use client";

import { useEffect, useId, useRef } from "react";
import type { TarotCard } from "../data/cards";
import { CARD_INTERPRETATIONS } from "../data/interpretations";

interface CardDetailsModalProps {
  readonly card: TarotCard;
  readonly onClose: () => void;
}

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

  return (
    <div
      className="fixed inset-0 bg-[#07020f]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-w-md w-full bg-[#1b0b2e] border-2 border-[#ffd700] p-8 rounded-xl shadow-[0_0_50px_rgba(255,215,0,0.25)] text-center relative flex flex-col gap-5 animate-in zoom-in-95 duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-[#ffd700]/60 text-xs tracking-[0.3em] uppercase">
          ✦ The Arcana Reveal ✦
        </div>

        <div>
          <h2
            id={titleId}
            className="text-3xl font-extrabold text-[#ffd700] tracking-wider mb-1"
          >
            {card.name}
          </h2>
          <div
            aria-hidden="true"
            className="w-24 h-px bg-linear-to-r from-transparent via-[#ffd700]/60 to-transparent mx-auto my-3"
          />

          <div className="flex gap-2 justify-center mb-4">
            <span className="text-[9px] uppercase font-bold tracking-wider text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-sm bg-purple-950/50">
              {interpretation.element}
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-sm bg-purple-950/50">
              {interpretation.astrology}
            </span>
          </div>

          <p className="text-xs font-semibold text-purple-300/60 tracking-widest uppercase mb-1">
            Short Meaning
          </p>
          <p className="text-sm italic text-purple-100/70 mb-4 font-serif">
            &ldquo;{card.meaning}&rdquo;
          </p>
        </div>

        <div className="text-left border-t border-[#ffd700]/20 pt-5">
          <p className="text-xs font-bold text-[#ffd700]/80 tracking-[0.2em] uppercase mb-2 font-serif text-center">
            Mystical Interpretation
          </p>
          <p
            id={descriptionId}
            className="text-sm leading-relaxed text-purple-100/90 font-serif text-justify"
          >
            {card.details}
          </p>
        </div>

        <div className="text-left border-t border-[#ffd700]/10 pt-4">
          <p className="text-xs font-bold text-[#ffd700]/70 tracking-[0.2em] uppercase mb-2 font-serif text-center">
            Sacred Symbols
          </p>
          <ul className="flex flex-col gap-1.5 text-xs text-purple-200/80 font-serif pl-2">
            {interpretation.symbols.map((symbol) => (
              <li key={symbol} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="text-[#ffd700] text-[8px] mt-1"
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
          className="mt-2 px-6 py-2 border border-[#ffd700]/50 bg-purple-950/40 text-[#ffd700] hover:bg-[#ffd700] hover:text-[#1a0b2e] font-serif text-xs uppercase tracking-widest transition-all rounded-sm active:scale-95"
        >
          Close Revelation
        </button>
      </div>
    </div>
  );
}
