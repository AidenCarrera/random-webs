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

export function RaceResults({ arraySize, stats }: RaceResultsProps) {
  const orderedStats = [...stats].sort((a, b) => a.executionMs - b.executionMs);
  const averageTime =
    orderedStats.reduce((sum, entry) => sum + entry.executionMs, 0) /
    (orderedStats.length || 1);
  const winnerTime = orderedStats[0]?.executionMs ?? 0;
  const slowestTime = orderedStats.at(-1)?.executionMs ?? 0;
  const spread = slowestTime - winnerTime;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] md:p-2.5"
    >
      <div className="grid gap-2 md:grid-cols-[minmax(15rem,0.85fr)_1fr] md:items-stretch">
        <div className="relative overflow-hidden rounded-xl bg-slate-900 px-3.5 py-2.5 text-white">
          <div
            aria-hidden="true"
            className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-amber-400/25 blur-2xl"
          />
          <div className="relative mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            Post-Race Results
          </div>
          <div className="relative text-sm font-black md:text-base">
            {orderedStats[0]?.name} wins
          </div>
          <div className="relative mt-1 font-mono text-[11px] text-slate-400">
            Avg {formatDuration(averageTime)} &bull; Spread{" "}
            {formatDuration(spread)} &bull; Best{" "}
            {formatDuration(winnerTime / arraySize)}/item
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {orderedStats.map((entry, index) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.08 + index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-black shadow-sm ${
                    PLACE_STYLES[index + 1] ?? "bg-slate-900 text-white"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 text-right">
                  <div className="truncate text-[11px] font-bold text-slate-700">
                    {entry.name.replace(" Sort", "")}
                  </div>
                  <div className="font-mono text-xs font-black text-slate-900">
                    {formatDuration(entry.executionMs)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {(entry.playbackMs / 1000).toFixed(1)}s on screen
                  </div>
                </div>
              </div>
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: slowestTime ? entry.executionMs / slowestTime : 0,
                }}
                transition={{
                  duration: 0.9,
                  delay: 0.2 + index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute inset-x-0 bottom-0 h-1 origin-left"
                style={{ background: COLORS[entry.name] }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
