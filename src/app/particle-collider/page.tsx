"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MousePointer2, Circle } from "lucide-react";

import styles from "./styles.module.css";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const PARTICLE_COLORS = ["#00ffff", "#ff00ff", "#ffff00", "#ffffff"];

const FIELD_RADIUS = 400;

const createParticle = (width: number, height: number): Particle => ({
  x: Math.random() * width,
  y: Math.random() * height,
  vx: (Math.random() - 0.5) * 2,
  vy: (Math.random() - 0.5) * 2,
  size: Math.random() * 2 + 1,
  color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
});

export default function ParticleCollider() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  const [mode, setMode] = useState<"attract" | "repel">("attract");
  const [forcePower, setForcePower] = useState(500);
  const [particleCount, setParticleCount] = useState(200);

  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const modeRef = useRef(mode);
  const forcePowerRef = useRef(forcePower);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    forcePowerRef.current = forcePower;
  }, [forcePower]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const particles = particlesRef.current;

    if (particles.length < particleCount) {
      while (particles.length < particleCount) {
        particles.push(createParticle(width, height));
      }
    } else {
      particles.length = particleCount;
    }
  }, [particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pulse = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pointer = mouseRef.current;
      if (pointer.down) {
        pulse = (pulse + 0.02) % 1;
        const attract = modeRef.current === "attract";
        const color = attract ? "255, 255, 255" : "255, 0, 255";
        // 0 at minimum force, 1 at maximum; drives ring size and opacity.
        const strength = (forcePowerRef.current - 100) / 9900;
        const maxRadius = 40 + strength * 140;

        for (let ring = 0; ring < 3; ring++) {
          const phase = (pulse + ring / 3) % 1;
          const radius = maxRadius * (attract ? 1 - phase : phase) + 6;
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${color}, ${(0.03 + strength * 0.07) * (1 - Math.abs(phase - 0.5) * 2)})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }

      particlesRef.current.forEach((p) => {
        const mouse = mouseRef.current;

        if (mouse.down) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < FIELD_RADIUS && dist > 5) {
            const force = forcePowerRef.current / (dist * dist);
            const angle = Math.atan2(dy, dx);
            const direction = modeRef.current === "attract" ? 1 : -1;

            p.vx += Math.cos(angle) * force * direction;
            p.vy += Math.sin(angle) * force * direction;
          }
        }

        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = particlesRef.current.length > 300 ? 0 : 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;

    if (e.type === "pointerdown") {
      mouseRef.current.down = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (e.type === "pointerup" || e.type === "pointercancel") {
      mouseRef.current.down = false;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    setForcePower((current) => {
      const next = current + (e.deltaY < 0 ? 250 : -250);
      return Math.max(100, Math.min(10000, next));
    });
  };

  return (
    <main
      className={`${styles.root} relative min-h-screen overflow-hidden bg-[#0a0a14] cursor-crosshair select-none touch-none`}
    >
      <div aria-hidden="true" className={styles.detector} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none select-none"
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
        onPointerUp={handlePointer}
        onPointerCancel={handlePointer}
        onWheel={handleWheel}
      />

      <div className="absolute left-4 top-4 z-10 text-white pointer-events-none select-none sm:left-6 sm:top-6">
        <h1 className="text-xl font-bold tracking-tighter mix-blend-difference sm:text-3xl">
          PARTICLE COLLIDER
        </h1>
        <p className="text-[10px] font-mono opacity-60 sm:text-xs">
          Quantum Simulation Environment
        </p>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 sm:bottom-6">
        <div className="flex gap-2 rounded-full border border-white/15 bg-white/8 p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <button
            onClick={() => setMode("attract")}
            aria-pressed={mode === "attract"}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
              mode === "attract" ? "text-black" : "text-white hover:bg-white/10"
            }`}
          >
            {mode === "attract" ? (
              <motion.span
                layoutId="collider-mode"
                className="absolute inset-0 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            ) : null}
            <span className="relative flex items-center gap-2">
              <Circle className="h-4 w-4 fill-current" />
              ATTRACT
            </span>
          </button>

          <button
            onClick={() => setMode("repel")}
            aria-pressed={mode === "repel"}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
              mode === "repel" ? "text-white" : "text-white hover:bg-white/10"
            }`}
          >
            {mode === "repel" ? (
              <motion.span
                layoutId="collider-mode"
                className="absolute inset-0 rounded-full bg-[#ff00ff] shadow-[0_0_12px_rgba(255,0,255,0.6)]"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            ) : null}
            <span className="relative flex items-center gap-2">
              <MousePointer2 className="h-4 w-4" />
              REPEL
            </span>
          </button>
        </div>

        <div
          className="rounded-3xl border border-white/15 bg-white/8 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:rounded-full sm:px-6"
          style={
            {
              "--accent": mode === "attract" ? "#ffffff" : "#ff00ff",
            } as React.CSSProperties
          }
        >
          <div className="flex items-center gap-3">
            <span className="w-20 text-[10px] font-bold text-white sm:text-xs">
              FORCE
            </span>
            <input
              type="range"
              min="100"
              max="10000"
              step="50"
              value={forcePower}
              onChange={(e) => setForcePower(Number(e.target.value))}
              aria-label="Force"
              style={
                {
                  "--fill": `${((forcePower - 100) / 9900) * 100}%`,
                } as React.CSSProperties
              }
              className="w-full appearance-none bg-transparent cursor-pointer focus:outline-none"
            />
            <span className="w-12 text-right font-mono text-[10px] text-white sm:text-xs">
              {forcePower}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="w-20 text-[10px] font-bold text-white sm:text-xs">
              PARTICLES
            </span>
            <input
              type="range"
              min="50"
              max="600"
              step="50"
              value={particleCount}
              onChange={(e) => setParticleCount(Number(e.target.value))}
              aria-label="Particles"
              style={
                {
                  "--fill": `${((particleCount - 50) / 550) * 100}%`,
                } as React.CSSProperties
              }
              className="w-full appearance-none bg-transparent cursor-pointer focus:outline-none"
            />
            <span className="w-12 text-right font-mono text-[10px] text-white sm:text-xs">
              {particleCount}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
