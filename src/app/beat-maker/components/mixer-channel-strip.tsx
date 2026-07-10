"use client";

import { memo } from "react";
import type { DrumKit, KitDefinition, TrackConfig } from "../types";
import { VerticalFader } from "./vertical-fader";

interface MixerChannelStripProps {
  track?: TrackConfig;
  volume: number;
  muted?: boolean;
  soloed?: boolean;
  master?: boolean;
  kits?: KitDefinition[];
  selectedKit?: DrumKit;
  meterRef: (element: HTMLDivElement | null) => void;
  onVolumeChange: (id: string, value: number) => void;
  onToggleMute?: (id: string) => void;
  onToggleSolo?: (id: string) => void;
  onKitChange?: (id: string, kit: DrumKit) => void;
}

export const MixerChannelStrip = memo(function MixerChannelStrip({
  track,
  volume,
  muted = false,
  soloed = false,
  master = false,
  kits = [],
  selectedKit = "808",
  meterRef,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onKitChange,
}: MixerChannelStripProps) {
  const id = master ? "master" : track!.id;
  const accent = master ? "#6366f1" : track!.accent;
  const glow = master ? "rgba(99,102,241,0.6)" : track!.glow;
  const name = master ? "MASTER" : track!.name;

  return (
    <div className="flex flex-col items-center gap-2 w-12 md:w-14 shrink-0">
      <span
        className="text-[9px] font-mono tabular-nums"
        style={{ color: "rgba(161,161,170,0.5)" }}
      >
        {volume.toFixed(0)}
      </span>
      {master ? (
        <div className="flex gap-1 opacity-0 pointer-events-none">
          <div className="w-5 h-5 md:w-6 md:h-6" />
          <div className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      ) : (
        <div className="flex gap-1">
          <button
            onClick={() => onToggleMute?.(id)}
            className="w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center text-[9px] font-black transition-all"
            style={{
              background: muted
                ? "rgba(245,158,11,0.2)"
                : "rgba(255,255,255,0.04)",
              border: muted
                ? "1px solid rgba(245,158,11,0.5)"
                : "1px solid rgba(255,255,255,0.06)",
              color: muted ? "#fbbf24" : "#52525b",
              boxShadow: muted ? "0 0 10px rgba(245,158,11,0.3)" : "none",
            }}
          >
            M
          </button>
          <button
            onClick={() => onToggleSolo?.(id)}
            className="w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center text-[9px] font-black transition-all"
            style={{
              background: soloed
                ? "rgba(99,102,241,0.2)"
                : "rgba(255,255,255,0.04)",
              border: soloed
                ? "1px solid rgba(99,102,241,0.5)"
                : "1px solid rgba(255,255,255,0.06)",
              color: soloed ? "#818cf8" : "#52525b",
              boxShadow: soloed ? "0 0 10px rgba(99,102,241,0.3)" : "none",
            }}
          >
            S
          </button>
        </div>
      )}
      <div
        className={`flex gap-1.5 md:gap-2 h-36 md:h-44 p-1.5 rounded-xl border ${master ? "border-white/6" : "border-white/4"}`}
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <VerticalFader id={id} value={volume} onChange={onVolumeChange} />
        <div
          className="w-1.5 h-full rounded-full relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div
            ref={meterRef}
            className="absolute bottom-0 w-full rounded-full transition-all duration-75 ease-out"
            style={{
              height: "0%",
              background: master
                ? "linear-gradient(to top,#6366f1,#8b5cf6)"
                : `linear-gradient(to top,${accent},${accent}88)`,
              boxShadow: master ? "0 0 8px rgba(99,102,241,0.4)" : "none",
            }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 6px ${glow}` }}
        />
        <span
          className="text-[8px] md:text-[9px] font-bold tracking-wider text-center leading-tight"
          style={{
            color: master ? "rgba(255,255,255,0.6)" : "rgba(161,161,170,0.7)",
          }}
        >
          {name}
        </span>
        {!master && (
          <select
            aria-label={`${name} sample`}
            title={`Change ${name} sample`}
            value={selectedKit}
            onChange={(event) => onKitChange?.(id, event.target.value)}
            className="w-12 md:w-14 px-1 py-0.5 rounded border border-white/10 bg-transparent text-[7px] md:text-[8px] font-bold text-zinc-400 cursor-pointer focus:outline-none focus:border-indigo-400"
          >
            {kits.map((kit) => (
              <option
                key={kit.id}
                value={kit.id}
                style={{ background: "#0d0d14" }}
              >
                {kit.name.replace(" Kit", "")}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
});
