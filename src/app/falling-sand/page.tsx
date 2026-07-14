"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useReducedMotion } from "framer-motion";
import {
  Bomb,
  BrickWall,
  Brush,
  Camera,
  CircleDot,
  Droplet,
  Eraser,
  Flame,
  FlaskConical,
  FolderOpen,
  Fuel,
  Gauge,
  Gem,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Save,
  Snowflake,
  Sprout,
  Trash2,
  TreePine,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";

import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { downloadBlob } from "@/lib/canvasExport";

import {
  FallingSandCanvas,
  type FallingSandCanvasHandle,
  type FallingSandSnapshot,
} from "./FallingSandCanvas";
import { DRAWABLE_MATERIALS, Material, type SandWorldStats } from "./engine";
import styles from "./styles.module.css";

const STORAGE_KEY = "random-webs:falling-sand:world";

const MATERIAL_ICONS: Record<Material, LucideIcon> = {
  [Material.EMPTY]: Eraser,
  [Material.SAND]: CircleDot,
  [Material.WATER]: Droplet,
  [Material.FIRE]: Flame,
  [Material.LAVA]: Mountain,
  [Material.PLANT]: Sprout,
  [Material.ACID]: FlaskConical,
  [Material.STONE]: BrickWall,
  [Material.WOOD]: TreePine,
  [Material.OIL]: Fuel,
  [Material.SALT]: Gem,
  [Material.GUNPOWDER]: Bomb,
  [Material.ICE]: Snowflake,
  [Material.SMOKE]: Flame,
  [Material.STEAM]: Waves,
};

const KEYBOARD_MATERIALS = new Map(
  DRAWABLE_MATERIALS.filter((material) => material.shortcut).map((material) => [
    material.shortcut.toLowerCase(),
    material.id,
  ]),
);

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

type ToastState = {
  message: string;
  tone: "success" | "error";
};

export default function FallingSandPage() {
  const reduceMotion = useReducedMotion();
  const canvasHandle = useRef<FallingSandCanvasHandle>(null);
  const toastTimer = useRef<number | null>(null);
  const [material, setMaterial] = useState(Material.SAND);
  const [brushSize, setBrushSize] = useState(5);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [showCanvasHint, setShowCanvasHint] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [snapshot, setSnapshot] = useState<FallingSandSnapshot | null>(null);
  const [stats, setStats] = useState<SandWorldStats>({
    cells: 0,
    active: 0,
    fps: 0,
  });
  const simulationPaused = paused || Boolean(reduceMotion);
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

  const selectedMaterial =
    DRAWABLE_MATERIALS.find((item) => item.id === material) ??
    DRAWABLE_MATERIALS[0];

  const showToast = useCallback((message: string, tone: ToastState["tone"]) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const closeSnapshot = useCallback(() => {
    setSnapshot((current) => {
      if (current) URL.revokeObjectURL(current.imageSrc);
      return null;
    });
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (snapshot) URL.revokeObjectURL(snapshot.imageSrc);
    },
    [snapshot],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLButtonElement
      ) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((current) => !current);
        return;
      }
      const nextMaterial = KEYBOARD_MATERIALS.get(event.key.toLowerCase());
      if (nextMaterial !== undefined) setMaterial(nextMaterial);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveCreation = () => {
    try {
      const serialized = canvasHandle.current?.serialize();
      if (!serialized) throw new Error("The sandbox is not ready yet.");
      localStorage.setItem(STORAGE_KEY, serialized);
      showToast("Creation saved in this browser.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save this world.",
        "error",
      );
    }
  };

  const loadCreation = () => {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        showToast("No saved creation was found on this device.", "error");
        return;
      }
      canvasHandle.current?.load(serialized);
      showToast("Saved creation loaded.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to load this world.",
        "error",
      );
    }
  };

  const exportCreation = async () => {
    try {
      const nextSnapshot = await canvasHandle.current?.snapshot();
      if (!nextSnapshot) throw new Error("The sandbox is not ready yet.");
      setSnapshot((current) => {
        if (current) URL.revokeObjectURL(current.imageSrc);
        return nextSnapshot;
      });
      if (!isTouchDevice) {
        downloadBlob(nextSnapshot.blob, nextSnapshot.fileName);
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to export this world.",
        "error",
      );
    }
  };

  const saveSnapshot = async () => {
    if (!snapshot) return;
    try {
      const file = new File([snapshot.blob], snapshot.fileName, {
        type: "image/png",
      });
      if (
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Falling Sand",
          text: "A world I made in Falling Sand.",
        });
        return;
      }
      window.open(snapshot.imageSrc, "_blank", "noopener,noreferrer");
    } catch {}
  };

  return (
    <>
      <main className={styles.root}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.brandMark} aria-hidden="true">
              <CircleDot size={18} strokeWidth={1.8} />
            </div>
            <div>
              <h1>Falling Sand</h1>
            </div>
          </div>

          <div className={styles.actions} aria-label="Creation controls">
            <button type="button" onClick={saveCreation} title="Save creation">
              <Save size={17} strokeWidth={1.8} />
              <span>Save</span>
            </button>
            <button type="button" onClick={loadCreation} title="Load creation">
              <FolderOpen size={17} strokeWidth={1.8} />
              <span>Load</span>
            </button>
            <button
              type="button"
              onClick={() => canvasHandle.current?.reset()}
              title="Reset demo"
            >
              <RotateCcw size={17} strokeWidth={1.8} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => canvasHandle.current?.clear()}
              title="Clear world"
            >
              <Trash2 size={17} strokeWidth={1.8} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              aria-pressed={simulationPaused}
              title={
                simulationPaused ? "Resume simulation" : "Pause simulation"
              }
            >
              {simulationPaused ? (
                <Play size={17} strokeWidth={1.8} />
              ) : (
                <Pause size={17} strokeWidth={1.8} />
              )}
              <span>{simulationPaused ? "Play" : "Pause"}</span>
            </button>
            <button
              type="button"
              className={styles.exportButton}
              onClick={exportCreation}
              title="Download PNG"
            >
              <Camera size={17} strokeWidth={1.8} />
              <span>Download PNG</span>
            </button>
          </div>
        </header>

        <div className={styles.workspace}>
          <section
            className={styles.worldPanel}
            aria-label="Falling sand world"
          >
            <FallingSandCanvas
              ref={canvasHandle}
              brushSize={brushSize}
              material={material}
              onBrushSizeChange={setBrushSize}
              paused={simulationPaused}
              speed={speed}
              onReady={() => setReady(true)}
              onStats={setStats}
            />

            {!ready ? (
              <div className={styles.loadingState} role="status">
                <CircleDot size={22} strokeWidth={1.7} />
                <span>Preparing the sandbox</span>
              </div>
            ) : null}

            {showCanvasHint ? (
              <div className={styles.canvasHint}>
                <span>
                  Draw with a pointer or touch. Scroll to resize. Right-click
                  erases.
                </span>
                <button
                  type="button"
                  onClick={() => setShowCanvasHint(false)}
                  aria-label="Dismiss drawing tips"
                >
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            ) : null}
          </section>

          <aside className={styles.controlPanel} aria-label="Sandbox tools">
            <section className={styles.materialSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <h2>Materials</h2>
                  <p>{selectedMaterial.description}</p>
                </div>
              </div>

              <div className={styles.materialGrid}>
                {DRAWABLE_MATERIALS.map((item) => {
                  const Icon = MATERIAL_ICONS[item.id];
                  const selected = item.id === material;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={selected ? styles.materialActive : undefined}
                      onClick={() => setMaterial(item.id)}
                      aria-pressed={selected}
                      title={
                        item.shortcut
                          ? `${item.name} (${item.shortcut})`
                          : item.name
                      }
                    >
                      <span
                        className={styles.materialIcon}
                        style={
                          {
                            "--material-color": item.color,
                          } as React.CSSProperties
                        }
                      >
                        <Icon size={21} strokeWidth={2.25} />
                      </span>
                      <span>{item.name}</span>
                      {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={styles.physicsSection}>
              <div className={styles.rangeHeading}>
                <label htmlFor="sand-brush-size">
                  <Brush size={18} strokeWidth={2.2} />
                  Brush size
                </label>
                <output htmlFor="sand-brush-size">{brushSize}</output>
              </div>
              <input
                id="sand-brush-size"
                className={styles.range}
                type="range"
                min="1"
                max="14"
                step="1"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
              />

              <div className={styles.speedControl}>
                <div className={styles.speedLabel}>
                  <Gauge size={18} strokeWidth={2.2} />
                  <span>Simulation speed</span>
                </div>
                <div className={styles.segmented}>
                  {[0.5, 1, 2].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={
                        speed === value ? styles.segmentActive : undefined
                      }
                      onClick={() => setSpeed(value)}
                      aria-pressed={speed === value}
                    >
                      {value}×
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className={styles.readout} aria-label="World statistics">
              <div>
                <span>Active cells</span>
                <strong>{stats.active.toLocaleString("en-US")}</strong>
              </div>
              <div>
                <span>World grid</span>
                <strong>{stats.cells.toLocaleString("en-US")}</strong>
              </div>
              <p>Space pauses. Number keys switch materials.</p>
            </section>
          </aside>
        </div>

        {toast ? (
          <div
            className={`${styles.toast} ${
              toast.tone === "error" ? styles.toastError : ""
            }`}
            role={toast.tone === "error" ? "alert" : "status"}
          >
            {toast.message}
          </div>
        ) : null}
      </main>

      {snapshot ? (
        <ExportPreviewModal
          description={
            isTouchDevice
              ? "Save the PNG to your device or share the simulator with friends."
              : "Your PNG downloaded automatically. Download it again or share the simulator."
          }
          emailBody="I made this world in the Falling Sand simulator:"
          emailSubject="My Falling Sand creation"
          facebookHashtag="#FallingSand"
          fileName={snapshot.fileName}
          imageAlt="Preview of a Falling Sand simulator creation"
          imageSrc={snapshot.imageSrc}
          isTouchDevice={isTouchDevice}
          onClose={closeSnapshot}
          onSaveImage={saveSnapshot}
          pixelatedPreview
          shareHeading="Share your world"
          shareUrl={shareUrl}
          socialTitle="I made this world in the Falling Sand simulator."
          title="Your pocket world"
        />
      ) : null}
    </>
  );
}
