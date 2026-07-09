"use client";

import { useRef, useEffect, useState } from "react";
import { MousePointer2, Circle } from "lucide-react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

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

  const colors = ["#00ffff", "#ff00ff", "#ffff00", "#ffffff"];

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    forcePowerRef.current = forcePower;
  }, [forcePower]);

  const createParticle = (width: number, height: number): Particle => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 2 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
  });

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

    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(canvas.width, canvas.height),
    );

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        const mouse = mouseRef.current;

        if (mouse.down) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 400 && dist > 5) {
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
        ctx.shadowBlur = particleCount > 300 ? 0 : 10;
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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] cursor-crosshair select-none touch-none">
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.1s ease;
          margin-top: -6px;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
        }

        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        input[type="range"]::-moz-range-thumb {
          border: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.1s ease;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
        }
      `}</style>

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
        <p className="text-[10px] font-mono opacity-50 sm:text-xs">
          Quantum Simulation Environment
        </p>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 sm:bottom-6">
        <div className="flex gap-2 rounded-full border border-white/20 bg-white/10 p-2 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setMode("attract")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
              mode === "attract"
                ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                : "text-white hover:bg-white/10"
            }`}
          >
            <Circle className="h-4 w-4 fill-current" />
            ATTRACT
          </button>

          <button
            onClick={() => setMode("repel")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
              mode === "repel"
                ? "bg-[#ff00ff] text-white shadow-[0_0_12px_rgba(255,0,255,0.6)]"
                : "text-white hover:bg-white/10"
            }`}
          >
            <MousePointer2 className="h-4 w-4" />
            REPEL
          </button>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-md sm:rounded-full sm:px-6">
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
              className="w-full appearance-none bg-transparent cursor-pointer focus:outline-none"
            />
            <span className="w-12 text-right font-mono text-[10px] text-white sm:text-xs">
              {particleCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}