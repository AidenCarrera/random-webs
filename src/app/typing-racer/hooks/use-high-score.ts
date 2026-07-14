"use client";

import { useCallback, useEffect, useState } from "react";

import { HIGH_SCORE_STORAGE_KEYS } from "../data/race-config";

export function useHighScore() {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const savedScore =
      localStorage.getItem(HIGH_SCORE_STORAGE_KEYS[0]) ||
      localStorage.getItem(HIGH_SCORE_STORAGE_KEYS[1]);

    if (!savedScore) return;

    const frame = requestAnimationFrame(() => {
      setHighScore(parseInt(savedScore, 10));
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const saveHighScore = useCallback(
    (finalWpm: number) => {
      if (finalWpm <= highScore) return;

      setHighScore(finalWpm);
      localStorage.setItem(HIGH_SCORE_STORAGE_KEYS[0], finalWpm.toString());
    },
    [highScore],
  );

  return { highScore, saveHighScore };
}
