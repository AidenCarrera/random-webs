import { useEffect, useRef } from "react";

export function useAutoScroll(history: string[], bootLogs: string[]) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, bootLogs]);

  return endRef;
}
