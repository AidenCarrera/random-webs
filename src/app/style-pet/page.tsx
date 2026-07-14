"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, RotateCcw, Volume2, VolumeX, Award } from "lucide-react";

// --- Types ---
type PetStatus = "IDLE" | "EATING" | "SLEEPING" | "PLAYING" | "DEAD";
type SkinColor = "cyber-cyan" | "neon-pink" | "golden-orange" | "slime-green";
type HatStyle = "NONE" | "COWBOY" | "CROWN" | "WIZARD" | "BOW";
type AccessoryStyle = "NONE" | "SHADES" | "BOWTIE" | "HALO";

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

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
    const AudioContextClass =
      window.AudioContext ||
      (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
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
  const [currentMenu, setCurrentMenu] = useState<"NONE" | "STYLE" | "STATS">(
    "NONE",
  );
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
      setSleepBubbles([]);
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
    setSleepBubbles([]);
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
      const frame = requestAnimationFrame(() => {
        setStatus("DEAD");
        setSleepBubbles([]);
        synth.playDead();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [hunger, happiness, energy, status]);

  // Zzz Animation Loop
  useEffect(() => {
    if (status !== "SLEEPING") return;
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
    const next =
      accs[(accs.indexOf(accessory) + dir + accs.length) % accs.length];
    setAccessory(next);
  };

  // Render customizable pet vector shapes (Clean crisp pixel art styling)
  const colors = SKIN_COLORS[skin];

  return (
    <div className="min-h-[100dvh] bg-[#172a33] flex flex-col items-center justify-center p-4 sm:p-6 select-none font-mono text-zinc-300 relative overflow-hidden">
      {/* Main Console Container */}
      <div className="relative z-10 flex w-full flex-col items-center">
        {/* Device Outer Frame */}
        <div className="relative flex w-[min(100%,420px)] flex-col items-center rounded-[50px] border-4 border-[#8f928d] bg-[#c8cac5] p-6 pb-16 pt-16 shadow-[0_30px_70px_rgba(8,24,31,0.5),inset_0_4px_8px_rgba(255,255,255,0.75),inset_0_-8px_14px_rgba(85,90,88,0.28)] animate-fade-in sm:p-8 sm:pb-[72px] sm:pt-16 md:w-125">
          {/* Sound control */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Turn sound on" : "Mute sound"}
            title={isMuted ? "Turn sound on" : "Mute sound"}
            className="absolute right-6 top-4 rounded-lg border border-[#9da09b] bg-[#b8bab5] p-1.5 text-[#4e5354] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors hover:bg-[#afb2ad] hover:text-[#242829] active:translate-y-px sm:right-8"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Handheld LCD Screen Area */}
          <div
            className="relative aspect-[11/10] w-full overflow-hidden rounded-2xl border-solid border-[#676b69] bg-[#87977a] p-4 text-zinc-900 shadow-[inset_0_4px_12px_rgba(0,0,0,0.32),0_2px_4px_rgba(255,255,255,0.3)] flex flex-col"
            style={{ borderWidth: "18px 26px" }}
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
                className="relative flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44"
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
                  <span className="text-zinc-500 font-mono select-none">
                    ▲▼ Select
                  </span>
                </div>

                {/* Skin item */}
                <div
                  className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 0 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 0 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`}
                    />
                    <span>SKIN COLOR</span>
                  </span>
                  <span>
                    {skin
                      .replace("cyber-", "")
                      .replace("neon-", "")
                      .replace("slime-", "")
                      .replace("golden-", "")
                      .toUpperCase()}
                  </span>
                </div>

                {/* Hat item */}
                <div
                  className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 1 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 1 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`}
                    />
                    <span>HAT STYLE</span>
                  </span>
                  <span>{hat}</span>
                </div>

                {/* Accessory item */}
                <div
                  className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-all ${selectedStyleIndex === 2 ? "bg-zinc-800/40 text-cyan-400 font-bold" : "opacity-80"}`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedStyleIndex === 2 ? "bg-cyan-400 animate-pulse" : "bg-transparent"}`}
                    />
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
              className="flex flex-col items-center gap-1 rounded-xl border border-[#404649] bg-[#565c5f] py-1.5 text-[9px] font-black uppercase text-[#f2f3ef] shadow-[0_2px_0_#363c3f,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-30 disabled:shadow-[0_2px_0_#363c3f]"
            >
              <span>Feed</span>
            </button>
            <button
              onClick={handlePlay}
              disabled={status === "DEAD" || status === "SLEEPING"}
              className="flex flex-col items-center gap-1 rounded-xl border border-[#404649] bg-[#565c5f] py-1.5 text-[9px] font-black uppercase text-[#f2f3ef] shadow-[0_2px_0_#363c3f,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-30 disabled:shadow-[0_2px_0_#363c3f]"
            >
              <span>Pet</span>
            </button>
            <button
              onClick={handleClean}
              disabled={status === "DEAD" || status === "SLEEPING"}
              className="flex flex-col items-center gap-1 rounded-xl border border-[#404649] bg-[#565c5f] py-1.5 text-[9px] font-black uppercase text-[#f2f3ef] shadow-[0_2px_0_#363c3f,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-30 disabled:shadow-[0_2px_0_#363c3f]"
            >
              <span>Clean</span>
            </button>
            <button
              onClick={toggleSleep}
              disabled={status === "DEAD"}
              className="flex flex-col items-center gap-1 rounded-xl border border-[#404649] bg-[#565c5f] py-1.5 text-[9px] font-black uppercase text-[#f2f3ef] shadow-[0_2px_0_#363c3f,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-30 disabled:shadow-[0_2px_0_#363c3f]"
            >
              <span>{status === "SLEEPING" ? "Wake" : "Sleep"}</span>
            </button>
          </div>

          {/* Console Physical Buttons (Styling controls / menu navigation) */}
          <div className="mt-8 flex w-full items-center justify-between px-2 max-[420px]:scale-[0.82]">
            {/* D-Pad Layout */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              {/* Center connector */}
              <div className="absolute h-8 w-8 rounded bg-[#303638]" />
              {/* Up Button */}
              <button
                onClick={() => {
                  synth.playSelect();
                  if (currentMenu === "STYLE") {
                    setSelectedStyleIndex((prev) => (prev - 1 + 3) % 3);
                  } else {
                    setCurrentMenu((prev) =>
                      prev === "STATS" ? "NONE" : "STATS",
                    );
                  }
                }}
                className="absolute top-0 flex h-11 w-8 items-center justify-center rounded-t bg-[#303638] shadow-[inset_0_2px_0_rgba(255,255,255,0.13)] transition-colors hover:bg-[#282e30] active:translate-y-px active:shadow-none"
              >
                <div className="w-0 h-0 border-l-5 border-l-transparent border-r-5 border-r-transparent border-b-7 border-b-zinc-400" />
              </button>
              {/* Down Button */}
              <button
                onClick={() => {
                  synth.playSelect();
                  if (currentMenu === "STYLE") {
                    setSelectedStyleIndex((prev) => (prev + 1) % 3);
                  } else {
                    setCurrentMenu("NONE");
                  }
                }}
                className="absolute bottom-0 flex h-11 w-8 items-center justify-center rounded-b bg-[#303638] shadow-[inset_0_-2px_0_rgba(0,0,0,0.32)] transition-colors hover:bg-[#282e30] active:translate-y-px active:shadow-none"
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
                className="absolute left-0 flex h-8 w-11 items-center justify-center rounded-l bg-[#303638] shadow-[inset_2px_0_0_rgba(255,255,255,0.13)] transition-colors hover:bg-[#282e30] active:translate-x-px active:shadow-none"
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
                className="absolute right-0 flex h-8 w-11 items-center justify-center rounded-r bg-[#303638] shadow-[inset_-2px_0_0_rgba(0,0,0,0.32)] transition-colors hover:bg-[#282e30] active:translate-x-px active:shadow-none"
              >
                <div className="w-0 h-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-l-7 border-l-zinc-400" />
              </button>
            </div>

            {/* Menu Labels */}
            <div className="flex min-w-25 flex-col items-center gap-1 text-center text-[9px] font-bold uppercase tracking-wider text-[#505556]">
              {currentMenu === "STYLE" ? (
                <>
                  <span className="animate-pulse text-[#7b2946]">
                    ▲▼ - SELECT
                  </span>
                  <span className="text-[#7b2946]">◀▶ - CHANGE</span>
                  <span className="text-[#686d6d]">▼ - CLOSE</span>
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
                  onClick={() => cycleSkin()}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#93425f] text-sm font-bold text-[#f5e8ed] shadow-[0_4px_0_#65263e,inset_0_2px_4px_rgba(255,255,255,0.24)] transition-all hover:bg-[#a44c6a] active:translate-y-1 active:shadow-none"
                >
                  X
                </button>
                <span className="text-[9px] font-bold tracking-wider text-[#505556]">
                  SKIN
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => {
                    synth.playSelect();
                    setCurrentMenu((prev) =>
                      prev === "STYLE" ? "NONE" : "STYLE",
                    );
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#93425f] text-sm font-bold text-[#f5e8ed] shadow-[0_4px_0_#65263e,inset_0_2px_4px_rgba(255,255,255,0.24)] transition-all hover:bg-[#a44c6a] active:translate-y-1 active:shadow-none"
                >
                  Y
                </button>
                <span className="text-[9px] font-bold tracking-wider text-[#505556]">
                  STYLE
                </span>
              </div>
            </div>
          </div>

          {/* Lower hardware row */}
          <div className="relative mt-10 flex min-h-14 w-full items-center px-4">
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

            {/* Select and Start controls */}
            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -rotate-[12deg] gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    synth.playSelect();
                    setCurrentMenu((prev) =>
                      prev === "STYLE" ? "NONE" : "STYLE",
                    );
                  }}
                  aria-label="Select style menu"
                  className="h-4 w-12 rounded-full border border-[#454b4d] bg-[#565c5f] shadow-[0_2px_0_#3d4345,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none"
                />
                <span className="text-[8px] font-bold tracking-wider text-[#505556]">
                  SELECT
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    synth.playSelect();
                    setCurrentMenu((prev) =>
                      prev === "STATS" ? "NONE" : "STATS",
                    );
                  }}
                  aria-label="Start vitals menu"
                  className="h-4 w-12 rounded-full border border-[#454b4d] bg-[#565c5f] shadow-[0_2px_0_#3d4345,inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:bg-[#4d5356] active:translate-y-0.5 active:shadow-none"
                />
                <span className="text-[8px] font-bold tracking-wider text-[#505556]">
                  START
                </span>
              </div>
            </div>

            {/* Game Boy-style angled speaker grille */}
            <div
              aria-hidden="true"
              className="ml-auto flex -rotate-[28deg] gap-2"
            >
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
              <div className="h-9 w-1.5 rounded-full bg-[#777d7a]/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
