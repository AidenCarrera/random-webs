"use client";

import { Download, Settings2, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { canvasToBlob, downloadCanvasPng } from "@/lib/canvasExport";

type ColorMode =
  | "default"
  | "neon"
  | "solar"
  | "ocean"
  | "spectrum"
  | "forest";

const COLOR_MODES: Array<{ id: ColorMode; label: string }> = [
  { id: "default", label: "Default" },
  { id: "neon", label: "Neon" },
  { id: "solar", label: "Solar" },
  { id: "ocean", label: "Ocean" },
  { id: "spectrum", label: "Spectrum" },
  { id: "forest", label: "Forest" },
];

type Rgb = [number, number, number];

const PALETTE_MAP: Record<Exclude<ColorMode, "default" | "spectrum">, Rgb[]> = {
  neon: [
    [92, 38, 146],
    [158, 52, 216],
    [240, 0, 120],
    [0, 240, 255],
  ],
  solar: [
    [190, 48, 18],
    [252, 126, 34],
    [255, 200, 0],
    [255, 255, 220],
  ],
  ocean: [
    [0, 40, 100],
    [0, 128, 160],
    [70, 220, 160],
    [200, 255, 240],
  ],
  forest: [
    [56, 118, 60],
    [204, 176, 72],
    [140, 35, 160],
    [220, 180, 255],
  ],
};

function interpolatePalette(t: number, colors: Rgb[]): Rgb {
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * (colors.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, colors.length - 1);
  const mix = scaled - index;
  const current = colors[index];
  const next = colors[nextIndex];

  return [
    Math.round(current[0] + (next[0] - current[0]) * mix),
    Math.round(current[1] + (next[1] - current[1]) * mix),
    Math.round(current[2] + (next[2] - current[2]) * mix),
  ];
}

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const h = hue / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (h >= 0 && h < 1) {
    red = c;
    green = x;
  } else if (h < 2) {
    red = x;
    green = c;
  } else if (h < 3) {
    green = c;
    blue = x;
  } else if (h < 4) {
    green = x;
    blue = c;
  } else if (h < 5) {
    red = x;
    blue = c;
  } else {
    red = c;
    blue = x;
  }

  const match = l - c / 2;

  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}

function getPaletteColor(t: number, mode: ColorMode): string {
  if (mode === "default") {
    const hue = ((t % 1) + 1) % 1;
    return `hsl(${hue * 360} 100% 50%)`;
  }

  if (mode === "spectrum") {
    const hue = (t * 360 * 3.5) % 360;
    const [red, green, blue] = hslToRgb(hue, 100, 50);
    return `rgb(${red} ${green} ${blue})`;
  }

  const [red, green, blue] = interpolatePalette(t, PALETTE_MAP[mode]);
  return `rgb(${red} ${green} ${blue})`;
}

function getSpectrumColor(offset: number): string {
  const hue = (((offset * -8) % 360) + 360) % 360;
  const [red, green, blue] = hslToRgb(hue, 100, 50);
  return `rgb(${red} ${green} ${blue})`;
}

function getRingStrokeStyle(radius: number, offset: number, mode: ColorMode): string {
  if (mode === "default") {
    const hue = (radius * 0.5 + offset * 5) % 360;
    return `hsl(${hue} 100% 50%)`;
  }

  if (mode === "spectrum") {
    return getSpectrumColor(offset);
  }

  const palettePosition = (((radius * 0.8 + offset * 14) % 360) + 360) % 360;
  return getPaletteColor(palettePosition / 360, mode);
}

function subscribeToTouchCapability(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(pointer: coarse)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getTouchCapabilitySnapshot() {
  return (
    window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0
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

export default function HypnoSpiral() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const colorModeRef = useRef<ColorMode>("default");
  const ringCountRef = useRef(90);
  const countdownTimeoutsRef = useRef<number[]>([]);

  const [colorMode, setColorMode] = useState<ColorMode>("default");
  const [ringCount, setRingCount] = useState(90);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isTouchDevice = useSyncExternalStore(
    subscribeToTouchCapability,
    getTouchCapabilitySnapshot,
    getServerTouchCapabilitySnapshot,
  );
  const [downloadCountdown, setDownloadCountdown] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState("hypno-spiral.png");
  const shareUrl = useSyncExternalStore(
    subscribeToLocation,
    getShareUrlSnapshot,
    getServerShareUrlSnapshot,
  );

  useEffect(() => {
    colorModeRef.current = colorMode;
  }, [colorMode]);

  useEffect(() => {
    ringCountRef.current = ringCount;
  }, [ringCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const updatePointer = (clientX: number, clientY: number) => {
      pointerRef.current = {
        x: Math.min(Math.max(clientX / width, 0), 1),
        y: Math.min(Math.max(clientY / height, 0), 1),
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handlePointerDown = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const drawRings = () => {
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
      const yPos = pointerRef.current.y;
      const xPos = pointerRef.current.x;
      const topIntensity = yPos < 0.5 ? (0.5 - yPos) * 2 : 0;
      const bottomIntensity = yPos > 0.5 ? (yPos - 0.5) * 2 : 0;
      const frequency = 0.02 + xPos * 0.08;
      const bottomRightBoost = xPos * bottomIntensity * 0.025;
      const baseRingStep = Math.max(3, maxRadius / ringCountRef.current);

      offsetRef.current -= 0.02 + xPos * 0.05 + bottomRightBoost;
      context.lineWidth = 2 + bottomIntensity * 25;

      for (let radius = 0; radius < maxRadius; radius += baseRingStep) {
        const distortion =
          Math.sin(radius * frequency - offsetRef.current) * (12.5 * topIntensity);

        context.beginPath();
        context.strokeStyle = getRingStrokeStyle(
          radius,
          offsetRef.current,
          colorModeRef.current,
        );
        context.arc(centerX, centerY, Math.max(0, radius + distortion), 0, Math.PI * 2);
        context.stroke();
      }
    };

    const draw = () => {
      context.fillStyle = "black";
      context.fillRect(0, 0, width, height);
      drawRings();

      animationId = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    draw();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of countdownTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (downloadCountdown === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      for (const timeoutId of countdownTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }

      countdownTimeoutsRef.current = [];
      setDownloadCountdown(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [downloadCountdown]);

  const handleDownload = () => {
    if (downloadCountdown !== null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsMenuOpen(false);
    setDownloadCountdown(3);

    const secondTickOne = window.setTimeout(() => setDownloadCountdown(2), 1000);
    const secondTickTwo = window.setTimeout(() => setDownloadCountdown(1), 2000);
    const finalTick = window.setTimeout(async () => {
      const fileName = `hypno-spiral-rings-${colorModeRef.current}.png`;

      try {
        const dataUrl = canvas.toDataURL("image/png");
        setPreviewImage(dataUrl);
        setPreviewFileName(fileName);

        if (!isTouchDevice) {
          await downloadCanvasPng(canvas, fileName);
        }
      } catch {
        const fallbackLink = document.createElement("a");
        fallbackLink.download = fileName;
        fallbackLink.href = canvas.toDataURL("image/png");
        fallbackLink.click();
      } finally {
        setDownloadCountdown(null);
        countdownTimeoutsRef.current = [];
      }
    }, 3000);

    countdownTimeoutsRef.current = [secondTickOne, secondTickTwo, finalTick];
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black text-white select-none"
      style={{ touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-4 sm:bottom-8">
        <div className="max-w-sm rounded-full border border-white/15 bg-black/40 px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.24em] text-white/85 backdrop-blur-sm sm:text-sm">
          {isTouchDevice
            ? "Drag your finger to warp the spiral."
            : "Move the mouse to warp the spiral."}
        </div>
      </div>

      {downloadCountdown !== null ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="rounded-full border border-white/20 bg-black/55 px-10 py-6 text-center shadow-2xl backdrop-blur-md">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">
              Capturing spiral in
            </div>
            <div className="mt-2 text-6xl font-semibold tabular-nums text-white">
              {downloadCountdown}
            </div>
          </div>
        </div>
      ) : null}

      {previewImage ? (
        <ExportPreviewModal
          fileName={previewFileName}
          imageSrc={previewImage}
          isTouchDevice={isTouchDevice}
          onClose={() => setPreviewImage(null)}
          onSaveImage={async () => {
            try {
              const canvas = canvasRef.current;
              if (!canvas) return;

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
                  title: "Hypno Spiral",
                  text: "Save this spiral image.",
                });
                return;
              }

              window.open(previewImage, "_blank", "noopener,noreferrer");
            } catch {}
          }}
          shareUrl={shareUrl}
        />
      ) : null}

      <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/60"
          aria-expanded={isMenuOpen}
          aria-controls="hypno-settings"
          aria-label={isMenuOpen ? "Close settings menu" : "Open settings menu"}
        >
          {isMenuOpen ? <X size={20} /> : <Settings2 size={20} />}
        </button>
      </div>

      {isMenuOpen ? (
        <div
          id="hypno-settings"
          className="absolute inset-x-3 top-16 z-10 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-3xl border border-white/15 bg-black/72 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:w-80 sm:max-h-[calc(100vh-7rem)]"
        >
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
              Settings
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="ring-count" className="mb-2 block text-sm text-white/80">
                Ring count
              </label>
              <input
                id="ring-count"
                type="range"
                min="36"
                max="180"
                step="1"
                value={ringCount}
                onChange={(event) => setRingCount(Number(event.target.value))}
                className="custom-slider"
              />
              <div className="mt-2 text-xs text-white/55">{ringCount} rings</div>
            </div>

            <div>
              <label htmlFor="color-mode" className="mb-2 block text-sm text-white/80">
                Palette
              </label>
              <select
                id="color-mode"
                value={colorMode}
                onChange={(event) => setColorMode(event.target.value as ColorMode)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white outline-none transition focus:border-white/40"
              >
                {COLOR_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id} className="bg-black text-white">
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadCountdown !== null}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-wait disabled:bg-white/70"
            >
              <Download size={16} />
              {downloadCountdown !== null ? `Saving in ${downloadCountdown}...` : "Download PNG"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
