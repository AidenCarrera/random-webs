"use client";

import { memo, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { BASS_MIXER_TRACK, TRACK_BY_ID } from "../constants";
import type { DrumKit, KitDefinition, TrackConfig } from "../types";
import { MixerChannelStrip } from "./mixer-channel-strip";

interface MixerProps {
  tracks: TrackConfig[];
  volumes: Record<string, number>;
  mutes: Record<string, boolean>;
  solos: Record<string, boolean>;
  kits: KitDefinition[];
  assignments: Record<string, DrumKit>;
  readMeterValues: () => Record<string, number>;
  onVolumeChange: (id: string, value: number) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onKitChange: (id: string, kit: DrumKit) => void;
}

export const Mixer = memo(function Mixer({
  tracks,
  volumes,
  mutes,
  solos,
  kits,
  assignments,
  readMeterValues,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onKitChange,
}: MixerProps) {
  const meterBars = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let animationFrame: number | null = null;
    let previousPaint = 0;
    const update = (timestamp: number) => {
      if (timestamp - previousPaint >= 1000 / 30) {
        previousPaint = timestamp;
        const values = readMeterValues();
        Object.entries(meterBars.current).forEach(([id, element]) => {
          if (!element) return;
          const value = values[id] ?? -60;
          const level = Number.isFinite(value) ? Math.max(-60, value) : -60;
          const height = Math.min(100, Math.max(0, ((level + 60) / 60) * 100));
          const track = TRACK_BY_ID[id];
          element.style.height = `${height}%`;
          if (id === "master") {
            element.style.background =
              level > -3
                ? "linear-gradient(to top,#f43f5e,#fb923c)"
                : "linear-gradient(to top,#6366f1,#8b5cf6)";
            element.style.boxShadow =
              level > -3
                ? "0 0 8px rgba(244,63,94,0.5)"
                : "0 0 8px rgba(99,102,241,0.4)";
          } else if (track) {
            element.style.background =
              level > -3
                ? "linear-gradient(to top,#f43f5e,#fb923c)"
                : level > -12
                  ? "linear-gradient(to top,#fbbf24,#84cc16)"
                  : `linear-gradient(to top,${track.accent},${track.accent}88)`;
            element.style.boxShadow =
              level > -12 ? `0 0 6px ${track.glow}` : "none";
          }
        });
      }
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [readMeterValues]);

  return (
    <div
      className="w-full max-w-6xl rounded-2xl border border-white/6 p-3.5 md:p-4.5"
      style={{ background: "#121218" }}
    >
      <div className="flex items-center gap-3 mb-3 md:mb-4">
        <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
        <h2 className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.3em]">
          Mixer
        </h2>
        <div
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(to right,rgba(255,255,255,0.05),transparent)",
          }}
        />
      </div>
      <div className="flex justify-start lg:justify-center gap-3 md:gap-6 px-2 overflow-x-auto pb-2 w-full">
        {[...tracks, BASS_MIXER_TRACK].map((track) => (
          <MixerChannelStrip
            key={track.id}
            track={track}
            volume={volumes[track.id] ?? 0}
            muted={mutes[track.id]}
            soloed={solos[track.id]}
            kits={kits}
            selectedKit={assignments[track.id] ?? "808"}
            meterRef={(element) => {
              meterBars.current[track.id] = element;
            }}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
            onToggleSolo={onToggleSolo}
            onKitChange={onKitChange}
          />
        ))}
        <div
          className="w-px mx-2 rounded-full self-stretch"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        <MixerChannelStrip
          master
          volume={volumes.master ?? 0}
          meterRef={(element) => {
            meterBars.current.master = element;
          }}
          onVolumeChange={onVolumeChange}
        />
      </div>
    </div>
  );
});
