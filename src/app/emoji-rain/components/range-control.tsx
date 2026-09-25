"use client";

import { memo, type ReactNode } from "react";

export const RangeControl = memo(function RangeControl({
  label,
  icon,
  value,
  displayValue,
  min,
  max,
  step,
  fill,
  onChange,
}: {
  label: string;
  icon?: ReactNode;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  fill: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-bold text-slate-600">
        <span className="flex items-center gap-1.5">
          {icon ? (
            <span aria-hidden="true" className="text-slate-400">
              {icon}
            </span>
          ) : null}
          {label}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] tabular-nums text-slate-500">
          {displayValue}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="custom-slider cursor-pointer"
        style={{ background: fill }}
      />
    </label>
  );
});
