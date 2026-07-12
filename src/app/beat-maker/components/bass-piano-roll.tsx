"use client";

import { memo, useEffect, useRef, useState } from "react";
import { BASS_NOTES, STEPS } from "../constants";
import type { BassNote } from "../types";

interface BassPianoRollProps {
  notes: BassNote[];
  currentStep: number;
  onPreview: (note: string) => void;
  onAdd: (pitchIndex: number, step: number) => void;
  onRemove: (id: number) => void;
  onResize: (id: number, start: number, length: number) => void;
  onMove: (id: number, pitchIndex: number, start: number) => void;
}

export const BassPianoRoll = memo(function BassPianoRoll({
  notes,
  currentStep,
  onPreview,
  onAdd,
  onRemove,
  onResize,
  onMove,
}: BassPianoRollProps) {
  const isErasing = useRef(false);
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
      className={`w-full max-w-6xl rounded-2xl border border-indigo-400/20 p-3 md:p-4 mb-3 md:mb-4 overflow-hidden ${eraseMode ? "cursor-not-allowed" : ""}`}
      style={{ background: "linear-gradient(135deg,#101018,#0b0b12)" }}
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
            <h2 className="text-zinc-200 font-bold text-[10px] uppercase tracking-[0.3em]">
              808 Bass Piano Roll
            </h2>
            <p className="pointer-coarse:block mt-1 hidden text-[9px] text-zinc-500">
              Tap a cell to add. Drag notes or edges. Use Erase to remove.
            </p>
          </div>
        </div>
        <div
          className="flex shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/20 p-0.5"
          aria-label="Piano roll editing tool"
        >
          {(["edit", "erase"] as const).map((nextTool) => (
            <button
              key={nextTool}
              type="button"
              aria-pressed={tool === nextTool}
              onClick={() => setTool(nextTool)}
              className="min-h-7 min-w-12 rounded px-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 transition-colors active:scale-[0.98]"
              style={
                tool === nextTool
                  ? { background: "#4f46e5", color: "#f4f4f5" }
                  : undefined
              }
            >
              {nextTool}
            </button>
          ))}
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(0,0,0,0.22)" }}
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
                className="w-16 md:w-20 shrink-0 touch-manipulation py-1 text-left px-2 md:px-3 text-[9px] md:text-[10px] font-bold tracking-widest transition-colors"
                style={{
                  background: blackKey
                    ? "#09090d"
                    : "linear-gradient(90deg,#e4e4e7,#b8b8c1)",
                  color: blackKey ? "#71717a" : "#18181b",
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
                    className="min-h-6 touch-manipulation md:min-h-7 border-r border-b border-white/5"
                    style={{
                      background: blackKey
                        ? "rgba(0,0,0,0.25)"
                        : step % 4 === 0
                          ? "rgba(255,255,255,0.075)"
                          : "rgba(255,255,255,0.03)",
                      boxShadow:
                        currentStep === step
                          ? "inset 0 0 0 1px rgba(255,255,255,0.5)"
                          : "none",
                    }}
                  />
                ))}
                {notes
                  .filter((note) => note.pitchIndex === pitchIndex)
                  .map((note) => (
                    <div
                      key={note.id}
                      className={`absolute top-0 bottom-0 z-10 rounded-sm border border-indigo-200 select-none ${eraseMode ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
                      style={{
                        left: `calc(${(note.start / STEPS) * 100}% + 1px)`,
                        width: `calc(${(note.length / STEPS) * 100}% - 2px)`,
                        background: "linear-gradient(135deg,#a5b4fc,#4f46e5)",
                        boxShadow:
                          "inset 0 0 12px rgba(255,255,255,0.22),0 0 8px rgba(99,102,241,0.55)",
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
                        className={`absolute left-0 top-0 bottom-0 w-3 ${eraseMode ? "cursor-not-allowed" : "cursor-ew-resize"}`}
                      />
                      <span
                        onPointerDown={(event) =>
                          beginResize(event, note, "right")
                        }
                        className={`absolute right-0 top-0 bottom-0 w-3 ${eraseMode ? "cursor-not-allowed" : "cursor-ew-resize"}`}
                      />
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
