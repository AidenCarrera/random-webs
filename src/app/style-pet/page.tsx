"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, RotateCcw, Volume2, VolumeX, Award } from "lucide-react";

// --- Types ---
type PetStatus = "IDLE" | "EATING" | "SLEEPING" | "PLAYING" | "DEAD";
type SkinColor = "cyber-cyan" | "neon-pink" | "golden-orange" | "slime-green";
type HatStyle = "NONE" | "COWBOY" | "CROWN" | "WIZARD" | "BOW";
type AccessoryStyle = "NONE" | "SHADES" | "BOWTIE" | "HALO";

const SKIN_COLORS: Record<
  SkinColor,
  { base: string; dark: string; light: string }
> = {
  "cyber-cyan": { base: "#06b6d4", dark: "#0891b2", light: "#22d3ee" },
  "neon-pink": { base: "#ec4899", dark: "#db2777", light: "#f472b6" },
  "golden-orange": { base: "#f97316", dark: "#ea580c", light: "#fb923c" },
  "slime-green": { base: "#22c55e", dark: "#16a34a", light: "#4ade80" },
};

// --- Web Audio 8-bit Retro Sound Generator ---
class AudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (this.ctx) return;
    this.ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  }

  beep(freq: number, type: OscillatorType = "square", duration = 0.12) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + duration,
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context init block:", e);
    }
  }

  playSelect() {
    this.beep(880, "square", 0.05);
  }

  playFeed() {
    this.beep(261.63, "sine", 0.06);
    setTimeout(() => this.beep(329.63, "sine", 0.06), 60);
    setTimeout(() => this.beep(392.0, "sine", 0.06), 120);
    setTimeout(() => this.beep(523.25, "sine", 0.12), 180);
  }

  playPet() {
    this.beep(587.33, "triangle", 0.08);
    setTimeout(() => this.beep(698.46, "triangle", 0.08), 80);
    setTimeout(() => this.beep(880.0, "triangle", 0.12), 160);
  }

  playSleep() {
    this.beep(523.25, "sine", 0.15);
    setTimeout(() => this.beep(392.0, "sine", 0.2), 150);
    setTimeout(() => this.beep(261.63, "sine", 0.35), 350);
  }

  playLevelUp() {
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
    scale.forEach((freq, idx) => {
      setTimeout(() => this.beep(freq, "square", 0.07), idx * 60);
    });
  }

  playDead() {
    this.beep(293.66, "sawtooth", 0.2);
    setTimeout(() => this.beep(220.0, "sawtooth", 0.25), 180);
    setTimeout(() => this.beep(146.83, "sawtooth", 0.45), 360);
  }
}

const synth = new AudioSynth();

export default function StylePet() {
  // Stats
  const [hunger, setHunger] = useState(70);
  const [happiness, setHappiness] = useState(80);
  const [energy, setEnergy] = useState(90);
  const [cleanliness, setCleanliness] = useState(85);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);

  // Status/Customizations
  const [status, setStatus] = useState<PetStatus>("IDLE");
  const [skin, setSkin] = useState<SkinColor>("cyber-cyan");
  const [hat, setHat] = useState<HatStyle>("NONE");
  const [accessory, setAccessory] = useState<AccessoryStyle>("NONE");
  const [isMuted, setIsMuted] = useState(false);
  const [petName, setPetName] = useState("CYBER-KITY");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("CYBER-KITY");

  // Menu toggles
  const [currentMenu, setCurrentMenu] = useState<"NONE" | "STYLE" | "STATS">("NONE");
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0); // 0 = SKIN, 1 = HAT, 2 = ACC

  // Zzz sleep floaters
  const [sleepBubbles, setSleepBubbles] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  // Sound toggling
  const toggleMute = () => {
    synth.muted = !isMuted;
    setIsMuted(!isMuted);
    synth.playSelect();
  };

  // Level Up / Exp logic
  const gainExp = useCallback(
    (amount: number) => {
      setExp((prev) => {
        const next = prev + amount;
        const needed = level * 100;
        if (next >= needed) {
          setLevel((l) => l + 1);
          synth.playLevelUp();
          return next - needed;
        }
        return next;
      });
    },
    [level],
  );

  // --- Actions ---
  const handleFeed = () => {
    if (status === "DEAD" || status === "SLEEPING") return;
    synth.playFeed();
    setStatus("EATING");
    setHunger((h) => Math.min(100, h + 25));
    setCleanliness((c) => Math.max(0, c - 10));
    gainExp(15);
    setTimeout(() => setStatus("IDLE"), 2200);
  };

  const handlePlay = () => {
    if (status === "DEAD" || status === "SLEEPING") return;
    synth.playPet();
    setStatus("PLAYING");
    setHappiness((h) => Math.min(100, h + 25));
    setEnergy((e) => Math.max(0, e - 15));
    gainExp(20);
    setTimeout(() => setStatus("IDLE"), 2200);
  };

  const handleClean = () => {
    if (status === "DEAD" || status === "SLEEPING") return;
    synth.beep(650, "triangle", 0.1);
    setTimeout(() => synth.beep(750, "triangle", 0.1), 80);
    setCleanliness(100);
    setHappiness((h) => Math.min(100, h + 5));
    gainExp(10);
  };

  const toggleSleep = () => {
    if (status === "DEAD") return;
    if (status === "SLEEPING") {
      synth.playSelect();
      setStatus("IDLE");
    } else {
      synth.playSleep();
      setStatus("SLEEPING");
      setCurrentMenu("NONE");
    }
  };

  const handleReset = () => {
    synth.playLevelUp();
    setHunger(75);
    setHappiness(80);
    setEnergy(90);
    setCleanliness(85);
    setLevel(1);
    setExp(0);
    setStatus("IDLE");
    setHat("NONE");
    setAccessory("NONE");
  };

  // --- Real-time Loop (Stat decays) ---
  useEffect(() => {
    if (status === "DEAD") return;
    const interval = setInterval(() => {
      if (status === "SLEEPING") {
        setEnergy((e) => Math.min(100, e + 6));
        setHunger((h) => Math.max(0, h - 1));
      } else {
        setHunger((h) => {
          const next = Math.max(0, h - 3);
          if (next === 0) setHappiness((hap) => Math.max(0, hap - 5));
          return next;
        });
        setHappiness((h) => Math.max(0, h - 2));
        setEnergy((e) => Math.max(0, e - 1.5));
        setCleanliness((c) => Math.max(0, c - 2));
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [status]);

  // Handle death condition
  useEffect(() => {
    if (hunger === 0 && happiness === 0 && energy === 0 && status !== "DEAD") {
      setStatus("DEAD");
      synth.playDead();
    }
  }, [hunger, happiness, energy, status]);

  // Zzz Animation Loop
  useEffect(() => {
    if (status !== "SLEEPING") {
      setSleepBubbles([]);
      return;
    }
    const interval = setInterval(() => {
      setSleepBubbles((prev) => [
        ...prev.slice(-3),
        { id: Date.now(), x: Math.random() * 40 - 20, y: 0 },
      ]);
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  // Customization rotation helpers
  const cycleSkin = (dir = 1) => {
    synth.playSelect();
    const keys = Object.keys(SKIN_COLORS) as SkinColor[];
    const next = keys[(keys.indexOf(skin) + dir + keys.length) % keys.length];
    setSkin(next);
  };

  const cycleHat = (dir = 1) => {
    synth.playSelect();
    const hats: HatStyle[] = ["NONE", "COWBOY", "CROWN", "WIZARD", "BOW"];
    const next = hats[(hats.indexOf(hat) + dir + hats.length) % hats.length];
    setHat(next);
  };

  const cycleAccessory = (dir = 1) => {
    synth.playSelect();
    const accs: AccessoryStyle[] = ["NONE", "SHADES", "BOWTIE", "HALO"];
    const next = accs[(accs.indexOf(accessory) + dir + accs.length) % accs.length];
    setAccessory(next);
  };

  // Render customizable pet vector shapes (Clean crisp pixel art styling)
  const colors = SKIN_COLORS[skin];

  return (
    <div className="min-h-screen bg-[#111216] flex flex-col items-center justify-center p-6 select-none font-mono text-zinc-300 relative overflow-hidden">
      {/* Soft background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #fff 1px, transparent 1px),
            linear-gradient(to bottom, #fff 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Console Container */}
      <div className="relative flex flex-col items-center">
        {/* Device Outer Frame */}
        <div className="relative bg-zinc-800 rounded-[50px] p-8 pb-14 w-[420px] md:w-[500px] shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_4px_10px_rgba(255,255,255,0.1),inset_0_-8px_16px_rgba(0,0,0,0.6)] border-4 border-zinc-700/80 flex flex-col items-center animate-fade-in">
          {/* Status LEDs & Brand top edge */}
          <div className="w-full flex items-center justify-between px-6 mb-4">
            {/* Status lights */}
            <div className="flex gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full border border-black/40 transition-all duration-300 ${status === "DEAD" ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-zinc-950"}`}
                title="Fault LED"
              />
              <div
                className={`w-2.5 h-2.5 rounded-full border border-black/40 transition-all duration-300 ${status === "SLEEPING" ? "bg-purple-500 shadow-[0_0_8px_#a855f7]" : "bg-zinc-950"}`}
                title="Sleeping LED"
              />
              <div
                className={`w-2.5 h-2.5 rounded-full border border-black/40 transition-all duration-300 ${status === "PLAYING" || status === "EATING" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-green-600/20"}`}
                title="Activity LED"
              />
            </div>
            {/* Brand text */}
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
              Style-Pet.V2
            </div>
            {/* Sound indicator */}
            <button
              onClick={toggleMute}
              className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 active:scale-95 transition-all"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>

          {/* Handheld LCD Screen Area */}
          <div
            className="relative w-full aspect-square bg-[#87977a] rounded-2xl border-solid border-zinc-900 shadow-[inset_0_4px_12px_rgba(0,0,0,0.4),0_2px_4px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col p-4 text-zinc-900"
            style={{ borderWidth: "10px" }}
          >
            {/* CRT Screen scanline layer */}
            <div
              className="absolute inset-0 pointer-events-none z-30 opacity-[0.08]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)",
              }}
            />
            {/* Glare reflection layer */}
            <div
              className="absolute inset-0 pointer-events-none z-30"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.04) 100%)",
              }}
            />

            {/* LCD Screen UI */}
            {/* Header info */}
            <div className="flex justify-between items-center text-[10px] font-bold border-b border-zinc-800/20 pb-1.5 z-10">
              <div className="flex items-center gap-1">
                <Award size={10} />
                <span>LVL {level}</span>
              </div>
              <div className="relative">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) =>
                      setTempName(e.target.value.toUpperCase().slice(0, 10))
                    }
                    onBlur={() => {
                      setPetName(tempName || "BABY");
                      setIsEditingName(false);
                      synth.playSelect();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPetName(tempName || "BABY");
                        setIsEditingName(false);
                        synth.playSelect();
                      }
                    }}
                    className="bg-zinc-800/10 text-center w-24 focus:outline-none border-b border-zinc-800 font-bold text-[10px]"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => {
                      setTempName(petName);
                      setIsEditingName(true);
                    }}
                    className="cursor-pointer border-b border-dotted border-zinc-800/40 hover:border-zinc-800 tracking-wider"
                  >
                    {petName}
                  </span>
                )}
              </div>
              <div className="text-[9px] tabular-nums font-medium tracking-tight">
                XP: {exp}/{level * 100}
              </div>
            </div>

            {/* Dynamic Zzz particles for sleeping */}
            {status === "SLEEPING" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                <AnimatePresence>
                  {sleepBubbles.map((bubble) => (
                    <motion.div
                      key={bubble.id}
                      initial={{
                        opacity: 0,
                        scale: 0.6,
                        y: 150,
                        x: 120 + bubble.x,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1.1,
                        y: 50,
                        x: 130 + bubble.x * 1.5,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 3.5, ease: "easeOut" }}
                      className="absolute font-bold text-base text-zinc-900/70"
                    >
                      Z
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Screen Inner Grid overlay for pixel texture */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none z-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: "2px 2px",
              }}
            />

            {/* Main Visual Display */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <motion.div
                animate={
                  status === "DEAD"
                    ? { y: [0, 4, 0], rotate: [0, -10, -10] }
                    : status === "SLEEPING"
                      ? { y: [0, 2, 0], scaleY: [1, 0.95, 1], rotate: 0 }
                      : status === "EATING"
                        ? {
                            scaleY: [1, 0.9, 1.1, 1],
                            y: [0, 4, -4, 0],
                            rotate: 0,
                          }
                        : status === "PLAYING"
                          ? {
                              y: [0, -35, 0],
                              rotate: [0, 15, -15, 0],
                              scaleY: [0.85, 1.1, 0.9, 1],
                            }
                          : { y: [0, -3, 0], scaleY: [1, 0.97, 1], rotate: 0 }
                }
                transition={
                  status === "SLEEPING"
                    ? {
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        scaleY: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                        rotate: { duration: 0.3 },
                      }
                    : status === "IDLE"
                      ? {
                          y: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                          scaleY: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                          rotate: { duration: 0.3 },
                        }
                      : { duration: 0.5, repeat: 4, ease: "easeInOut" }
                }
                className="relative w-44 h-44 flex items-center justify-center"
              >
                {/* SVG Character Model with pixel-perfect shapes */}
                <svg
                  viewBox="0 0 32 32"
                  className="w-full h-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)]"
                  style={{ shapeRendering: "crispEdges" }}
                >
                  {/* Accessory: Halo (renders behind/above) */}
                  {accessory === "HALO" && status !== "DEAD" && (
                    <ellipse
                      cx="16"
                      cy="3"
                      rx="6"
                      ry="1.5"
                      fill="none"
                      stroke="#fef08a"
                      strokeWidth="1"
                    />
                  )}

                  {/* Ear back details */}
                  <rect x="5" y="6" width="4" height="4" fill={colors.dark} />
                  <rect x="23" y="6" width="4" height="4" fill={colors.dark} />

                  {/* Main Slime/Cat Body */}
                  <path
                    d="
                      M 8 9 h 16 v 2 h 2 v 14 h -2 v 2 h -16 v -2 h -2 v -14 h 2 z
                      M 6 10 h 2 v 2 h -2 z
                      M 24 10 h 2 v 2 h -2 z
                    "
                    fill={colors.base}
                  />

                  {/* Inner lighter belly */}
                  <path
                    d="
                      M 11 15 h 10 v 1 h 2 v 8 h -2 v 1 h -10 v -1 h -2 v -8 h 2 z
                    "
                    fill={colors.light}
                    opacity="0.75"
                  />

                  {/* EYES rendering */}
                  {status === "DEAD" ? (
                    // Dead eyes (X X)
                    <>
                      <path
                        d="M 9 12 l 2 2 M 11 12 l -2 2"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 21 12 l 2 2 M 23 12 l -2 2"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : status === "SLEEPING" ? (
                    // Sleeping eyes (- -)
                    <>
                      <rect x="9" y="13" width="4" height="1" fill="#0f172a" />
                      <rect x="19" y="13" width="4" height="1" fill="#0f172a" />
                    </>
                  ) : status === "PLAYING" ? (
                    // Happy eyes (^ ^)
                    <>
                      <path
                        d="M 9 14 l 2 -2 l 2 2"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 19 14 l 2 -2 l 2 2"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : (
                    // Regular blinkable eyes
                    <>
                      <rect x="9" y="11" width="3" height="4" fill="#0f172a" />
                      <rect x="20" y="11" width="3" height="4" fill="#0f172a" />
                      {/* Pupils */}
                      <rect x="9" y="11" width="1" height="2" fill="#fff" />
                      <rect x="20" y="11" width="1" height="2" fill="#fff" />
                    </>
                  )}

                  {/* MOUTH rendering */}
                  {status === "DEAD" ? (
                    // Sad curve
                    <path
                      d="M 14 20 q 2 -2 4 0"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  ) : status === "EATING" ? (
                    // Open eating mouth
                    <rect x="14" y="17" width="4" height="3" fill="#0f172a" />
                  ) : status === "PLAYING" ? (
                    // Big wide smile
                    <path d="M 13 17 h 6 v 2 h -6 z" fill="#0f172a" />
                  ) : (
                    // Tiny cat mouth
                    <path
                      d="M 14 17 q 1 1 2 0 q 1 1 2 0"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Blush Cheeks */}
                  {status === "PLAYING" && (
                    <>
                      <rect
                        x="7"
                        y="15"
                        width="2"
                        height="1"
                        fill="#f43f5e"
                        opacity="0.6"
                      />
                      <rect
                        x="23"
                        y="15"
                        width="2"
                        height="1"
                        fill="#f43f5e"
                        opacity="0.6"
                      />
                    </>
                  )}

                  {/* Accessory: Shades */}
                  {accessory === "SHADES" && (
                    <path
                      d="M 7 11 h 18 v 3 h -3 v -1 h -4 v 1 h -4 v -1 h -4 v 1 h -3 z"
                      fill="#1e293b"
                    />
                  )}

                  {/* Accessory: Bowtie */}
                  {accessory === "BOWTIE" && (
                    <path
                      d="M 13 22 h 6 l -1 2 h -4 z M 12 21 h 2 v 3 h -2 z M 18 21 h 2 v 3 h -2 z"
                      fill="#ec4899"
                    />
                  )}

                  {/* Hat: Cowboy */}
                  {hat === "COWBOY" && (
                    <path
                      d="M 7 8 h 18 v 2 h -18 z M 9 5 h 14 v 3 h -14 z M 12 2 h 8 v 3 h -8 z"
                      fill="#78350f"
                    />
                  )}

                  {/* Hat: Crown */}
                  {hat === "CROWN" && (
                    <path
                      d="M 9 8 h 14 v 2 h -14 z M 9 4 l 2 3 l 3 -3 l 2 3 l 3 -3 l 3 3 v 1 h -13 z"
                      fill="#fbbf24"
                    />
                  )}

                  {/* Hat: Wizard */}
                  {hat === "WIZARD" && (
                    <path
                      d="M 7 7 h 18 v 2 h -18 z M 9 5 h 14 v 2 h -14 z M 12 2 h 8 v 3 h -8 z"
                      fill="#4f46e5"
                    />
                  )}

                  {/* Hat: Bow */}
                  {hat === "BOW" && (
                    <path
                      d="M 15 6 h 2 v 2 h -2 z M 11 5 h 4 v 4 h -4 z M 17 5 h 4 v 4 h -4 z"
                      fill="#ec4899"
                    />
                  )}
                </svg>
              </motion.div>
            </div>

            {/* Custom interactive dashboard overlays inside screen */}
            {currentMenu === "STYLE" && (
              <div className="absolute inset-x-2 bottom-2 bg-zinc-900/95 text-[9px] rounded-lg p-2.5 flex flex-col gap-1 border border-zinc-800 text-zinc-300 z-30">
                <div className="font-bold tracking-wider text-center text-zinc-400 border-b border-zinc-800/60 pb-0.5 uppercase mb-1.5 flex justify-between px-1">
                  <span>STYLE CUSTOMIZER</span>
                  <span className="text-zinc-500 font-mono select-none">▲▼ Select</span>
                </div>
                
                {/* Skin item */}
                <div className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 0 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 0 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`} />
                    <span>SKIN COLOR</span>
                  </span>
                  <span>
                    {skin.replace("cyber-", "").replace("neon-", "").replace("slime-", "").replace("golden-", "").toUpperCase()}
                  </span>
                </div>

                {/* Hat item */}
                <div className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 1 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 1 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`} />
                    <span>HAT STYLE</span>
                  </span>
                  <span>{hat}</span>
                </div>

                {/* Accessory item */}
                <div className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 2 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 2 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`} />
                    <span>ACCESSORY</span>
                  </span>
                  <span>{accessory}</span>
                </div>
              </div>
            )}

            {currentMenu === "STATS" && (
              <div className="absolute inset-x-2 bottom-2 bg-zinc-900/95 text-[9px] rounded-lg p-2.5 flex flex-col gap-1.5 border border-zinc-800 text-zinc-300 z-30">
                <div className="font-bold tracking-wider text-center text-zinc-400 border-b border-zinc-800 pb-0.5 uppercase">
                  DETAILED Vitals
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="flex flex-col">
                    <span>HUNGER: {hunger}%</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${hunger}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span>HAPPINESS: {happiness}%</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className="h-full bg-pink-500"
                        style={{ width: `${happiness}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span>ENERGY: {energy}%</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500"
                        style={{ width: `${energy}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span>HYGIENE: {cleanliness}%</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${cleanliness}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick status bar (always visible icons on left/right edges) */}
            <div className="absolute bottom-2 inset-x-3 flex justify-between items-center z-10 opacity-75 font-black text-[9px]">
              <div className="flex gap-1.5 items-center">
                <Heart size={10} className="fill-zinc-800 stroke-zinc-800" />
                <span>{happiness}%</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <span>{hunger}%</span>
                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
              </div>
            </div>
          </div>

          {/* Device Controls (Feed, Pet, Clean, Sleep, Customize buttons) */}
          <div className="w-full grid grid-cols-4 gap-2 mt-6 px-1">
            <button
              onClick={handleFeed}
              disabled={status === "DEAD" || status === "SLEEPING"}
              className="flex flex-col items-center gap-1 py-1.5 rounded-xl bg-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-[9px] font-black uppercase text-zinc-100 border border-zinc-600 disabled:opacity-30 disabled:scale-100 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
            >
              <span>Feed</span>
            </button>
            <button
              onClick={handlePlay}
              disabled={status === "DEAD" || status === "SLEEPING"}
              className="flex flex-col items-center gap-1 py-1.5 rounded-xl bg-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-[9px] font-black uppercase text-zinc-100 border border-zinc-600 disabled:opacity-30 disabled:scale-100 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
            >
              <span>Pet</span>
            </button>
            <button
              onClick={handleClean}
              disabled={status === "DEAD" || status === "SLEEPING"}
              className="flex flex-col items-center gap-1 py-1.5 rounded-xl bg-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-[9px] font-black uppercase text-zinc-100 border border-zinc-600 disabled:opacity-30 disabled:scale-100 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
            >
              <span>Clean</span>
            </button>
            <button
              onClick={toggleSleep}
              disabled={status === "DEAD"}
              className="flex flex-col items-center gap-1 py-1.5 rounded-xl bg-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-[9px] font-black uppercase text-zinc-100 border border-zinc-600 disabled:opacity-30 disabled:scale-100 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
            >
              <span>{status === "SLEEPING" ? "Wake" : "Sleep"}</span>
            </button>
          </div>

          {/* Console Physical Buttons (Styling controls / menu navigation) */}
          <div className="w-full flex items-center justify-between mt-8 px-2">
            {/* D-Pad Layout */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              {/* Center connector */}
              <div className="absolute w-8 h-8 bg-zinc-900 rounded" />
              {/* Up Button */}
              <button
                onClick={() => {
                  synth.playSelect();
                  if (currentMenu === "STYLE") {
                    setSelectedStyleIndex(prev => (prev - 1 + 3) % 3);
                  } else {
                    setCurrentMenu(prev => prev === "STATS" ? "NONE" : "STATS");
                  }
                }}
                className="absolute top-0 w-8 h-11 bg-zinc-900 hover:bg-zinc-950 rounded-t shadow-[inset_0_2px_0_rgba(255,255,255,0.1)] active:translate-y-px active:shadow-none flex items-center justify-center"
              >
                <div className="w-0 h-0 border-l-5 border-l-transparent border-r-5 border-r-transparent border-b-7 border-b-zinc-400" />
              </button>
              {/* Down Button */}
              <button
                onClick={() => {
                  synth.playSelect();
                  if (currentMenu === "STYLE") {
                    setSelectedStyleIndex(prev => (prev + 1) % 3);
                  } else {
                    setCurrentMenu("NONE");
                  }
                }}
                className="absolute bottom-0 w-8 h-11 bg-zinc-900 hover:bg-zinc-950 rounded-b shadow-[inset_0_-2px_0_rgba(0,0,0,0.4)] active:translate-y-px active:shadow-none flex items-center justify-center"
              >
                <div className="w-0 h-0 border-l-5 border-l-transparent border-r-5 border-r-transparent border-t-7 border-t-zinc-400" />
              </button>
              {/* Left Button */}
              <button
                onClick={() => {
                  if (currentMenu === "STYLE") {
                    if (selectedStyleIndex === 0) cycleSkin(-1);
                    else if (selectedStyleIndex === 1) cycleHat(-1);
                    else if (selectedStyleIndex === 2) cycleAccessory(-1);
                  } else {
                    cycleHat(-1);
                  }
                }}
                className="absolute left-0 w-11 h-8 bg-zinc-900 hover:bg-zinc-950 rounded-l shadow-[inset_2px_0_0_rgba(255,255,255,0.1)] active:translate-x-px active:shadow-none flex items-center justify-center"
              >
                <div className="w-0 h-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-r-7 border-r-zinc-400" />
              </button>
              {/* Right Button */}
              <button
                onClick={() => {
                  if (currentMenu === "STYLE") {
                    if (selectedStyleIndex === 0) cycleSkin(1);
                    else if (selectedStyleIndex === 1) cycleHat(1);
                    else if (selectedStyleIndex === 2) cycleAccessory(1);
                  } else {
                    cycleAccessory(1);
                  }
                }}
                className="absolute right-0 w-11 h-8 bg-zinc-900 hover:bg-zinc-950 rounded-r shadow-[inset_-2px_0_0_rgba(0,0,0,0.4)] active:translate-x-px active:shadow-none flex items-center justify-center"
              >
                <div className="w-0 h-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-l-7 border-l-zinc-400" />
              </button>
            </div>

            {/* Menu Labels */}
            <div className="flex flex-col items-center gap-1 text-[9px] text-zinc-500 font-bold uppercase tracking-wider min-w-[100px] text-center">
              {currentMenu === "STYLE" ? (
                <>
                  <span className="text-cyan-500 animate-pulse">▲▼ - SELECT</span>
                  <span className="text-cyan-500">◀▶ - CHANGE</span>
                  <span className="text-zinc-600">▼ - CLOSE</span>
                </>
              ) : (
                <>
                  <span>▲ - VITALS</span>
                  <span>◀ - HATS</span>
                  <span>▶ - ACCESSORIES</span>
                  <span>▼ - CLOSE</span>
                </>
              )}
            </div>

            {/* Tactile Action Buttons (A & B style) */}
            <div className="flex gap-4 shrink-0 rotate-[-25deg] -translate-y-2 mr-2">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => {
                    synth.playSelect();
                    setCurrentMenu((prev) =>
                      prev === "STYLE" ? "NONE" : "STYLE",
                    );
                  }}
                  className="w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 shadow-[0_4px_0_#0891b2,inset_0_2px_4px_rgba(255,255,255,0.2)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center text-sm font-bold text-cyan-950"
                >
                  Y
                </button>
                <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                  STYLE
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => cycleSkin()}
                  className="w-12 h-12 rounded-full bg-pink-600 hover:bg-pink-500 shadow-[0_4px_0_#db2777,inset_0_2px_4px_rgba(255,255,255,0.2)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center text-sm font-bold text-pink-950"
                >
                  X
                </button>
                <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                  SKIN
                </span>
              </div>
            </div>
          </div>

          {/* Reset button nested in speaker slits */}
          <div className="w-full flex justify-between items-center mt-10 px-4">
            {/* Grill slits */}
            <div className="flex gap-1">
              <div className="w-1.5 h-6 bg-zinc-950/40 rounded-full" />
              <div className="w-1.5 h-6 bg-zinc-950/40 rounded-full" />
              <div className="w-1.5 h-6 bg-zinc-950/40 rounded-full" />
              <div className="w-1.5 h-6 bg-zinc-950/40 rounded-full" />
            </div>

            {/* Small Reset Button */}
            {status === "DEAD" && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 hover:text-red-300 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                <RotateCcw size={10} />
                <span>Revive</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
