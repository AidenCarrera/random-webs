"use client";

import { memo, useEffect, useState } from "react";
import { Music, Pause, Play, Trash2 } from "lucide-react";
import { PRESETS } from "../presets";
import type { DrumKit, KitDefinition } from "../types";

interface StudioToolbarProps {
  isPlaying: boolean;
  tempo: number;
  swing: number;
  activeKit: DrumKit;
  kits: KitDefinition[];
  onTogglePlay: () => void;
  onClear: () => void;
  onTempoChange: (tempo: number) => void;
  onSwingChange: (swing: number) => void;
  onPresetChange: (key: string) => void;
  onKitChange: (kit: DrumKit) => void;
}

export const StudioToolbar = memo(function StudioToolbar({
  isPlaying,
  tempo,
  swing,
  activeKit,
  kits,
  onTogglePlay,
  onClear,
  onTempoChange,
  onSwingChange,
  onPresetChange,
  onKitChange,
}: StudioToolbarProps) {
  const [tempoDraft, setTempoDraft] = useState(String(tempo));
  useEffect(() => setTempoDraft(String(tempo)), [tempo]);

  const commitTempo = () => {
    const parsed = Number.parseInt(tempoDraft);
    const next = Number.isNaN(parsed)
      ? 120
      : Math.min(300, Math.max(40, parsed));
    onTempoChange(next);
    setTempoDraft(String(next));
  };

  return (
    <div className="w-full max-w-6xl mb-3 md:mb-4">
      <div className="flex items-center justify-between mb-2.5 md:mb-3">
        <div>
          <h1
            className="text-2xl md:text-4xl font-black tracking-[0.2em] text-white"
            style={{ textShadow: "0 0 40px rgba(99,102,241,0.3)" }}
          >
            STUDIO <span style={{ color: "#6366f1" }}>808</span>
          </h1>
          <p className="text-[10px] md:text-xs tracking-[0.3em] text-zinc-600 uppercase mt-0.5">
            Drum Machine &amp; Sequencer
          </p>
        </div>
      </div>
      <div
        className="rounded-2xl border border-white/6 py-2.5 px-3 md:py-3 md:px-4 flex flex-wrap gap-2.5 md:gap-3.5 justify-between items-center"
        style={{ background: "#121218" }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-2 md:gap-2.5 px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wider transition-all duration-200"
            style={{
              background: isPlaying
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: isPlaying
                ? "0 0 12px rgba(16,185,129,0.2),inset 0 1px 0 rgba(255,255,255,0.15)"
                : "0 0 12px rgba(99,102,241,0.2),inset 0 1px 0 rgba(255,255,255,0.15)",
              color: "#fff",
            }}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" />
            ) : (
              <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
            {isPlaying ? "PAUSE" : "PLAY"}
          </button>
          <button
            onClick={onClear}
            className="p-2 md:p-2.5 rounded-xl border border-white/6 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all text-zinc-500 hover:text-rose-400"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
              Tempo
            </label>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl border border-white/6"
              style={{ background: "#0d0d14" }}
            >
              <Music className="w-3 h-3 text-zinc-600" />
              <input
                type="number"
                value={tempoDraft}
                onChange={(event) => setTempoDraft(event.target.value)}
                onBlur={commitTempo}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitTempo();
                    event.currentTarget.blur();
                  }
                }}
                className="w-8 md:w-12 bg-transparent text-center focus:outline-none font-bold text-zinc-200 text-xs md:text-sm"
              />
              <span className="text-[9px] md:text-xs text-zinc-600">BPM</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
              Swing
            </label>
            <div
              className="flex items-center gap-3 px-3 py-1.5 md:py-2 rounded-xl border border-white/6"
              style={{ background: "#0d0d14" }}
            >
              <div className="relative flex items-center w-20 md:w-28 h-5 cursor-pointer group">
                <input
                  type="range"
                  min="50"
                  max="75"
                  value={swing}
                  onChange={(event) =>
                    onSwingChange(Number(event.target.value))
                  }
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
                />
                <div
                  className="absolute inset-x-0 h-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                />
                <div
                  className="absolute left-0 h-1 rounded-full"
                  style={{
                    width: `${((swing - 50) / 25) * 100}%`,
                    background: "linear-gradient(90deg,#6366f1,#818cf8)",
                    boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                  }}
                />
                <div
                  className="absolute w-3 h-3 rounded-full pointer-events-none transition-transform duration-75 group-hover:scale-110"
                  style={{
                    left: `calc(${((swing - 50) / 25) * 100}% - 6px)`,
                    background: "#fff",
                    boxShadow:
                      "0 0 6px rgba(99,102,241,0.7), 0 1px 3px rgba(0,0,0,0.5)",
                  }}
                />
              </div>
              <span className="text-[9px] md:text-xs text-zinc-200 w-7 tabular-nums text-right shrink-0">
                {swing}%
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
              Preset
            </label>
            <select
              title="Preset"
              className="text-[10px] md:text-xs font-bold px-3 py-1.5 md:py-2 rounded-xl border border-white/6 focus:outline-none cursor-pointer"
              style={{ background: "#0d0d14", color: "#e4e4e7" }}
              onChange={(event) => {
                if (event.target.value) onPresetChange(event.target.value);
              }}
              defaultValue=""
            >
              <option
                value=""
                disabled
                style={{ background: "#0d0d14", color: "#52525b" }}
              >
                LOAD...
              </option>
              {Object.entries(PRESETS).map(([key, preset]) => (
                <option
                  key={key}
                  value={key}
                  style={{ background: "#0d0d14", color: "#e4e4e7" }}
                >
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
              Drum Kit
            </label>
            <select
              title="Drum sample kit"
              value={activeKit}
              onChange={(event) => onKitChange(event.target.value)}
              className="text-[10px] md:text-xs font-bold px-3 py-1.5 md:py-2 rounded-xl border border-indigo-400/25 focus:outline-none cursor-pointer"
              style={{ background: "#0d0d14", color: "#c7d2fe" }}
            >
              {kits.map((kit) => (
                <option
                  key={kit.id}
                  value={kit.id}
                  style={{ background: "#0d0d14", color: "#e4e4e7" }}
                >
                  {kit.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
});
