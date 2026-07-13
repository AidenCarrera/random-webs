"use client";

import "./styles.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eraser,
  Grid3X3,
  PaintBucket,
  Pencil,
  Pipette,
  Redo,
  Trash2,
  Undo,
} from "lucide-react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { canvasToBlob, downloadCanvasPng } from "@/lib/canvasExport";

const DEFAULT_SIZE = 32;
const MOBILE_DEFAULT_SIZE = 16;
const DEFAULT_COLOR = "#fff1e8";
const COLORS = [
  "#000000",
  "#ffffff",
  "#595652",
  "#696a6a",
  "#847e87",
  "#9badb7",
  "#cbdbfc",
  "#222034",
  "#3f3f74",
  "#306082",
  "#5b6ee1",
  "#639bff",
  "#5fcde4",
  "#323c39",
  "#4b692f",
  "#37946e",
  "#6abe30",
  "#99e550",
  "#fbf236",
  "#524b24",
  "#8a6f30",
  "#8f974a",
  "#d9a066",
  "#eec39a",
  "#663931",
  "#8f563b",
  "#df7126",
  "#ac3232",
  "#d95763",
  "#45283c",
  "#d77bba",
  "#76428a",
];

type Tool = "pencil" | "eraser" | "fill" | "picker";

const createEmptyGrid = (size: number) =>
  Array(size * size).fill(DEFAULT_COLOR);
const createFileName = (size: number) => `pixel-art-${size}x${size}.png`;

const isDefaultColor = (color: string) =>
  color.toLowerCase() === DEFAULT_COLOR.toLowerCase();

export default function PixelArt() {
  const [gridSize, setGridSize] = useState(DEFAULT_SIZE);
  const [grid, setGrid] = useState<string[]>(createEmptyGrid(DEFAULT_SIZE));
  const [history, setHistory] = useState<string[][]>([
    createEmptyGrid(DEFAULT_SIZE),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [activeTool, setActiveTool] = useState<Tool>("pencil");
  const [showGrid, setShowGrid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState(
    createFileName(DEFAULT_SIZE),
  );
  const [shareUrl, setShareUrl] = useState("");

  const gridRef = useRef(grid);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastDrawnIndexRef = useRef<number | null>(null);
  const pointerToolRef = useRef<Tool>("pencil");

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isMobilePointer =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;

    const frame = requestAnimationFrame(() => {
      setIsTouchDevice(isMobilePointer);
      setShareUrl(window.location.href);

      if (isMobilePointer) {
        const nextGrid = createEmptyGrid(MOBILE_DEFAULT_SIZE);
        gridRef.current = nextGrid;
        historyRef.current = [nextGrid];
        historyIndexRef.current = 0;
        lastDrawnIndexRef.current = null;

        setGridSize(MOBILE_DEFAULT_SIZE);
        setGrid(nextGrid);
        setHistory([nextGrid]);
        setHistoryIndex(0);
        setPreviewFileName(createFileName(MOBILE_DEFAULT_SIZE));
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const updateGrid = useCallback((nextGrid: string[]) => {
    const nextHistory = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );
    nextHistory.push(nextGrid);
    if (nextHistory.length > 50) {
      nextHistory.shift();
    }

    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    gridRef.current = nextGrid;

    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setGrid(nextGrid);
  }, []);

  const commitCurrentGrid = useCallback(() => {
    const snapshot = historyRef.current[historyIndexRef.current];
    const current = gridRef.current;

    if (JSON.stringify(current) !== JSON.stringify(snapshot)) {
      updateGrid([...current]);
    }
  }, [updateGrid]);

  useEffect(() => {
    const stopDrawing = () => {
      if (!isDrawingRef.current) {
        return;
      }

      isDrawingRef.current = false;
      lastDrawnIndexRef.current = null;
      commitCurrentGrid();
    };

    window.addEventListener("pointerup", stopDrawing);
    window.addEventListener("pointercancel", stopDrawing);

    return () => {
      window.removeEventListener("pointerup", stopDrawing);
      window.removeEventListener("pointercancel", stopDrawing);
    };
  }, [commitCurrentGrid]);

  const undo = () => {
    if (historyIndexRef.current <= 0) {
      return;
    }

    const nextIndex = historyIndexRef.current - 1;
    const nextGrid = historyRef.current[nextIndex];

    historyIndexRef.current = nextIndex;
    gridRef.current = nextGrid;

    setHistoryIndex(nextIndex);
    setGrid(nextGrid);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }

    const nextIndex = historyIndexRef.current + 1;
    const nextGrid = historyRef.current[nextIndex];

    historyIndexRef.current = nextIndex;
    gridRef.current = nextGrid;

    setHistoryIndex(nextIndex);
    setGrid(nextGrid);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
          return;
        }

        undo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const floodFill = (
    startIndex: number,
    targetColor: string,
    replacementColor: string,
  ) => {
    if (targetColor === replacementColor) {
      return;
    }

    const nextGrid = [...gridRef.current];
    const queue: number[] = [startIndex];
    const visited = new Set([startIndex]);

    while (queue.length > 0) {
      const currentIndex = queue.shift();
      if (currentIndex === undefined) {
        break;
      }

      nextGrid[currentIndex] = replacementColor;

      const x = currentIndex % gridSize;
      const y = Math.floor(currentIndex / gridSize);
      const neighbors = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const { dx, dy } of neighbors) {
        const nextX = x + dx;
        const nextY = y + dy;

        if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) {
          continue;
        }

        const neighborIndex = nextY * gridSize + nextX;
        if (
          !visited.has(neighborIndex) &&
          nextGrid[neighborIndex] === targetColor
        ) {
          visited.add(neighborIndex);
          queue.push(neighborIndex);
        }
      }
    }

    updateGrid(nextGrid);
  };

  const handleInteraction = (
    index: number,
    isClick: boolean,
    toolOverride?: Tool,
  ) => {
    const tool = toolOverride ?? activeTool;

    if (tool === "fill" && isClick) {
      floodFill(index, gridRef.current[index], selectedColor);
      return;
    }

    if (tool === "picker" && isClick) {
      setSelectedColor(gridRef.current[index]);
      setActiveTool("pencil");
      return;
    }

    if (tool !== "pencil" && tool !== "eraser") {
      return;
    }

    const nextColor = tool === "eraser" ? DEFAULT_COLOR : selectedColor;
    if (gridRef.current[index] === nextColor) {
      return;
    }

    const nextGrid = [...gridRef.current];
    nextGrid[index] = nextColor;
    gridRef.current = nextGrid;
    setGrid(nextGrid);
  };

  const drawInterpolatedLine = (
    fromIndex: number,
    toIndex: number,
    tool: Tool,
  ) => {
    if (tool !== "pencil" && tool !== "eraser") {
      handleInteraction(toIndex, false, tool);
      return;
    }

    const startX = fromIndex % gridSize;
    const startY = Math.floor(fromIndex / gridSize);
    const endX = toIndex % gridSize;
    const endY = Math.floor(toIndex / gridSize);
    const nextColor = tool === "eraser" ? DEFAULT_COLOR : selectedColor;
    const nextGrid = [...gridRef.current];

    let x = startX;
    let y = startY;
    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);
    const stepX = startX < endX ? 1 : -1;
    const stepY = startY < endY ? 1 : -1;
    let error = deltaX - deltaY;

    while (true) {
      nextGrid[y * gridSize + x] = nextColor;

      if (x === endX && y === endY) {
        break;
      }

      const doubleError = error * 2;
      if (doubleError > -deltaY) {
        error -= deltaY;
        x += stepX;
      }
      if (doubleError < deltaX) {
        error += deltaX;
        y += stepY;
      }
    }

    gridRef.current = nextGrid;
    setGrid(nextGrid);
  };

  const getIndexFromPointerPosition = (clientX: number, clientY: number) => {
    const container = gridContainerRef.current;
    if (!container) {
      return null;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const relativeX = Math.min(
      Math.max(clientX - rect.left, 0),
      rect.width - 0.001,
    );
    const relativeY = Math.min(
      Math.max(clientY - rect.top, 0),
      rect.height - 0.001,
    );
    const column = Math.floor((relativeX / rect.width) * gridSize);
    const row = Math.floor((relativeY / rect.height) * gridSize);

    return row * gridSize + column;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const index = getIndexFromPointerPosition(event.clientX, event.clientY);
    if (index === null) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastDrawnIndexRef.current = index;
    pointerToolRef.current = event.button === 2 ? "eraser" : activeTool;
    handleInteraction(index, true, pointerToolRef.current);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    const index = getIndexFromPointerPosition(event.clientX, event.clientY);
    if (index === null) {
      return;
    }

    const tool =
      event.buttons === 2 || event.buttons === 3
        ? "eraser"
        : pointerToolRef.current;
    pointerToolRef.current = tool;
    const previousIndex = lastDrawnIndexRef.current;
    if (previousIndex !== null && previousIndex !== index) {
      drawInterpolatedLine(previousIndex, index, tool);
    } else {
      handleInteraction(index, false, tool);
    }

    lastDrawnIndexRef.current = index;
  };

  const handleGridSizeChange = (nextSize: number) => {
    if (nextSize === gridSize) {
      return;
    }

    const isDirty = gridRef.current.some((color) => !isDefaultColor(color));
    if (isDirty) {
      const confirmed = window.confirm(
        "Changing grid size will clear your current drawing. Continue?",
      );
      if (!confirmed) {
        return;
      }
    }

    const nextGrid = createEmptyGrid(nextSize);
    gridRef.current = nextGrid;
    historyRef.current = [nextGrid];
    historyIndexRef.current = 0;
    lastDrawnIndexRef.current = null;

    setGridSize(nextSize);
    setGrid(nextGrid);
    setHistory([nextGrid]);
    setHistoryIndex(0);
  };

  const clearCanvas = () => {
    updateGrid(createEmptyGrid(gridSize));
  };

  const paintGridOnCanvas = (
    context: CanvasRenderingContext2D,
    scale = 1,
    includeBackground = false,
  ) => {
    if (includeBackground) {
      context.fillStyle = DEFAULT_COLOR;
      context.fillRect(0, 0, gridSize * scale, gridSize * scale);
    }

    for (let index = 0; index < gridRef.current.length; index += 1) {
      const color = gridRef.current[index];
      if (
        !includeBackground &&
        (color.toLowerCase() === "#ffffff" || isDefaultColor(color))
      ) {
        continue;
      }

      const x = (index % gridSize) * scale;
      const y = Math.floor(index / gridSize) * scale;
      context.fillStyle = color;
      context.fillRect(x, y, scale, scale);
    }
  };

  const buildExportCanvas = () => {
    const canvas = document.createElement("canvas");
    canvas.width = gridSize;
    canvas.height = gridSize;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    paintGridOnCanvas(context);

    return canvas;
  };

  const buildPreviewCanvas = () => {
    const maxPreviewSize = 384;
    const scale = Math.max(1, Math.floor(maxPreviewSize / gridSize));
    const canvas = document.createElement("canvas");
    canvas.width = gridSize * scale;
    canvas.height = gridSize * scale;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.imageSmoothingEnabled = false;
    paintGridOnCanvas(context, scale, true);

    return canvas;
  };

  const exportToPNG = async () => {
    setIsSaving(true);

    try {
      const exportCanvas = buildExportCanvas();
      const previewCanvas = buildPreviewCanvas();
      if (!exportCanvas || !previewCanvas) {
        return;
      }

      const fileName = createFileName(gridSize);
      const dataUrl = previewCanvas.toDataURL("image/png");

      setPreviewImage(dataUrl);
      setPreviewFileName(fileName);

      if (!isTouchDevice) {
        await downloadCanvasPng(exportCanvas, fileName);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#c2c3c7] px-3 py-3 text-[#1d2b53] sm:px-4 sm:py-8 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 sm:gap-4 lg:my-auto">
        <header className="pixel-panel bg-white p-3 sm:p-5">
          <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="pixel-font text-lg leading-none text-[#1d2b53] sm:text-3xl">
                PIXEL STUDIO {gridSize}
              </h1>
            </div>

            <div className="grid w-full gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2">
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                {[8, 16, 32].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleGridSizeChange(size)}
                    className={`pixel-chip ${gridSize === size ? "pixel-chip-active" : ""}`}
                    type="button"
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:hidden">
                <button
                  className={`pixel-action ${showGrid ? "pixel-action-active" : ""}`}
                  onClick={() => setShowGrid((value) => !value)}
                  type="button"
                >
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </button>
                <button
                  className="pixel-action bg-[#ac3232] text-[#1d2b53]"
                  onClick={clearCanvas}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
                <button
                  className="pixel-action bg-[#99e550] text-[#1d2b53] disabled:bg-[#9badb7]"
                  disabled={isSaving}
                  onClick={exportToPNG}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_16rem]">
          <aside className="pixel-panel min-w-0 bg-[#2b395e] p-2 text-[#fff1e8] sm:p-4">
            <div className="mb-2 flex items-center justify-between sm:mb-3">
              <span className="pixel-font text-xs sm:text-sm">TOOLS</span>
              <span className="pixel-label text-[#ffcd75]">{activeTool}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-2">
              <ToolButton
                active={activeTool === "pencil"}
                icon={<Pencil className="h-4 w-4" />}
                label="Draw"
                onClick={() => setActiveTool("pencil")}
              />
              <ToolButton
                active={activeTool === "eraser"}
                icon={<Eraser className="h-4 w-4" />}
                label="Erase"
                onClick={() => setActiveTool("eraser")}
              />
              <ToolButton
                active={activeTool === "fill"}
                icon={<PaintBucket className="h-4 w-4" />}
                label="Fill"
                onClick={() => setActiveTool("fill")}
              />
              <ToolButton
                active={activeTool === "picker"}
                icon={<Pipette className="h-4 w-4" />}
                label="Pick"
                onClick={() => setActiveTool("picker")}
              />
            </div>

            <div className="my-2 h-1 bg-[#1d2b53] sm:my-3" />

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <ToolButton
                active={false}
                disabled={historyIndex === 0}
                icon={<Undo className="h-4 w-4" />}
                label="Undo"
                onClick={undo}
              />
              <ToolButton
                active={false}
                disabled={historyIndex === history.length - 1}
                icon={<Redo className="h-4 w-4" />}
                label="Redo"
                onClick={redo}
              />
            </div>

            <div className="mt-2 hidden grid-cols-3 gap-1.5 sm:mt-3 sm:grid sm:grid-cols-1 sm:gap-2">
              <button
                className={`pixel-action ${showGrid ? "pixel-action-active" : ""}`}
                onClick={() => setShowGrid((value) => !value)}
                type="button"
              >
                <Grid3X3 className="h-4 w-4" />
                Grid {showGrid ? "On" : "Off"}
              </button>
              <button
                className="pixel-action bg-[#ac3232] text-[#1d2b53]"
                onClick={clearCanvas}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                Clear Canvas
              </button>
              <button
                className="pixel-action bg-[#99e550] text-[#1d2b53] disabled:bg-[#9badb7]"
                disabled={isSaving}
                onClick={exportToPNG}
                type="button"
              >
                <Download className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save PNG"}
              </button>
            </div>
          </aside>

          <main className="pixel-panel min-w-0 bg-white p-2 sm:p-4">
            <div className="flex justify-center overflow-hidden rounded-none bg-[#c2c3c7] p-1.5 sm:p-3">
              <div
                ref={gridContainerRef}
                className={`grid ${showGrid ? "gap-px border border-[#847e87] bg-[#847e87]" : ""}`}
                onContextMenu={(event) => event.preventDefault()}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  width: "min(calc(100vw - 2.5rem), 42rem)",
                  maxWidth: "100%",
                  aspectRatio: "1 / 1",
                  touchAction: "none",
                  boxSizing: "border-box",
                }}
              >
                {grid.map((color, index) => (
                  <div
                    key={index}
                    onContextMenu={(event) => event.preventDefault()}
                    className={`h-full w-full select-none ${
                      activeTool === "picker"
                        ? "cursor-copy"
                        : "cursor-crosshair"
                    }`}
                    draggable={false}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </main>

          <aside className="pixel-panel min-w-0 bg-white p-2 sm:p-4">
            <div className="mb-2 flex items-center justify-between sm:mb-3">
              <span className="pixel-font text-xs sm:text-sm">PALETTE</span>
              <span className="pixel-label text-[#8f563b]">32 colors</span>
            </div>

            <div className="grid grid-cols-8 gap-1 sm:grid-cols-8 sm:gap-2 xl:grid-cols-4">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  type="button"
                  aria-label={`Select ${color}`}
                  className={`aspect-square min-w-0 border-2 transition-transform hover:scale-[1.04] ${
                    selectedColor === color
                      ? "border-[#1d2b53] shadow-[2px_2px_0px_#1d2b53]"
                      : "border-[#847e87]"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="mt-3 rounded-none border-2 border-[#1d2b53] bg-white p-2.5 sm:mt-4 sm:p-3">
              <p className="pixel-label mb-1 text-[#8f563b]">Selected color</p>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 shrink-0 border-2 border-[#1d2b53]"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="pixel-font text-xs sm:text-sm">
                  {selectedColor}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {previewImage ? (
        <ExportPreviewModal
          description="Your PNG downloaded automatically. You can also save it manually or share it here."
          fileName={previewFileName}
          imageAlt="Pixel art export preview"
          imageSrc={previewImage}
          isTouchDevice={isTouchDevice}
          onClose={() => setPreviewImage(null)}
          onSaveImage={async () => {
            try {
              const canvas = buildExportCanvas();
              if (!canvas) {
                return;
              }

              const blob = await canvasToBlob(canvas);
              const pngFile = new File([blob], previewFileName, {
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
                  title: "Pixel Studio 32",
                  text: "Sharing this pixel art.",
                });
                return;
              }

              window.open(previewImage, "_blank", "noopener,noreferrer");
            } catch {}
          }}
          pixelatedPreview
          shareHeading="Share with friends"
          shareUrl={shareUrl}
          title="Pixel art snapshot"
        />
      ) : null}
    </div>
  );
}

const ToolButton = ({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    className={`flex min-h-12 flex-col items-center justify-center gap-1 border-[3px] px-1.5 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wide transition-transform sm:min-h-16 sm:gap-2 sm:px-2 sm:py-3 sm:text-[15px] ${
      active
        ? "border-[#fff1e8] bg-[#29adff] text-[#fff7dd] shadow-[inset_0_0_0_2px_#1d2b53]"
        : "border-[#1d2b53] bg-[#c2c3c7] text-[#1d2b53]"
    } ${disabled ? "cursor-not-allowed opacity-50" : "hover:translate-y-px"}`}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {icon}
    <span>{label}</span>
  </button>
);
