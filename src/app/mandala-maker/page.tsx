"use client";

import { useRef, useEffect, useState } from "react";
import { Download, Trash2, Palette, Eye, EyeOff, Undo, Redo, Square, Maximize } from "lucide-react";

export default function MandalaMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#00ffea");
  const [segments, setSegments] = useState(12);
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isSquareCanvas, setIsSquareCanvas] = useState(false);

  // Undo/Redo History Stacks
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

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
    const side = Math.min(window.innerWidth - 32, window.innerHeight - 180, 750);
    const w = isSquareCanvas ? side : window.innerWidth;
    const h = isSquareCanvas ? side : window.innerHeight;

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
  }, [isSquareCanvas, windowSize]);

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

  const startDrawing = (e: React.PointerEvent) => {
    setIsDrawing(true);
    hasDrawnRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
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

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

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

      ctx.lineWidth = lineWidth;
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

  const download = () => {
    const link = document.createElement("a");
    link.download = "mandala.png";
    link.href = canvasRef.current?.toDataURL() || "";
    link.click();
  };

  return (
    <div className="min-h-screen bg-neutral-950 overflow-hidden font-sans relative touch-none flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={drawMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        className={`bg-black cursor-crosshair transition-all duration-300 ${
          isSquareCanvas
            ? "shadow-[0_0_50px_rgba(0,0,0,0.85)] border border-white/10 rounded-2xl relative"
            : "absolute inset-0"
        }`}
      />

      {/* Toggle UI Button */}
      <button
        onClick={() => setShowUI(!showUI)}
        className="absolute top-4 right-4 z-50 p-3 bg-gray-900/50 backdrop-blur-md text-white/50 hover:text-white hover:bg-gray-900/80 rounded-xl transition-all border border-white/10 shadow-lg cursor-pointer"
        title={showUI ? "Hide Controls" : "Show Controls"}
      >
        {showUI ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Controls */}
      <div
        className={`absolute top-0 left-0 w-full p-4 flex flex-wrap justify-center items-start gap-4 pointer-events-none transition-opacity duration-300 z-35 ${
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-gray-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap items-center gap-6 pointer-events-auto">
          {/* Layout Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 font-bold uppercase">
              Layout
            </label>
            <button
              onClick={() => setIsSquareCanvas(!isSquareCanvas)}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs ${
                isSquareCanvas
                  ? "bg-cyan-500 text-white shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
              title={isSquareCanvas ? "Fullscreen Canvas" : "Square Canvas"}
            >
              {isSquareCanvas ? <Maximize className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isSquareCanvas ? "Fullscreen" : "Square"}
              </span>
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 font-bold uppercase">
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

          <div className="flex flex-col gap-2 w-32">
            <label className="text-xs text-white/50 font-bold uppercase">
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

          <div className="flex flex-col gap-2 w-32">
            <label className="text-xs text-white/50 font-bold uppercase">
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

          <div className="h-8 w-px bg-white/10" />

          {/* Action buttons including Undo / Redo */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                canUndo
                  ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                  : "bg-white/5 text-white/25 cursor-not-allowed"
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                canRedo
                  ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                  : "bg-white/5 text-white/25 cursor-not-allowed"
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-5 h-5" />
            </button>

            <div className="h-8 w-px bg-white/10 mx-1" />

            <button
              onClick={clearCanvas}
              className="p-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Clear"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={download}
              className="p-3 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center pointer-events-none">
        <h1 className="text-white/20 text-4xl font-black uppercase tracking-[1em]">
          Mandala
        </h1>
      </div>
    </div>
  );
}
