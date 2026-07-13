import { useCallback, useEffect, useState } from "react";

import { BOOT_SEQUENCE } from "../constants";

export function useBootSequence() {
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  const runBootSequence = useCallback(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < BOOT_SEQUENCE.length) {
        setBootLogs((previous) => [...previous, BOOT_SEQUENCE[index]]);
        index++;
      } else {
        clearInterval(interval);
        setIsBooting(false);
      }
    }, 120);
    return interval;
  }, []);

  const startBootSequence = useCallback(() => {
    setIsBooting(true);
    setBootLogs([]);
    return runBootSequence();
  }, [runBootSequence]);

  useEffect(() => {
    const bootInterval = runBootSequence();
    return () => clearInterval(bootInterval);
  }, [runBootSequence]);

  return {
    bootLogs,
    isBooting,
    setIsBooting,
    startBootSequence,
  };
}
