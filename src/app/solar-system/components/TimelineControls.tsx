"use client";

import { Pause, Play } from "lucide-react";

type Props = {
  paused: boolean;
  timeScale: number;
  onTogglePause: () => void;
  onTimeScaleChange: (value: number) => void;
};

export function TimelineControls({
  paused,
  timeScale,
  onTogglePause,
  onTimeScaleChange,
}: Props) {
  return (
    <div className="order-5 relative z-40 -mt-1 mb-4 flex max-w-full flex-wrap items-center justify-center gap-4 rounded-[1.75rem] border border-white/10 bg-black/50 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md md:absolute md:bottom-6 md:left-1/2 md:mb-0 md:mt-0 md:-translate-x-1/2 md:flex-nowrap md:gap-5 md:rounded-full md:px-6">
      <button
        onClick={onTogglePause}
        className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 group cursor-pointer"
        title={paused ? "Resume Simulation" : "Pause Simulation"}
      >
        {paused ? (
          <Play className="w-4 h-4 text-white/70 group-hover:text-white" />
        ) : (
          <Pause className="w-4 h-4 text-white/70 group-hover:text-white" />
        )}
      </button>

      <div className="h-4 w-px bg-white/10" />

      <div className="flex flex-col items-center gap-1 group">
        <label className="text-[9px] font-mono text-white/45 uppercase tracking-widest group-hover:text-white/80 transition-colors">
          Time Scale: {timeScale.toFixed(1)}x
        </label>
        <input
          aria-label="Time scale"
          type="range"
          min="0.1"
          max="6"
          step="0.1"
          value={timeScale}
          onChange={(event) => onTimeScaleChange(Number(event.target.value))}
          className="w-44 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
        />
      </div>
    </div>
  );
}
