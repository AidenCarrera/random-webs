"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, CloudRain, Umbrella, Wind } from "lucide-react";
import { useEffect, useState } from "react";

import {
  COMPACT_MEDIA_QUERY,
  SPEED_MAX,
  SPEED_MIN,
  SPEED_STEP,
} from "../config";
import type { Category } from "../types";
import { getSliderBackground } from "../utils/style";
import { CategoryButtons } from "./category-buttons";
import { RangeControl } from "./range-control";

export function ControlPanel({
  intensityPercent,
  speed,
  selected,
  accent,
  isRainbow,
  onIntensityChange,
  onSpeedChange,
  onCategoryPress,
}: {
  intensityPercent: number;
  speed: number;
  selected: Category[];
  accent: string;
  isRainbow: boolean;
  onIntensityChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onCategoryPress: (category: Category, mix: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [minimized, setMinimized] = useState(false);
  const speedPercent = ((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100;

  useEffect(() => {
    const query = window.matchMedia(COMPACT_MEDIA_QUERY);
    const sync = () => setMinimized(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <section className="absolute bottom-4 left-1/2 z-20 flex w-[min(92vw,37rem)] -translate-x-1/2 flex-col rounded-3xl border border-white/70 bg-white/80 p-3 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:bottom-6 sm:p-3.5 md:bottom-8 md:w-[90%] md:max-w-[37rem] md:p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-colors duration-500"
            style={{
              background: isRainbow
                ? "linear-gradient(135deg,#ff3366,#ff9933,#33cc66,#3399ff,#9933ff)"
                : accent,
            }}
          >
            <Umbrella className="size-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Emoji Rain
            </p>
            <p className="text-sm font-semibold text-slate-700">
              Controls
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMinimized((value) => !value)}
          aria-expanded={!minimized}
          className="group flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white active:scale-95"
        >
          {minimized ? "Open" : "Minimize"}
          <ChevronDown
            aria-hidden="true"
            className={`size-3.5 transition-transform duration-300 ${
              minimized ? "rotate-180" : ""
            }`}
          />
        </button>
      </header>

      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            key="body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex max-h-[50vh] flex-col gap-3.5 overflow-y-auto pr-1 sm:gap-4">
              <div className="flex shrink-0 flex-col gap-3.5 border-b border-slate-200/60 pb-3.5 sm:grid sm:grid-cols-2 sm:gap-5 sm:pb-4">
                <RangeControl
                  label="Rain Intensity"
                  icon={<CloudRain className="size-3.5" strokeWidth={2.5} />}
                  value={intensityPercent}
                  displayValue={`${intensityPercent}%`}
                  min={0}
                  max={100}
                  step={1}
                  fill={getSliderBackground(
                    intensityPercent,
                    accent,
                    isRainbow,
                  )}
                  onChange={onIntensityChange}
                />
                <RangeControl
                  label="Falling Speed"
                  icon={<Wind className="size-3.5" strokeWidth={2.5} />}
                  value={speed}
                  displayValue={`${Math.round(speed * 100)}%`}
                  min={SPEED_MIN}
                  max={SPEED_MAX}
                  step={SPEED_STEP}
                  fill={getSliderBackground(speedPercent, accent, isRainbow)}
                  onChange={onSpeedChange}
                />
              </div>

              <CategoryButtons
                selected={selected}
                isRainbow={isRainbow}
                accent={accent}
                onPress={onCategoryPress}
              />

              <p className="shrink-0 select-none text-center text-[11px] font-medium text-slate-400">
                Press and hold to mix categories.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
