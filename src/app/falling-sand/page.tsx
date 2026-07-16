"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion, useDragControls, useReducedMotion } from "framer-motion";
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
  GripHorizontal,
  Maximize2,
  Minimize2,
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
import {
  DRAWABLE_MATERIALS,
  MATERIAL_COUNT,
  Material,
  type SandWorldStats,
} from "./engine";
import styles from "./styles.module.css";

const STORAGE_KEY = "random-webs:falling-sand:world";
const MOBILE_VIEWPORT_QUERY = "(max-width: 720px)";

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
  [Material.DIRT]: Mountain,
  [Material.MUD]: Droplet,
  [Material.COAL]: Gem,
  [Material.METAL]: BrickWall,
  [Material.GLASS]: FlaskConical,
  [Material.SNOW]: Snowflake,
  [Material.METHANE]: Waves,
  [Material.TNT]: Bomb,
  [Material.NITRO]: FlaskConical,
  [Material.C4]: Bomb,
  [Material.FUSE]: Fuel,
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

function subscribeToMobileViewport(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMobileViewportSnapshot() {
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
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
const getServerMobileViewportSnapshot = () => false;

type ToastState = {
  message: string;
  tone: "success" | "error";
};

type PanelTab = "elements" | "settings" | "statistics";

type SettingToggleProps = {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
};

function SettingToggle({
  checked,
  description,
  label,
  onChange,
}: SettingToggleProps) {
  return (
    <label className={styles.settingToggle}>
      <span className={styles.settingCopy}>
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.toggleTrack} aria-hidden="true">
        <span />
      </span>
    </label>
  );
}

export default function FallingSandPage() {
  const reduceMotion = useReducedMotion();
  const canvasHandle = useRef<FallingSandCanvasHandle>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const toastTimer = useRef<number | null>(null);
  const [material, setMaterial] = useState(Material.SAND);
  const [brushSize, setBrushSize] = useState(5);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("elements");
  const [panelMinimizedOverride, setPanelMinimizedOverride] = useState<
    boolean | null
  >(null);
  const [ready, setReady] = useState(false);
  const [showCanvasHint, setShowCanvasHint] = useState(true);
  const [displayFrameRate, setDisplayFrameRate] = useState(false);
  const [rightClickErases, setRightClickErases] = useState(true);
  const [pauseWhileDrawing, setPauseWhileDrawing] = useState(false);
  const [autoPauseWhenHidden, setAutoPauseWhenHidden] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [snapshot, setSnapshot] = useState<FallingSandSnapshot | null>(null);
  const [stats, setStats] = useState<SandWorldStats>({
    cells: 0,
    active: 0,
    fps: 0,
    materialCounts: Array<number>(MATERIAL_COUNT).fill(0),
  });
  const simulationPaused = paused || Boolean(reduceMotion);
  const isTouchDevice = useSyncExternalStore(
    subscribeToTouchCapability,
    getTouchCapabilitySnapshot,
    getServerTouchCapabilitySnapshot,
  );
  const isMobileViewport = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );
  const shareUrl = useSyncExternalStore(
    subscribeToLocation,
    getShareUrlSnapshot,
    getServerShareUrlSnapshot,
  );
  const panelMinimized = panelMinimizedOverride ?? isMobileViewport;

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
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      if (event.code === "Space") {
        if (event.target instanceof HTMLButtonElement) return;
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

  useEffect(() => {
    if (!autoSave || !ready) return;
    const saveQuietly = () => {
      try {
        const serialized = canvasHandle.current?.serialize();
        if (serialized) localStorage.setItem(STORAGE_KEY, serialized);
      } catch {}
    };
    const interval = window.setInterval(saveQuietly, 15_000);
    return () => window.clearInterval(interval);
  }, [autoSave, ready]);

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

  const emptyCells = Math.max(0, stats.cells - stats.active);
  const coverage = stats.cells
    ? `${((stats.active / stats.cells) * 100).toFixed(1)}%`
    : "0.0%";
  const materialVariety = stats.materialCounts
    .slice(1)
    .filter((count) => count > 0).length;

  return (
    <>
      <main className={styles.root}>
        <div className={styles.workspace} ref={workspaceRef}>
          <section
            className={styles.worldPanel}
            aria-label="Falling sand world"
          >
            <FallingSandCanvas
              ref={canvasHandle}
              autoPauseWhenHidden={autoPauseWhenHidden}
              brushSize={brushSize}
              material={material}
              onBrushSizeChange={setBrushSize}
              pauseWhileDrawing={pauseWhileDrawing}
              paused={simulationPaused}
              rightClickErases={rightClickErases}
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
                    onClick={() => setPaused((current) => !current)}
                    aria-pressed={simulationPaused}
                    title={
                      simulationPaused
                        ? "Resume simulation"
                        : "Pause simulation"
                    }
                  >
                    {simulationPaused ? (
                      <Play size={18} strokeWidth={2.1} />
                    ) : (
                      <Pause size={18} strokeWidth={2.1} />
                    )}
                    <span>{simulationPaused ? "Play" : "Pause"}</span>
                  </button>

                  <div
                    className={styles.speedDock}
                    aria-label="Simulation speed"
                  >
                    <Gauge size={17} strokeWidth={2.2} aria-hidden="true" />
                    {[0.5, 1, 2, 4].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={
                          speed === value ? styles.speedActive : undefined
                        }
                        onClick={() => setSpeed(value)}
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
                  <button
                    type="button"
                    onClick={() => canvasHandle.current?.reset()}
                    title="Reset demo"
                  >
                    <RotateCcw size={18} strokeWidth={2.1} />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => canvasHandle.current?.clear()}
                    title="Clear world"
                  >
                    <Trash2 size={18} strokeWidth={2.1} />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveCreation}
                    title="Save creation"
                  >
                    <Save size={18} strokeWidth={2.1} />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={loadCreation}
                    title="Load creation"
                  >
                    <FolderOpen size={18} strokeWidth={2.1} />
                    <span>Load</span>
                  </button>
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={exportCreation}
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

          <motion.aside
            className={`${styles.controlPanel} ${styles.glassSurface} ${
              panelMinimized ? styles.panelMinimized : ""
            }`}
            aria-label="Sandbox tools"
            drag={isTouchDevice ? false : true}
            dragConstraints={workspaceRef}
            dragControls={dragControls}
            dragElastic={0}
            dragListener={false}
            dragMomentum={false}
          >
            <div
              className={styles.panelHeader}
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).closest("button")) return;
                dragControls.start(event);
              }}
            >
              <GripHorizontal size={19} strokeWidth={2.2} aria-hidden="true" />
              <span>Toolbox</span>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setPanelMinimizedOverride(!panelMinimized)}
                aria-expanded={!panelMinimized}
                aria-label={
                  panelMinimized
                    ? "Restore control panel"
                    : "Minimize control panel"
                }
                title={
                  panelMinimized
                    ? "Restore control panel"
                    : "Minimize control panel"
                }
              >
                {panelMinimized ? (
                  <Maximize2 size={17} strokeWidth={2.2} />
                ) : (
                  <Minimize2 size={17} strokeWidth={2.2} />
                )}
              </button>
            </div>

            {!panelMinimized ? (
              <>
                <div
                  className={styles.panelTabs}
                  role="tablist"
                  aria-label="Toolbox views"
                >
                  {(["elements", "settings", "statistics"] as PanelTab[]).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        aria-controls={`panel-${tab}`}
                        id={`tab-${tab}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab[0].toUpperCase() + tab.slice(1)}
                      </button>
                    ),
                  )}
                </div>

                <div className={styles.panelBody}>
                  {activeTab === "elements" ? (
                    <section
                      id="panel-elements"
                      role="tabpanel"
                      aria-labelledby="tab-elements"
                      className={styles.materialSection}
                    >
                      <div className={styles.sectionHeading}>
                        <div>
                          <h2>Elements</h2>
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
                              className={
                                selected ? styles.materialActive : undefined
                              }
                              onClick={() => setMaterial(item.id)}
                              aria-pressed={selected}
                              style={
                                {
                                  "--material-color": item.color,
                                } as React.CSSProperties
                              }
                              title={
                                item.shortcut
                                  ? `${item.name} (${item.shortcut})`
                                  : item.name
                              }
                            >
                              <span className={styles.materialIcon}>
                                <Icon size={21} strokeWidth={2.25} />
                              </span>
                              <span>{item.name}</span>
                              {item.shortcut ? (
                                <kbd>{item.shortcut}</kbd>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {activeTab === "settings" ? (
                    <section
                      id="panel-settings"
                      role="tabpanel"
                      aria-labelledby="tab-settings"
                      className={styles.physicsSection}
                    >
                      <div className={styles.settingsGroup}>
                        <h3>Drawing</h3>
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
                          onChange={(event) =>
                            setBrushSize(Number(event.target.value))
                          }
                        />
                        <SettingToggle
                          checked={rightClickErases}
                          description="Hold the secondary pointer button to erase."
                          label="Right-click erases"
                          onChange={setRightClickErases}
                        />
                        <SettingToggle
                          checked={pauseWhileDrawing}
                          description="Hold particles still until the stroke ends."
                          label="Pause while drawing"
                          onChange={setPauseWhileDrawing}
                        />
                      </div>

                      <div className={styles.settingsGroup}>
                        <h3>Display</h3>
                        <SettingToggle
                          checked={displayFrameRate}
                          description="Show live rendering performance on the canvas."
                          label="Display frame rate"
                          onChange={setDisplayFrameRate}
                        />
                        <SettingToggle
                          checked={showCanvasHint}
                          description="Keep the drawing instructions visible."
                          label="Drawing tips"
                          onChange={setShowCanvasHint}
                        />
                      </div>

                      <div className={styles.settingsGroup}>
                        <h3>Simulation</h3>
                        <SettingToggle
                          checked={autoPauseWhenHidden}
                          description="Stop physics when this browser tab is hidden."
                          label="Pause in background"
                          onChange={setAutoPauseWhenHidden}
                        />
                        <SettingToggle
                          checked={autoSave}
                          description="Store the current world every 15 seconds."
                          label="Auto-save world"
                          onChange={setAutoSave}
                        />
                      </div>
                    </section>
                  ) : null}

                  {activeTab === "statistics" ? (
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
                        <strong className={styles.readoutText}>
                          {selectedMaterial.name}
                        </strong>
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
                  ) : null}
                </div>
              </>
            ) : null}
          </motion.aside>
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
