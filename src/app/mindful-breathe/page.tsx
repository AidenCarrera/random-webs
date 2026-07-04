"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function PastelDream() {
  const [speed, setSpeed] = useState(4); // seconds per cycle
  const [isInhale, setIsInhale] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsInhale((prev) => !prev);
    }, speed * 1000);
    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-8 transition-all duration-1000 relative">
      <header className="absolute top-16 md:top-20 text-center select-none">
        <h1 className="text-xl font-light text-slate-600/70 tracking-[0.4em] uppercase">
          Mindful Breathe
        </h1>
        <p className="text-xs text-slate-400/80 font-light tracking-widest mt-1.5">
          Find your inner peace
        </p>
      </header>

      <div className="relative flex items-center justify-center w-80 h-80 md:w-96 md:h-96 mt-16">
        <motion.div
          animate={{
            scale: isInhale ? 1.5 : 1,
            opacity: isInhale ? 0.85 : 0.45,
            filter: isInhale ? "blur(20px)" : "blur(40px)",
          }}
          transition={{ duration: speed, ease: "easeInOut" }}
          className="absolute inset-0 bg-linear-to-tr from-blue-400 to-pink-400 rounded-full"
        />
        <motion.div
          animate={{
            scale: isInhale ? 1.15 : 0.85,
          }}
          transition={{ duration: speed, ease: "easeInOut" }}
          className="z-10 text-3xl md:text-4xl font-extralight text-slate-600/80 tracking-[0.4em] uppercase select-none"
        >
          {isInhale ? "Inhale" : "Exhale"}
        </motion.div>
      </div>

      <div className="mt-32 md:mt-40 bg-white/25 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/40 shadow-lg flex flex-col items-center gap-4 w-72 md:w-80">
        <div className="relative flex items-center w-full h-5 cursor-pointer group">
          <input
            type="range"
            min="2"
            max="8"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
          />
          {/* Track background */}
          <div className="absolute inset-x-0 h-1 bg-slate-200/50 rounded-full" />
          {/* Filled portion */}
          <div
            className="absolute left-0 h-1 bg-linear-to-r from-blue-300 to-pink-300 rounded-full"
            style={{
              width: `${((speed - 2) / 6) * 100}%`,
            }}
          />
          {/* Thumb */}
          <div
            className="absolute w-3 h-3 rounded-full bg-white shadow-md border border-slate-200 transition-transform duration-75 group-hover:scale-110"
            style={{
              left: `calc(${((speed - 2) / 6) * 100}% - 6px)`,
            }}
          />
        </div>
        <div className="flex justify-between w-full text-[10px] text-slate-400 font-light tracking-wide -mt-2">
          <span>Fast (2s)</span>
          <span>Slow (8s)</span>
        </div>
        <label className="text-slate-500/90 font-light text-xs tracking-wider uppercase mt-1">
          Breath Duration:{" "}
          <span className="font-normal text-slate-600">{speed}s</span>
        </label>
      </div>
    </div>
  );
}
