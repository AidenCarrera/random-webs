"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PROXIMITY = 65; // px from button edge before it runs
const ESCAPE_DIST = 220; // how far it jumps
const YIELD_AFTER = 10; // escapes before yielding
const YIELD_DURATION = 3500;

type Phase = "avoiding" | "yielding";

export default function DontClickMe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonWrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [clickCount, setClickCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("avoiding");

  const phaseRef = useRef<Phase>("avoiding");
  const offsetRef = useRef({ x: 0, y: 0 });
  const escapeCountRef = useRef(0);
  const yieldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEscapeAt = useRef(0);

  // Direct DOM move — zero React overhead
  const moveTo = useCallback((x: number, y: number) => {
    offsetRef.current = { x, y };
    if (buttonWrapRef.current) {
      buttonWrapRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, []);

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const resumeAvoiding = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const rx = (Math.random() - 0.5) * width * 0.55;
    const ry = (Math.random() - 0.5) * height * 0.35;
    moveTo(rx, ry);
    setPhaseSync("avoiding");
  }, [moveTo, setPhaseSync]);

  const escape = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const btnW = buttonRef.current?.offsetWidth ?? 160;
    const btnH = buttonRef.current?.offsetHeight ?? 56;
    const maxX = width / 2 - btnW / 2 - 12;
    const maxY = height / 2 - btnH / 2 - 12;

    const angle = Math.random() * 2 * Math.PI;
    const nx = Math.max(
      -maxX,
      Math.min(maxX, offsetRef.current.x + Math.cos(angle) * ESCAPE_DIST),
    );
    const ny = Math.max(
      -maxY,
      Math.min(maxY, offsetRef.current.y + Math.sin(angle) * ESCAPE_DIST),
    );
    moveTo(nx, ny);

    escapeCountRef.current += 1;
    if (escapeCountRef.current >= YIELD_AFTER) {
      escapeCountRef.current = 0;
      setPhaseSync("yielding");
      if (yieldTimerRef.current) clearTimeout(yieldTimerRef.current);
      yieldTimerRef.current = setTimeout(() => {
        if (phaseRef.current === "yielding") resumeAvoiding();
      }, YIELD_DURATION);
    }
  }, [moveTo, setPhaseSync, resumeAvoiding]);

  // Mouse proximity check
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (phaseRef.current !== "avoiding") return;
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const cx = Math.max(r.left, Math.min(r.right, e.clientX));
      const cy = Math.max(r.top, Math.min(r.bottom, e.clientY));
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < PROXIMITY) {
        const now = Date.now();
        if (now - lastEscapeAt.current > 80) {
          lastEscapeAt.current = now;
          escape();
        }
      }
    },
    [escape],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Click handler
  const handleClick = () => {
    if (phaseRef.current !== "yielding") return;
    if (yieldTimerRef.current) clearTimeout(yieldTimerRef.current);
    setClickCount((c) => c + 1);
    resumeAvoiding();
  };

  // TV static canvas — drawn every 3 frames to stay light
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let frame = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (++frame % 3 !== 0) return; // run at ~20fps for static
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (!w || !h) return;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 28;
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden relative select-none"
    >
      {/* TV static */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
        }}
      />

      {/* Click counter */}
      {clickCount > 0 && (
        <p
          className="absolute top-6 font-black tabular-nums z-10 select-none"
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "4rem",
            lineHeight: 1,
            color: "#ff1a1a",
            textShadow: "0 0 30px rgba(255,0,0,0.7), 0 0 60px rgba(255,0,0,0.3)",
          }}
        >
          {clickCount}
        </p>
      )}

      {/* Button arena */}
      <div className="relative z-20 w-full flex-1 flex items-center justify-center">
        <div
          ref={buttonWrapRef}
          style={{
            transition: "transform 0.07s ease-out",
            willChange: "transform",
          }}
        >
          <button
            ref={buttonRef}
            onClick={handleClick}
            className="font-black uppercase tracking-widest text-lg px-10 py-4 border-2 transition-colors duration-150"
            style={{
              fontFamily: "'Courier New', monospace",
              background:
                phase === "yielding" ? "rgba(200,0,0,0.12)" : "rgba(0,0,0,0.6)",
              borderColor: phase === "yielding" ? "#ff2222" : "#222",
              color: phase === "yielding" ? "#ff4040" : "#333",
              boxShadow:
                phase === "yielding"
                  ? "0 0 24px rgba(255,0,0,0.35), inset 0 0 20px rgba(255,0,0,0.08)"
                  : "none",
            }}
          >
            CLICK ME
          </button>
        </div>
      </div>
    </div>
  );
}
