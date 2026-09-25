"use client";

import { motion } from "framer-motion";
import { memo } from "react";

import { DURATIONS, PANEL } from "../constants";
import type { Duration } from "../types";
import { PanelTitle } from "./panel-title";

export const DurationPicker = memo(function DurationPicker({
  duration,
  disabled,
  onChange,
}: {
  duration: Duration;
  disabled: boolean;
  onChange: (duration: Duration) => void;
}) {
  return (
    <section className={`${PANEL} shrink-0 p-6 lg:p-5`}>
      <PanelTitle>Test Duration</PanelTitle>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-700/70 bg-slate-950/40 p-1">
        {DURATIONS.map((value) => {
          const selected = duration === value;
          return (
            <button
              key={value}
              disabled={disabled}
              onClick={() => onChange(value)}
              aria-pressed={selected}
              className={`relative rounded-lg px-3 py-2 font-mono text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? "text-white"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId="click-duration"
                  className="absolute inset-0 rounded-lg bg-blue-600"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              ) : null}
              <span className="relative">{value}s</span>
            </button>
          );
        })}
      </div>
    </section>
  );
});
