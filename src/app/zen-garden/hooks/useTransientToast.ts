import { useCallback, useEffect, useRef, useState } from "react";

export function useTransientToast(duration = 2500) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (nextMessage: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(nextMessage);
      timeoutRef.current = setTimeout(() => {
        setMessage((current) => (current === nextMessage ? null : current));
      }, duration);
    },
    [duration],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { toastMessage: message, showToast };
}
