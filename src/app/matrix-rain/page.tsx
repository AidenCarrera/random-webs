"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, ShieldAlert, Cpu, Terminal, RefreshCw } from "lucide-react";

const HACKER_CODE = `"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, ShieldAlert, Cpu } from "lucide-react";

// ACCESS CODE: EXECUTING SOURCE EXTRACT...
// DECOMPILING RANDOM-WEB MAIN MAIN MAIN MAIN CORE...

import React from "react";

export function TerminalCore() {
  const kernel = useCoreKernel();
  const [entropy, setEntropy] = useState(0xDEADC0DE);

  // Initializing socket link override...
  const initializeSecureBypass = async () => {
    const handshake = await kernel.sendBypassPacket({
      address: "127.0.0.1",
      payload: Math.random().toString(16),
      timestamp: Date.now()
    });

    if (handshake.status === "GRANTED") {
      kernel.grantSystemAccess();
      console.log("ALERT: SECURITY OVERRIDE COMPLETED");
    }
  };

  return (
    <div className="system-node bg-black/90 p-4 border border-green-500/30">
      <div className="status-grid text-green-500 text-xs">
        <span>MEM_ALLOC: 0xFF00FF - OK</span>
        <span>SYS_CORE: ONLINE (PRIMARY)</span>
        <span>ENTROPY: 0x{entropy.toString(16)}</span>
      </div>
      <button onClick={initializeSecureBypass} className="mt-4 px-2 py-1 bg-green-500/20 text-green-400">
        Decompile Mainframe
      </button>
    </div>
  );
}

// INTRUSION DETECTED: AUTO-REBOOT BYPASSED
// SOURCE RECOVERY COMPLETING...
// SUCCESS. MATRIX CASCADE ACTIVE.
// OVERRIDE COMPILER STATE = GRANTED.`;

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedChars, setTypedChars] = useState(0);
  const [accessGranted, setAccessGranted] = useState(false);

  const dropsRef = useRef<number[]>([]);
  const tapTimestampsRef = useRef<number[]>([]);

  // Setup canvas size once on mount and bind resize listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const fontSize = 16;
      const columns = Math.ceil(canvas.width / fontSize);
      if (dropsRef.current.length !== columns) {
        const newDrops = [];
        for (let i = 0; i < columns; i++) {
          newDrops[i] = Math.random() * -100;
        }
        dropsRef.current = newDrops;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Animation loop - controls animation frames independently to freeze canvas correctly
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+{}[]|;:,.<>?";
    const fontSize = 16;
    let animationId: number;

    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;

    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw);

      const deltaTime = timestamp - lastTime;
      if (deltaTime < interval) return;

      lastTime = timestamp - (deltaTime % interval);

      ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0F0";
      ctx.font = `${fontSize}px monospace`;

      // 1. Calculate active typing speed multiplier based on the last 1.5 seconds
      const now = performance.now();
      tapTimestampsRef.current = tapTimestampsRef.current.filter((t) => now - t < 1500);
      const tapsPerSecond = tapTimestampsRef.current.length / 1.5;
      
      // Speed multiplier caps at 1.0 (equivalent to full default cascade speed) at 8 keystrokes per second
      const speedMultiplier = 0.04 + Math.min(0.96, tapsPerSecond / 8.0);

      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
        const x = i * fontSize;
        const y = Math.floor(drops[i]) * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i] += speedMultiplier;
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  // Handle auto-scroll terminal console
  useEffect(() => {
    const consoleEl = consoleRef.current;
    if (consoleEl) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }, [typedChars]);

  const advanceHacking = () => {
    // Record keystroke timestamp for typing velocity speed multiplier
    tapTimestampsRef.current.push(performance.now());

    const drops = dropsRef.current;
    if (drops.length > 0) {
      for (let j = 0; j < 6; j++) {
        const randomIndex = Math.floor(Math.random() * drops.length);
        drops[randomIndex] = -Math.floor(Math.random() * 15);
      }
    }

    setTypedChars((prev) => {
      const nextChars = prev + 6;
      if (nextChars >= HACKER_CODE.length) {
        setAccessGranted(true);
      }
      return Math.min(nextChars, HACKER_CODE.length);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape" || e.key === "F12" || e.key === "F5") return;

      e.preventDefault();
      advanceHacking();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resetBypass = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTypedChars(0);
    setAccessGranted(false);
  };

  return (
    <div 
      onPointerDown={advanceHacking}
      className="relative min-h-screen bg-black overflow-hidden font-mono flex items-center justify-center cursor-keyboard select-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Top Banner UI */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-3xl md:text-4xl font-black text-[#0F0] tracking-widest drop-shadow-[0_0_10px_rgba(0,255,0,0.6)] uppercase">
          matrix_core
        </h1>
        <div className="flex items-center gap-2 text-[#0F0]/60 mt-1 text-xs">
          <Monitor className="w-3.5 h-3.5" />
          <span>PORT: 127.0.0.1 &bull; SMASH KEYS TO TYPE</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-8 right-8 z-30 flex items-center gap-3" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-5 py-2.5 border border-[#0F0] text-[#0F0] hover:bg-[#0F0] hover:text-black transition-colors rounded uppercase text-xs font-black tracking-wider cursor-pointer"
        >
          {isPlaying ? "Freeze Simulation" : "Resume Cascade"}
        </button>
      </div>

      {/* Floating Hacker Terminal */}
      <div 
        onPointerDown={(e) => e.stopPropagation()} 
        className="w-[92vw] max-w-4xl h-[560px] relative rounded-xl border border-[#0F0]/25 bg-black/85 backdrop-blur-md flex flex-col p-5 font-mono text-xs text-[#0F0] shadow-[0_0_40px_rgba(0,255,0,0.18)] z-20 transition-transform hover:scale-101"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#0F0]/15 mb-3 text-[10px] text-[#0F0]/50 tracking-wider">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#0F0]" />
            <span>bypass_compiler.sh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
            <span className="w-2 h-2 rounded-full bg-[#0F0]/50"></span>
          </div>
        </div>

        {/* Console Printout Body */}
        <div 
          ref={consoleRef}
          className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[11px] md:text-xs"
        >
          <div className="text-[#0F0]/40">
            SECURE LINK ROOT AUTHENTICATED...<br />
            LOAD TARGET SPEC: <span className="text-[#0F0]/80 font-bold">src/app/matrix-rain/page.tsx</span><br />
            --------------------------------------------------------<br />
            [INFO] BEGIN KEYBOARD INPUT OR SCREEN TAPS TO DECOMPILE...<br />
          </div>

          <pre className="white-space-pre-wrap break-all text-[#0F0] font-mono leading-relaxed">
            {HACKER_CODE.slice(0, typedChars)}
            {typedChars < HACKER_CODE.length && (
              <span className="inline-block w-2 h-4 bg-[#0F0] ml-0.5 animate-pulse align-middle" />
            )}
          </pre>
        </div>

        {/* Bottom Status bar */}
        <div className="mt-3 pt-2 border-t border-[#0F0]/10 flex items-center justify-between text-[9px] text-[#0F0]/40 uppercase tracking-widest">
          <span>PROGRESS: {Math.round((typedChars / HACKER_CODE.length) * 100)}%</span>
          <span>SYSTEM BYPASS PROMPT</span>
        </div>

        {/* Access Granted Overlay Banner */}
        {accessGranted && (
          <div className="absolute inset-0 bg-black/95 rounded-xl flex flex-col items-center justify-center p-6 text-center border-2 border-[#0F0] shadow-[0_0_50px_rgba(0,255,0,0.4)] z-40 animate-fade-in">
            <ShieldAlert className="w-12 h-12 text-[#0F0] animate-bounce mb-3" />
            <h2 className="text-2xl font-black text-[#0F0] tracking-widest drop-shadow-[0_0_8px_#0F0] mb-2 uppercase">
              ACCESS GRANTED
            </h2>
            <p className="text-xs text-[#0F0]/70 max-w-sm mb-6 leading-relaxed">
              Mainframe override completes successfully. Security logs cleared. Cascade parameters fully operational.
            </p>
            <button
              onClick={resetBypass}
              className="flex items-center gap-2 px-5 py-2 border-2 border-[#0F0] text-[#0F0] hover:bg-[#0F0] hover:text-black transition-all font-bold text-xs uppercase tracking-wider rounded cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Mainframe</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
