"use client";

import { Award } from "lucide-react";

import { MILESTONES, PANEL } from "../constants";
import type { Duration } from "../types";
import { PanelTitle } from "./panel-title";

/** Milestone ladder for the selected duration, unlocked by the best click count. */
export function MilestonesPanel({
  duration,
  bestClicks,
}: {
  duration: Duration;
  bestClicks: number;
}) {
  return (
    <section
      className={`${PANEL} flex flex-1 flex-col justify-between p-6 lg:min-h-0 lg:p-5`}
    >
      <PanelTitle icon={<Award className="size-4 text-yellow-500" />}>
        Milestones ({duration}s mode)
      </PanelTitle>
      <div className="flex flex-1 flex-col justify-between gap-2.5 lg:min-h-0 lg:gap-2">
        {MILESTONES[duration].map((milestone) => {
          const achieved = bestClicks >= milestone.target;
          const progress = Math.min(1, bestClicks / milestone.target);

          return (
            <div
              key={milestone.label}
              className={`relative flex flex-1 items-center justify-between overflow-hidden rounded-lg border p-2.5 transition-all lg:py-2 ${
                achieved
                  ? `${milestone.color} shadow-sm`
                  : "border-slate-800 bg-slate-950/30 text-slate-500"
              }`}
            >
              {!achieved && progress > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-blue-500/8 transition-[width] duration-700"
                  style={{ width: `${progress * 100}%` }}
                />
              ) : null}
              <div className="relative">
                <div className="text-xs font-bold leading-snug">
                  {milestone.label}
                </div>
                <div className="text-[10px] opacity-80">
                  {milestone.target} clicks target
                </div>
              </div>
              <span
                className={`relative rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                  achieved
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-600"
                }`}
              >
                {achieved ? "Unlocked" : "Locked"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
