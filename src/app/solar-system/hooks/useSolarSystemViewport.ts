"use client";

import { useEffect, useRef, useState } from "react";

import { getViewportLayout } from "../utils";

export function useSolarSystemViewport(
  setSidebarOpen: (open: boolean) => void,
) {
  const [mounted, setMounted] = useState(false);
  const [containerScale, setContainerScale] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const lastMobileViewportRef = useRef<boolean | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const layout = getViewportLayout(window.innerWidth, window.innerHeight);

      if (lastMobileViewportRef.current !== layout.isMobileViewport) {
        lastMobileViewportRef.current = layout.isMobileViewport;
        setIsMobileViewport(layout.isMobileViewport);
        setSidebarOpen(!layout.isMobileViewport);
      }

      setContainerScale(layout.containerScale);
    };

    const frame = requestAnimationFrame(() => {
      setMounted(true);
      handleResize();
    });

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [setSidebarOpen]);

  return { mounted, containerScale, isMobileViewport };
}
