import { useCallback, useEffect, useRef } from "react";

export function useSessionUptime() {
  const loadTimeRef = useRef<number | null>(null);

  useEffect(() => {
    loadTimeRef.current = Date.now();
  }, []);

  return useCallback(() => {
    const loadTime = loadTimeRef.current;
    if (loadTime === null) return "0s";

    const differenceInSeconds = Math.floor((Date.now() - loadTime) / 1000);
    const minutes = Math.floor(differenceInSeconds / 60);
    const seconds = differenceInSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }, []);
}
