"use client";

import { useEffect, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

/**
 * ASCII Density strings from dark to light
 */
const DENSITY = "Ñ@#W$9876543210?!abc;:+=-,._ ";

export default function AsciiCamera() {
  const [asciiArt, setAsciiArt] = useState<string>("");
  const [resolution, setResolution] = useState(120); // Width in chars
  const [contrast, setContrast] = useState(1);
  const [color, setColor] = useState<string>("#00ff00");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1.33);

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
      setAsciiArt(asciiFrame);
    };
  }, [imageSrc, resolution, contrast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="min-h-screen bg-black font-mono flex flex-col items-center justify-center p-4 overflow-hidden select-none"
      style={{ "--theme-color": color } as React.CSSProperties}
    >
      {/* Main Container TV Frame */}
      <div
        className="relative w-full max-w-7xl p-6 md:p-8 border-4 rounded-3xl bg-[#111] shadow-2xl transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
        style={{ borderColor: color, boxShadow: `0 0 30px rgba(0,0,0,0.8), 0 0 15px ${color}33` }}
      >
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,4px_100%] rounded-2xl" />


        <div className="relative z-10">
          {/* Header */}
          <div
            className="flex justify-between items-center mb-4 pb-2 border-b border-opacity-30 border-[var(--theme-color)] text-[var(--theme-color)]"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-6 h-6 animate-pulse" />
              <h1 className="text-xl font-bold tracking-widest">
                ASCII_VISION
              </h1>
            </div>
            <div className="text-xs opacity-70">
              {resolution}x :: IMG {imageSrc ? "LOADED" : "WAITING"}
            </div>
          </div>

          {/* ASCII Output */}
          <div className="bg-black p-4 rounded-xl border border-white/5 w-full min-h-[70vh] flex items-center justify-center overflow-hidden">
            {!imageSrc ? (
              <div className="text-center space-y-4">
                <label
                  className="cursor-pointer px-8 py-3 border-2 font-bold uppercase tracking-widest hover:bg-[var(--theme-color)] hover:text-black transition-all inline-flex items-center gap-2 border-[var(--theme-color)] text-[var(--theme-color)]"
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs opacity-50 font-mono">
                  Supports JPG, PNG, WEBP
                </p>
              </div>
            ) : (
              <pre
                className="leading-none font-bold text-center whitespace-pre text-[var(--theme-color)]"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: `calc(min(100vw - 80px, 1180px, (75vh - 100px) * ${aspectRatio}) * 1.6 / ${resolution})`,
                  textShadow: `0 0 8px ${color}`,
                }}
              >
                {asciiArt}
              </pre>
            )}
          </div>

          {/* Controls Rack */}
          {imageSrc && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--theme-color)]">
                  Density (Res)
                </label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={resolution}
                  onChange={(e) => setResolution(Number(e.target.value))}
                  className="w-full accent-current h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--theme-color)]">
                  Contrast
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-current h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-between items-end gap-3 text-[var(--theme-color)]">
                {/* Green Preset */}
                <button
                  onClick={() => setColor("#00ff00")}
                  className={`h-8 w-8 rounded-full bg-[#00ff00] cursor-pointer transition-all ${
                    color === "#00ff00" ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110" : "opacity-60 hover:opacity-100"
                  }`}
                  title="Green"
                />
                {/* Blue Preset */}
                <button
                  onClick={() => setColor("#0088ff")}
                  className={`h-8 w-8 rounded-full bg-[#0088ff] cursor-pointer transition-all ${
                    color === "#0088ff" ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110" : "opacity-60 hover:opacity-100"
                  }`}
                  title="Blue"
                />
                {/* Red Preset */}
                <button
                  onClick={() => setColor("#ff3333")}
                  className={`h-8 w-8 rounded-full bg-[#ff3333] cursor-pointer transition-all ${
                    color === "#ff3333" ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110" : "opacity-60 hover:opacity-100"
                  }`}
                  title="Red"
                />
                {/* Custom Color Picker */}
                <div
                  className={`relative h-8 w-8 rounded-full overflow-hidden border border-white/20 cursor-pointer transition-all ${
                    color !== "#00ff00" && color !== "#0088ff" && color !== "#ff3333"
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
                      background: "conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)",
                    }}
                  />
                </div>

                <label
                  className="ml-auto p-2 border border-current hover:bg-[var(--theme-color)]/10 rounded transition-colors cursor-pointer"
                  title="Upload New Image"
                >
                  <Upload className="w-5 h-5 text-current" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        input[type="range"] {
          color: ${color};
        }
      `}</style>
    </div>
  );
}
