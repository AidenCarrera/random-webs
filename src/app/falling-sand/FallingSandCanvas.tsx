"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { FallingSandEngine } from "./engine";
import { useLatestRef } from "./hooks/useLatestRef";
import styles from "./styles.module.css";
import {
  Material,
  type FallingSandCanvasHandle,
  type SandWorldStats,
} from "./types";
import { createSnapshot } from "./utils/createSnapshot";

type FallingSandCanvasProps = {
  autoPauseWhenHidden: boolean;
  brushSize: number;
  material: Material;
  onBrushSizeChange?: (size: number) => void;
  onReady?: () => void;
  onStats?: (stats: SandWorldStats) => void;
  pauseWhileDrawing: boolean;
  paused: boolean;
  rightClickErases: boolean;
  speed: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const getWorldDimensions = (width: number, height: number) => {
  const targetCellSize = width < 700 ? 4.8 : 4.2;
  const worldWidth = clamp(Math.round(width / targetCellSize), 96, 280);
  const worldHeight = clamp(
    Math.round(worldWidth * (height / Math.max(width, 1))),
    64,
    196,
  );
  return { width: worldWidth, height: worldHeight };
};

export const FallingSandCanvas = forwardRef<
  FallingSandCanvasHandle,
  FallingSandCanvasProps
>(function FallingSandCanvas(
  {
    autoPauseWhenHidden,
    brushSize,
    material,
    onBrushSizeChange,
    onReady,
    onStats,
    pauseWhileDrawing,
    paused,
    rightClickErases,
    speed,
  },
  ref,
) {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FallingSandEngine | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const materialRef = useLatestRef(material);
  const brushSizeRef = useLatestRef(brushSize);
  const autoPauseWhenHiddenRef = useLatestRef(autoPauseWhenHidden);
  const pauseWhileDrawingRef = useLatestRef(pauseWhileDrawing);
  const pausedRef = useLatestRef(paused);
  const rightClickErasesRef = useLatestRef(rightClickErases);
  const speedRef = useLatestRef(speed);
  const onBrushSizeChangeRef = useLatestRef(onBrushSizeChange);
  const onStatsRef = useLatestRef(onStats);
  const onReadyRef = useLatestRef(onReady);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const readyRef = useRef(false);
  const documentHiddenRef = useRef(false);

  const renderNow = () => {
    const engine = engineRef.current;
    const context = contextRef.current;
    if (engine && context) engine.render(context);
  };

  useImperativeHandle(
    ref,
    () => ({
      clear() {
        engineRef.current?.clear();
        renderNow();
      },
      load(serialized: string) {
        const engine = engineRef.current;
        const canvas = canvasRef.current;
        if (!engine || !canvas)
          throw new Error("The sandbox is not ready yet.");
        engine.load(serialized);
        canvas.width = engine.width;
        canvas.height = engine.height;
        renderNow();
      },
      reset() {
        engineRef.current?.seedDemo();
        renderNow();
      },
      serialize() {
        const engine = engineRef.current;
        if (!engine) throw new Error("The sandbox is not ready yet.");
        return engine.serialize();
      },
      async snapshot() {
        const engine = engineRef.current;
        if (!engine) throw new Error("The sandbox is not ready yet.");
        return createSnapshot(engine);
      },
    }),
    [],
  );

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    if (!shell || !canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    contextRef.current = context;

    let animationFrame = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let renderedFrames = 0;
    let statsStartedAt = lastTime;
    const handleVisibilityChange = () => {
      documentHiddenRef.current = document.hidden;
    };
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const resize = (width: number, height: number) => {
      const dimensions = getWorldDimensions(width, height);
      if (!engineRef.current) {
        engineRef.current = new FallingSandEngine(
          dimensions.width,
          dimensions.height,
        );
        engineRef.current.seedDemo();
      } else {
        engineRef.current.resize(dimensions.width, dimensions.height);
      }
      canvas.width = engineRef.current.width;
      canvas.height = engineRef.current.height;
      engineRef.current.render(context);
      if (!readyRef.current) {
        readyRef.current = true;
        onReadyRef.current?.();
      }
    };

    const bounds = shell.getBoundingClientRect();
    resize(bounds.width, bounds.height);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (
        !entry ||
        entry.contentRect.width < 1 ||
        entry.contentRect.height < 1
      ) {
        return;
      }
      resize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(shell);

    const loop = (now: number) => {
      const elapsed = Math.min(50, now - lastTime);
      lastTime = now;
      const engine = engineRef.current;
      const drawingPause = pauseWhileDrawingRef.current && drawingRef.current;
      const hiddenPause =
        autoPauseWhenHiddenRef.current && documentHiddenRef.current;
      if (engine && !pausedRef.current && !drawingPause && !hiddenPause) {
        accumulator += (elapsed / (1000 / 60)) * speedRef.current;
        let iterations = 0;
        while (accumulator >= 1 && iterations < 4) {
          engine.step(1);
          accumulator -= 1;
          iterations += 1;
        }
      }
      if (engine) {
        engine.render(context);
        renderedFrames += 1;
        if (now - statsStartedAt >= 650) {
          const duration = now - statsStartedAt;
          const materialCounts = engine.getMaterialCounts();
          onStatsRef.current?.({
            cells: engine.width * engine.height,
            active:
              engine.width * engine.height - materialCounts[Material.EMPTY],
            fps: Math.round((renderedFrames * 1000) / duration),
            materialCounts,
          });
          renderedFrames = 0;
          statsStartedAt = now;
        }
      }
      animationFrame = requestAnimationFrame(loop);
    };
    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      contextRef.current = null;
      engineRef.current = null;
      readyRef.current = false;
    };
  }, [
    autoPauseWhenHiddenRef,
    onReadyRef,
    onStatsRef,
    pauseWhileDrawingRef,
    pausedRef,
    speedRef,
  ]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: clamp(
        Math.floor(
          ((event.clientX - bounds.left) / bounds.width) * engine.width,
        ),
        0,
        engine.width - 1,
      ),
      y: clamp(
        Math.floor(
          ((event.clientY - bounds.top) / bounds.height) * engine.height,
        ),
        0,
        engine.height - 1,
      ),
    };
  };

  const drawAtPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);
    const engine = engineRef.current;
    if (!point || !engine) return;
    if (event.buttons === 2 && !rightClickErasesRef.current) return;
    const selected = event.buttons === 2 ? Material.EMPTY : materialRef.current;
    const previous = lastPointRef.current ?? point;
    engine.paintLine(
      previous.x,
      previous.y,
      point.x,
      point.y,
      brushSizeRef.current,
      selected,
    );
    lastPointRef.current = point;
    if (pausedRef.current) renderNow();
  };

  return (
    <div ref={shellRef} className={styles.canvasShell}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Interactive falling sand simulation. Draw materials with a pointer or touch."
        onContextMenu={(event) => {
          if (rightClickErasesRef.current) event.preventDefault();
        }}
        onWheel={(event) => {
          event.preventDefault();
          if (event.deltaY === 0) return;
          const direction = event.deltaY < 0 ? 1 : -1;
          const nextSize = clamp(brushSizeRef.current + direction, 1, 14);
          if (nextSize === brushSizeRef.current) return;
          brushSizeRef.current = nextSize;
          onBrushSizeChangeRef.current?.(nextSize);
        }}
        onPointerDown={(event) => {
          if (event.button === 2 && !rightClickErasesRef.current) return;
          drawingRef.current = true;
          lastPointRef.current = null;
          event.currentTarget.setPointerCapture(event.pointerId);
          drawAtPointer(event);
        }}
        onPointerMove={(event) => {
          if (drawingRef.current) drawAtPointer(event);
        }}
        onPointerUp={(event) => {
          drawingRef.current = false;
          lastPointRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
          lastPointRef.current = null;
        }}
      />
    </div>
  );
});
