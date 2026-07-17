import { useCallback, useSyncExternalStore } from "react";

import { HINT_DISMISSED_STORAGE_KEY } from "../constants";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === HINT_DISMISSED_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

const getSnapshot = () =>
  localStorage.getItem(HINT_DISMISSED_STORAGE_KEY) !== "true";
const getServerSnapshot = () => true;

export function useCanvasHint() {
  const visible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setVisible = useCallback((nextVisible: boolean) => {
    localStorage.setItem(HINT_DISMISSED_STORAGE_KEY, String(!nextVisible));
    listeners.forEach((notify) => notify());
  }, []);

  return [visible, setVisible] as const;
}
