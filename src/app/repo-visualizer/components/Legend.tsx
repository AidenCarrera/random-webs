import { type MutableRefObject, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FILE_COLORS, STATUS_COLORS } from "../constants";
import { GraphNode } from "../types";

type LegendProps = {
  graphRef: MutableRefObject<Map<string, GraphNode>>;
};

const labelToColor: Record<string, string> = {
  "TypeScript": FILE_COLORS.typescript,
  "JavaScript": FILE_COLORS.javascript,
  "Styles": FILE_COLORS.styles,
  "Data": FILE_COLORS.data,
  "Docs": FILE_COLORS.docs,
  "Images": FILE_COLORS.image,
  "Audio": FILE_COLORS.audio,
  "Video": FILE_COLORS.video,
  "Config": FILE_COLORS.config,
  "Other": FILE_COLORS.other,
};

const colorToLabel: Record<string, string> = {
  [FILE_COLORS.typescript]: "TypeScript",
  [FILE_COLORS.javascript]: "JavaScript",
  [FILE_COLORS.styles]: "Styles",
  [FILE_COLORS.data]: "Data",
  [FILE_COLORS.docs]: "Docs",
  [FILE_COLORS.image]: "Images",
  [FILE_COLORS.audio]: "Audio",
  [FILE_COLORS.video]: "Video",
  [FILE_COLORS.config]: "Config",
  [FILE_COLORS.other]: "Other",
};

type Distribution = {
  activeItems: Array<{ label: string; count: number; color: string }>;
  totalActiveFiles: number;
};

const EMPTY_DISTRIBUTION: Distribution = {
  activeItems: [],
  totalActiveFiles: 0,
};

function getDistribution(graph: Map<string, GraphNode>): Distribution {
  const counts = new Map<string, number>();

  Object.keys(labelToColor).forEach((label) => {
    counts.set(label, 0);
  });

  let totalActiveFiles = 0;
  for (const node of graph.values()) {
    if (node.alpha <= 0.08 || node.kind !== "file" || node.deleted) continue;
    const label = colorToLabel[node.color] || "Other";
    counts.set(label, (counts.get(label) || 0) + 1);
    totalActiveFiles += 1;
  }

  const activeItems = Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      color: labelToColor[label] || FILE_COLORS.other,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return { activeItems, totalActiveFiles };
}

export function Legend({ graphRef }: LegendProps) {
  const [distribution, setDistribution] =
    useState<Distribution>(EMPTY_DISTRIBUTION);

  useEffect(() => {
    const updateDistribution = () => {
      setDistribution(getDistribution(graphRef.current));
    };
    const frame = requestAnimationFrame(updateDistribution);
    const interval = window.setInterval(updateDistribution, 250);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [graphRef]);

  const { activeItems, totalActiveFiles } = distribution;

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
      <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        File distribution
      </p>

      {activeItems.length > 0 ? (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {activeItems.map((item) => {
            const percentage = totalActiveFiles > 0 ? (item.count / totalActiveFiles) * 100 : 0;
            return (
              <motion.div layout key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-300">{item.label}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    {item.count}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-slate-600">No active files</p>
      )}

      <div className="mt-2 border-t border-white/5 pt-3">
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          File status
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["added", "modified", "removed"] as const).map((status) => (
            <div
              key={status}
              className="flex items-center gap-1.5 text-[10px] capitalize text-slate-400"
            >
              <span
                className="size-1.5 rounded-full border"
                style={{
                  borderColor: STATUS_COLORS[status],
                  backgroundColor: `${STATUS_COLORS[status]}22`,
                }}
              />
              <span className="font-medium text-slate-400">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
