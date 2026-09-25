"use client";

import { memo, useEffect, useRef, useState } from "react";
import { BASS_NOTES, STEPS } from "../constants";
import styles from "../studio.module.css";
import type { BassNote } from "../types";

interface BassPianoRollProps {
  notes: BassNote[];
  currentStep: number;
  isPlaying: boolean;
  onPreview: (note: string) => void;
  onAdd: (pitchIndex: number, step: number) => void;
  onRemove: (id: number) => void;
  onResize: (id: number, start: number, length: number) => void;
  onMove: (id: number, pitchIndex: number, start: number) => void;
}

export const BassPianoRoll = memo(function BassPianoRoll({
  notes,
  currentStep,
  isPlaying,
  onPreview,
  onAdd,
  onRemove,
  onResize,
  onMove,
}: BassPianoRollProps) {
  const isErasing = useRef(false);
  const playheadStep = isPlaying || currentStep > 0 ? currentStep : -1;
  const [tool, setTool] = useState<"edit" | "erase">("edit");
  const [rightMouseErasing, setRightMouseErasing] = useState(false);
  const eraseMode = tool === "erase" || rightMouseErasing;
  const resizing = useRef<{
    id: number;
    pointerId: number;
    edge: "left" | "right";
    start: number;
    end: number;
    rowLeft: number;
    rowWidth: number;
  } | null>(null);
  const moving = useRef<{
    id: number;
    pointerId: number;
    pitchIndex: number;
    start: number;
    pointerX: number;
    pointerY: number;
    rowWidth: number;
    rowHeight: number;
  } | null>(null);

  useEffect(() => {
    isErasing.current = eraseMode;
  }, [eraseMode]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resize = resizing.current;
      if (resize) {
        if (event.pointerId !== resize.pointerId) return;
        const step = Math.max(
          0,
          Math.min(
            STEPS - 1,
            Math.floor(
              ((event.clientX - resize.rowLeft) / resize.rowWidth) * STEPS,
            ),
          ),
        );
        if (resize.edge === "left") {
          const start = Math.min(step, resize.end - 1);
          onResize(resize.id, start, resize.end - start);
        } else {
          const end = Math.max(resize.start + 1, step + 1);
          onResize(resize.id, resize.start, end - resize.start);
        }
        return;
      }

      const drag = moving.current;
      if (!drag) return;
      if (event.pointerId !== drag.pointerId) return;
      const stepDelta = Math.round(
        (event.clientX - drag.pointerX) / (drag.rowWidth / STEPS),
      );
      const pitchDelta = Math.round(
        (event.clientY - drag.pointerY) / drag.rowHeight,
      );
      onMove(
        drag.id,
        Math.max(
          0,
          Math.min(BASS_NOTES.length - 1, drag.pitchIndex + pitchDelta),
        ),
        drag.start + stepDelta,
      );
    };
    const stop = (event: PointerEvent) => {
      if (
        (resizing.current && resizing.current.pointerId !== event.pointerId) ||
        (moving.current && moving.current.pointerId !== event.pointerId)
      ) {
        return;
      }
      resizing.current = null;
      moving.current = null;
      if (event.pointerType === "mouse") setRightMouseErasing(false);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [onMove, onResize]);

  const beginResize = (
    event: React.PointerEvent,
    note: BassNote,
    edge: "left" | "right",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.button !== 0) return;
    if (eraseMode) {
      onRemove(note.id);
      return;
    }
    const row = event.currentTarget.closest("[data-bass-row]");
    if (!row) return;
    const bounds = row.getBoundingClientRect();
    resizing.current = {
      id: note.id,
      pointerId: event.pointerId,
      edge,
      start: note.start,
      end: note.start + note.length,
      rowLeft: bounds.left,
      rowWidth: bounds.width,
    };
  };

  const beginMove = (event: React.PointerEvent, note: BassNote) => {
    if (event.button !== 0) return;
    if (eraseMode) {
      event.preventDefault();
      event.stopPropagation();
      onRemove(note.id);
      return;
    }
    event.preventDefault();
    const row = event.currentTarget.closest("[data-bass-row]");
    const rows = event.currentTarget.closest("[data-piano-rows]");
    if (!row || !rows) return;
    const rowBounds = row.getBoundingClientRect();
    const rowsBounds = rows.getBoundingClientRect();
    moving.current = {
      id: note.id,
      pointerId: event.pointerId,
      pitchIndex: note.pitchIndex,
      start: note.start,
      pointerX: event.clientX,
      pointerY: event.clientY,
      rowWidth: rowBounds.width,
      rowHeight: rowsBounds.height / BASS_NOTES.length,
    };
  };

  return (
    <div
      className={`${styles.panel} w-full max-w-6xl rounded-2xl p-3 md:p-5 mb-3 md:mb-4 overflow-hidden ${eraseMode ? "cursor-not-allowed" : ""}`}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDownCapture={(event) => {
        if (event.pointerType === "mouse" && event.button === 2) {
          event.preventDefault();
          isErasing.current = true;
          setRightMouseErasing(true);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="ml-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-200">
              808 Bass Piano Roll
            </h2>
            <p className="pointer-coarse:block mt-1 hidden text-[9px] text-zinc-500">
              Tap a cell to add. Drag notes or edges. Use Erase to remove.
            </p>
          </div>
        </div>
        <div
          className="flex shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40 p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
          aria-label="Piano roll editing tool"
        >
          {(["edit", "erase"] as const).map((nextTool) => (
            <button
              key={nextTool}
              type="button"
              aria-pressed={tool === nextTool}
              onClick={() => setTool(nextTool)}
              className="min-h-7 min-w-12 rounded-md px-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-200 active:scale-[0.98]"
              style={
                tool === nextTool
                  ? {
                      background: "linear-gradient(180deg,#6366f1,#4f46e5)",
                      color: "#f4f4f5",
                      boxShadow:
                        "0 0 12px rgba(99,102,241,0.45),inset 0 1px 0 rgba(255,255,255,0.25)",
                    }
                  : undefined
              }
            >
              {nextTool}
            </button>
          ))}
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden border border-black/40"
        style={{
          background: "rgba(0,0,0,0.3)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
        }}
        data-piano-rows
      >
        {BASS_NOTES.map((pitch, pitchIndex) => {
          const blackKey = pitch.includes("#");
          return (
            <div
              key={pitch}
              className="flex items-stretch gap-3 md:gap-4 min-h-6 md:min-h-7"
            >
              <button
                type="button"
                onDoubleClick={() => onPreview(pitch)}
                onPointerDown={(event) => {
                  if (event.pointerType !== "mouse") onPreview(pitch);
                }}
                className="w-18 md:w-24 shrink-0 touch-manipulation border-b border-black/30 py-1 text-left px-2 md:px-3 text-[9px] md:text-[10px] font-bold tracking-widest transition-[filter] hover:brightness-110 active:brightness-90"
                style={{
                  background: blackKey
                    ? "linear-gradient(90deg,#1b1b22 0%,#0b0b0f 70%,#16161c 100%)"
                    : "linear-gradient(90deg,#f4f4f5 0%,#d9d9de 80%,#bdbdc6 100%)",
                  color: blackKey ? "#8b8b96" : "#27272a",
                  boxShadow: blackKey
                    ? "inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "inset 0 1px 0 #fff, inset -3px 0 4px rgba(0,0,0,0.12)",
                }}
                title={`Double-click or tap to preview ${pitch}`}
              >
                {pitch}
              </button>
              <div className="relative flex-1 grid grid-cols-16" data-bass-row>
                {Array.from({ length: STEPS }, (_, step) => (
                  <button
                    type="button"
                    key={step}
                    aria-label={`Add ${pitch} at step ${step + 1}`}
                    onClick={() => onAdd(pitchIndex, step)}
                    className="min-h-6 touch-manipulation md:min-h-7 border-l border-b border-l-transparent border-b-white/5 transition-colors duration-100 hover:bg-indigo-400/15!"
                    style={{
                      background:
                        playheadStep === step
                          ? "rgba(165,180,252,0.14)"
                          : blackKey
                            ? "rgba(0,0,0,0.25)"
                            : step % 4 === 0
                              ? "rgba(255,255,255,0.075)"
                              : "rgba(255,255,255,0.03)",
                      borderLeftColor:
                        step % 4 === 0 && step > 0
                          ? "rgba(255,255,255,0.12)"
                          : undefined,
                    }}
                  />
                ))}
                {notes
                  .filter((note) => note.pitchIndex === pitchIndex)
                  .map((note) => (
                    <div
                      key={note.id}
                      className={`group/note absolute top-0.5 bottom-0.5 z-10 rounded-md border border-indigo-200/80 select-none transition-[filter] hover:brightness-110 ${eraseMode ? "cursor-not-allowed hover:brightness-75" : "cursor-grab active:cursor-grabbing"}`}
                      style={{
                        left: `calc(${(note.start / STEPS) * 100}% + 1px)`,
                        width: `calc(${(note.length / STEPS) * 100}% - 2px)`,
                        background:
                          "linear-gradient(180deg,#c7d2fe 0%,#818cf8 45%,#4f46e5 100%)",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.6),0 0 12px rgba(99,102,241,0.6)",
                        touchAction: "none",
                      }}
                      onPointerDownCapture={(event) => {
                        if (
                          event.pointerType === "mouse" &&
                          event.button === 2
                        ) {
                          event.preventDefault();
                          onRemove(note.id);
                        }
                      }}
                      onPointerDown={(event) => beginMove(event, note)}
                      onPointerEnter={() => {
                        if (isErasing.current) onRemove(note.id);
                      }}
                      onDoubleClick={() => onRemove(note.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRemove(note.id);
                      }}
                      title="Drag the note to move it. Drag either edge to resize. Right-click or use Erase to remove."
                    >
                      <span
                        onPointerDown={(event) =>
                          beginResize(event, note, "left")
                        }
                        className={`absolute left-0 top-0 bottom-0 flex w-3 items-center justify-center ${eraseMode ? "cursor-not-allowed" : "cursor-ew-resize"}`}
                      >
                        <span className="h-2.5 w-px rounded-full bg-indigo-950/50 opacity-0 transition-opacity group-hover/note:opacity-100" />
                      </span>
                      <span
                        onPointerDown={(event) =>
                          beginResize(event, note, "right")
                        }
                        className={`absolute right-0 top-0 bottom-0 flex w-3 items-center justify-center ${eraseMode ? "cursor-not-allowed" : "cursor-ew-resize"}`}
                      >
                        <span className="h-2.5 w-px rounded-full bg-indigo-950/50 opacity-0 transition-opacity group-hover/note:opacity-100" />
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
