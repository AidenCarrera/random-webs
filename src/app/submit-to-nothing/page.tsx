"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, ShieldAlert, Cpu } from "lucide-react";

// --- Types ---
type Phase = "TYPING" | "SUCKING" | "DIGESTING";

interface Particle {
  id: number;
  char: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  t: number;
  scale: number;
  rotation: number;
  startRotation: number;
  delay: number;
}

export default function SubmitToNothing() {
  const [complaint, setComplaint] = useState("");
  const [phase, setPhase] = useState<Phase>("TYPING");
  const [voidMass, setVoidMass] = useState(1);
  const [gravityPull, setGravityPull] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "SINGULARITY SYSTEM INITIALIZED.",
    "AWAITING DESTRUCTIVE CONFLICT INPUTS...",
  ]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voidCenterRef = useRef<HTMLDivElement>(null);

  // Background star field engine
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    interface Star {
      x: number;
      y: number;
      size: number;
      baseSpeed: number;
      hasTrail: boolean;
      history: { x: number; y: number }[];
      opacity: number;
    }

    let raf: number;
    let stars: Star[] = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 1200 }, (_, idx) => {
        const isDeepBackground = idx >= 200;
        const hasTrail = !isDeepBackground && Math.random() < 0.08;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: isDeepBackground ? 0.7 : Math.random() * 1.5 + 0.5,
          baseSpeed: isDeepBackground
            ? Math.random() * 0.01 + 0.002
            : Math.random() * (hasTrail ? 0.9 : 0.15) + 0.04,
          hasTrail,
          history: [],
          opacity: isDeepBackground
            ? Math.random() * 0.2 + 0.08
            : Math.random() * 0.4 + 0.3,
        };
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const draw = () => {
      ctx.fillStyle = "#07060c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      stars.forEach((star) => {
        if (star.hasTrail) {
          star.history.push({ x: star.x, y: star.y });
          if (star.history.length > 6) {
            star.history.shift();
          }
        }

        // Gravitational pull calculations
        const dx = centerX - star.x;
        const dy = centerY - star.y;
        const dist = Math.hypot(dx, dy);

        if (gravityPull > 0 && dist > 10) {
          const force = (gravityPull * 8) / dist;
          star.x += (dx / dist) * force;
          star.y += (dy / dist) * force;
          if (dist < 40) {
            star.x = Math.random() * canvas.width;
            star.y = Math.random() * canvas.height;
            star.history = [];
          }
        } else {
          // Normal slow drift
          star.y += star.baseSpeed;
          if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
            star.history = [];
          }
        }

        // Draw individual trails for selected stars
        if (star.hasTrail && star.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(star.history[0].x, star.history[0].y);
          for (let i = 1; i < star.history.length; i++) {
            ctx.lineTo(star.history[i].x, star.history[i].y);
          }
          ctx.strokeStyle = `rgba(168, 85, 247, ${star.baseSpeed * 0.45})`;
          ctx.lineWidth = star.size * 0.9;
          ctx.stroke();
        }

        ctx.fillStyle = star.hasTrail
          ? "rgba(216, 180, 254, 0.8)"
          : `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
    };
  }, [gravityPull]);

  // Handle typing effects
  const handleInputChange = (val: string) => {
    setComplaint(val);
    // Pulse void size temporarily on type
    setVoidMass(1 + val.length * 0.008);
  };

  // Add a line to the simulated log terminal
  const logMsg = useCallback((msg: string) => {
    setTerminalLogs((prev) => [...prev.slice(-8), `> ${msg.toUpperCase()}`]);
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop =
          logContainerRef.current.scrollHeight;
      }
    }, 20);
  }, []);

  // Sucking particle simulation loop
  useEffect(() => {
    if (phase !== "SUCKING") return;

    let timer: number;
    const step = () => {
      setParticles((prev) => {
        const remaining = prev
          .map((p) => {
            if (p.delay > 0) {
              return { ...p, delay: p.delay - 1 };
            }

            // Progress incremental steps (slowing down animation for dramatic effect)
            const nextT = Math.min(1, p.t + 0.007);

            const startDist = Math.hypot(p.startX, p.startY);
            const startAngle = Math.atan2(p.startY, p.startX);

            // Exponential distance decay (pulling faster as they get closer)
            const currentDist = startDist * Math.pow(1 - nextT, 1.8);
            // Swirling: orbits around center by 1.5 full turns (3 * Math.PI)
            const currentAngle = startAngle + nextT * (Math.PI * 3);

            const nextX = Math.cos(currentAngle) * currentDist;
            const nextY = Math.sin(currentAngle) * currentDist;

            const nextScale = (1 - nextT) * 1.1;
            const nextRotation = p.startRotation + nextT * 540;

            return {
              ...p,
              t: nextT,
              x: nextX,
              y: nextY,
              scale: nextScale,
              rotation: nextRotation,
            };
          })
          .filter((p) => p.t < 1);

        if (remaining.length === 0) {
          // Swallow complete
          setPhase("DIGESTING");
          setGravityPull(0);
          setVoidMass(1.8);
          logMsg("swallow sequence complete.");
          logMsg("the void remains satisfied.");
          setTimeout(() => {
            setVoidMass(1.0);
            setPhase("TYPING");
          }, 1500);
        }
        return remaining;
      });

      timer = requestAnimationFrame(step);
    };
    timer = requestAnimationFrame(step);

    return () => cancelAnimationFrame(timer);
  }, [phase, logMsg]);

  // Shred & swallow action
  const handleShred = () => {
    if (!complaint || phase !== "TYPING") return;

    setPhase("SUCKING");
    setGravityPull(1.5);
    logMsg("commencing shred protocol...");
    logMsg(`spaghettifying ${complaint.length} characters...`);

    // Dynamically calculate the offset coordinates from textarea center to void center
    let startX = -450;
    let startY = 0;
    if (textareaRef.current && voidCenterRef.current) {
      const textRect = textareaRef.current.getBoundingClientRect();
      const voidRect = voidCenterRef.current.getBoundingClientRect();
      startX =
        textRect.left +
        textRect.width / 2 -
        (voidRect.left + voidRect.width / 2);
      startY =
        textRect.top +
        textRect.height / 2 -
        (voidRect.top + voidRect.height / 2);
    }

    const charList = complaint.split("");
    const newParticles: Particle[] = charList.map((char, index) => {
      const startRotation = Math.random() * 360;
      const sX = startX + (Math.random() * 120 - 60);
      const sY = startY + (Math.random() * 80 - 40);
      return {
        id: index,
        char,
        startX: sX,
        startY: sY,
        x: sX,
        y: sY,
        t: 0,
        scale: 1.1,
        rotation: startRotation,
        startRotation,
        delay: index * 3.5, // Stagger letters flyout for a flow ribbon feel
      };
    });
    setParticles(newParticles);
    setComplaint("");
  };

  return (
    <div className="min-h-screen bg-[#07060c] text-white flex flex-col justify-center overflow-hidden relative select-none font-mono">
      {/* Background star field */}
      <canvas
        ref={backgroundCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* CORE WORKSPACE */}
      <main className="z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-12 max-w-7xl mx-auto w-full">
        {/* INPUT CARD */}
        <div className="w-full lg:w-[48%] flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">
            {phase === "TYPING" ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full bg-[#12111a]/70 border border-zinc-800/60 rounded-3xl p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-linear-to-r from-zinc-100 to-zinc-400">
                  SHRED TO THE VOID
                </h1>
                <p className="text-zinc-500 text-xs mb-6">
                  Dump your frustrations, anger, and useless thoughts.
                  Submissions are instantly shredded and deleted forever.
                </p>

                <div className="flex flex-col gap-1.5 relative mb-6">
                  <textarea
                    ref={textareaRef}
                    value={complaint}
                    onChange={(e) => handleInputChange(e.target.value)}
                    maxLength={140}
                    className="w-full h-32 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-900/60 focus:ring-1 focus:ring-purple-900/60 transition-all outline-none resize-none font-mono"
                    placeholder="ENTER YOUR POINTLESS FRUSTRATION..."
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600">
                    {complaint.length}/140
                  </div>
                </div>

                <button
                  onClick={handleShred}
                  disabled={!complaint.trim()}
                  className="w-full py-4 bg-linear-to-r from-purple-950 to-indigo-950 border border-purple-900/60 hover:from-purple-900/40 hover:to-indigo-900/40 text-purple-300 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>SHRED FOREVER</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full text-center p-8 bg-zinc-950/30 rounded-3xl border border-zinc-900/40 backdrop-blur-md"
              >
                <div className="text-zinc-500 text-xs tracking-[0.2em] uppercase animate-pulse mb-2">
                  {phase === "SUCKING"
                    ? "Spaghettifying Data"
                    : "Fusing Particles"}
                </div>
                <div className="text-sm font-bold text-zinc-400">
                  {phase === "SUCKING"
                    ? "SHREDDING COMPLAINT INTO SPACE DUST..."
                    : "DIGESTED IN THE EVENT HORIZON."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GLOWING SINGULARITY (Void Graphic) */}
        <div className="w-full lg:w-[48%] flex items-center justify-center relative min-h-[400px] lg:translate-x-20">
          {/* Sucking particles overlay */}
          {phase === "SUCKING" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              {particles.map((p) => {
                if (p.delay > 0) return null;
                return (
                  <div
                    key={p.id}
                    className="absolute font-black text-sm text-purple-400/90 font-mono"
                    style={{
                      transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`,
                      transition: "transform 0.08s linear",
                      willChange: "transform",
                    }}
                  >
                    {p.char}
                  </div>
                );
              })}
            </div>
          )}

          {/* Singular Orb Container */}
          <div
            ref={voidCenterRef}
            className="relative flex items-center justify-center w-96 h-96 md:w-[520px] md:h-[520px] lg:w-[580px] lg:h-[580px]"
          >
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full drop-shadow-[0_0_80px_rgba(124,58,237,0.2)]"
            >
              <defs>
                {/* Glow Filters */}
                <filter
                  id="bh-glow-heavy"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
                </filter>
                <filter
                  id="bh-glow-mid"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
                </filter>
                <filter
                  id="bh-glow-fine"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>

                {/* Accretion Gradients */}
                <radialGradient id="outer-shroud" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e0b36" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#2e1065" stopOpacity="0.45" />
                  <stop offset="80%" stopColor="#172554" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#07060c" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="mid-vortex" cx="50%" cy="50%" r="50%">
                  <stop offset="25%" stopColor="#db2777" stopOpacity="0" />
                  <stop offset="45%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="65%" stopColor="#6d28d9" stopOpacity="0.35" />
                  <stop offset="90%" stopColor="#1e3a8a" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#07060c" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="inner-vortex" cx="50%" cy="50%" r="50%">
                  <stop offset="35%" stopColor="#c084fc" stopOpacity="0" />
                  <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.75" />
                  <stop offset="70%" stopColor="#4338ca" stopOpacity="0.4" />
                  <stop offset="90%" stopColor="#1e3a8a" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#07060c" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#000" stopOpacity="1" />
                  <stop offset="90%" stopColor="#000" stopOpacity="1" />
                  <stop offset="96%" stopColor="#6d28d9" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Layer 1: Outer Sapphire Swirling Disk */}
              <motion.g
                animate={{ rotate: -360 }}
                transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                className="origin-center"
              >
                {/* Large outer base glow */}
                <circle
                  cx="200"
                  cy="200"
                  r="170"
                  fill="url(#outer-shroud)"
                  filter="url(#bh-glow-heavy)"
                />
                {/* Outer swirl arm paths */}
                <path
                  d="M 200 200 Q 280 120 330 200 T 200 350"
                  fill="none"
                  stroke="rgba(91, 33, 182, 0.2)"
                  strokeWidth="35"
                  strokeLinecap="round"
                  filter="url(#bh-glow-heavy)"
                />
                <path
                  d="M 200 200 Q 120 280 70 200 T 200 50"
                  fill="none"
                  stroke="rgba(30, 58, 138, 0.15)"
                  strokeWidth="35"
                  strokeLinecap="round"
                  filter="url(#bh-glow-heavy)"
                />
              </motion.g>

              {/* Layer 2: Middle Purple/Magenta Vortex */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="origin-center"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="130"
                  fill="url(#mid-vortex)"
                  filter="url(#bh-glow-mid)"
                />
                {/* Spiraling violet threads */}
                <path
                  d="M 200 200 Q 250 140 280 200 T 200 310"
                  fill="none"
                  stroke="rgba(219, 39, 119, 0.25)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  filter="url(#bh-glow-mid)"
                />
                <path
                  d="M 200 200 Q 150 260 120 200 T 200 90"
                  fill="none"
                  stroke="rgba(109, 40, 217, 0.3)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  filter="url(#bh-glow-mid)"
                />
              </motion.g>

              {/* Layer 3: Inner Neon Cyan Accretion Swirls */}
              <motion.g
                animate={{ rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                className="origin-center"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="95"
                  fill="url(#inner-vortex)"
                  filter="url(#bh-glow-fine)"
                />
                {/* Sharp bright inner accretion tails */}
                <path
                  d="M 200 200 Q 230 160 250 200 T 200 270"
                  fill="none"
                  stroke="rgba(124, 58, 237, 0.65)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter="url(#bh-glow-fine)"
                />
                <path
                  d="M 200 200 Q 170 240 150 200 T 200 130"
                  fill="none"
                  stroke="rgba(29, 78, 216, 0.45)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter="url(#bh-glow-fine)"
                />
              </motion.g>

              {/* Layer 4: Singularity Event Horizon Core */}
              <motion.g
                animate={{ scale: voidMass }}
                className="origin-center"
                transition={{ type: "spring", stiffness: 120, damping: 10 }}
              >
                {/* Solid pitch black core circle with glowing rim */}
                <circle cx="200" cy="200" r="55" fill="url(#core-glow)" />
                <circle cx="200" cy="200" r="53" fill="#000000" />
              </motion.g>
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
