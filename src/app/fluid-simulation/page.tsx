"use client";

import {
  Download,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { downloadBlob } from "@/lib/canvasExport";

import { FluidEngine, type FluidEngineStats } from "./fluidEngine";
import styles from "./styles.module.css";

const DEFAULT_ITERATIONS = 24;
const DEFAULT_PARTICLES = 131_072;
const DEFAULT_FORCE = 1;

type CaptureState = "idle" | "capturing" | "saved" | "error";

type FluidSnapshot = {
  blob: Blob;
  fileName: string;
  imageSrc: string;
};

function subscribeToTouchCapability(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(pointer: coarse)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getTouchCapabilitySnapshot() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0
  );
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

const getShareUrlSnapshot = () => window.location.href;
const getServerShareUrlSnapshot = () => "";
const getServerTouchCapabilitySnapshot = () => false;

const makePhotoName = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `fluid-field-${timestamp}.png`;
};

export default function FluidSimulationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FluidEngine | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(true);
  const [solverIterations, setSolverIterations] = useState(DEFAULT_ITERATIONS);
  const [particleCount, setParticleCount] = useState(DEFAULT_PARTICLES);
  const [force, setForce] = useState(DEFAULT_FORCE);
  const [paused, setPaused] = useState(false);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [snapshot, setSnapshot] = useState<FluidSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FluidEngineStats | null>(null);
  const isTouchDevice = useSyncExternalStore(
    subscribeToTouchCapability,
    getTouchCapabilitySnapshot,
    getServerTouchCapabilitySnapshot,
  );
  const shareUrl = useSyncExternalStore(
    subscribeToLocation,
    getShareUrlSnapshot,
    getServerShareUrlSnapshot,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: FluidEngine;
    try {
      engine = new FluidEngine(canvas, {
        solverIterations: DEFAULT_ITERATIONS,
        particleCount: DEFAULT_PARTICLES,
        force: DEFAULT_FORCE,
        onStats: setStats,
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The GPU fluid engine could not start.";
      queueMicrotask(() => setError(message));
      return;
    }

    engineRef.current = engine;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      engine.resize(bounds.width, bounds.height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      engine.setPaused(true);
      queueMicrotask(() => setPaused(true));
    }

    engine.start();

    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  const handleIterations = (value: number) => {
    setSolverIterations(value);
    engineRef.current?.setSolverIterations(value);
  };

  const handleParticleCount = (value: number) => {
    setParticleCount(value);
    engineRef.current?.setParticleCount(value);
  };

  const handleForce = (value: number) => {
    setForce(value);
    engineRef.current?.setForce(value);
  };

  const togglePause = () => {
    setPaused((current) => {
      const next = !current;
      engineRef.current?.setPaused(next);
      return next;
    });
  };

  const createSnapshot = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || captureState === "capturing") return;

    setCaptureState("capturing");
    try {
      const blob = await engine.capture();
      const fileName = makePhotoName();
      const imageSrc = URL.createObjectURL(blob);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      previewUrlRef.current = imageSrc;
      setSnapshot({ blob, fileName, imageSrc });
      if (!isTouchDevice) {
        downloadBlob(blob, fileName);
      }
      setCaptureState("saved");
    } catch {
      setCaptureState("error");
    }

    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(
      () => setCaptureState("idle"),
      2_200,
    );
  }, [captureState, isTouchDevice]);

  const closePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSnapshot(null);
  }, []);

  const saveSnapshot = useCallback(async () => {
    if (!snapshot) return;

    try {
      const pngFile = new File([snapshot.blob], snapshot.fileName, {
        type: "image/png",
      });
      const canShareFile =
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [pngFile] });

      if (canShareFile) {
        await navigator.share({
          files: [pngFile],
          title: "Fluid Field",
          text: "Save this GPU fluid snapshot.",
        });
        return;
      }

      window.open(snapshot.imageSrc, "_blank", "noopener,noreferrer");
    } catch {}
  }, [snapshot]);

  const updatePointer = (
    event: React.PointerEvent<HTMLCanvasElement>,
    mode: "down" | "move",
  ) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    if (mode === "down") {
      event.currentTarget.setPointerCapture(event.pointerId);
      engineRef.current?.pointerDown(event.clientX, event.clientY, bounds);
    } else {
      engineRef.current?.pointerMove(event.clientX, event.clientY, bounds);
    }
  };

  const releasePointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    engineRef.current?.pointerUp();
  };

  const captureLabel =
    captureState === "capturing"
      ? "Preparing PNG"
      : captureState === "error"
        ? "Try Download Again"
        : "Download PNG";

  return (
    <>
      <main className={styles.root}>
        <h1 className={styles.srOnly}>GPU Fluid Field</h1>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label="Interactive GPU particle fluid. Drag across the canvas to stir the flow."
          onPointerDown={(event) => updatePointer(event, "down")}
          onPointerMove={(event) => updatePointer(event, "move")}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onContextMenu={(event) => event.preventDefault()}
        />

        {panelOpen ? (
          <aside className={styles.panel} aria-label="Fluid settings">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelTitle}>Fluid field</p>
                <p className={styles.performance}>
                  {error
                    ? "GPU unavailable"
                    : stats
                      ? `${stats.fps} FPS · ${stats.simulationWidth}×${stats.simulationHeight}`
                      : "Starting GPU solver"}
                </p>
              </div>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setPanelOpen(false)}
                aria-label="Close settings"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            {error ? (
              <p className={styles.errorMessage}>{error}</p>
            ) : (
              <>
                <div className={styles.controlGroup}>
                  <div className={styles.controlLabel}>
                    <label htmlFor="solver-iterations">Solver iterations</label>
                    <output htmlFor="solver-iterations">
                      {solverIterations}
                    </output>
                  </div>
                  <input
                    id="solver-iterations"
                    className={styles.range}
                    type="range"
                    min="4"
                    max="48"
                    step="1"
                    value={solverIterations}
                    onChange={(event) =>
                      handleIterations(Number(event.currentTarget.value))
                    }
                  />
                </div>

                <div className={styles.controlGroup}>
                  <div className={styles.controlLabel}>
                    <label htmlFor="force">Stroke force</label>
                    <output htmlFor="force">{force.toFixed(1)}</output>
                  </div>
                  <input
                    id="force"
                    className={styles.range}
                    type="range"
                    min="0.4"
                    max="2"
                    step="0.1"
                    value={force}
                    onChange={(event) =>
                      handleForce(Number(event.currentTarget.value))
                    }
                  />
                </div>

                <div className={styles.selectRow}>
                  <label htmlFor="particle-count">Particles</label>
                  <select
                    id="particle-count"
                    value={particleCount}
                    onChange={(event) =>
                      handleParticleCount(Number(event.currentTarget.value))
                    }
                  >
                    <option value={65_536}>65K</option>
                    <option value={131_072}>131K</option>
                    <option value={262_144}>262K</option>
                  </select>
                </div>

                <p className={styles.instruction}>
                  Drag anywhere to pull the current through the particles.
                </p>

                <button
                  type="button"
                  className={styles.photoButton}
                  onClick={createSnapshot}
                  disabled={captureState === "capturing"}
                >
                  <Download aria-hidden="true" />
                  <span>{captureLabel}</span>
                </button>

                <div className={styles.secondaryActions}>
                  <button
                    type="button"
                    onClick={() => engineRef.current?.reset()}
                  >
                    <RotateCcw aria-hidden="true" />
                    Reset
                  </button>
                  <button type="button" onClick={togglePause}>
                    {paused ? (
                      <Play aria-hidden="true" />
                    ) : (
                      <Pause aria-hidden="true" />
                    )}
                    {paused ? "Resume" : "Pause"}
                  </button>
                </div>
              </>
            )}

            <span className={styles.srOnly} aria-live="polite">
              {captureState === "saved"
                ? "Fluid PNG ready to download and share."
                : captureState === "error"
                  ? "The fluid PNG could not be prepared."
                  : ""}
            </span>
          </aside>
        ) : (
          <button
            type="button"
            className={styles.settingsButton}
            onClick={() => setPanelOpen(true)}
            aria-label="Open fluid settings"
          >
            <SlidersHorizontal aria-hidden="true" />
            <span>Settings</span>
          </button>
        )}
      </main>

      {snapshot ? (
        <ExportPreviewModal
          description={
            isTouchDevice
              ? "Save the PNG to your device or share Fluid Field with others."
              : "Your PNG downloaded automatically. Download it again or share Fluid Field."
          }
          emailBody="Shape your own GPU particle flow with Fluid Field:"
          emailSubject="Fluid Field snapshot"
          facebookHashtag="#FluidField"
          fileName={snapshot.fileName}
          imageAlt="Fluid Field particle snapshot"
          imageSrc={snapshot.imageSrc}
          isTouchDevice={isTouchDevice}
          onClose={closePreview}
          onSaveImage={saveSnapshot}
          shareHeading="Share Fluid Field"
          shareUrl={shareUrl}
          socialTitle="Shape a GPU particle flow with Fluid Field."
          title="Fluid snapshot"
        />
      ) : null}
    </>
  );
}
