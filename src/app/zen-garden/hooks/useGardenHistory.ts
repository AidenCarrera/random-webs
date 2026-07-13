import { useCallback, useEffect, useRef, useState } from "react";
import type { HistoryEntry, Plant, Ripple, Stroke } from "../types";

const EMPTY_GARDEN: HistoryEntry = {
  plants: [],
  strokes: [],
  ripples: [],
};

export function useGardenHistory() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([EMPTY_GARDEN]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const plantsRef = useRef(plants);
  const strokesRef = useRef(strokes);
  const ripplesRef = useRef(ripples);

  useEffect(() => {
    plantsRef.current = plants;
    strokesRef.current = strokes;
    ripplesRef.current = ripples;
  }, [plants, ripples, strokes]);

  const saveToHistory = useCallback(
    (nextPlants: Plant[], nextStrokes: Stroke[], nextRipples: Ripple[]) => {
      const nextHistory = [
        ...history.slice(0, historyIndex + 1),
        {
          plants: nextPlants,
          strokes: nextStrokes,
          ripples: nextRipples,
        },
      ];
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex],
  );

  const restoreHistoryEntry = useCallback((entry: HistoryEntry) => {
    setPlants(entry.plants);
    setStrokes(entry.strokes);
    setRipples(entry.ripples);
  }, []);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return false;
    const previousIndex = historyIndex - 1;
    restoreHistoryEntry(history[previousIndex]);
    setHistoryIndex(previousIndex);
    return true;
  }, [history, historyIndex, restoreHistoryEntry]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return false;
    const nextIndex = historyIndex + 1;
    restoreHistoryEntry(history[nextIndex]);
    setHistoryIndex(nextIndex);
    return true;
  }, [history, historyIndex, restoreHistoryEntry]);

  return {
    plants,
    setPlants,
    strokes,
    setStrokes,
    ripples,
    setRipples,
    history,
    historyIndex,
    plantsRef,
    strokesRef,
    ripplesRef,
    saveToHistory,
    undo,
    redo,
  };
}
