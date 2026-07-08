"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Palette = {
  id: string;
  name: string;
  background: string;
  orb: string;
  slider: string;
};

const PALETTES: Palette[] = [
  {
    id: "default",
    name: "Default",
    background: "from-indigo-50 via-purple-50 to-pink-50",
    orb: "from-blue-400 to-pink-400",
    slider: "from-blue-300 to-pink-300",
  },
  {
    id: "sun",
    name: "Sun",
    background: "from-amber-50 via-rose-50 to-orange-100",
    orb: "from-amber-300 to-rose-400",
    slider: "from-amber-300 to-rose-300",
  },
  {
    id: "ocean",
    name: "Ocean",
    background: "from-sky-50 via-blue-50 to-indigo-100",
    orb: "from-blue-400 to-indigo-500",
    slider: "from-sky-300 to-blue-400",
  },
];

export default function MindfulBreathePage() {
  const [speed, setSpeed] = useState(4);
  const [isInhale, setIsInhale] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [paletteId, setPaletteId] = useState("default");
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const palette =
    PALETTES.find((entry) => entry.id === paletteId) ?? PALETTES[0];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsInhale((prev) => !prev);
    }, speed * 1000);

    return () => window.clearInterval(interval);
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = 0.45;

    if (!musicEnabled) {
      audio.pause();
      return;
    }

    const attemptPlay = () => {
      void audio.play().catch(() => undefined);
    };

    if (hasWelcomed) {
      attemptPlay();
    }

    return () => {
      audio.pause();
    };
  }, [hasWelcomed, musicEnabled]);

  return (
    <div
      className={`min-h-screen w-full bg-linear-to-br ${palette.background} flex flex-col items-center justify-center py-10 px-6 transition-all duration-1000 relative overflow-hidden select-none`}
    >
      <audio
        ref={audioRef}
        src="/mindful-breathe/ambient-music.mp3"
        loop
        preload="auto"
        playsInline
      />

      {!hasWelcomed ? (
        <button
          type="button"
          onClick={() => setHasWelcomed(true)}
          className="absolute inset-0 z-30 flex items-center justify-center bg-white/30 px-6 backdrop-blur-sm"
        >
          <span className="rounded-full border border-white/60 bg-white/75 px-5 py-3 text-sm font-light tracking-[0.28em] uppercase text-slate-600 shadow-lg">
            Tap to begin
          </span>
        </button>
      ) : null}

      <div className="flex-1 flex flex-col items-center justify-between w-full max-w-md py-6 gap-8 my-auto">
        <header className="text-center">
          <h1 className="text-xl md:text-2xl font-light text-slate-600/70 tracking-[0.4em] pl-[0.4em] uppercase text-center">
            Mindful Breathe
          </h1>
          <p className="text-xs text-slate-400/80 font-light tracking-widest mt-2 text-center">
            Find your inner peace
          </p>
        </header>

        <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80 my-auto overflow-visible">
          <motion.div
            initial={{
              scale: 1,
              opacity: 0.45,
              filter: "blur(40px)",
            }}
            animate={{
              scale: isInhale ? 1.35 : 1,
              opacity: isInhale ? 0.85 : 0.45,
              filter: isInhale ? "blur(20px)" : "blur(40px)",
            }}
            transition={{ duration: speed, ease: "easeInOut" }}
            className={`absolute inset-4 bg-linear-to-tr ${palette.orb} rounded-full`}
          />
          <motion.div
            initial={{
              scale: 0.85,
            }}
            animate={{
              scale: isInhale ? 1.15 : 0.85,
            }}
            transition={{ duration: speed, ease: "easeInOut" }}
            className="z-10 text-3xl md:text-4xl font-extralight text-slate-600/80 tracking-[0.4em] pl-[0.4em] uppercase text-center"
          >
            {isInhale ? "Inhale" : "Exhale"}
          </motion.div>
        </div>

        <div className="bg-white/20 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/40 shadow-lg flex flex-col items-center gap-4 w-full max-w-[21rem] md:max-w-[22rem]">
          <label className="text-slate-500/90 font-light text-xs tracking-wider uppercase mt-1">
            Breath Duration:{" "}
            <span className="font-normal text-slate-600">{speed}s</span>
          </label>

          <div className="relative flex items-center w-full h-5 cursor-pointer group">
            <input
              type="range"
              min="2"
              max="8"
              step="0.5"
              value={speed}
              onChange={(event) => setSpeed(parseFloat(event.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
            />
            <div className="absolute inset-x-0 h-1 bg-slate-200/50 rounded-full" />
            <div
              className={`absolute left-0 h-1 bg-linear-to-r ${palette.slider} rounded-full`}
              style={{
                width: `${((speed - 2) / 6) * 100}%`,
              }}
            />
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-md border border-slate-200 transition-transform duration-75 group-hover:scale-110"
              style={{
                left: `calc(${((speed - 2) / 6) * 100}% - 7px)`,
              }}
            />
          </div>

          <div className="flex justify-between w-full text-[10px] text-slate-400 font-light tracking-wide -mt-2">
            <span>Fast (2s)</span>
            <span>Slow (8s)</span>
          </div>

          <div className="w-full border-t border-white/35 pt-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-slate-500/90 font-light tracking-[0.25em] uppercase">
                  Ambient Music
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMusicEnabled((current) => !current)}
                className={`rounded-full px-4 py-2 text-[10px] tracking-[0.25em] uppercase transition ${
                  musicEnabled
                    ? "bg-slate-600 text-white"
                    : "bg-white/70 text-slate-600"
                }`}
              >
                {musicEnabled ? "On" : "Off"}
              </button>
            </div>

            <div className="w-full">
              <p className="text-[11px] text-slate-500/90 font-light tracking-[0.25em] uppercase mb-2">
                Color Palette
              </p>
              <div className="flex flex-wrap gap-2">
                {PALETTES.map((entry) => {
                  const selected = entry.id === paletteId;

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setPaletteId(entry.id)}
                      className={`rounded-full border px-3 py-2 text-[10px] tracking-[0.2em] uppercase transition ${
                        selected
                          ? "border-slate-400/60 bg-white/80 text-slate-700"
                          : "border-white/50 bg-white/35 text-slate-500 hover:bg-white/60"
                      }`}
                    >
                      {entry.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
