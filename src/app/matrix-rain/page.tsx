"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, ShieldAlert, Terminal, RefreshCw } from "lucide-react";

const MATRIX_SOURCE_LINES = [
  `"use client";`,
  ``,
  `import { useEffect, useRef, useState } from "react";`,
  `import { Monitor, ShieldAlert, Terminal, RefreshCw } from "lucide-react";`,
  ``,
  `// WARNING: 147 npm vulnerabilities found.`,
  `// STATUS: 146 critical, 1 moderate, proceeding anyway.`,
  `// npm audit fix --force was attempted. node_modules is ruined.`,
  `// ACCESS CODE: EXECUTING SOURCE EXTRACT...`,
  `// DECOMPILING RANDOM-WEB MAIN MAIN MAIN CORE...`,
  `// ACCESS CODE: HANDSHAKE ACCEPTED. SPOOFING SAFE MODE FLAGS...`,
  `// HYDRATION WARNING SUPPRESSED. PROBABLY FINE.`,
  `// INTRUSION DETECTED: AUTO-REBOOT BYPASSED`,
  `// If you can read this, the page source escaped the build pipeline.`,
  `const SYSTEM_FLAGS = { mobileReady: true, freeSimulation: "visible", taps: "armed" };`,
  `const MAINFRAME_STATUS = ["MEM_ALLOC: 0xFF00FF - OK", "SYS_CORE: ONLINE (PRIMARY)", "ENTROPY: STABLE_ISH"];`,
  ``,
  `export function TerminalCore() {`,
  `  const canvasRef = useRef<HTMLCanvasElement>(null);`,
  `  const consoleRef = useRef<HTMLDivElement>(null);`,
  `  const kernel = useCoreKernel();`,
  `  const [isPlaying, setIsPlaying] = useState(true);`,
  `  const [typedChars, setTypedChars] = useState(0);`,
  `  const [accessGranted, setAccessGranted] = useState(false);`,
  `  const [entropy, setEntropy] = useState(0xDEADC0DE);`,
  ``,
  `  // Initializing socket link override...`,
  `  // Setup canvas size once on mount and bind resize listener`,
  `  // Handle auto-scroll terminal console`,
  `  // Record keystroke timestamp for typing velocity speed multiplier`,
  `  // Screen taps should feel like keyboard input on desktop`,
  ``,
  `  const initializeSecureBypass = async () => {`,
  `    const handshake = await kernel.sendBypassPacket({`,
  `      address: "127.0.0.1",`,
  `      payload: Math.random().toString(16),`,
  `      timestamp: Date.now()`,
  `    });`,
  ``,
  `    if (handshake.status === "GRANTED") {`,
  `      kernel.grantSystemAccess();`,
  `      console.log("ALERT: SECURITY OVERRIDE COMPLETED");`,
  `    }`,
  `  };`,
  ``,
  `  return (`,
  `    <div className="system-node bg-black/90 p-4 border border-green-500/30">`,
  `      <div className="status-grid text-green-500 text-xs">`,
  `        <span>{MAINFRAME_STATUS[0]}</span>`,
  `        <span>{MAINFRAME_STATUS[1]}</span>`,
  `        <span>ENTROPY: 0x{entropy.toString(16)}</span>`,
  `      </div>`,
  `      <button onClick={initializeSecureBypass} className="mt-4 px-2 py-1 bg-green-500/20 text-green-400">`,
  `        {isPlaying ? "Freeze Simulation" : "Resume Cascade"}`,
  `      </button>`,
  `    </div>`,
  `  );`,
  `}`,
  ``,
  `// SOURCE RECOVERY COMPLETING...`,
  `// SUCCESS. MATRIX CASCADE ACTIVE.`,
  `// OVERRIDE COMPILER STATE = GRANTED.`,
  `// hidden_init(): TODOs=load_bearing; tests=null;`,
  `// final_build_status: working locally, good enough.`,
  `export default function MatrixRain() { return <TerminalCore />; }`,
];

const HACKER_CODE = MATRIX_SOURCE_LINES.join("\n");
const RAIN_CHARACTERS = Array.from(
  new Set(HACKER_CODE.replace(/\s+/g, "")),
).join("");

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
      tapTimestampsRef.current = tapTimestampsRef.current.filter(
        (t) => now - t < 1500,
      );
      const tapsPerSecond = tapTimestampsRef.current.length / 1.5;

      // Speed multiplier caps at 1.0 (equivalent to full default cascade speed) at 8 keystrokes per second
      const speedMultiplier = 0.04 + Math.min(0.96, tapsPerSecond / 8.0);

      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const text = RAIN_CHARACTERS.charAt(
          Math.floor(Math.random() * RAIN_CHARACTERS.length),
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
      if (e.key === "Tab") return;

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
    <main
      onPointerDown={advanceHacking}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 pt-24 pb-36 font-mono touch-manipulation select-none md:px-6 md:pt-10 md:pb-24"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Top Banner UI */}
      <div className="pointer-events-none absolute top-4 left-1/2 z-10 w-full max-w-[calc(100vw-2rem)] -translate-x-1/2 px-4 text-center md:top-8 md:left-8 md:max-w-none md:translate-x-0 md:px-0 md:text-left">
        <h1 className="text-2xl font-black uppercase tracking-[0.35em] text-[#0F0] drop-shadow-[0_0_10px_rgba(0,255,0,0.6)] md:text-4xl">
          matrix_rain
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-[#0F0]/60 md:mt-1 md:justify-start md:text-xs">
          <Monitor className="w-3.5 h-3.5" />
          <span>PORT: 127.0.0.1 &bull; SMASH KEYS OR TAP SCREEN TO TYPE</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div
        className="absolute right-4 bottom-4 left-4 z-30 flex items-center justify-center gap-3 md:right-8 md:bottom-8 md:left-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-full max-w-xs rounded border border-[#0F0] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#0F0] transition-colors hover:bg-[#0F0] hover:text-black md:w-auto md:px-5 md:text-xs"
        >
          {isPlaying ? "Freeze Simulation" : "Resume Cascade"}
        </button>
      </div>

      {/* Floating Hacker Terminal */}
      <div className="relative z-20 flex h-[min(68vh,42rem)] w-full max-w-4xl flex-col rounded-xl border border-[#0F0]/25 bg-black/85 p-4 font-mono text-xs text-[#0F0] shadow-[0_0_40px_rgba(0,255,0,0.18)] backdrop-blur-md md:h-[min(72vh,46rem)] md:p-5">
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
          className="flex-1 space-y-2 overflow-y-auto pr-1 text-[10px] md:text-xs"
        >
          <div className="text-[#0F0]/40">
            SECURE LINK ROOT AUTHENTICATED...
            <br />
            LOAD TARGET SPEC:{" "}
            <span className="text-[#0F0]/80 font-bold">
              src/app/matrix-rain/page.tsx
            </span>
            <br />
            --------------------------------------------------------
            <br />
            [INFO]{" "}
            <span className="text-[#0F0]/80 font-bold">
              BEGIN KEYBOARD INPUT OR SCREEN TAPS TO DECOMPILE...
            </span>
            <br />
            [WARN] npm audit fix --force attempted.
            <br />
            [NOTE] MOBILE PATCH APPLIED. Text displays. Layout is cooked.
            <br />
          </div>

          <pre className="whitespace-pre-wrap wrap-break-word text-[#0F0] font-mono leading-relaxed">
            {HACKER_CODE.slice(0, typedChars)}
            {typedChars < HACKER_CODE.length && (
              <span className="inline-block w-2 h-4 bg-[#0F0] ml-0.5 animate-pulse align-middle" />
            )}
          </pre>
        </div>

        {/* Bottom Status bar */}
        <div className="mt-3 pt-2 border-t border-[#0F0]/10 flex items-center justify-between text-[9px] text-[#0F0]/40 uppercase tracking-widest">
          <span>
            PROGRESS: {Math.round((typedChars / HACKER_CODE.length) * 100)}%
          </span>
          <span>SYSTEM BYPASS PROMPT</span>
        </div>

        {/* Access Granted Overlay Banner */}
        {accessGranted && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-xl border-2 border-[#0F0] bg-black/95 p-6 text-center shadow-[0_0_50px_rgba(0,255,0,0.4)] animate-fade-in">
            <ShieldAlert className="w-12 h-12 text-[#0F0] animate-bounce mb-3" />
            <h2 className="text-2xl font-black text-[#0F0] tracking-widest drop-shadow-[0_0_8px_#0F0] mb-2 uppercase">
              ACCESS GRANTED
            </h2>
            <p className="text-xs text-[#0F0]/70 max-w-sm mb-6 leading-relaxed">
              Mainframe override completes successfully. Security logs cleared.
              Cascade parameters fully operational.
            </p>
            <button
              onClick={resetBypass}
              className="flex items-center gap-2 rounded border-2 border-[#0F0] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#0F0] transition-all hover:bg-[#0F0] hover:text-black active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Mainframe</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
