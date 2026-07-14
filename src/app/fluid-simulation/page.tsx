"use client";

import {
  Download,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
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

import { FluidEngine } from "./fluidEngine";
import styles from "./styles.module.css";

const DEFAULT_ITERATIONS = 24;
const DEFAULT_PARTICLES = 262_144;
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
  return `fluid-simulation-${timestamp}.png`;
};

export default function FluidSimulationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<FluidEngine | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [solverIterations, setSolverIterations] = useState(DEFAULT_ITERATIONS);
  const [particleCount, setParticleCount] = useState(DEFAULT_PARTICLES);
  const [force, setForce] = useState(DEFAULT_FORCE);
  const [paused, setPaused] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [snapshot, setSnapshot] = useState<FluidSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.34;
    if (musicEnabled) {
      void audio.play().catch(() => {
        // Browsers can require the first pointer gesture before playing audio.
      });
    } else {
      audio.pause();
    }

    return () => audio.pause();
  }, [musicEnabled]);

  const startMusic = useCallback(() => {
    if (!musicEnabled) return;
    void audioRef.current?.play().catch(() => {});
  }, [musicEnabled]);

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

  const toggleMusic = () => {
    setMusicEnabled((current) => !current);
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
          title: "Fluid Simulation",
          text: "Save this fluid simulation snapshot.",
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
      startMusic();
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
        <h1 className={styles.srOnly}>Fluid Simulation</h1>
        <audio
          ref={audioRef}
          src="/fluid-simulation/ethereal.mp3"
          loop
          preload="auto"
        />
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
              <p className={styles.panelTitle}>Fluid Simulation</p>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setPanelOpen(false)}
                aria-label="Close settings"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            {!error ? (
              <div
                className={styles.utilityActions}
                aria-label="Simulation controls"
              >
                <button
                  type="button"
                  onClick={() => engineRef.current?.reset()}
                  aria-label="Reset simulation"
                  title="Reset simulation"
                >
                  <RotateCcw aria-hidden="true" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={togglePause}
                  aria-label={paused ? "Resume simulation" : "Pause simulation"}
                  aria-pressed={paused}
                  title={paused ? "Resume simulation" : "Pause simulation"}
                >
                  {paused ? (
                    <Play aria-hidden="true" />
                  ) : (
                    <Pause aria-hidden="true" />
                  )}
                  <span>{paused ? "Resume" : "Pause"}</span>
                </button>
                <button
                  type="button"
                  className={styles.musicButton}
                  onClick={toggleMusic}
                  aria-label={musicEnabled ? "Mute music" : "Play music"}
                  aria-pressed={musicEnabled}
                  title={musicEnabled ? "Mute music" : "Play music"}
                >
                  {musicEnabled ? (
                    <Volume2 aria-hidden="true" />
                  ) : (
                    <VolumeX aria-hidden="true" />
                  )}
                  <span>Music</span>
                </button>
              </div>
            ) : null}

            {error ? (
              <p className={styles.errorMessage}>{error}</p>
            ) : (
              <>
                <div className={styles.selectRow}>
                  <label htmlFor="particle-count">Particles</label>
                  <select
                    id="particle-count"
                    value={particleCount}
                    onChange={(event) =>
                      handleParticleCount(Number(event.currentTarget.value))
                    }
                  >
                    <option value={131_072}>131K</option>
                    <option value={262_144}>262K</option>
                    <option value={524_288}>524K</option>
                    <option value={1_048_576}>1.05M</option>
                  </select>
                </div>

                <div className={styles.controlGroup}>
                  <div className={styles.controlLabel}>
                    <label htmlFor="solver-iterations">Iterations</label>
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

                <button
                  type="button"
                  className={styles.photoButton}
                  onClick={createSnapshot}
                  disabled={captureState === "capturing"}
                >
                  <Download aria-hidden="true" />
                  <span>{captureLabel}</span>
                </button>
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
            onClick={() => {
              setPanelOpen(true);
              startMusic();
            }}
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
              ? "Save the PNG to your device or share Fluid Simulation with others."
              : "Your PNG downloaded automatically. Download it again or share Fluid Simulation."
          }
          emailBody="Shape your own particle flow with Fluid Simulation:"
          emailSubject="Fluid Simulation snapshot"
          facebookHashtag="#FluidSimulation"
          fileName={snapshot.fileName}
          imageAlt="Fluid Simulation particle snapshot"
          imageSrc={snapshot.imageSrc}
          isTouchDevice={isTouchDevice}
          onClose={closePreview}
          onSaveImage={saveSnapshot}
          shareHeading="Share Fluid Simulation"
          shareUrl={shareUrl}
          socialTitle="Shape a glowing particle flow with Fluid Simulation."
          title="Fluid Simulation snapshot"
        />
      ) : null}
    </>
  );
}
