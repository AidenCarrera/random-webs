import { useCallback, useEffect, useRef, useState } from "react";

import type { ToastState } from "../types";

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, tone: ToastState["tone"]) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setToast({ message, tone });
    timerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { showToast, toast };
}
