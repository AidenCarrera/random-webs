"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

const PRESETS = [
  { label: "5 MIN", minutes: 5 },
  { label: "25 MIN", minutes: 25 },
  { label: "1 HR", minutes: 60 },
];

export default function MinimalMono() {
  const [duration, setDuration] = useState(25 * 60);
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("25");

  const endTimeRef = useRef<number | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const defaultTitleRef = useRef<string>("");

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.ceil(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTime(duration);
    endTimeRef.current = null;

    if (containerRef.current) {
      containerRef.current.style.background = "black";
    }
  }, [duration]);

  useEffect(() => {
    defaultTitleRef.current = document.title;

    return () => {
      document.title = defaultTitleRef.current;
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      document.title = `${formatTime(time)} - Focus`;
    } else {
      document.title = defaultTitleRef.current || "Minimal Mono";
    }
  }, [time, isActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (target?.tagName === "INPUT") {
        if (e.key === "Escape") {
          setIsEditing(false);
          setEditValue(Math.floor(duration / 60).toString());
        }

        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsActive((prev) => !prev);
      }

      if (e.key.toLowerCase() === "r") {
        resetTimer();
      }

      if (e.key.toLowerCase() === "e" && !isActive) {
        setEditValue(Math.floor(duration / 60).toString());
        setIsEditing(true);
      }

      if (!isActive && !isEditing && e.key === "ArrowUp") {
        e.preventDefault();
        const newSeconds = Math.min(99 * 60, duration + 60);
        setDuration(newSeconds);
        setTime(newSeconds);
      }

      if (!isActive && !isEditing && e.key === "ArrowDown") {
        e.preventDefault();
        const newSeconds = Math.max(60, duration - 60);
        setDuration(newSeconds);
        setTime(newSeconds);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [duration, isActive, isEditing, resetTimer]);

  useEffect(() => {
    const tick = (frameTime: number) => {
      if (!endTimeRef.current || !containerRef.current) return;

      if (frameTime - lastFrameTimeRef.current < 8) {
        requestIdRef.current = requestAnimationFrame(tick);
        return;
      }

      lastFrameTimeRef.current = frameTime;

      const now = Date.now();
      const remaining = Math.max(0, (endTimeRef.current - now) / 1000);

      const elapsed = duration - remaining;
      const progress = duration > 0 ? (elapsed / duration) * 360 : 0;
      const showGradient = progress > 0.1;

      containerRef.current.style.background = showGradient
        ? `conic-gradient(from 0deg, black 0deg, black ${progress}deg, white ${
            progress + 0.3
          }deg, white 360deg)`
        : "black";

      setTime((prevTime) => {
        const flooredRemaining = Math.ceil(remaining);
        return Math.ceil(prevTime) !== flooredRemaining
          ? remaining
          : prevTime;
      });

      if (remaining <= 0) {
        setIsActive(false);
        setTime(0);
        endTimeRef.current = null;

        containerRef.current.style.background =
          "conic-gradient(from 0deg, black 0deg, black 360deg, white 360deg, white 360deg)";
      } else {
        requestIdRef.current = requestAnimationFrame(tick);
      }
    };

    if (isActive) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + time * 1000;
        lastFrameTimeRef.current = performance.now();
      }

      requestIdRef.current = requestAnimationFrame(tick);
    } else {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }

      endTimeRef.current = null;
    }

    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [isActive, duration, time]);

  const handleTimeEdit = () => {
    const newMinutes = parseInt(editValue, 10);

    if (!isNaN(newMinutes) && newMinutes > 0) {
      const newSeconds = newMinutes * 60;

      setDuration(newSeconds);
      setTime(newSeconds);
      setIsActive(false);
      endTimeRef.current = null;

      if (containerRef.current) {
        containerRef.current.style.background = "black";
      }
    }

    setIsEditing(false);
  };

  const handlePresetClick = (minutes: number) => {
    const newSeconds = minutes * 60;

    setDuration(newSeconds);
    setTime(newSeconds);
    setEditValue(minutes.toString());
    setIsActive(false);
    setIsEditing(false);
    endTimeRef.current = null;

    if (containerRef.current) {
      containerRef.current.style.background = "black";
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center font-mono relative overflow-hidden transition-colors will-change-[background]"
      style={{ background: "black" }}
    >
      <div className="flex flex-col items-center z-10 mix-blend-difference text-white">
        <div className="w-[90vw] flex justify-center">
          {isEditing ? (
            <div className="flex items-center justify-center gap-2 w-full text-[20vw] leading-none font-bold tracking-tighter tabular-nums selection:bg-transparent">
              <input
                type="number"
                min="1"
                max="99"
                value={editValue}
                onChange={(e) => {
                  const val = e.target.value;

                  if (val.length <= 2) {
                    setEditValue(val);
                  }
                }}
                onBlur={handleTimeEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTimeEdit();
                  }
                }}
                autoFocus
                className="w-[2ch] bg-transparent text-center outline-none border-none caret-white"
              />
              <span>:00</span>
            </div>
          ) : (
            <div
              onClick={() => {
                if (!isActive) {
                  setEditValue(Math.floor(duration / 60).toString());
                  setIsEditing(true);
                }
              }}
              className={`w-full text-center text-[20vw] leading-none font-bold tracking-tighter tabular-nums ${
                !isActive ? "cursor-pointer" : ""
              }`}
              title={!isActive ? "Click to edit duration" : ""}
            >
              {formatTime(time)}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          {PRESETS.map((preset) => {
            const selected = duration === preset.minutes * 60;

            return (
              <button
                key={preset.minutes}
                onClick={() => handlePresetClick(preset.minutes)}
                disabled={isActive}
                className={`px-4 py-2 border border-white rounded-full text-sm tracking-widest transition-colors ${
                  selected ? "bg-white text-black" : "bg-transparent text-white"
                } ${
                  isActive
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-white hover:text-black"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-8 mt-12">
          <button
            onClick={() => setIsActive(!isActive)}
            className="w-24 h-24 border-4 border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            title="Space"
          >
            {isActive ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </button>

          <button
            onClick={resetTimer}
            className="w-24 h-24 border-4 border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            title="R"
          >
            <RotateCcw className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
