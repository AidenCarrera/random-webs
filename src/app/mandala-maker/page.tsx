"use client";

import "./styles.css";
import { useRef, useEffect, useState } from "react";
import { Download, Trash2, Palette, Eye, EyeOff, Undo, Redo, Square, Maximize } from "lucide-react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { canvasToBlob, downloadCanvasPng } from "@/lib/canvasExport";

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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [canvasCssSize, setCanvasCssSize] = useState({ width: 1200, height: 800 });

  // Undo/Redo History Stacks
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const shouldUseSquareCanvas = isSquareCanvas || windowSize.width < 640;

  // For rainbow cycle
  const hueRef = useRef(0);

  const pushToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
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

  const undo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      restoreHistoryState();
    }
  };

  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      restoreHistoryState();
    }
  };

  const restoreHistoryState = () => {
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
  };

  // Sync window resize dimensions state
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    setIsTouchDevice(
      window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0,
    );
    setShareUrl(window.location.href);

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle canvas sizing and history backups on window sizing or layout toggle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate dimensions
    const mobileChromeOffset = windowSize.width < 640 ? 156 : 180;
    const side = Math.max(
      240,
      Math.min(window.innerWidth - 16, window.innerHeight - mobileChromeOffset, 750),
    );
    const cssWidth = shouldUseSquareCanvas ? side : window.innerWidth;
    const cssHeight = shouldUseSquareCanvas ? side : window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.round(cssWidth * pixelRatio);
    const h = Math.round(cssHeight * pixelRatio);
    setCanvasCssSize({ width: cssWidth, height: cssHeight });

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
  }, [shouldUseSquareCanvas, windowSize]);

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
  }, []);

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
      const fileName = "mandala.png";
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewImage(dataUrl);

      if (!isTouchDevice) {
        await downloadCanvasPng(canvas, fileName);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen touch-none items-center justify-center overflow-hidden bg-neutral-950 px-2 py-32 font-sans sm:p-0">
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={drawMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        className={`cursor-crosshair bg-black transition-[border-color,border-radius,box-shadow] duration-300 ${
          shouldUseSquareCanvas
            ? "shadow-[0_0_50px_rgba(0,0,0,0.85)] border border-white/10 rounded-2xl relative"
            : "absolute inset-0"
        }`}
        style={{
          width: shouldUseSquareCanvas ? canvasCssSize.width : "100%",
          height: shouldUseSquareCanvas ? canvasCssSize.height : "100%",
        }}
      />

      {/* Toggle UI Button */}
      <button
        onClick={() => setShowUI(!showUI)}
        className={`absolute right-3 top-3 z-10 rounded-xl border border-white/10 bg-gray-900/50 p-2.5 text-white/50 shadow-lg backdrop-blur-md transition-all hover:bg-gray-900/80 hover:text-white sm:right-4 sm:top-4 sm:flex sm:p-3 ${
          showUI ? "hidden" : "flex"
        }`}
        title={showUI ? "Hide Controls" : "Show Controls"}
      >
        {showUI ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Controls */}
      <div
        className={`pointer-events-none absolute left-0 top-0 z-10 flex w-full flex-wrap items-start justify-center gap-2 p-2 transition-opacity duration-300 sm:gap-4 sm:p-4 ${
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="pointer-events-auto flex max-w-[calc(100vw-4rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gray-900/80 p-2 shadow-2xl backdrop-blur-xl sm:max-w-none sm:gap-6 sm:p-4">
          {/* Layout Toggle */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className="text-[10px] font-bold uppercase text-white/50 sm:text-xs">
              Layout
            </label>
            <button
              onClick={() => setIsSquareCanvas(!isSquareCanvas)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg p-2 text-xs font-bold transition-colors ${
                shouldUseSquareCanvas
                  ? "bg-cyan-500 text-white shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
              title={shouldUseSquareCanvas ? "Fullscreen Canvas" : "Square Canvas"}
            >
              {shouldUseSquareCanvas ? <Maximize className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {shouldUseSquareCanvas ? "Fullscreen" : "Square"}
              </span>
            </button>
          </div>

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className="text-[10px] font-bold uppercase text-white/50 sm:text-xs">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setRainbowMode(false);
                }}
                className="color-picker-input"
              />
              <button
                onClick={() => setRainbowMode(!rainbowMode)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  rainbowMode
                    ? "bg-linear-to-r from-red-500 via-green-500 to-blue-500 text-white"
                    : "bg-white/10 text-white/50 hover:bg-white/15"
                }`}
                title="Rainbow Mode"
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex w-24 flex-col gap-1.5 sm:w-32 sm:gap-2">
            <label className="text-[10px] font-bold uppercase text-white/50 sm:text-xs">
              Segments: {segments}
            </label>
            <input
              type="range"
              min="2"
              max="32"
              step="1"
              value={segments}
              onChange={(e) => setSegments(parseInt(e.target.value))}
              className="mandala-slider"
            />
          </div>

          <div className="flex w-24 flex-col gap-1.5 sm:w-32 sm:gap-2">
            <label className="text-[10px] font-bold uppercase text-white/50 sm:text-xs">
              Size: {lineWidth}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="mandala-slider"
            />
          </div>

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          {/* Action buttons including Undo / Redo */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`cursor-pointer rounded-xl p-2.5 transition-all sm:p-3 ${
                canUndo
                  ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                  : "bg-white/5 text-white/25 cursor-not-allowed"
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`cursor-pointer rounded-xl p-2.5 transition-all sm:p-3 ${
                canRedo
                  ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                  : "bg-white/5 text-white/25 cursor-not-allowed"
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="mx-0.5 h-8 w-px bg-white/10 sm:mx-1" />

            <button
              onClick={clearCanvas}
              className="cursor-pointer rounded-xl bg-red-500/20 p-2.5 text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-95 sm:p-3"
              title="Clear"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={exportToPNG}
              disabled={isSaving}
              className="cursor-pointer rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400 transition-all hover:bg-cyan-500 hover:text-white active:scale-95 disabled:cursor-wait disabled:opacity-60 sm:p-3"
              title="Download"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => setShowUI(false)}
              className="cursor-pointer rounded-xl bg-white/10 p-2.5 text-white/60 transition-all hover:bg-white/20 hover:text-white active:scale-95 sm:hidden"
              title="Hide Controls"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 hidden w-full text-center sm:block">
        <h1 className="text-4xl font-black uppercase tracking-[1em] text-white/20">
          Mandala
        </h1>
      </div>

      {previewImage ? (
        <ExportPreviewModal
          description="Your PNG downloaded automatically. You can also save it manually or share it here."
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
          title="Mandala snapshot"
        />
      ) : null}
    </div>
  );
}
