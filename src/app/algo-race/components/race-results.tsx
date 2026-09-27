"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

import { COLORS } from "../lib/algorithms";
import type { RaceStat } from "../types";
import { formatDuration } from "../utils/format";

type RaceResultsProps = {
  arraySize: number;
  stats: RaceStat[];
};

const PLACE_STYLES: Record<number, string> = {
  1: "bg-linear-to-b from-amber-200 to-amber-400 text-amber-950",
  2: "bg-linear-to-b from-slate-100 to-slate-300 text-slate-800",
  3: "bg-linear-to-b from-orange-200 to-orange-400 text-orange-950",
};

const EASE = [0.16, 1, 0.3, 1] as const;

const tint = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, white)`;

const formatRatio = (ratio: number) =>
  ratio >= 100 ? `${Math.round(ratio)}×` : `${ratio.toFixed(1)}×`;

export function RaceResults({ arraySize, stats }: RaceResultsProps) {
  const orderedStats = [...stats].sort((a, b) => a.executionMs - b.executionMs);
  const winner = orderedStats[0];
  const winnerTime = winner?.executionMs ?? 0;
  const slowestTime = orderedStats.at(-1)?.executionMs ?? 0;
  const winnerColor = winner ? COLORS[winner.name] : "#f59e0b";
  const lead = winnerTime ? slowestTime / winnerTime : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] md:p-2.5"
    >
      <div className="grid gap-2 md:grid-cols-[minmax(15rem,0.85fr)_1fr] md:items-stretch">
        <div
          className="relative overflow-hidden rounded-xl border px-3.5 py-2.5 text-slate-900"
          style={{
            background: tint(winnerColor, 18),
            borderColor: tint(winnerColor, 45),
          }}
        >
          {/* Checkered finish-line stripe */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-10 opacity-15"
            style={{
              background:
                "repeating-conic-gradient(#0f172a 0 25%, transparent 0 50%) 0 0 / 10px 10px",
              maskImage: "linear-gradient(to right, transparent, black)",
            }}
          />
          <div
            className="relative mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em]"
            style={{ color: `color-mix(in srgb, ${winnerColor} 70%, black)` }}
          >
            <motion.span
              initial={{ rotate: -25, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.15 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-b from-amber-200 to-amber-400 shadow-sm"
            >
              <Trophy className="h-3 w-3 text-amber-900" />
            </motion.span>
            Post-Race Results
          </div>
          <div className="relative text-sm font-black md:text-base">
            {winner?.name} wins
            {lead > 1 && (
              <span className="ml-1.5 rounded-full bg-white/70 px-1.5 py-0.5 align-middle font-mono text-[10px] font-bold text-slate-700">
                {formatRatio(lead)} faster than last
              </span>
            )}
          </div>
          <div className="relative mt-1 font-mono text-[11px] text-slate-600">
            {formatDuration(winnerTime)} total &bull;{" "}
            {formatDuration(winnerTime / arraySize)}/item
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {orderedStats.map((entry, index) => {
            const color = COLORS[entry.name];
            const ratio = winnerTime ? entry.executionMs / winnerTime : 1;

            return (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 + index * 0.05, ease: EASE }}
                className="relative flex flex-col justify-between gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2"
                style={{
                  background: tint(color, index === 0 ? 16 : 8),
                  borderColor: tint(color, 35),
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-black shadow-sm ${
                      PLACE_STYLES[index + 1] ?? "bg-white text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 text-right">
                    <div
                      className="truncate text-[11px] font-bold"
                      style={{ color: `color-mix(in srgb, ${color} 75%, black)` }}
                    >
                      {entry.name.replace(" Sort", "")}
                    </div>
                    <div className="font-mono text-xs font-black text-slate-900">
                      {formatDuration(entry.executionMs)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-0.5 flex justify-between font-mono text-[9px] text-slate-500">
                    <span>{(entry.playbackMs / 1000).toFixed(1)}s</span>
                    <span className="font-bold" style={{ color }}>
                      {index === 0 ? "WINNER" : `${formatRatio(ratio)} slower`}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: tint(color, 20) }}
                  >
                    <motion.div
                      aria-hidden="true"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: slowestTime ? entry.executionMs / slowestTime : 0 }}
                      transition={{ duration: 0.9, delay: 0.2 + index * 0.05, ease: EASE }}
                      className="h-full origin-left rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
