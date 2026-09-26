"use client";

import { memo, type CSSProperties } from "react";
import { Clock3 } from "lucide-react";

import { RHYTHMS } from "../rhythms";
import styles from "../styles.module.css";
import { Panel } from "./panel";

const round = (value: number) => Math.round(value * 100) / 100;

/** The rhythm's pulses as dots evenly spaced around a circle. */
function PulseGlyph({ count }: { count: number }) {
  return (
    <svg viewBox="-10 -10 20 20" aria-hidden="true" className="h-4 w-4">
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={index}
            cx={round(Math.cos(angle) * 7)}
            cy={round(Math.sin(angle) * 7)}
            r={count > 8 ? 1.2 : 1.6}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

export const RhythmPanel = memo(function RhythmPanel({
  activeCounts,
  onToggleRhythm,
}: {
  activeCounts: number[];
  onToggleRhythm: (count: number) => void;
}) {
  return (
    <Panel
      title="Rhythms"
      icon={<Clock3 />}
      aside={
        <span className="font-mono text-[11px] tabular-nums text-[#d8cabc]/60">
          {activeCounts.join(":")}
        </span>
      }
      className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
    >
      <div className={`${styles.padGrid} grid grid-cols-3 gap-2`}>
        {RHYTHMS.map((rhythm) => {
          const selected = activeCounts.includes(rhythm.count);
          return (
            <button
              key={rhythm.count}
              onClick={() => onToggleRhythm(rhythm.count)}
              className={`${styles.pad} ${selected ? styles.padActive : ""} flex h-12 items-center justify-center gap-2 text-base font-black tabular-nums lg:h-auto`}
              style={{ "--pad-color": rhythm.color } as CSSProperties}
              title={`${rhythm.count} pulses per cycle`}
              aria-pressed={selected}
            >
              <PulseGlyph count={rhythm.count} />
              {rhythm.count}
            </button>
          );
        })}
      </div>
    </Panel>
  );
});
