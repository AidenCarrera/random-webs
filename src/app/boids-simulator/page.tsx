"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Pause,
  Play,
  RefreshCw,
  Shuffle,
} from "lucide-react";

import {
  BoidsCanvas,
  type BoidsCanvasHandle,
  type BoidsMetrics,
} from "./BoidsCanvas";
import {
  BOIDS_PRESET_DESCRIPTIONS,
  BOIDS_PRESETS,
  DEFAULT_BOIDS_SETTINGS,
  MAX_SEPARATION_FORCE,
  type BoidsPresetName,
  type BoidsSettings,
} from "./simulator";
import styles from "./boids-simulator.module.css";

type SliderControl = {
  key: keyof BoidsSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};

const CONTROLS: SliderControl[] = [
  {
    key: "count",
    label: "Population",
    min: 100,
    max: 3000,
    step: 100,
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    key: "movementAccuracy",
    label: "Movement accuracy",
    min: 16,
    max: 160,
    step: 8,
    format: (value) => value.toFixed(0),
  },
  {
    key: "boidVision",
    label: "Boid vision",
    min: 24,
    max: 140,
    step: 2,
    format: (value) => `${value}px`,
  },
  {
    key: "alignmentForce",
    label: "Alignment force",
    min: 0,
    max: 2.5,
    step: 0.05,
    format: (value) => value.toFixed(2),
  },
  {
    key: "cohesionForce",
    label: "Cohesion force",
    min: 0,
    max: 2,
    step: 0.05,
    format: (value) => value.toFixed(2),
  },
  {
    key: "separationForce",
    label: "Separation force",
    min: 0,
    max: MAX_SEPARATION_FORCE,
    step: 0.05,
    format: (value) => value.toFixed(2),
  },
  {
    key: "steeringForce",
    label: "Steering force",
    min: 0.01,
    max: 0.12,
    step: 0.002,
    format: (value) => value.toFixed(3),
  },
  {
    key: "minSpeed",
    label: "Min speed",
    min: 0.2,
    max: 10,
    step: 0.05,
    format: (value) => value.toFixed(2),
  },
  {
    key: "maxSpeed",
    label: "Max speed",
    min: 0.5,
    max: 10,
    step: 0.05,
    format: (value) => value.toFixed(2),
  },
];

export default function BoidsSimulatorPage() {
  const reduceMotion = useReducedMotion();
  const canvasHandle = useRef<BoidsCanvasHandle>(null);
  const [settings, setSettings] = useState(DEFAULT_BOIDS_SETTINGS);
  const [activePreset, setActivePreset] = useState<BoidsPresetName | null>(
    "Balanced",
  );
  const [paused, setPaused] = useState(() => Boolean(reduceMotion));
  const [trails, setTrails] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [metrics, setMetrics] = useState<BoidsMetrics>({
    fps: 60,
    neighbors: 0,
  });

  const handleMetrics = useCallback((nextMetrics: BoidsMetrics) => {
    setMetrics(nextMetrics);
  }, []);

  const choosePreset = (preset: BoidsPresetName) => {
    setActivePreset(preset);
    setSettings(BOIDS_PRESETS[preset]);
    canvasHandle.current?.reseed();
  };

  const updateSetting = (key: keyof BoidsSettings, value: number) => {
    setActivePreset(null);
    setSettings((current) => {
      const next = { ...current, [key]: value };
      if (key === "minSpeed" && value > current.maxSpeed) {
        next.maxSpeed = value;
      }
      if (key === "maxSpeed" && value < current.minSpeed) {
        next.minSpeed = value;
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((current) => !current);
      }
      if (event.key.toLowerCase() === "r") {
        canvasHandle.current?.reseed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className={styles.root}>
      <section className={styles.canvasShell} aria-label="Boids Simulator">
        <BoidsCanvas
          ref={canvasHandle}
          settings={settings}
          paused={paused}
          trails={trails}
          onMetrics={handleMetrics}
        />

        {showStats ? (
          <div className={styles.metrics} aria-label="Simulation metrics">
            <div>
              <span>Boids</span>
              <strong>{settings.count.toLocaleString("en-US")}</strong>
            </div>
            <div>
              <span>Neighbors</span>
              <strong>{metrics.neighbors}</strong>
            </div>
            <div>
              <span>Frame rate</span>
              <strong>{metrics.fps}</strong>
            </div>
          </div>
        ) : null}
      </section>

      <aside
        className={`${styles.panel} ${
          mobilePanelOpen ? styles.panelOpen : ""
        } ${panelCollapsed ? styles.panelCollapsed : ""}`}
        aria-label="Boids Simulator controls"
      >
        <button
          type="button"
          className={styles.panelToggle}
          onClick={() => setPanelCollapsed((current) => !current)}
          aria-label={panelCollapsed ? "Expand controls" : "Collapse controls"}
          aria-expanded={!panelCollapsed}
        >
          <ChevronRight aria-hidden="true" size={19} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          className={styles.panelHandle}
          onClick={() => setMobilePanelOpen((current) => !current)}
          aria-expanded={mobilePanelOpen}
        >
          <span>Boids Simulator</span>
          <ChevronDown aria-hidden="true" size={18} strokeWidth={1.8} />
        </button>

        <div className={styles.panelBody}>
          <div className={styles.panelTitle}>
            <h1>Boids Simulator</h1>
          </div>

          <section className={styles.actions}>
            <div className={styles.sectionHeading}>
              <h2>Controls</h2>
            </div>
            <p className={styles.interactionHint}>
              Left click to attract birds. Right click to repel birds. Space to
              pause.
            </p>
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? (
                <Play aria-hidden="true" size={15} fill="currentColor" />
              ) : (
                <Pause aria-hidden="true" size={15} fill="currentColor" />
              )}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => canvasHandle.current?.scatter()}
            >
              <Shuffle aria-hidden="true" size={15} strokeWidth={1.8} />
              Scatter
            </button>
            <button
              type="button"
              onClick={() => canvasHandle.current?.reseed()}
            >
              <RefreshCw aria-hidden="true" size={15} strokeWidth={1.8} />
              Reset
            </button>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => void canvasHandle.current?.snapshot()}
            >
              <Camera aria-hidden="true" size={15} strokeWidth={1.8} />
              Snapshot
            </button>
          </section>

          <section className={styles.presetSection}>
            <div className={styles.sectionHeading}>
              <h2>Presets</h2>
            </div>
            <div className={styles.presetRail}>
              {(Object.keys(BOIDS_PRESETS) as BoidsPresetName[]).map(
                (preset) => {
                  const selected = activePreset === preset;
                  return (
                    <button
                      type="button"
                      key={preset}
                      className={selected ? styles.presetActive : ""}
                      onClick={() => choosePreset(preset)}
                      aria-pressed={selected}
                    >
                      <span>{preset}</span>
                    </button>
                  );
                },
              )}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activePreset ?? "Custom"}
                className={styles.presetDescription}
                initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                {activePreset
                  ? BOIDS_PRESET_DESCRIPTIONS[activePreset]
                  : "A custom balance shaped by your parameter adjustments."}
              </motion.p>
            </AnimatePresence>
          </section>

          <section className={styles.rulesSection}>
            <div className={styles.sectionHeading}>
              <h2>Parameters</h2>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setSettings(DEFAULT_BOIDS_SETTINGS);
                  setActivePreset("Balanced");
                }}
              >
                Defaults
              </button>
            </div>
            <div className={styles.controlGrid}>
              {CONTROLS.map((control) => (
                <label className={styles.sliderControl} key={control.key}>
                  <span>{control.label}</span>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={settings[control.key]}
                    onChange={(event) =>
                      updateSetting(control.key, Number(event.target.value))
                    }
                    aria-label={control.label}
                  />
                  <output>{control.format(settings[control.key])}</output>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.renderingSection}>
            <div className={styles.sectionHeading}>
              <h2>Display</h2>
            </div>
            <div className={styles.switchGroup}>
              <div className={styles.switchRow}>
                <span>Boid trails</span>
                <button
                  type="button"
                  className={trails ? styles.switchActive : ""}
                  onClick={() => setTrails((current) => !current)}
                  aria-pressed={trails}
                  aria-label="Toggle boid trails"
                >
                  <span />
                </button>
              </div>
              <div className={styles.switchRow}>
                <span>Corner stats</span>
                <button
                  type="button"
                  className={showStats ? styles.switchActive : ""}
                  onClick={() => setShowStats((current) => !current)}
                  aria-pressed={showStats}
                  aria-label="Toggle corner stats"
                >
                  <span />
                </button>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </main>
  );
}
