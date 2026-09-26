"use client";

import { memo } from "react";

import { VIEW_MODES } from "../constants";
import styles from "../styles.module.css";
import type { ViewMode } from "../types";

/** Segmented switch for the visualization, sitting in the stage's top bar. */
export const ViewModeTabs = memo(function ViewModeTabs({
  mode,
  onModeChange,
}: {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div role="group" aria-label="View" className="flex items-center gap-1.5">
      {VIEW_MODES.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            onClick={() => onModeChange(value)}
            aria-pressed={active}
            title={label}
            className={`${styles.mode} ${active ? styles.modeActive : styles.modeIdle} flex h-8 items-center justify-center gap-2 rounded-lg border px-2.5 text-[11px] font-black uppercase tracking-[0.16em] [&>svg]:h-3.5 [&>svg]:w-3.5`}
          >
            <Icon />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
});
