import type { RefObject } from "react";
import { useCallback, useEffect } from "react";

import { STORAGE_KEY } from "../constants";
import type { FallingSandCanvasHandle, ToastState } from "../types";

type ShowToast = (message: string, tone: ToastState["tone"]) => void;

export function useWorldStorage(
  canvasRef: RefObject<FallingSandCanvasHandle | null>,
  autoSave: boolean,
  ready: boolean,
  showToast: ShowToast,
) {
  useEffect(() => {
    if (!autoSave || !ready) return;
    const saveQuietly = () => {
      try {
        const serialized = canvasRef.current?.serialize();
        if (serialized) localStorage.setItem(STORAGE_KEY, serialized);
      } catch {}
    };
    const interval = window.setInterval(saveQuietly, 15_000);
    return () => window.clearInterval(interval);
  }, [autoSave, canvasRef, ready]);

  const saveWorld = useCallback(() => {
    try {
      const serialized = canvasRef.current?.serialize();
      if (!serialized) throw new Error("The sandbox is not ready yet.");
      localStorage.setItem(STORAGE_KEY, serialized);
      showToast("Creation saved in this browser.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save this world.",
        "error",
      );
    }
  }, [canvasRef, showToast]);

  const loadWorld = useCallback(() => {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        showToast("No saved creation was found on this device.", "error");
        return;
      }
      canvasRef.current?.load(serialized);
      showToast("Saved creation loaded.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to load this world.",
        "error",
      );
    }
  }, [canvasRef, showToast]);

  return { loadWorld, saveWorld };
}
