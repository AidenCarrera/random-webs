"use client";

import { memo, useEffect, useState } from "react";
import { ChevronDown, Music, Pause, Play, Trash2 } from "lucide-react";
import { PRESETS } from "../presets";
import styles from "../studio.module.css";
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

const fieldLabel =
  "px-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400 md:text-[10px]";
const controlText = "text-[11px] font-bold text-zinc-100 md:text-xs";
const selectInput = `${controlText} h-full cursor-pointer appearance-none bg-transparent pl-3 pr-8 focus:outline-none`;
const selectChevron =
  "pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-zinc-400";
const optionStyle = { background: "#1c1c24", color: "#f4f4f5" };

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

  const swingPercent = ((swing - 50) / 25) * 100;

  return (
    <div className="mb-3 w-full max-w-6xl md:mb-4">
      <div className="mb-3 flex items-end justify-between md:mb-4">
        <div>
          <h1
            className="text-2xl font-black tracking-[0.2em] text-white md:text-4xl"
            style={{ textShadow: "0 0 16px rgba(99,102,241,0.15)" }}
          >
            STUDIO{" "}
            <span
              className="bg-linear-to-b from-indigo-300 to-indigo-500 bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 6px rgba(99,102,241,0.2))" }}
            >
              808
            </span>
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-zinc-500 md:text-xs">
            Drum Machine &amp; Sequencer
          </p>
        </div>
      </div>
      <div
        className={`${styles.panel} flex flex-wrap items-center justify-between gap-2.5 rounded-2xl px-3 py-2.5 md:gap-3.5 md:px-5 md:py-3.5`}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onTogglePlay}
            aria-pressed={isPlaying}
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-xs font-bold tracking-wider text-white transition-[transform,box-shadow,background] duration-200 active:translate-y-px active:scale-[0.98] md:gap-2.5 md:px-6 md:py-2.5 md:text-sm"
            style={{
              background: isPlaying
                ? "linear-gradient(180deg,#34d399,#059669)"
                : "linear-gradient(180deg,#818cf8,#4f46e5)",
              boxShadow: isPlaying
                ? "0 0 22px rgba(16,185,129,0.35),inset 0 1px 0 rgba(255,255,255,0.3),inset 0 -2px 0 rgba(0,0,0,0.2)"
                : "0 0 22px rgba(99,102,241,0.3),inset 0 1px 0 rgba(255,255,255,0.3),inset 0 -2px 0 rgba(0,0,0,0.2)",
            }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
            {isPlaying ? (
              <Pause
                className="relative h-3.5 w-3.5 md:h-4 md:w-4"
                fill="currentColor"
              />
            ) : (
              <Play
                className="relative h-3.5 w-3.5 md:h-4 md:w-4"
                fill="currentColor"
              />
            )}
            <span className="relative">{isPlaying ? "PAUSE" : "PLAY"}</span>
          </button>
          <button
            onClick={onClear}
            className="rounded-xl border border-white/6 bg-white/2 p-2 text-zinc-500 transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95 md:p-2.5"
            title="Clear"
            aria-label="Clear"
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="studio-tempo" className={fieldLabel}>
              Tempo
            </label>
            <div className={`${styles.control} gap-1.5 px-3`}>
              <Music className="h-3 w-3 text-zinc-500" />
              <input
                id="studio-tempo"
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
                className={`${controlText} w-8 bg-transparent text-center font-mono tabular-nums focus:outline-none md:w-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
              <span className="font-mono text-[9px] text-zinc-500 md:text-[10px]">
                BPM
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="studio-swing" className={fieldLabel}>
              Swing
            </label>
            <div className={`${styles.control} gap-3 px-3`}>
              <div className="group relative flex h-5 w-20 cursor-pointer items-center md:w-28">
                <input
                  id="studio-swing"
                  type="range"
                  min="50"
                  max="75"
                  value={swing}
                  onChange={(event) =>
                    onSwingChange(Number(event.target.value))
                  }
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <div className="absolute inset-x-0 h-1 rounded-full bg-white/10" />
                <div
                  className="absolute left-0 h-1 rounded-full bg-indigo-400"
                  style={{ width: `${swingPercent}%` }}
                />
                <div
                  className="pointer-events-none absolute h-3.5 w-3.5 rounded-full bg-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-transform duration-100 group-hover:scale-110 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300"
                  style={{ left: `calc(${swingPercent}% - 7px)` }}
                />
              </div>
              <span
                className={`${controlText} w-8 shrink-0 text-right font-mono tabular-nums`}
              >
                {swing}%
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="studio-kit" className={fieldLabel}>
              Drum Kit
            </label>
            <div className={styles.control}>
              <select
                id="studio-kit"
                title="Drum sample kit"
                value={activeKit}
                onChange={(event) => onKitChange(event.target.value)}
                className={selectInput}
              >
                {kits.map((kit) => (
                  <option key={kit.id} value={kit.id} style={optionStyle}>
                    {kit.name}
                  </option>
                ))}
              </select>
              <ChevronDown className={selectChevron} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="studio-preset" className={fieldLabel}>
              Preset
            </label>
            <div className={styles.control}>
              <select
                id="studio-preset"
                title="Preset"
                className={selectInput}
                onChange={(event) => {
                  if (event.target.value) onPresetChange(event.target.value);
                }}
                defaultValue=""
              >
                <option
                  value=""
                  disabled
                  style={{ ...optionStyle, color: "#71717a" }}
                >
                  LOAD...
                </option>
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <option key={key} value={key} style={optionStyle}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <ChevronDown className={selectChevron} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
