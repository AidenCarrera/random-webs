"use client";

import { motion } from "framer-motion";
import { Flag, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { SIZE_OPTIONS } from "../config";

type RaceHeaderProps = {
  arraySize: number;
  canSkipToEnd: boolean;
  isPaused: boolean;
  isPreparing: boolean;
  isRunning: boolean;
  prepareProgress: number;
  onSizeChange: (size: number) => void;
  onToggle: () => void;
  onSkipToEnd: () => void;
  onReset: () => void;
};

function StartButtonLabel({
  isPaused,
  isPreparing,
  isRunning,
}: Pick<RaceHeaderProps, "isPaused" | "isPreparing" | "isRunning">) {
  // Preparation happens ahead of Start, so this only shows while the cache is cold.
  if (isPreparing) return "Preparing race…";

  if (isRunning && !isPaused) {
    return (
      <>
        <Pause className="h-3.5 w-3.5" fill="currentColor" /> PAUSE
      </>
    );
  }

  if (isRunning) {
    return (
      <>
        <Play className="h-3.5 w-3.5" fill="currentColor" /> RESUME
      </>
    );
  }

  return (
    <>
      <Play className="h-3.5 w-3.5" fill="currentColor" /> START
    </>
  );
}

export function RaceHeader({
  arraySize,
  canSkipToEnd,
  isPaused,
  isPreparing,
  isRunning,
  prepareProgress,
  onSizeChange,
  onToggle,
  onSkipToEnd,
  onReset,
}: RaceHeaderProps) {
  return (
    <header className="relative flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center justify-center gap-3 sm:justify-start">
        <div
          aria-hidden="true"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-[0_6px_16px_-6px_rgba(15,23,42,0.6)] sm:flex"
        >
          <Flag className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-black italic leading-none tracking-[-0.03em] text-slate-900 sm:text-3xl">
            ALGO RACE
          </h1>
          <p className="mt-1.5 font-mono text-[11px] tracking-tight text-slate-500 sm:text-xs">
            Which algorithm will win? • N={arraySize.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <div
          role="group"
          aria-label="Array size"
          className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
        >
          <span
            aria-hidden="true"
            className="px-2 font-mono text-[10px] font-bold tracking-[0.14em] text-slate-400"
          >
            SIZE
          </span>
          {SIZE_OPTIONS.map((option) => {
            const isActive = arraySize === option.size;
            return (
              <button
                key={option.size}
                onClick={() => onSizeChange(option.size)}
                disabled={isRunning}
                title={`${option.size.toLocaleString()} items`}
                aria-pressed={isActive}
                className={`relative min-w-8 rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="algo-race-size"
                    className="absolute inset-0 rounded-full bg-slate-900"
                    transition={{ type: "spring", stiffness: 520, damping: 38 }}
                  />
                ) : null}
                <span className="relative">{option.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onToggle}
          disabled={isPreparing}
          className="group relative flex min-w-28 items-center justify-center gap-2 overflow-hidden rounded-full bg-slate-900 px-4 py-2 text-xs font-bold tracking-[0.08em] text-white shadow-[0_8px_18px_-8px_rgba(15,23,42,0.7)] transition-[transform,background-color] duration-200 hover:bg-slate-800 active:scale-[0.97] disabled:opacity-60"
        >
          <StartButtonLabel
            isPaused={isPaused}
            isPreparing={isPreparing}
            isRunning={isRunning}
          />
          {isPreparing && (
            <span
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-white/70 transition-transform duration-200"
              style={{ transform: `scaleX(${prepareProgress})` }}
            />
          )}
        </button>
        {canSkipToEnd && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onSkipToEnd}
            title="Finish the last algorithm now"
            className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold tracking-[0.08em] text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            <SkipForward className="h-3.5 w-3.5" /> SKIP TO END
          </motion.button>
        )}
        <button
          onClick={() => onReset()}
          className="group flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold tracking-[0.08em] text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 active:scale-[0.97]"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" />{" "}
          RESET
        </button>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1.5 opacity-25 [background:conic-gradient(#0f172a_25%,transparent_0_50%,#0f172a_0_75%,transparent_0)_0_0/6px_6px] [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
      />
    </header>
  );
}
