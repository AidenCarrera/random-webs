"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Trophy,
  RotateCcw,
  Zap,
  Gauge,
  Flame,
  Award,
  ChevronRight,
} from "lucide-react";

// --- Cosmic Synth Sweeps ---
class RaceSynth {
  ctx: AudioContext | null = null;
  init() {
    if (this.ctx) return;
    this.ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  }
  playBeep(freq: number, duration: number) {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + duration,
    );
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

const synth = new RaceSynth();

// --- Passages Dataset ---
const PASSAGES = [
  "A vaporwave sunset glows over a virtual wireframe grid, looping low-fidelity synthesizer beats under a starry purple sky.",
  "Neon lights reflect on rain-slicked asphalt as sirens echo off towering monolithic skyscrapers in the cybernetic core.",
  "The sky above the port was the color of television, tuned to a dead channel, flickering with electronic static noise.",
  "We live in a world of complex networks where tiny packets of light carry the collective thoughts of humanity across oceans.",
  "I have seen things you people wouldn't believe. Attack ships on fire off the shoulder of Orion in the dark cosmos.",
  "Welcome to the simulation interface. Slip on the headset, boot up the main terminal drive, and warp into the digital landscape.",
  "The global network is vast and infinite, a cybernetic horizon where light nodes flicker in the absolute quiet darkness.",
  "Information wants to be free. It is the lifeblood of our digital civilization, flowing through high speed optical fibers.",
];

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_SETTINGS = {
  easy: { name: "ROOKIE", bot1Wpm: 35, bot2Wpm: 45, label: "Easy Competitors" },
  medium: {
    name: "PRO",
    bot1Wpm: 55,
    bot2Wpm: 68,
    label: "Medium Competitors",
  },
  hard: {
    name: "CYBER",
    bot1Wpm: 80,
    bot2Wpm: 92,
    label: "Expert Competitors",
  },
};

interface Competitor {
  name: string;
  wpm: number;
  color: string;
  progress: number; // 0 - 100
}

export default function TypeRacer() {
  const [gameState, setGameState] = useState<
    "menu" | "countdown" | "playing" | "finished"
  >("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [passage, setPassage] = useState("");
  const [typedText, setTypedText] = useState("");
  const [countdown, setCountdown] = useState(3);

  // Timers and stats
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalKeysTyped, setTotalKeysTyped] = useState(0);
  const [errors, setErrors] = useState(0);

  // Competitor Cars
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [highScore, setHighScore] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("neon_racer_high_score");
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Update high score
  const saveHighScore = (finalWpm: number) => {
    if (finalWpm > highScore) {
      setHighScore(finalWpm);
      localStorage.setItem("neon_racer_high_score", finalWpm.toString());
    }
  };

  // Setup game configuration
  const handleSetupGame = () => {
    const randomPassage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setPassage(randomPassage);
    setTypedText("");
    setWpm(0);
    setAccuracy(100);
    setTotalKeysTyped(0);
    setErrors(0);
    setStartTime(null);
    setTimeElapsed(0);

    const config = DIFFICULTY_SETTINGS[difficulty];
    setCompetitors([
      {
        name: "CPU - VAPOR RUNNER",
        wpm: config.bot1Wpm,
        color: "#a855f7",
        progress: 0,
      },
      {
        name: "CPU - GLITCH CRUISER",
        wpm: config.bot2Wpm,
        color: "#ec4899",
        progress: 0,
      },
    ]);

    setCountdown(3);
    setGameState("countdown");

    // Clear loops
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    if (gameLoopIntervalRef.current) clearInterval(gameLoopIntervalRef.current);
  };

  // Countdown cycle
  useEffect(() => {
    if (gameState !== "countdown") return;

    synth.playBeep(440, 0.1);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setGameState("playing");
          setStartTime(Date.now());
          setTimeout(() => inputRef.current?.focus(), 20);
          synth.playBeep(880, 0.3);
          return 0;
        }
        synth.playBeep(440, 0.1);
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [gameState]);

  // Main gameplay loop (updates times, wpm, and competitor progress)
  useEffect(() => {
    if (gameState !== "playing" || !startTime) return;

    gameLoopIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setTimeElapsed(elapsed);

      // Update competitors
      setCompetitors((prev) =>
        prev.map((bot) => {
          const charPerSec = (bot.wpm * 5) / 60;
          const charsTyped = elapsed * charPerSec;
          const calculatedProgress = Math.min(
            100,
            (charsTyped / passage.length) * 100,
          );
          return {
            ...bot,
            progress: calculatedProgress,
          };
        }),
      );
    }, 100);

    return () => {
      if (gameLoopIntervalRef.current)
        clearInterval(gameLoopIntervalRef.current);
    };
  }, [gameState, startTime, passage]);

  // Check if anyone won/finished
  const checkFinished = useCallback(
    (textVal: string) => {
      if (textVal === passage) {
        setGameState("finished");
        if (gameLoopIntervalRef.current)
          clearInterval(gameLoopIntervalRef.current);

        const elapsed = startTime ? (Date.now() - startTime) / 1000 : 1;
        const finalWpm = Math.round(passage.length / 5 / (elapsed / 60));
        setWpm(finalWpm);
        saveHighScore(finalWpm);
      }
    },
    [passage, startTime, highScore],
  );

  // Keyboard inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== "playing") return;

    const val = e.target.value;

    // Key counting for accuracy
    if (val.length > typedText.length) {
      setTotalKeysTyped((prev) => prev + (val.length - typedText.length));
    }

    setTypedText(val);

    // Calculate errors and accuracy
    let currentErrors = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== passage[i]) {
        currentErrors++;
      }
    }
    setErrors(currentErrors);

    // WPM Real-time tracking
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 1;
    const minutes = elapsed / 60;

    // Correct characters are chars typed up to the first error
    let correctCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === passage[i]) {
        correctCount++;
      } else {
        break;
      }
    }

    const calculatedWpm =
      minutes > 0 ? Math.round(correctCount / 5 / minutes) : 0;
    setWpm(calculatedWpm);

    checkFinished(val);
  };

  const getAccuracy = () => {
    if (totalKeysTyped === 0) return 100;
    const correctKeys = totalKeysTyped - errors;
    return Math.max(0, Math.round((correctKeys / totalKeysTyped) * 100));
  };

  // Render passage characters with color indicators
  const renderPassage = () => {
    return passage.split("").map((char, i) => {
      let charClass = "text-zinc-500";
      let cursorBg = "";

      if (i < typedText.length) {
        if (typedText[i] === char) {
          charClass = "text-cyan-400 font-medium";
        } else {
          charClass =
            "text-pink-500 bg-pink-950/40 font-bold decoration-pink-500 underline";
        }
      } else if (i === typedText.length) {
        charClass =
          "text-white underline decoration-purple-500 decoration-2 underline-offset-4";
        cursorBg = "bg-purple-900/30 ring-1 ring-purple-600";
      }

      return (
        <span
          key={i}
          className={`${charClass} ${cursorBg} transition-colors duration-75 text-2xl tracking-wide font-mono`}
        >
          {char}
        </span>
      );
    });
  };

  // Player progress percentage
  const playerProgress = passage
    ? Math.min(100, (typedText.length / passage.length) * 100)
    : 0;

  // Determine leaderboard positions
  const getLeaderboard = () => {
    const list = [
      {
        name: "YOU (PLAYER)",
        wpm: wpm,
        isPlayer: true,
        progress: playerProgress,
      },
      ...competitors.map((c) => ({
        name: c.name,
        wpm: c.wpm,
        isPlayer: false,
        progress: c.progress,
      })),
    ];

    // Sort by progress first, then WPM
    return list.sort((a, b) => b.progress - a.progress || b.wpm - a.wpm);
  };

  const currentRank = getLeaderboard().findIndex((x) => x.isPlayer) + 1;

  // Helper render of stylized profile car
  const renderCarSVG = (color: string) => (
    <svg
      viewBox="0 0 50 25"
      className="w-14 h-7 transition-all duration-300"
      style={{ transform: "scaleX(-1)" }}
    >
      {/* Sleek retro delorean outline */}
      <path
        d="M 2 15 L 14 13 L 20 6 L 36 6 L 42 13 L 48 15 C 49 15 50 16 50 17 L 50 21 C 50 22 49 23 48 23 L 2 23 C 1 23 0 22 0 21 L 0 17 C 0 16 1 15 2 15 Z"
        fill={color}
      />
      {/* Front/back bumpers */}
      <rect x="0" y="17" width="2" height="4" fill="#64748b" />
      <rect x="48" y="17" width="2" height="4" fill="#f43f5e" />
      {/* Windows */}
      <path d="M 21 8 L 33 8 L 36 12 L 18 12 Z" fill="#000" opacity="0.75" />
      <path d="M 22 9 L 27 9 L 26 11 L 20 11 Z" fill="#00ffff" opacity="0.8" />
      <path d="M 28 9 L 32 9 L 34 11 L 27 11 Z" fill="#00ffff" opacity="0.8" />
      {/* Wheels */}
      <circle
        cx="10"
        cy="21"
        r="4.5"
        fill="#07060c"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="10" cy="21" r="1.5" fill="#cbd5e1" />
      <circle
        cx="38"
        cy="21"
        r="4.5"
        fill="#07060c"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle cx="38" cy="21" r="1.5" fill="#cbd5e1" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#0d071c] text-white flex flex-col justify-center overflow-hidden relative select-none font-mono">
      {/* Cosmic grid lines backdrop */}
      <div className="absolute inset-0 bg-size-[50px_50px] bg-[linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] z-0 pointer-events-none" />

      {/* CRT overlay effect */}
      <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.4)_100%)] opacity-60" />

      <div className="z-10 max-w-5xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* HEADER BAR */}
        <header className="flex justify-between items-center bg-[#150d2a]/80 border border-purple-900/60 rounded-3xl p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400">
              NEON RACER
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-950/40 border border-purple-900/40 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-purple-300 font-bold">
              <Trophy size={14} className="text-yellow-400" />
              <span>HIGH SCORE: {highScore} WPM</span>
            </div>
          </div>
        </header>

        {/* MENU PANEL */}
        {gameState === "menu" && (
          <div className="bg-[#120b24]/75 border border-purple-900/40 rounded-3xl p-10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-purple-400 font-bold uppercase tracking-[0.25em]">
                SYNTH TYPING SIMULATION
              </span>
              <h2 className="text-5xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500">
                N E O N   R A C E R
              </h2>
              <p className="text-zinc-500 text-sm max-w-lg mx-auto">
                Type the passage as fast as possible to race against CPU
                opponents down the cyber highway grid.
              </p>
            </div>

            {/* Difficulty Cards */}
            <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
              {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map(
                (level) => {
                  const active = difficulty === level;
                  const config = DIFFICULTY_SETTINGS[level];
                  return (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                        active
                          ? "bg-purple-900/30 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white"
                          : "bg-black/40 border-purple-900/30 text-zinc-500 hover:border-purple-800/40 hover:text-zinc-300"
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider font-bold">
                        MODE
                      </span>
                      <span className="text-2xl font-black tracking-widest">
                        {config.name}
                      </span>
                      <span className="text-[10px] opacity-70 uppercase tracking-widest">
                        Bots: {config.bot1Wpm} & {config.bot2Wpm} WPM
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={handleSetupGame}
              className="px-12 py-5 liquid-gradient-btn hover:scale-105 active:scale-95 text-white font-black text-lg tracking-widest rounded-2xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center gap-3"
            >
              <ChevronRight size={20} className="animate-pulse" />
              <span>LAUNCH RACE</span>
            </button>
          </div>
        )}

        {/* COUNTDOWN STATE */}
        {gameState === "countdown" && (
          <div className="bg-[#120b24]/75 border border-purple-900/40 rounded-3xl p-24 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center min-h-87.5 animate-in fade-in zoom-in duration-300">
            <span className="text-zinc-500 text-sm uppercase tracking-[0.3em] mb-12 relative z-10">
              DRIVERS PREPARE
            </span>
            <div className="relative w-32 h-32 flex items-center justify-center my-6">
              {/* Pinging background glow clone */}
              <div className="absolute text-9xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-400 to-purple-600 animate-ping select-none pointer-events-none opacity-45">
                {countdown}
              </div>
              {/* Steady solid foreground number */}
              <div className="absolute text-9xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-400 to-purple-600">
                {countdown}
              </div>
            </div>
            <span className="text-purple-400 text-xs font-bold uppercase tracking-widest mt-12 animate-pulse relative z-10">
              GET READY TO TYPE...
            </span>
          </div>
        )}

        {/* ACTIVE RACE GRID */}
        {(gameState === "playing" || gameState === "finished") && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* RACETRACK GRAPHIC */}
            <div className="bg-[#110a22]/80 border border-purple-900/50 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl shadow-xl flex flex-col gap-6">
              {/* Lane Grid Floor */}
              <div
                className="absolute inset-0 z-0 opacity-15 rolling-grid"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(147, 51, 234, 0.4) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(147, 51, 234, 0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: "60px 40px",
                  // Animate floor grids only when racing
                  animation:
                    gameState === "playing"
                      ? "gridScroll 0.8s linear infinite"
                      : "none",
                }}
              />

              <div className="flex justify-between items-center border-b border-purple-950 pb-3 relative z-10">
                <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
                  CYBER HIGHWAY TRACK
                </span>
                <div className="flex items-center gap-4 text-xs font-bold text-cyan-400">
                  <span>POSITION: {currentRank} / 3</span>
                </div>
              </div>

              {/* Tracks lanes container */}
              <div className="flex flex-col gap-5 relative z-10 pb-2">
                {/* Lane 1: Player */}
                <div className="relative h-12 bg-black/40 border-y border-purple-900/40 flex items-center px-4 rounded-xl">
                  <div className="absolute left-3 text-[9px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                    YOU
                  </div>
                  <div
                    className="absolute transition-all duration-300"
                    style={{
                      left: `calc(${playerProgress}% - 48px)`,
                      marginLeft: "48px",
                    }}
                  >
                    {renderCarSVG("#22d3ee")}
                  </div>
                  {/* Finish line line */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-linear-to-b from-cyan-400 via-pink-500 to-purple-600 opacity-60" />
                </div>

                {/* Lane 2: Bot 1 */}
                {competitors[0] && (
                  <div className="relative h-12 bg-black/40 border-y border-purple-900/40 flex items-center px-4 rounded-xl">
                    <div className="absolute left-3 text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                      {competitors[0].name.split(" - ")[1]}
                    </div>
                    <div
                      className="absolute transition-all duration-300"
                      style={{
                        left: `calc(${competitors[0].progress}% - 48px)`,
                        marginLeft: "48px",
                      }}
                    >
                      {renderCarSVG(competitors[0].color)}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-linear-to-b from-cyan-400 via-pink-500 to-purple-600 opacity-60" />
                  </div>
                )}

                {/* Lane 3: Bot 2 */}
                {competitors[1] && (
                  <div className="relative h-12 bg-black/40 border-y border-purple-900/40 flex items-center px-4 rounded-xl">
                    <div className="absolute left-3 text-[9px] font-bold text-pink-400 uppercase tracking-widest bg-pink-950/60 border border-pink-850/40 px-2 py-0.5 rounded">
                      {competitors[1].name.split(" - ")[1]}
                    </div>
                    <div
                      className="absolute transition-all duration-300"
                      style={{
                        left: `calc(${competitors[1].progress}% - 48px)`,
                        marginLeft: "48px",
                      }}
                    >
                      {renderCarSVG(competitors[1].color)}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-linear-to-b from-cyan-400 via-pink-500 to-purple-600 opacity-60" />
                  </div>
                )}
              </div>
            </div>

            {/* MAIN INTERFACE: TYPING PASSAGE */}
            {gameState === "playing" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Passage & Input area */}
                <div className="lg:col-span-3 bg-[#110a22]/70 border border-purple-900/40 rounded-3xl p-8 backdrop-blur-xl shadow-xl flex flex-col gap-6">
                  {/* Passage block */}
                  <div className="bg-black/30 border border-purple-950/50 rounded-2xl p-6 leading-relaxed select-text min-h-30">
                    {renderPassage()}
                  </div>

                  {/* Input form */}
                  <div
                    className={`relative rounded-2xl bg-black/50 border p-2 flex items-center transition-all ${
                      errors > 0
                        ? "border-pink-600 shadow-[0_0_15px_rgba(219,39,119,0.3)]"
                        : "border-purple-900/60 focus-within:border-cyan-500 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    }`}
                  >
                    <span className="text-purple-500 text-lg font-bold pl-3 pr-2 select-none">
                      $
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={typedText}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-none text-white text-xl p-3 focus:outline-none tracking-wide"
                      placeholder="TYPE THE PASSAGE EXACTLY AS SHOWN..."
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Live Stats side panel */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  {/* WPM Display */}
                  <div className="bg-[#110a22]/80 border border-purple-900/40 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="h-10 w-10 rounded-xl bg-cyan-950/50 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                      <Gauge size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        WORDS PER MINUTE
                      </div>
                      <div className="text-3xl font-black text-cyan-400">
                        {wpm}{" "}
                        <span className="text-xs text-zinc-400 font-normal">
                          WPM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accuracy Display */}
                  <div className="bg-[#110a22]/80 border border-purple-900/40 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="h-10 w-10 rounded-xl bg-pink-950/50 border border-pink-850/40 flex items-center justify-center text-pink-400">
                      <Flame size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        ACCURACY INDEX
                      </div>
                      <div className="text-3xl font-black text-pink-500">
                        {getAccuracy()}%
                      </div>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="bg-[#110a22]/80 border border-purple-900/40 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="h-10 w-10 rounded-xl bg-purple-950/50 border border-purple-800/40 flex items-center justify-center text-purple-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        RACE TIMER
                      </div>
                      <div className="text-3xl font-black text-purple-400">
                        {timeElapsed.toFixed(1)}{" "}
                        <span className="text-xs text-zinc-400 font-normal">
                          SEC
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RACE SUMMARY RESULTS */}
            {gameState === "finished" && (
              <div className="bg-[#120b24]/75 border border-purple-900/40 rounded-3xl p-10 backdrop-blur-xl shadow-2xl flex flex-col gap-8 animate-in zoom-in-95 duration-300">
                {/* Result header */}
                <div className="text-center flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center text-yellow-400 animate-bounce mb-2">
                    <Award size={36} />
                  </div>
                  <h2 className="text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-pink-500">
                    RACE COMPLETE
                  </h2>
                  <p className="text-zinc-500 text-xs uppercase tracking-widest">
                    Telemetry data compiled. Rank:{" "}
                    {currentRank === 1
                      ? "🥇 1ST PLACE"
                      : currentRank === 2
                        ? "🥈 2ND PLACE"
                        : "🥉 3RD PLACE"}
                  </p>
                </div>

                {/* Speed dashboard grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/40 border border-purple-950/60 rounded-2xl p-6">
                  <div className="text-center p-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                      Final speed
                    </div>
                    <div className="text-3xl font-black text-cyan-400">
                      {wpm} WPM
                    </div>
                  </div>
                  <div className="text-center p-2 border-l border-purple-950">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                      ACCURACY
                    </div>
                    <div className="text-3xl font-black text-pink-500">
                      {getAccuracy()}%
                    </div>
                  </div>
                  <div className="text-center p-2 border-l border-purple-950">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                      TIME TAKEN
                    </div>
                    <div className="text-3xl font-black text-purple-400">
                      {timeElapsed.toFixed(2)}s
                    </div>
                  </div>
                  <div className="text-center p-2 border-l border-purple-950">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                      ERRORS
                    </div>
                    <div className="text-3xl font-black text-zinc-300">
                      {errors}
                    </div>
                  </div>
                </div>

                {/* Final Leaderboard rankings */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest pl-2">
                    Leaderboard Standings
                  </span>
                  <div className="flex flex-col border border-purple-950 rounded-2xl overflow-hidden divide-y divide-purple-950">
                    {getLeaderboard().map((runner, index) => {
                      const isMe = runner.isPlayer;
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 px-6 text-sm ${
                            isMe
                              ? "bg-purple-900/20 font-black text-cyan-300"
                              : "bg-black/20 text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold w-4">{index + 1}.</span>
                            <span>{runner.name}</span>
                          </div>
                          <span className="font-bold">{runner.wpm} WPM</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSetupGame}
                    className="flex-1 py-4 bg-linear-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    <span>RACE AGAIN</span>
                  </button>
                  <button
                    onClick={() => setGameState("menu")}
                    className="px-8 py-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-purple-900/40 rounded-2xl text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all"
                  >
                    RETURN TO MENU
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global CSS keyframes for floor scroll */}
      <style jsx global>{`
        @keyframes gridScroll {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 40px;
          }
        }
          @keyframes gradientCycle {
          from { background-position: 0% 0%; }
          to { background-position: -300% 0%; }
        }
        .rolling-grid {
          background-position: 0 0;
        }
        .liquid-gradient-btn {
          background: linear-gradient(90deg, #9333ea, #ec4899, #06b6d4, #ec4899, #9333ea);
          background-size: 300% 100%;
          animation: gradientCycle 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
