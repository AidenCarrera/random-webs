"use client";

import { AnimatePresence, motion } from "motion/react";

import type { ViewMode, VisualizerProps } from "../types";
import { ViewModeTabs } from "./view-mode-tabs";
import { BloomVisualizer } from "./visualizers/bloom-visualizer";
import { CircularVisualizer } from "./visualizers/circular-visualizer";
import { Orbit3DVisualizer } from "./visualizers/orbit-3d-visualizer";
import { TimelineVisualizer } from "./visualizers/timeline-visualizer";

/**
 * Stage that frames the active visualization in a square, with the view switch,
 * tempo and cycle position in a fixed-height bar above it. On desktop the stage
 * is as wide as its slot's height minus that bar (border 2px + bar 52px + line
 * 2px = 3.375rem), so the drawing area stays square. Each visualizer receives
 * only the values it draws with, so the ones that ignore cycle progress can
 * skip re-rendering.
 */
export function VisualizerStage({
  mode,
  onModeChange,
  bpm,
  rhythms,
  progress,
  turns,
  activePulses,
}: VisualizerProps & {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  bpm: number;
}) {
  return (
    <section className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#faf9f6]/14 bg-[#141219] shadow-[inset_0_1px_0_rgba(250,249,246,0.08),0_24px_50px_-30px_rgba(0,0,0,0.95)] lg:w-[min(100cqw,calc(100cqh-3.375rem))]">
      <div className="flex h-13 shrink-0 items-center justify-between gap-4 px-3 sm:px-4">
        <ViewModeTabs mode={mode} onModeChange={onModeChange} />
        <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums text-[#d8cabc]/55">
          <span>{bpm} BPM</span>
          <span className="text-[#faf9f6]">{(progress * 100).toFixed(1)}%</span>
        </div>
      </div>
      <div className="relative h-0.5 w-full shrink-0 bg-[#faf9f6]/10">
        <div
          className="absolute inset-y-0 left-0 bg-[#55c991] shadow-[0_0_10px_rgba(85,201,145,0.8)]"
          style={{ width: `${progress * 100}%` }}
        >
          <span className="absolute -right-1 -top-[3px] h-2 w-2 rounded-full bg-[#faf9f6] shadow-[0_0_10px_#55c991]" />
        </div>
      </div>
      <div className="relative aspect-square w-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center p-3 sm:p-4"
          >
            {mode === "circle" && (
              <CircularVisualizer
                rhythms={rhythms}
                progress={progress}
                activePulses={activePulses}
              />
            )}
            {mode === "timeline" && (
              <TimelineVisualizer
                rhythms={rhythms}
                progress={progress}
                activePulses={activePulses}
              />
            )}
            {mode === "bloom" && (
              <BloomVisualizer
                rhythms={rhythms}
                progress={progress}
                turns={turns}
                activePulses={activePulses}
              />
            )}
            {mode === "orbit3d" && (
              <Orbit3DVisualizer
                rhythms={rhythms}
                activePulses={activePulses}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
