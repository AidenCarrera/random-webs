"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TAROT_CARDS, type TarotCard } from "../data/cards";
import { SHUFFLE_DURATION_MS, THREE_CARD_SPREAD } from "../data/spreads";
import type { DrawnCard } from "../types";
import { createReading } from "../utils/create-reading";

export function useTarotReading() {
  const [spread, setSpread] = useState<DrawnCard<TarotCard>[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const shuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startReading = useCallback(() => {
    setIsShuffling(true);
    setSpread([]);

    if (shuffleTimer.current) {
      clearTimeout(shuffleTimer.current);
    }

    shuffleTimer.current = setTimeout(() => {
      setSpread(createReading(TAROT_CARDS, THREE_CARD_SPREAD.positions));
      setIsShuffling(false);
      shuffleTimer.current = null;
    }, SHUFFLE_DURATION_MS);
  }, []);

  const revealCard = useCallback((index: number) => {
    setSpread((currentSpread) =>
      currentSpread.map((drawnCard, cardIndex) =>
        cardIndex === index ? { ...drawnCard, revealed: true } : drawnCard,
      ),
    );
  }, []);

  const showCardDetails = useCallback((card: TarotCard) => {
    setSelectedCard(card);
  }, []);

  const closeCardDetails = useCallback(() => {
    setSelectedCard(null);
  }, []);

  useEffect(
    () => () => {
      if (shuffleTimer.current) {
        clearTimeout(shuffleTimer.current);
      }
    },
    [],
  );

  return {
    spread,
    isShuffling,
    selectedCard,
    hasCompletedReading:
      spread.length > 0 && spread.every((drawnCard) => drawnCard.revealed),
    startReading,
    revealCard,
    showCardDetails,
    closeCardDetails,
  };
}
