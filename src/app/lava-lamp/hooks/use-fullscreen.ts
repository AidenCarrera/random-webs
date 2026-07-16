import { useCallback, useEffect, useState, type RefObject } from "react";

export function useFullscreen(stageRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;

    if (isFullscreen) {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => undefined);
      }
      setIsFullscreen(false);
      return;
    }

    setIsFullscreen(true);
    if (stage.requestFullscreen) {
      await stage.requestFullscreen().catch(() => undefined);
    }
  }, [isFullscreen, stageRef]);

  return { isFullscreen, toggleFullscreen };
}
