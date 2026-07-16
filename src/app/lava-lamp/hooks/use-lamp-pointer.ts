import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import type { Blob, CursorMode, Geometry, PointerState } from "../types";
import { halfWidthAt } from "../utils/geometry";
import { clamp } from "../utils/math";

type UseLampPointerOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  geometryRef: RefObject<Geometry | null>;
  blobsRef: RefObject<Blob[]>;
  pointerRef: RefObject<PointerState>;
};

export function useLampPointer({
  canvasRef,
  geometryRef,
  blobsRef,
  pointerRef,
}: UseLampPointerOptions) {
  const cursorModeRef = useRef<CursorMode>("default");
  const [cursorMode, setCursorMode] = useState<CursorMode>("default");

  const changeCursorMode = useCallback((next: CursorMode) => {
    if (cursorModeRef.current === next) return;
    cursorModeRef.current = next;
    setCursorMode(next);
  }, []);

  const updatePointer = useCallback(
    (event: ReactPointerEvent<HTMLElement>, down = pointerRef.current.down) => {
      if ((event.target as HTMLElement).closest(".controls")) {
        if (!pointerRef.current.down) changeCursorMode("default");
        return;
      }

      const canvas = canvasRef.current;
      const geometry = geometryRef.current;
      if (!canvas || !geometry) return;

      const rect = canvas.getBoundingClientRect();
      const nextX =
        (event.clientX - rect.left - geometry.centerX) / geometry.bodyHalf;
      const nextY =
        (event.clientY - rect.top - geometry.glassTop) / geometry.glassHeight;
      const inside =
        nextY >= 0 &&
        nextY <= 1 &&
        Math.abs(nextX) <= halfWidthAt(clamp(nextY, 0, 1));
      const bodyToHeight = geometry.bodyHalf / geometry.glassHeight;
      const pointerX = nextX * bodyToHeight;
      let lavaField = 0;

      if (inside) {
        for (const blob of blobsRef.current) {
          const dx = pointerX - blob.x * bodyToHeight;
          const dy = nextY - blob.y;
          lavaField += (blob.r * blob.r) / (dx * dx + dy * dy + 0.00034);
        }
      }

      const overLava = inside && lavaField >= 0.82;
      const pointer = pointerRef.current;
      const dragging = down && inside && (pointer.down || overLava);

      pointer.dx = clamp(nextX - pointer.x, -0.12, 0.12);
      pointer.dy = clamp(nextY - pointer.y, -0.12, 0.12);
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.active = inside;
      pointer.down = dragging;

      changeCursorMode(dragging ? "grabbing" : overLava ? "grab" : "default");
    },
    [blobsRef, canvasRef, changeCursorMode, geometryRef, pointerRef],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest(".controls")) return;
    updatePointer(event, true);
    if (pointerRef.current.down) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    updatePointer(event, false);
    pointerRef.current.down = false;
  };

  const handlePointerLeave = () => {
    pointerRef.current.active = false;
    pointerRef.current.down = false;
    changeCursorMode("default");
  };

  return {
    cursorMode,
    handlePointerDown,
    handlePointerMove: updatePointer,
    handlePointerUp,
    handlePointerLeave,
  };
}
