"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CONFIG = {
  proximity: 65,
  escapeDistance: 220,
  escapeCooldown: 80,
  escapesBeforeYield: 10,
  yieldDuration: 3500,
  edgePadding: 12,
  staticFrameInterval: 3,
} as const;

const FONT = "'Courier New', monospace";

type Phase = "avoiding" | "yielding";
type Position = { x: number; y: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function DontClickMe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonWrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const phaseRef = useRef<Phase>("avoiding");
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const escapeCountRef = useRef(0);
  const lastEscapeTimeRef = useRef(0);
  const yieldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("avoiding");
  const [clickCount, setClickCount] = useState(0);

  const updatePhase = useCallback((nextPhase: Phase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const moveButton = useCallback(({ x, y }: Position) => {
    positionRef.current = { x, y };

    if (buttonWrapRef.current) {
      buttonWrapRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, []);

  const clearYieldTimer = useCallback(() => {
    if (!yieldTimerRef.current) return;

    clearTimeout(yieldTimerRef.current);
    yieldTimerRef.current = null;
  }, []);

  const getMovementBounds = useCallback(() => {
    const container = containerRef.current;
    const button = buttonRef.current;

    if (!container || !button) return null;

    const width = container.clientWidth;
    const height = window.visualViewport?.height ?? container.clientHeight;

    return {
      width,
      height,
      maxX: Math.max(0, (width - button.offsetWidth) / 2 - CONFIG.edgePadding),
      maxY: Math.max(
        0,
        (height - button.offsetHeight) / 2 - CONFIG.edgePadding,
      ),
    };
  }, []);

  const resumeAvoiding = useCallback(() => {
    const bounds = getMovementBounds();
    if (!bounds) return;

    clearYieldTimer();

    moveButton({
      x: (Math.random() - 0.5) * bounds.width * 0.55,
      y: (Math.random() - 0.5) * bounds.height * 0.35,
    });

    updatePhase("avoiding");
  }, [clearYieldTimer, getMovementBounds, moveButton, updatePhase]);

  const beginYielding = useCallback(() => {
    escapeCountRef.current = 0;
    clearYieldTimer();
    updatePhase("yielding");

    yieldTimerRef.current = setTimeout(() => {
      if (phaseRef.current === "yielding") resumeAvoiding();
    }, CONFIG.yieldDuration);
  }, [clearYieldTimer, resumeAvoiding, updatePhase]);

  const escape = useCallback(() => {
    const bounds = getMovementBounds();
    if (!bounds) return;

    const angle = Math.random() * Math.PI * 2;
    const current = positionRef.current;

    moveButton({
      x: clamp(
        current.x + Math.cos(angle) * CONFIG.escapeDistance,
        -bounds.maxX,
        bounds.maxX,
      ),
      y: clamp(
        current.y + Math.sin(angle) * CONFIG.escapeDistance,
        -bounds.maxY,
        bounds.maxY,
      ),
    });

    if (++escapeCountRef.current >= CONFIG.escapesBeforeYield) {
      beginYielding();
    }
  }, [beginYielding, getMovementBounds, moveButton]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (clickCount < 10) return;
    if (phaseRef.current !== "avoiding") return;

    event.preventDefault();
    escape();
  };

  const handleClick = () => {
    if (clickCount < 10) {
      setClickCount((count) => count + 1);
      const bounds = getMovementBounds();
      if (bounds) {
        moveButton({
          x: (Math.random() - 0.5) * bounds.width * 0.55,
          y: (Math.random() - 0.5) * bounds.height * 0.35,
        });
      }
      return;
    }

    if (phaseRef.current !== "yielding") return;

    setClickCount((count) => count + 1);
    resumeAvoiding();
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (
        clickCount < 10 ||
        event.pointerType === "touch" ||
        phaseRef.current !== "avoiding"
      ) {
        return;
      }

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();

      // Distance from the pointer to the nearest point on the button.
      const nearestX = clamp(event.clientX, rect.left, rect.right);
      const nearestY = clamp(event.clientY, rect.top, rect.bottom);
      const distance = Math.hypot(
        event.clientX - nearestX,
        event.clientY - nearestY,
      );

      const now = performance.now();

      if (
        distance < CONFIG.proximity &&
        now - lastEscapeTimeRef.current >= CONFIG.escapeCooldown
      ) {
        lastEscapeTimeRef.current = now;
        escape();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [escape, clickCount]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const keepButtonInBounds = () => {
      const bounds = getMovementBounds();
      if (!bounds) return;

      moveButton({
        x: clamp(positionRef.current.x, -bounds.maxX, bounds.maxX),
        y: clamp(positionRef.current.y, -bounds.maxY, bounds.maxY),
      });
    };

    viewport.addEventListener("resize", keepButtonInBounds);

    return () => viewport.removeEventListener("resize", keepButtonInBounds);
  }, [getMovementBounds, moveButton]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    let animationFrame = 0;
    let frame = 0;
    let imageData: ImageData | null = null;

    const drawStatic = () => {
      animationFrame = requestAnimationFrame(drawStatic);

      if (++frame % CONFIG.staticFrameInterval !== 0) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (!width || !height) return;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        imageData = context.createImageData(width, height);
      }

      if (!imageData) return;

      const pixels = imageData.data;

      for (let index = 0; index < pixels.length; index += 4) {
        const noise = Math.random() * 255;

        pixels[index] = noise;
        pixels[index + 1] = noise;
        pixels[index + 2] = noise;
        pixels[index + 3] = 28;
      }

      context.putImageData(imageData, 0, 0);
    };

    animationFrame = requestAnimationFrame(drawStatic);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => clearYieldTimer, [clearYieldTimer]);

  const isYielding = phase === "yielding";

  return (
    <div
      ref={containerRef}
      className="relative flex h-dvh select-none flex-col items-center justify-center overflow-hidden bg-black text-white"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "screen" }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-1"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
        }}
      />

      {clickCount > 0 && (
        <p
          className="absolute top-6 z-10 select-none font-black tabular-nums"
          style={{
            fontFamily: FONT,
            fontSize: "4rem",
            lineHeight: 1,
            color: "#ff1a1a",
            textShadow:
              "0 0 30px rgba(255,0,0,0.7), 0 0 60px rgba(255,0,0,0.3)",
          }}
        >
          {clickCount}
        </p>
      )}

      <div className="relative z-20 flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          ref={buttonWrapRef}
          style={{
            transition: "transform 70ms ease-out",
            willChange: "transform",
          }}
        >
          <button
            ref={buttonRef}
            type="button"
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            className="touch-manipulation border-2 px-10 py-4 text-lg font-black uppercase tracking-widest transition-colors duration-150"
            style={{
              fontFamily: FONT,
              background: isYielding ? "rgba(200,0,0,0.12)" : "rgba(0,0,0,0.6)",
              borderColor: isYielding ? "#ff2222" : "#222",
              color: isYielding ? "#ff4040" : "#333",
              boxShadow: isYielding
                ? "0 0 24px rgba(255,0,0,0.35), inset 0 0 20px rgba(255,0,0,0.08)"
                : "none",
            }}
          >
            Don&apos;t Click Me
          </button>
        </div>
      </div>
    </div>
  );
}
