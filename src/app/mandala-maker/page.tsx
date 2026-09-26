"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Download,
  Trash2,
  Palette,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Asterisk,
  Square,
  Maximize,
} from "lucide-react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { canvasToBlob } from "@/lib/canvasExport";

import styles from "./styles.module.css";

function subscribeToViewport(onStoreChange: () => void) {
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

const getViewportSnapshot = () => `${window.innerWidth}:${window.innerHeight}`;
const getServerViewportSnapshot = () => "1200:800";

function subscribeToTouchCapability(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(pointer: coarse)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

const getTouchCapabilitySnapshot = () =>
  window.matchMedia("(pointer: coarse)").matches ||
  navigator.maxTouchPoints > 0;
const getServerTouchCapabilitySnapshot = () => false;

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

export default function MandalaMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#00ffea");
  const [segments, setSegments] = useState(12);
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isSquareCanvas, setIsSquareCanvas] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isTouchDevice = useSyncExternalStore(
    subscribeToTouchCapability,
    getTouchCapabilitySnapshot,
    getServerTouchCapabilitySnapshot,
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const shareUrl = useSyncExternalStore(
    subscribeToLocation,
    getShareUrlSnapshot,
    getServerShareUrlSnapshot,
  );

  // Undo/Redo History Stacks
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const viewportSnapshot = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    getServerViewportSnapshot,
  );
  const [viewportWidth, viewportHeight] = viewportSnapshot
    .split(":")
    .map(Number);
  const isMobileViewport =
    viewportWidth < 768 || (isTouchDevice && viewportHeight <= 500);
  const shouldUseSquareCanvas = isSquareCanvas && !isMobileViewport;

  // Switching to square crops the drawing, so ask first.
  const [isConfirmingSquare, setIsConfirmingSquare] = useState(false);
  const showSquareConfirm =
    isConfirmingSquare && showUI && !isMobileViewport && !isSquareCanvas;

  useEffect(() => {
    if (!showSquareConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsConfirmingSquare(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSquareConfirm]);
  const squareSide = Math.max(
    240,
    Math.min(viewportWidth - 16, viewportHeight - 180, 750),
  );
  const canvasCssWidth = shouldUseSquareCanvas ? squareSide : viewportWidth;
  const canvasCssHeight = shouldUseSquareCanvas ? squareSide : viewportHeight;

  // For rainbow cycle
  const hueRef = useRef(0);

  const pushToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanHistory = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );
    const snapshot = canvas.toDataURL();

    cleanHistory.push(snapshot);
    if (cleanHistory.length > 50) {
      cleanHistory.shift();
    }

    historyRef.current = cleanHistory;
    historyIndexRef.current = cleanHistory.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  const restoreHistoryState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataUrl = historyRef.current[historyIndexRef.current];
    if (!dataUrl) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    };
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      restoreHistoryState();
    }
  }, [restoreHistoryState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      restoreHistoryState();
    }
  }, [restoreHistoryState]);

  // Handle canvas sizing and history backups on window sizing or layout toggle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate dimensions
    const cssWidth = canvasCssWidth;
    const cssHeight = canvasCssHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.round(cssWidth * pixelRatio);
    const h = Math.round(cssHeight * pixelRatio);
    // Copy current state if it exists
    const tempUrl = canvas.toDataURL();
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    if (historyRef.current[historyIndexRef.current]) {
      const img = new Image();
      img.src = tempUrl;
      img.onload = () => {
        // Redraw old content centered inside the new canvas size
        ctx.drawImage(img, (w - oldWidth) / 2, (h - oldHeight) / 2);
        // Replace current index snapshot with the new, resized image to keep undo/redo clean
        historyRef.current[historyIndexRef.current] = canvas.toDataURL();
      };
    } else {
      // First clean state
      historyRef.current = [canvas.toDataURL()];
      historyIndexRef.current = 0;
      setCanUndo(false);
    }
  }, [canvasCssHeight, canvasCssWidth]);

  // Keyboard shortcut listener (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  // Drawing Implementation with Ref for coordinates
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasDrawnRef = useRef(false);

  const getCanvasPoint = (e: React.PointerEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    setIsDrawing(true);
    hasDrawnRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    lastPos.current = getCanvasPoint(e, canvas);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      if (hasDrawnRef.current) {
        pushToHistory();
      }
    }
  };

  const drawMove = (e: React.PointerEvent) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getCanvasPoint(e, canvas);
    const currentX = currentPoint.x;
    const currentY = currentPoint.y;
    const strokeScale = canvas.width / canvas.getBoundingClientRect().width;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw all segments
    const angleStep = (Math.PI * 2) / segments;

    ctx.save();
    ctx.translate(centerX, centerY);

    for (let i = 0; i < segments; i++) {
      ctx.rotate(angleStep);

      // Draw the segment line relative to center
      ctx.beginPath();
      // Move to PREV pos relative to center
      ctx.moveTo(lastPos.current.x - centerX, lastPos.current.y - centerY);
      // Line to CURRENT pos relative to center
      ctx.lineTo(currentX - centerX, currentY - centerY);

      ctx.lineWidth = lineWidth * strokeScale;
      ctx.lineCap = "round";
      ctx.strokeStyle = rainbowMode
        ? `hsl(${hueRef.current}, 100%, 50%)`
        : color;
      ctx.stroke();
    }

    ctx.restore();

    hasDrawnRef.current = true;
    if (rainbowMode) hueRef.current = (hueRef.current + 1) % 360;

    lastPos.current = { x: currentX, y: currentY };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushToHistory();
  };

  const exportToPNG = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewImage(dataUrl);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main
      className={`${styles.root} mandala-page relative flex h-dvh w-full items-center justify-center overflow-hidden bg-neutral-950 font-sans`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={drawMove}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onPointerLeave={stopDrawing}
        className={`touch-none cursor-crosshair bg-black transition-[border-color,border-radius,box-shadow] duration-300 ${
          shouldUseSquareCanvas
            ? "shadow-[0_0_50px_rgba(0,0,0,0.85)] border border-white/10 rounded-2xl relative"
            : "absolute inset-0"
        }`}
        style={{
          width: shouldUseSquareCanvas ? canvasCssWidth : "100%",
          height: shouldUseSquareCanvas ? canvasCssHeight : "100%",
        }}
      />

      {/* Show controls again once hidden */}
      <ToolButton
        onClick={() => setShowUI(true)}
        className={`absolute right-3 top-3 z-10 border border-white/10 bg-[#0a0e13]/80 shadow-lg backdrop-blur-xl transition-opacity duration-300 sm:right-4 sm:top-4 ${
          showUI ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        title="Show Controls"
        aria-label="Show controls"
        aria-pressed={showUI}
        tabIndex={showUI ? -1 : 0}
      >
        <Eye className="h-4 w-4" />
      </ToolButton>

      {/* Controls */}
      <div
        className={`mandala-controls-viewport pointer-events-none absolute left-0 top-0 z-10 flex w-full items-start justify-center p-2 transition-[opacity,translate] duration-300 sm:p-4 ${
          showUI
            ? "mandala-controls-visible translate-y-0 opacity-100"
            : "-translate-y-3 opacity-0"
        }`}
        inert={!showUI}
      >
        <div
          className={`mandala-controls flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#0a0e13]/85 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:max-w-[calc(100vw-2rem)] ${
            showUI ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          {/* Brush: layout + color */}
          <div className="flex items-center gap-1">
            <div className="mandala-layout-control relative flex items-center gap-1">
              <ToolButton
                onClick={() => {
                  if (isSquareCanvas) {
                    setIsSquareCanvas(false);
                  } else {
                    setIsConfirmingSquare(!isConfirmingSquare);
                  }
                }}
                tone={
                  shouldUseSquareCanvas || showSquareConfirm
                    ? "active"
                    : "default"
                }
                aria-label={
                  shouldUseSquareCanvas
                    ? "Use fullscreen canvas"
                    : "Use square canvas"
                }
                aria-pressed={shouldUseSquareCanvas}
                aria-expanded={
                  shouldUseSquareCanvas ? undefined : showSquareConfirm
                }
                title={
                  shouldUseSquareCanvas ? "Fullscreen Canvas" : "Square Canvas"
                }
              >
                {shouldUseSquareCanvas ? (
                  <Maximize className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </ToolButton>
              <Divider />

              {showSquareConfirm ? (
                <div
                  role="alertdialog"
                  aria-labelledby="square-confirm-title"
                  aria-describedby="square-confirm-body"
                  className="animate-in fade-in slide-in-from-top-4 absolute left-0 top-full mt-3 w-64 rounded-xl border border-white/10 bg-[#0a0e13]/95 p-3 text-left shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl duration-300"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 left-3.5 h-3 w-3 rotate-45 border-l border-t border-white/10 bg-[#0a0e13]"
                  />
                  <p
                    id="square-confirm-title"
                    className="text-sm font-medium text-white"
                  >
                    Switch to a square canvas?
                  </p>
                  <p
                    id="square-confirm-body"
                    className="mt-1 text-xs leading-relaxed text-white/55"
                  >
                    Anything drawn outside the square will be cropped away.
                  </p>
                  <div className="mt-3 flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingSquare(false)}
                      className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      autoFocus
                      onClick={() => {
                        setIsSquareCanvas(true);
                        setIsConfirmingSquare(false);
                      }}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Make it square
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setRainbowMode(false);
              }}
              className={`color-picker-input ${rainbowMode ? "opacity-40" : ""}`}
              aria-label="Brush color"
              title="Brush Color"
            />
            <ToolButton
              onClick={() => setRainbowMode(!rainbowMode)}
              tone={rainbowMode ? "rainbow" : "default"}
              aria-label="Toggle rainbow mode"
              aria-pressed={rainbowMode}
              title="Rainbow Mode"
            >
              <Palette className="h-4 w-4" />
            </ToolButton>
          </div>

          <Divider className="hidden md:block" />

          {/* Stroke shape */}
          <div className="flex items-center gap-1.5 max-md:order-first max-md:w-full max-md:justify-center">
            <SliderField
              label="Segments"
              icon={<Asterisk className="h-4 w-4" />}
              value={segments}
              min={2}
              max={32}
              onChange={setSegments}
            />
            <SliderField
              label="Size"
              icon={
                <span
                  aria-hidden="true"
                  className="flex h-4 w-4 items-center justify-center"
                >
                  <span
                    className="block rounded-full transition-[width,height] duration-150"
                    style={{
                      width: Math.max(3, Math.min(16, lineWidth / 2 + 2)),
                      height: Math.max(3, Math.min(16, lineWidth / 2 + 2)),
                      background: rainbowMode
                        ? "conic-gradient(#f43f5e,#facc15,#22c55e,#3b82f6,#a855f7,#f43f5e)"
                        : color,
                      boxShadow: `0 0 8px ${rainbowMode ? "#a855f7" : color}`,
                    }}
                  />
                </span>
              }
              iconAlways
              value={lineWidth}
              min={1}
              max={50}
              onChange={setLineWidth}
            />
          </div>

          <Divider className="hidden md:block" />

          {/* History + output */}
          <div className="flex items-center gap-1">
            <ToolButton
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </ToolButton>

            <Divider />

            <ToolButton
              onClick={clearCanvas}
              tone="danger"
              title="Clear"
              aria-label="Clear"
            >
              <Trash2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
              onClick={exportToPNG}
              disabled={isSaving}
              tone="primary"
              title="Download"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
              <span className="hidden text-sm sm:inline">Save</span>
            </ToolButton>
            <ToolButton
              onClick={() => setShowUI(false)}
              title="Hide Controls"
              aria-label="Hide controls"
            >
              <EyeOff className="h-4 w-4" />
            </ToolButton>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 hidden w-full text-center sm:block">
        <h1 className="pl-[1em] text-3xl font-extralight uppercase tracking-[1em] text-white/20 [text-shadow:0_0_24px_rgba(0,255,234,0.25)]">
          Mandala
        </h1>
      </div>

      {previewImage ? (
        <ExportPreviewModal
          description="Download the current mandala as an image or share it directly."
          fileName="mandala.png"
          imageAlt="Mandala export preview"
          imageSrc={previewImage}
          isTouchDevice={isTouchDevice}
          onClose={() => setPreviewImage(null)}
          onSaveImage={async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            try {
              const blob = await canvasToBlob(canvas);
              const pngFile = new File([blob], "mandala.png", {
                type: "image/png",
              });
              const canShareFile =
                typeof navigator !== "undefined" &&
                "share" in navigator &&
                "canShare" in navigator &&
                navigator.canShare({ files: [pngFile] });

              if (canShareFile) {
                await navigator.share({
                  files: [pngFile],
                  title: "Mandala Maker",
                  text: "Sharing this mandala.",
                });
                return;
              }

              window.open(previewImage, "_blank", "noopener,noreferrer");
            } catch {}
          }}
          shareHeading="Share your mandala"
          shareUrl={shareUrl}
          title="Mandala Snapshot"
        />
      ) : null}
    </main>
  );
}

const toolButtonTones = {
  default: "text-white/65 hover:bg-white/10 hover:text-white",
  active:
    "bg-cyan-400/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/30 hover:bg-cyan-400/20",
  rainbow: "bg-linear-to-r from-red-500 via-green-500 to-blue-500 text-white",
  danger: "text-white/65 hover:bg-red-500/15 hover:text-red-400",
  primary:
    "bg-white/[0.06] px-3 font-medium text-white/85 ring-1 ring-inset ring-white/10 hover:bg-white/12 hover:text-white",
};

function ToolButton({
  tone = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: keyof typeof toolButtonTones;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl transition-[background-color,color,opacity,scale] active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${toolButtonTones[tone]} ${className}`}
      {...props}
    />
  );
}

function Divider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`mx-0.5 h-6 w-px shrink-0 bg-white/10 ${className}`}
    />
  );
}

function SliderField({
  label,
  icon,
  iconAlways = false,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  iconAlways?: boolean;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex h-10 items-center gap-2.5 rounded-xl bg-white/4 pl-3 pr-2.5 ring-1 ring-inset ring-white/6">
      <span className={`text-white/50 ${iconAlways ? "" : "lg:hidden"}`}>
        {icon}
      </span>
      <span className="mandala-field-label hidden text-[11px] font-medium uppercase tracking-[0.12em] text-white/45 lg:inline">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="mandala-slider w-20 sm:w-24 xl:w-28"
        aria-label={label}
        style={
          {
            "--fill": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
      <output className="w-5 text-right text-sm font-medium tabular-nums text-white/90">
        {value}
      </output>
    </div>
  );
}
