"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { STEPS } from "../constants";
import styles from "../studio.module.css";
import type { TrackConfig } from "../types";
import { InstrumentIcon } from "./instrument-icon";

interface SequencerGridProps {
  tracks: TrackConfig[];
  grid: boolean[][];
  currentStep: number;
  isPlaying: boolean;
  onMouseDown: (track: number, step: number, active?: boolean) => void;
  onMouseEnter: (track: number, step: number) => void;
  onAddTrack: () => void;
  showAddButton: boolean;
}

const GROUPS = Array.from({ length: STEPS / 4 }, (_, group) =>
  Array.from({ length: 4 }, (_, offset) => group * 4 + offset),
);

export const SequencerGrid = memo(function SequencerGrid({
  tracks,
  grid,
  currentStep,
  isPlaying,
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
      const cell = getCell(event);
      if (!cell) return;
      if (event.cancelable) event.preventDefault();
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

  const showPlayhead = isPlaying || currentStep > 0;

  return (
    <div
      ref={containerRef}
      onContextMenu={(event) => event.preventDefault()}
      className={`${styles.panel} mb-3 w-full max-w-6xl rounded-2xl p-3 md:mb-4 md:p-5 ${eraseMode ? "cursor-not-allowed" : ""}`}
    >
      <div
        aria-hidden="true"
        className="mb-2.5 flex items-center gap-3 md:mb-3 md:gap-4"
      >
        <div className="w-18 shrink-0 font-mono text-[8px] tracking-[0.2em] text-zinc-600 md:w-24 md:text-[9px]">
          STEP
        </div>
        <div className="flex flex-1 gap-2 md:gap-3">
          {GROUPS.map((group) => (
            <div key={group[0]} className="grid flex-1 grid-cols-4 gap-1">
              {group.map((step) => (
                <div key={step} className="flex justify-center">
                  <span
                    className={styles.led}
                    data-on={
                      (showPlayhead && currentStep === step) || undefined
                    }
                    data-downbeat={step % 4 === 0 || undefined}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {tracks.map((track, trackIndex) => (
        <div
          key={track.id}
          className="mb-1.5 flex items-center gap-3 last:mb-0 md:mb-2 md:gap-4"
        >
          <div className="flex w-18 shrink-0 items-center gap-1.5 md:w-24 md:gap-2">
            <InstrumentIcon
              trackId={track.id}
              color={track.accent}
              className="h-3 w-3 shrink-0 md:h-3.5 md:w-3.5"
            />
            <span
              className={`truncate text-[9px] font-black uppercase tracking-[0.15em] md:text-[10px] ${track.text}`}
            >
              {track.name}
            </span>
          </div>
          <div className="flex flex-1 gap-2 md:gap-3">
            {GROUPS.map((group) => (
              <div key={group[0]} className="grid flex-1 grid-cols-4 gap-1">
                {group.map((stepIndex) => {
                  const active = grid[trackIndex][stepIndex];
                  const current = showPlayhead && currentStep === stepIndex;
                  return (
                    <div
                      key={stepIndex}
                      className={`${styles.cell} relative aspect-square touch-none ${eraseMode ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                        className={styles.pad}
                        data-active={active || undefined}
                        data-current={current || undefined}
                        data-downbeat={stepIndex % 4 === 0 || undefined}
                        style={
                          {
                            "--pad-color": track.accent,
                            "--pad-glow": track.glow,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
      {showAddButton && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onAddTrack}
            className="group flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:border-indigo-400/50 hover:bg-indigo-500/8 hover:text-indigo-300 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
            Add Track
          </button>
        </div>
      )}
    </div>
  );
});
