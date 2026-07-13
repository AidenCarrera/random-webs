"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, Upload } from "lucide-react";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { canvasToBlob, downloadCanvasPng } from "@/lib/canvasExport";

/**
 * ASCII Density strings from dark to light
 */
const DENSITY = "Ñ@#W$9876543210?!abc;:+=-,._ ";

const ASCII_EXPORT_FONT_SIZE = 18;
const ASCII_EXPORT_LINE_HEIGHT = 20;
const ASCII_EXPORT_CHAR_WIDTH = 10.8;
const ASCII_EXPORT_PADDING = 32;

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

export default function AsciiCamera() {
  const [asciiArt, setAsciiArt] = useState<string>("");
  const [asciiSize, setAsciiSize] = useState({ columns: 120, rows: 54 });
  const [resolution, setResolution] = useState(120);
  const [contrast, setContrast] = useState(1);
  const [color, setColor] = useState<string>("#00ff00");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1.33);
  const isTouchDevice = useSyncExternalStore(
    subscribeToTouchCapability,
    getTouchCapabilitySnapshot,
    getServerTouchCapabilitySnapshot,
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState("ascii-vision.png");
  const shareUrl = useSyncExternalStore(
    subscribeToLocation,
    getShareUrlSnapshot,
    getServerShareUrlSnapshot,
  );

  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setAspectRatio(img.width / img.height);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = resolution;
      const height = Math.floor((img.height / img.width) * width * 0.6);

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      let asciiFrame = "";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          let avg = (r + g + b) / 3;
          avg = Math.pow(avg / 255, contrast) * 255;
          const len = DENSITY.length;
          const charIndex = Math.floor(((255 - avg) / 255) * len);
          const char = DENSITY[Math.min(Math.max(charIndex, 0), len - 1)];
          asciiFrame += char;
        }
        asciiFrame += "\n";
      }
      setAsciiSize({ columns: width, rows: height });
      setAsciiArt(asciiFrame);
    };
  }, [imageSrc, resolution, contrast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setPreviewImage(null);
    };
    reader.readAsDataURL(file);
  };

  const renderAsciiToCanvas = () => {
    if (!asciiArt.trim()) return null;

    const lines = asciiArt.trimEnd().split("\n");
    const columnCount = Math.max(...lines.map((line) => line.length), 1);
    const rowCount = Math.max(lines.length, 1);
    const canvas = exportCanvasRef.current ?? document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return null;

    exportCanvasRef.current = canvas;
    canvas.width = Math.ceil(
      ASCII_EXPORT_PADDING * 2 + columnCount * ASCII_EXPORT_CHAR_WIDTH,
    );
    canvas.height = Math.ceil(
      ASCII_EXPORT_PADDING * 2 + rowCount * ASCII_EXPORT_LINE_HEIGHT,
    );

    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = `700 ${ASCII_EXPORT_FONT_SIZE}px "Courier New", monospace`;
    context.textBaseline = "top";
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = 10;

    lines.forEach((line, index) => {
      context.fillText(
        line,
        ASCII_EXPORT_PADDING,
        ASCII_EXPORT_PADDING + index * ASCII_EXPORT_LINE_HEIGHT,
      );
    });

    return canvas;
  };

  const handleDownload = async () => {
    const canvas = renderAsciiToCanvas();
    if (!canvas) return;

    const fileName = `ascii-vision-${resolution}x${Math.max(
      asciiArt.trimEnd().split("\n").length,
      1,
    )}.png`;

    try {
      setPreviewImage(canvas.toDataURL("image/png"));
      setPreviewFileName(fileName);

      if (!isTouchDevice) {
        await downloadCanvasPng(canvas, fileName);
      }
    } catch {
      const fallbackLink = document.createElement("a");
      fallbackLink.download = fileName;
      fallbackLink.href = canvas.toDataURL("image/png");
      fallbackLink.click();
    }
  };

  return (
    <div
      className="ascii-shell min-h-screen bg-black font-mono flex flex-col items-center justify-center px-2 py-2 overflow-hidden select-none sm:p-4"
      style={
        {
          "--theme-color": color,
          "--ascii-aspect-ratio": aspectRatio,
          "--ascii-scale": aspectRatio > 1 ? 1.82 : 1.6,
          "--ascii-columns": asciiSize.columns,
          "--ascii-rows": asciiSize.rows,
        } as React.CSSProperties
      }
    >
      <div
        className="ascii-frame relative w-full max-w-7xl rounded-[1.25rem] border-[3px] bg-[#111] p-2 transition-all duration-500 sm:rounded-3xl sm:border-4 sm:p-6 md:p-8"
        style={{
          borderColor: color,
          boxShadow: `0 0 30px rgba(0,0,0,0.8), 0 0 15px ${color}33`,
        }}
      >
        <div className="ascii-overlay absolute inset-0 pointer-events-none z-20 rounded-2xl bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,4px_100%] transition-all duration-500 sm:rounded-2xl" />

        <div className="relative z-10">
          <div className="ascii-header mb-2 flex flex-col gap-2 border-b border-(--theme-color) border-opacity-30 pb-2 text-(--theme-color) transition-colors duration-500 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-[0.22em] sm:text-xl">
                ASCII_VISION
              </h1>
            </div>
            <div className="text-[11px] opacity-70 sm:text-xs">
              {resolution}x :: IMG {imageSrc ? "LOADED" : "WAITING"}
            </div>
          </div>

          <div className="ascii-output flex min-h-[60dvh] w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-black p-1.5 transition-all duration-500 sm:min-h-[70vh] sm:p-4">
            {!imageSrc ? (
              <div className="text-center space-y-4 px-3">
                <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-(--theme-color) px-6 py-3 font-bold uppercase tracking-widest text-(--theme-color) transition-all hover:bg-(--theme-color) hover:text-black sm:px-8">
                  <Upload className="h-5 w-5" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="font-mono text-xs opacity-50">
                  Supports JPG, PNG, WEBP
                </p>
              </div>
            ) : (
              <pre
                className="w-full overflow-hidden text-center font-bold leading-none whitespace-pre text-(--theme-color) transition-colors duration-500"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  textShadow: `0 0 8px ${color}`,
                }}
              >
                {asciiArt}
              </pre>
            )}
          </div>

          {imageSrc && (
            <div className="ascii-controls mt-3 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-6 md:grid-cols-3">
              <div className="ascii-slider-group space-y-2">
                <label className="text-xs font-bold uppercase text-(--theme-color) transition-colors duration-500">
                  Density (Res)
                </label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={resolution}
                  onChange={(e) => setResolution(Number(e.target.value))}
                  className="ascii-slider w-full appearance-none rounded-lg h-2 cursor-pointer"
                />
              </div>
              <div className="ascii-slider-group space-y-2">
                <label className="text-xs font-bold uppercase text-(--theme-color) transition-colors duration-500">
                  Contrast
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="ascii-slider w-full appearance-none rounded-lg h-2 cursor-pointer"
                />
              </div>
              <div className="ascii-actions flex items-end justify-between gap-3 text-(--theme-color) md:justify-end">
                <div className="ascii-swatch-group flex items-end gap-3">
                  <button
                    onClick={() => setColor("#00ff00")}
                    className={`ascii-swatch h-8 w-8 rounded-full bg-[#00ff00] cursor-pointer transition-all ${
                      color === "#00ff00"
                        ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Green"
                  />
                  <button
                    onClick={() => setColor("#0088ff")}
                    className={`ascii-swatch h-8 w-8 rounded-full bg-[#0088ff] cursor-pointer transition-all ${
                      color === "#0088ff"
                        ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Blue"
                  />
                  <button
                    onClick={() => setColor("#ff3333")}
                    className={`ascii-swatch h-8 w-8 rounded-full bg-[#ff3333] cursor-pointer transition-all ${
                      color === "#ff3333"
                        ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Red"
                  />
                  <div
                    className={`ascii-swatch relative h-8 w-8 overflow-hidden rounded-full border border-white/20 cursor-pointer transition-all duration-500 ${
                      color !== "#00ff00" &&
                      color !== "#0088ff" &&
                      color !== "#ff3333"
                        ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Custom Color"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)",
                      }}
                    />
                  </div>
                </div>

                <div className="ascii-file-actions flex items-center gap-3">
                  <label
                    className="ascii-icon-button flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-current text-current transition-all duration-500 hover:bg-(--theme-color) hover:text-black"
                    title="Upload New Image"
                  >
                    <Upload className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      void handleDownload();
                    }}
                    className="ascii-icon-button inline-flex h-10 w-10 items-center justify-center rounded border border-(--theme-color) text-(--theme-color) transition-all duration-500 hover:bg-(--theme-color) hover:text-black"
                    aria-label="Download PNG"
                    title="Download PNG"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewImage ? (
        <ExportPreviewModal
          description="Your PNG downloaded automatically. You can also save it manually or share it here."
          fileName={previewFileName}
          imageAlt="ASCII export preview"
          imageSrc={previewImage}
          isTouchDevice={isTouchDevice}
          onClose={() => setPreviewImage(null)}
          onSaveImage={async () => {
            try {
              const canvas = renderAsciiToCanvas();
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
                  title: "ASCII Vision",
                  text: "Save this ASCII image.",
                });
                return;
              }

              window.open(previewImage, "_blank", "noopener,noreferrer");
            } catch {}
          }}
          shareHeading="Share your capture"
          shareUrl={shareUrl}
          title="ASCII snapshot"
        />
      ) : null}

      <style jsx>{`
        input[type="range"] {
          color: ${color};
        }

        .ascii-shell {
          --ascii-font-size: calc(
            min(
                (100vw - 16px) / var(--ascii-columns),
                1180px / var(--ascii-columns),
                ((100dvh - 168px) * var(--ascii-aspect-ratio)) /
                  var(--ascii-columns),
                (100dvh - 168px) / var(--ascii-rows)
              ) *
              var(--ascii-scale)
          );
        }

        .ascii-header,
        .ascii-controls,
        .ascii-frame,
        .ascii-overlay,
        .ascii-output,
        .ascii-actions,
        .ascii-swatch-group,
        .ascii-swatch,
        .ascii-file-actions,
        .ascii-slider-group,
        .ascii-icon-button {
          transition-duration: 0.5s;
        }

        .ascii-output pre {
          font-size: var(--ascii-font-size);
        }

        .ascii-slider {
          background: color-mix(in srgb, ${color} 30%, #111 70%);
          accent-color: ${color};
          transition:
            background 0.5s ease,
            accent-color 0.5s ease;
        }

        .ascii-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 0;
          background: ${color};
          border: 2px solid #000;
          transition:
            background 0.5s ease,
            transform 0.2s ease;
        }

        .ascii-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 0;
          background: ${color};
          border: 2px solid #000;
          transition:
            background 0.5s ease,
            transform 0.2s ease;
        }

        .ascii-slider::-moz-range-track {
          background: color-mix(in srgb, ${color} 30%, #111 70%);
          height: 8px;
          border-radius: 9999px;
          transition: background 0.5s ease;
        }

        @media (orientation: portrait) and (max-width: 639px) {
          .ascii-shell {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }

          .ascii-frame {
            border-radius: 1.75rem;
            padding: 0.75rem;
          }

          .ascii-overlay {
            border-radius: 1.5rem;
          }

          .ascii-header {
            margin-bottom: 0.75rem;
            padding-bottom: 0.75rem;
          }

          .ascii-output {
            min-height: 72dvh;
            border-radius: 1rem;
            padding: 0.5rem;
          }

          .ascii-controls {
            margin-top: 1rem;
            gap: 1rem;
          }
        }

        @media (orientation: landscape) and (max-width: 639px) {
          .ascii-shell {
            padding-top: 0.35rem;
            padding-bottom: 0.35rem;
          }

          .ascii-frame {
            border-radius: 1rem;
            padding: 0.45rem;
          }

          .ascii-overlay {
            border-radius: 0.85rem;
          }

          .ascii-header {
            margin-bottom: 0.45rem;
            padding-bottom: 0.45rem;
          }

          .ascii-output {
            min-height: calc(100dvh - 7.8rem);
            border-radius: 0.8rem;
            padding: 0.2rem;
          }

          .ascii-controls {
            margin-top: 0.5rem;
            gap: 0.4rem;
            grid-template-columns: minmax(4.5rem, 1fr) minmax(4.5rem, 1fr) auto;
            align-items: end;
          }

          .ascii-slider-group {
            min-width: 0;
          }

          .ascii-slider-group label {
            font-size: 0.6rem;
            line-height: 1;
          }

          .ascii-actions {
            gap: 0.35rem;
            justify-content: flex-end;
            min-width: 0;
            flex-wrap: nowrap;
          }

          .ascii-swatch-group {
            gap: 0.35rem;
            min-width: 0;
            flex-wrap: nowrap;
          }

          .ascii-file-actions {
            gap: 0.35rem;
            flex: 0 0 auto;
          }

          .ascii-swatch {
            width: 1.65rem;
            height: 1.65rem;
            min-width: 1.65rem;
            min-height: 1.65rem;
          }

          .ascii-icon-button {
            width: 2rem;
            height: 2rem;
            min-width: 2rem;
            min-height: 2rem;
          }

          .ascii-icon-button :global(svg) {
            width: 1rem;
            height: 1rem;
          }

          .ascii-swatch-group > button,
          .ascii-swatch-group > div,
          .ascii-file-actions > label,
          .ascii-file-actions > button {
            flex: 0 0 auto;
          }

          .ascii-slider-group .ascii-slider {
            min-width: 0;
          }

          .ascii-shell {
            --ascii-font-size: calc(
              min(
                  (100vw - 6px) / var(--ascii-columns),
                  1180px / var(--ascii-columns),
                  ((100dvh - 108px) * var(--ascii-aspect-ratio)) /
                    var(--ascii-columns),
                  (100dvh - 108px) / var(--ascii-rows)
                ) *
                calc(var(--ascii-scale) + 0.1)
            );
          }
        }
      `}</style>
    </div>
  );
}
