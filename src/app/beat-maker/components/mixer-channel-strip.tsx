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

const keyBase =
  "flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-black transition-all active:translate-y-px md:h-6 md:w-6";

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
    <div
      className={`flex w-12 shrink-0 flex-col items-center gap-2 md:w-14 ${
        muted ? "opacity-60" : ""
      } transition-opacity duration-200`}
    >
      <span
        className="rounded bg-black/30 px-1 font-mono text-[9px] tabular-nums"
        style={{ color: master ? "#c7d2fe" : "rgba(161,161,170,0.7)" }}
      >
        {volume > 0 ? `+${volume.toFixed(0)}` : volume.toFixed(0)}
      </span>
      {master ? (
        <div className="pointer-events-none flex gap-1 opacity-0">
          <div className="h-5 w-5 md:h-6 md:w-6" />
          <div className="h-5 w-5 md:h-6 md:w-6" />
        </div>
      ) : (
        <div className="flex gap-1">
          <button
            onClick={() => onToggleMute?.(id)}
            aria-pressed={muted}
            aria-label={`Mute ${name}`}
            className={keyBase}
            style={{
              background: muted
                ? "linear-gradient(180deg,rgba(251,191,36,0.35),rgba(245,158,11,0.18))"
                : "linear-gradient(180deg,#22222b,#18181f)",
              border: muted
                ? "1px solid rgba(245,158,11,0.6)"
                : "1px solid rgba(255,255,255,0.06)",
              color: muted ? "#fcd34d" : "#71717a",
              boxShadow: muted
                ? "0 0 12px rgba(245,158,11,0.35)"
                : "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            M
          </button>
          <button
            onClick={() => onToggleSolo?.(id)}
            aria-pressed={soloed}
            aria-label={`Solo ${name}`}
            className={keyBase}
            style={{
              background: soloed
                ? "linear-gradient(180deg,rgba(129,140,248,0.4),rgba(99,102,241,0.2))"
                : "linear-gradient(180deg,#22222b,#18181f)",
              border: soloed
                ? "1px solid rgba(129,140,248,0.65)"
                : "1px solid rgba(255,255,255,0.06)",
              color: soloed ? "#c7d2fe" : "#71717a",
              boxShadow: soloed
                ? "0 0 12px rgba(99,102,241,0.4)"
                : "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            S
          </button>
        </div>
      )}
      <div
        className={`flex h-36 gap-1.5 rounded-xl border p-1.5 md:h-44 md:gap-2 ${master ? "border-indigo-400/20" : "border-white/5"}`}
        style={{
          background:
            "linear-gradient(180deg,rgba(0,0,0,0.45),rgba(0,0,0,0.25))",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
        }}
      >
        <VerticalFader id={id} value={volume} onChange={onVolumeChange} />
        <div
          className="relative h-full w-1.5 overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div
            ref={meterRef}
            className="absolute bottom-0 w-full transition-all duration-75 ease-out"
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
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 6px ${glow}` }}
        />
        <span
          className="text-center text-[8px] font-bold leading-tight tracking-wider md:text-[9px]"
          style={{
            color: master ? "rgba(255,255,255,0.75)" : "rgba(161,161,170,0.8)",
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
            className="w-12 cursor-pointer rounded border border-white/10 bg-black/30 px-1 py-0.5 text-[7px] font-bold text-zinc-400 transition-colors hover:border-white/20 focus:border-indigo-400 focus:outline-none md:w-14 md:text-[8px]"
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
