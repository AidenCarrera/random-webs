"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { TrackConfig } from "../types";

interface SequencerGridProps {
  tracks: TrackConfig[];
  grid: boolean[][];
  currentStep: number;
  onMouseDown: (track: number, step: number, active?: boolean) => void;
  onMouseEnter: (track: number, step: number) => void;
  onAddTrack: () => void;
  showAddButton: boolean;
}

export const SequencerGrid = memo(function SequencerGrid({
  tracks,
  grid,
  currentStep,
  onMouseDown,
  onMouseEnter,
  onAddTrack,
  showAddButton,
}: SequencerGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ track: number; step: number } | null>(null);
  const [eraseMode, setEraseMode] = useState(false);

  useEffect(() => {
    const stopErasing = () => setEraseMode(false);
    window.addEventListener("mouseup", stopErasing);
    return () => window.removeEventListener("mouseup", stopErasing);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const getCell = (event: TouchEvent) => {
      const touch = event.touches[0];
      return document
        .elementFromPoint(touch.clientX, touch.clientY)
        ?.closest("[data-track][data-step]") as HTMLElement | null;
    };
    const handleTouchStart = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
      const cell = getCell(event);
      if (!cell) return;
      const track = Number(cell.dataset.track);
      const step = Number(cell.dataset.step);
      lastTouchRef.current = { track, step };
      onMouseDown(track, step);
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
      const cell = getCell(event);
      if (!cell) return;
      const track = Number(cell.dataset.track);
      const step = Number(cell.dataset.step);
      const last = lastTouchRef.current;
      if (!last || last.track !== track || last.step !== step) {
        lastTouchRef.current = { track, step };
        onMouseEnter(track, step);
      }
    };
    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
    };
  }, [onMouseDown, onMouseEnter]);

  return (
    <div
      ref={containerRef}
      onContextMenu={(event) => event.preventDefault()}
      className={`w-full max-w-6xl rounded-2xl border border-white/6 p-3 md:p-4 mb-3 md:mb-4 ${eraseMode ? "cursor-not-allowed" : ""}`}
      style={{ background: "#121218" }}
    >
      {tracks.map((track, trackIndex) => (
        <div
          key={track.id}
          className="flex items-center gap-3 md:gap-4 mb-1.5 md:mb-2 last:mb-0"
        >
          <div className="w-16 md:w-20 shrink-0 flex flex-col gap-1">
            <span
              className={`text-[9px] md:text-[10px] font-black tracking-[0.15em] uppercase ${track.text}`}
            >
              {track.name}
            </span>
            <div
              className="h-px w-full rounded-full opacity-30"
              style={{ background: track.accent }}
            />
          </div>
          <div className="flex-1 grid grid-cols-16 gap-1">
            {grid[trackIndex].map((active, stepIndex) => {
              const downbeat = stepIndex % 4 === 0;
              const current = currentStep === stepIndex;
              return (
                <div
                  key={stepIndex}
                  className={`aspect-square relative touch-none ${eraseMode ? "cursor-not-allowed" : "cursor-pointer"}`}
                  data-track={trackIndex}
                  data-step={stepIndex}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (event.button === 0) {
                      onMouseDown(trackIndex, stepIndex, true);
                    } else if (event.button === 2) {
                      setEraseMode(true);
                      onMouseDown(trackIndex, stepIndex, false);
                    }
                  }}
                  onMouseEnter={() => onMouseEnter(trackIndex, stepIndex)}
                >
                  <div
                    className="absolute inset-0 rounded-md"
                    style={{
                      transition:
                        "background 75ms ease, border-color 75ms ease, box-shadow 75ms ease",
                      background: active
                        ? track.accent
                        : downbeat
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(255,255,255,0.025)",
                      border: active
                        ? `1px solid ${track.accent}`
                        : "1px solid rgba(255,255,255,0.04)",
                      boxShadow: active
                        ? `0 0 10px ${track.glow},inset 0 1px 0 rgba(255,255,255,0.25)`
                        : current
                          ? "0 0 10px rgba(255,255,255,0.2)"
                          : "none",
                      transform: current ? "scale(1.08)" : "scale(1)",
                      opacity: current && !active ? 0.95 : 1,
                      outline: current
                        ? "1.5px solid rgba(255,255,255,0.65)"
                        : "none",
                      outlineOffset: "1px",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {showAddButton && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onAddTrack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(161,161,170,0.6)",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
              event.currentTarget.style.color = "#818cf8";
              event.currentTarget.style.background = "rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              event.currentTarget.style.color = "rgba(161,161,170,0.6)";
              event.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Track
          </button>
        </div>
      )}
    </div>
  );
});
