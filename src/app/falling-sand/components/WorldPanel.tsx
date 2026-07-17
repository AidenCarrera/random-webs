import type { RefObject } from "react";
import {
  Camera,
  CircleDot,
  FolderOpen,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { FallingSandCanvas } from "../FallingSandCanvas";
import styles from "../styles.module.css";
import type {
  FallingSandCanvasHandle,
  Material,
  SandWorldStats,
} from "../types";

type WorldPanelProps = {
  autoPauseWhenHidden: boolean;
  brushSize: number;
  canvasRef: RefObject<FallingSandCanvasHandle | null>;
  displayFrameRate: boolean;
  material: Material;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onExport: () => void;
  onHintDismiss: () => void;
  onLoad: () => void;
  onPausedToggle: () => void;
  onReady: () => void;
  onReset: () => void;
  onSave: () => void;
  onSpeedChange: (speed: number) => void;
  onStats: (stats: SandWorldStats) => void;
  pauseWhileDrawing: boolean;
  paused: boolean;
  ready: boolean;
  rightClickErases: boolean;
  showCanvasHint: boolean;
  speed: number;
  stats: SandWorldStats;
};

const SPEEDS = [0.5, 1, 2, 4];

export function WorldPanel({
  autoPauseWhenHidden,
  brushSize,
  canvasRef,
  displayFrameRate,
  material,
  onBrushSizeChange,
  onClear,
  onExport,
  onHintDismiss,
  onLoad,
  onPausedToggle,
  onReady,
  onReset,
  onSave,
  onSpeedChange,
  onStats,
  pauseWhileDrawing,
  paused,
  ready,
  rightClickErases,
  showCanvasHint,
  speed,
  stats,
}: WorldPanelProps) {
  return (
    <section className={styles.worldPanel} aria-label="Falling sand world">
      <FallingSandCanvas
        ref={canvasRef}
        autoPauseWhenHidden={autoPauseWhenHidden}
        brushSize={brushSize}
        material={material}
        onBrushSizeChange={onBrushSizeChange}
        pauseWhileDrawing={pauseWhileDrawing}
        paused={paused}
        rightClickErases={rightClickErases}
        speed={speed}
        onReady={onReady}
        onStats={onStats}
      />

      {!ready ? (
        <div className={styles.loadingState} role="status">
          <CircleDot size={22} strokeWidth={1.7} />
          <span>Preparing the sandbox</span>
        </div>
      ) : null}

      <div className={styles.canvasChrome}>
        <div className={`${styles.brand} ${styles.glassSurface}`}>
          <div
            className={styles.brandMark}
            aria-hidden="true"
            data-sand-brand-mark
          >
            <CircleDot size={19} strokeWidth={2.1} />
          </div>
          <h1>Falling Sand</h1>
        </div>
        <div
          className={`${styles.controlCluster} ${styles.glassSurface}`}
          data-sand-control-bar
        >
          <div
            className={`${styles.playbackControls} ${styles.glassSurface}`}
            aria-label="Playback controls"
          >
            <button
              type="button"
              onClick={onPausedToggle}
              aria-pressed={paused}
              title={paused ? "Resume simulation" : "Pause simulation"}
            >
              {paused ? (
                <Play size={18} strokeWidth={2.1} />
              ) : (
                <Pause size={18} strokeWidth={2.1} />
              )}
              <span>{paused ? "Play" : "Pause"}</span>
            </button>
            <div className={styles.speedDock} aria-label="Simulation speed">
              <Gauge size={17} strokeWidth={2.2} aria-hidden="true" />
              {SPEEDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={speed === value ? styles.speedActive : undefined}
                  onClick={() => onSpeedChange(value)}
                  aria-pressed={speed === value}
                  aria-label={`${value}× speed`}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>
          <div
            className={`${styles.actions} ${styles.glassSurface}`}
            aria-label="Creation controls"
          >
            <button type="button" onClick={onReset} title="Reset demo">
              <RotateCcw size={18} strokeWidth={2.1} />
              <span>Reset</span>
            </button>
            <button type="button" onClick={onClear} title="Clear world">
              <Trash2 size={18} strokeWidth={2.1} />
              <span>Clear</span>
            </button>
            <button type="button" onClick={onSave} title="Save creation">
              <Save size={18} strokeWidth={2.1} />
              <span>Save</span>
            </button>
            <button type="button" onClick={onLoad} title="Load creation">
              <FolderOpen size={18} strokeWidth={2.1} />
              <span>Load</span>
            </button>
            <button
              type="button"
              className={styles.exportButton}
              onClick={onExport}
              title="Download PNG"
            >
              <Camera size={18} strokeWidth={2.1} />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>

      {displayFrameRate ? (
        <div
          className={`${styles.fpsOverlay} ${styles.glassSurface}`}
          role="status"
        >
          {stats.fps || 0} FPS
        </div>
      ) : null}
      {showCanvasHint ? (
        <div className={styles.canvasHint}>
          <span>
            Draw with a pointer or touch. Scroll to resize. Right-click erases.
          </span>
          <button
            type="button"
            onClick={onHintDismiss}
            aria-label="Dismiss drawing tips"
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
