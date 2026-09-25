"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback } from "react";

import type { SortName } from "../types";

const MEDALS: Record<number, string> = {
  1: "bg-linear-to-b from-amber-200 to-amber-400 text-amber-950 ring-amber-500/40",
  2: "bg-linear-to-b from-slate-100 to-slate-300 text-slate-800 ring-slate-400/50",
  3: "bg-linear-to-b from-orange-200 to-orange-400 text-orange-950 ring-orange-500/40",
};

export const SortVisualizer = memo(function SortVisualizer({
  name,
  color,
  onCanvas,
  rank,
  complexity,
  isRaceComplete,
}: {
  name: SortName;
  color: string;
  onCanvas: (name: SortName, canvas: HTMLCanvasElement | null) => void;
  rank: number | null;
  complexity: string;
  isRaceComplete: boolean;
}) {
  // Stable ref callback prevents canvas re-mounting when rank badge renders.
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => onCanvas(name, canvas),
    [onCanvas, name],
  );

  return (
    <div
      style={{
        boxShadow: rank
          ? `0 0 0 2px color-mix(in srgb, ${color} 35%, transparent), 0 14px 30px -14px color-mix(in srgb, ${color} 55%, transparent)`
          : undefined,
      }}
      className={`relative mx-auto flex aspect-square w-full min-w-0 max-w-none flex-col rounded-2xl border border-slate-200/70 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_10px_24px_-14px_rgba(15,23,42,0.25)] transition-shadow duration-500 md:p-3 ${
        isRaceComplete
          ? "md:max-w-[calc((100vh-246px)/3)] xl:max-w-[calc((100vh-226px)/2)]"
          : "md:max-w-[calc((100vh-146px)/3)] xl:max-w-[calc((100vh-136px)/2)]"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[11px] font-bold leading-tight text-slate-800 sm:text-sm md:text-base">
            {name}
          </h2>
          <div className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.04em] text-slate-500 sm:text-[9px]">
            {complexity}
          </div>
        </div>
        <AnimatePresence>
          {rank && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 20 }}
              className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-black shadow-md ring-1 ${
                MEDALS[rank] ?? "bg-slate-900 text-white ring-slate-900/20"
              }`}
            >
              #{rank}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative min-h-0 flex-1 rounded-lg border-b-2 border-l border-slate-200 p-0.5">
        <canvas
          ref={canvasRef}
          aria-label={`${name} visualization`}
          className="block h-full w-full"
        />
      </div>
    </div>
  );
});
