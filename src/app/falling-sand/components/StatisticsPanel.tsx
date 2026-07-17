import styles from "../styles.module.css";
import type { MaterialDefinition, SandWorldStats } from "../types";

type StatisticsPanelProps = {
  brushSize: number;
  selectedMaterial: MaterialDefinition;
  speed: number;
  stats: SandWorldStats;
};

export function StatisticsPanel({
  brushSize,
  selectedMaterial,
  speed,
  stats,
}: StatisticsPanelProps) {
  const emptyCells = Math.max(0, stats.cells - stats.active);
  const coverage = stats.cells
    ? `${((stats.active / stats.cells) * 100).toFixed(1)}%`
    : "0.0%";
  const materialVariety = stats.materialCounts
    .slice(1)
    .filter((count) => count > 0).length;
  return (
    <section
      id="panel-statistics"
      role="tabpanel"
      aria-labelledby="tab-statistics"
      className={styles.readout}
      aria-label="World statistics"
    >
      <div>
        <span>Active cells</span>
        <strong>{stats.active.toLocaleString("en-US")}</strong>
      </div>
      <div>
        <span>World grid</span>
        <strong>{stats.cells.toLocaleString("en-US")}</strong>
      </div>
      <div>
        <span>Empty cells</span>
        <strong>{emptyCells.toLocaleString("en-US")}</strong>
      </div>
      <div>
        <span>World coverage</span>
        <strong>{coverage}</strong>
      </div>
      <div>
        <span>Material types</span>
        <strong>{materialVariety}</strong>
      </div>
      <div>
        <span>Selected element</span>
        <strong className={styles.readoutText}>{selectedMaterial.name}</strong>
      </div>
      <div>
        <span>Brush size</span>
        <strong>{brushSize}</strong>
      </div>
      <div>
        <span>Playback speed</span>
        <strong>{speed}×</strong>
      </div>
    </section>
  );
}
