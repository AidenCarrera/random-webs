import { motion } from "framer-motion";
import { SkipBack, SkipForward, Play, Pause, RotateCcw } from "lucide-react";
import { Dataset } from "../types";
import { formatDate } from "../utils/common";
import { BASE_EVENT_DELAY } from "../constants";

type ToolbarProps = {
  dataset: Dataset;
  cursor: number;
  setCursor: (val: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean | ((prev: boolean) => boolean)) => void;
  speed: number;
  setSpeed: (val: number) => void;
};

export function Toolbar({
  dataset,
  cursor,
  setCursor,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
}: ToolbarProps) {
  const progress = (cursor / Math.max(dataset.events.length, 1)) * 100;
  const progressDuration = isPlaying
    ? Math.max(0.18, BASE_EVENT_DELAY / speed / 1000)
    : 0.24;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="pointer-events-none absolute inset-x-3 bottom-3 z-20 sm:inset-x-5 sm:bottom-5"
    >
      <div className="pointer-events-auto mx-auto max-w-5xl rounded-2xl border border-white/10 bg-slate-950/82 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCursor((value: number) => Math.max(0, value - 1));
              }}
              disabled={cursor === 0}
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition-all hover:scale-105 active:scale-95 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent"
              aria-label="Previous commit"
            >
              <SkipBack className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (cursor >= dataset.events.length) {
                  setCursor(0);
                  window.setTimeout(() => setIsPlaying(true), 40);
                  return;
                }
                setIsPlaying((value: boolean) => !value);
              }}
              className="grid size-10 place-items-center rounded-xl border border-blue-400/30 bg-blue-500/20 text-blue-200 transition-all hover:scale-105 hover:bg-blue-500/30 hover:text-white active:scale-95"
              aria-label={isPlaying ? "Pause playback" : "Start playback"}
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="ml-0.5 size-4 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCursor((value: number) =>
                  Math.min(dataset.events.length, value + 1),
                );
              }}
              disabled={cursor >= dataset.events.length}
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition-all hover:scale-105 active:scale-95 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent"
              aria-label="Next commit"
            >
              <SkipForward className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCursor(0);
              }}
              className="ml-1 grid size-8 place-items-center rounded-lg text-slate-500 transition-all hover:scale-105 active:scale-95 hover:bg-white/8 hover:text-white"
              aria-label="Reset playback"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          <div className="group min-w-0 flex-1">
            <div className="relative flex h-3.5 items-center">
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="relative h-full rounded-full bg-blue-400"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: progressDuration, ease: "linear" }}
                >
                  <div className="absolute right-0 top-1/2 size-3.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_5px_rgba(96,165,250,0.8)]" />
                </motion.div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(dataset.events.length, 1)}
                value={cursor}
                onChange={(event) => {
                  setIsPlaying(false);
                  setCursor(Number(event.target.value));
                }}
                className="relative block h-3.5 w-full cursor-pointer appearance-none rounded-full bg-transparent outline-none focus:outline-none focus:ring-0
                  [&::-webkit-slider-runnable-track]:bg-transparent
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent
                  [&::-moz-range-track]:bg-transparent
                  [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-transparent"
                aria-label="Commit timeline"
              />
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-slate-500">
              <span>
                {dataset.events[0]
                  ? formatDate(dataset.events[0].date).split(",")[0]
                  : "Start"}
              </span>
              <span className="font-semibold text-slate-300">
                {cursor} / {dataset.events.length} commits
              </span>
              <span>
                {dataset.events.at(-1)
                  ? formatDate(dataset.events.at(-1)!.date).split(",")[0]
                  : "End"}
              </span>
            </div>
          </div>

          <div className="order-3 flex w-full shrink-0 items-center justify-center gap-0.5 rounded-xl border border-white/5 bg-black/40 p-1 md:order-0 md:w-auto md:gap-1 landscape:order-0 landscape:w-auto landscape:gap-1">
            {[1, 2, 4, 8].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpeed(value)}
                className={`rounded-lg px-2 py-1 font-mono text-[10px] font-medium transition-all hover:scale-105 active:scale-95 sm:px-2.5 ${
                  speed === value
                    ? "bg-blue-500/20 border border-blue-400/30 text-blue-200"
                    : "border border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
