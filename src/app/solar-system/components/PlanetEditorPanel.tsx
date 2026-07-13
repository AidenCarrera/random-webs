"use client";

import { Trash2, X } from "lucide-react";

import {
  GLOW_COLORS,
  TEXTURE_MAP,
  TEXTURE_OPTIONS,
  TYPE_OPTIONS,
} from "../constants";
import type { Planet, SolarTextureKey } from "../types";

type Props = {
  selectedPlanet: Planet | null;
  enableGlow: boolean;
  paused: boolean;
  onClose: () => void;
  onUpdate: (id: string, fields: Partial<Planet>) => void;
  onDelete: (id: string) => void;
};

export function PlanetEditorPanel({
  selectedPlanet,
  enableGlow,
  paused,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  if (!selectedPlanet) return null;

  const selectedGlow =
    selectedPlanet.id !== "sun"
      ? GLOW_COLORS[selectedPlanet.textureKey]
      : "rgba(253,184,19,0.15)";

  return (
    <div className="order-3 relative z-40 -mt-1 mb-4 w-full max-w-sm self-stretch overflow-y-auto solar-system-scrollbar bg-black/60 backdrop-blur-xl border border-white/10 p-6 text-left shadow-[0_15px_40px_rgba(0,0,0,0.7)] rounded-2xl animate-in fade-in duration-300 md:absolute md:top-1/2 md:right-6 md:mb-0 md:mt-0 md:w-80 md:max-w-none md:max-h-[80vh] md:-translate-y-1/2 md:slide-in-from-right-10">
      {/* Close Panel Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full cursor-pointer"
        title="Close Panel"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Spherical Preview Icon */}
      <div
        className="w-16 h-16 rounded-full mb-4 shadow-2xl relative planet-texture-spin"
        style={{
          backgroundImage: `url(${TEXTURE_MAP[selectedPlanet.textureKey]})`,
          boxShadow: enableGlow
            ? `0 0 8px ${selectedPlanet.id === "sun" ? "rgba(253,184,19,0.12)" : selectedGlow}`
            : "none",
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.15)_0%,rgba(0,0,0,0.85)_82%)] pointer-events-none" />
      </div>

      <h2 className="text-2xl font-light uppercase tracking-widest text-white leading-tight">
        {selectedPlanet.name}
      </h2>
      <div className="text-[10px] font-mono text-white/45 mb-4 uppercase tracking-wider">
        {selectedPlanet.type}
      </div>

      <p className="text-[11px] leading-relaxed text-white/60 border-l-2 border-white/15 pl-3 mb-6">
        {selectedPlanet.desc}
      </p>

      {/* Live Planet Editing Console (Only for editable planets, not the star Sun) */}
      {selectedPlanet.id !== "sun" ? (
        <div className="space-y-4 border-t border-white/5 pt-5 font-mono text-[11px] text-white/80">
          <h3 className="text-[10px] text-white/45 uppercase tracking-widest font-bold mb-3">
            Properties
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-white/45">Name</label>
            <input
              type="text"
              value={selectedPlanet.name}
              onChange={(e) =>
                onUpdate(selectedPlanet.id, {
                  name: e.target.value,
                })
              }
              className="bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs w-full focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/45">Type</label>
              <select
                value={selectedPlanet.textureKey}
                onChange={(e) =>
                  onUpdate(selectedPlanet.id, {
                    textureKey: e.target.value as SolarTextureKey,
                  })
                }
                className="bg-black/80 border border-white/10 rounded px-2 py-1.5 text-xs w-full focus:outline-none cursor-pointer"
              >
                {TEXTURE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/45">Category</label>
              <select
                value={selectedPlanet.type}
                onChange={(e) =>
                  onUpdate(selectedPlanet.id, {
                    type: e.target.value,
                  })
                }
                className="bg-black/80 border border-white/10 rounded px-2 py-1.5 text-xs w-full focus:outline-none cursor-pointer"
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-[10px] text-white/45">Planet Radius</label>
              <span className="text-[10px] text-white/60">
                {selectedPlanet.size}px
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="65"
              value={selectedPlanet.size}
              onChange={(e) =>
                onUpdate(selectedPlanet.id, {
                  size: parseInt(e.target.value),
                })
              }
              className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-[10px] text-white/45">
                Orbital Diameter
              </label>
              <span className="text-[10px] text-white/60">
                {selectedPlanet.orbitSize}px
              </span>
            </div>
            <input
              type="range"
              min="110"
              max="850"
              step="10"
              value={selectedPlanet.orbitSize}
              onChange={(e) =>
                onUpdate(selectedPlanet.id, {
                  orbitSize: parseInt(e.target.value),
                })
              }
              className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label className="text-[10px] text-white/45">
                Year Duration (Period)
              </label>
              <span className="text-[10px] text-white/60">
                {selectedPlanet.duration}s
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="120"
              value={selectedPlanet.duration}
              onChange={(e) =>
                onUpdate(selectedPlanet.id, {
                  duration: parseInt(e.target.value),
                })
              }
              className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-1.5 border-y border-white/5 my-2 text-[10px]">
            <label
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                selectedPlanet.hasMoon
                  ? "bg-white/15 border-white/35 text-white shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                  : "bg-black/30 border-white/10 text-white/55 hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPlanet.hasMoon || false}
                onChange={(e) =>
                  onUpdate(selectedPlanet.id, {
                    hasMoon: e.target.checked,
                  })
                }
                className="sr-only"
              />
              Moon
            </label>

            <label
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                selectedPlanet.hasRings
                  ? "bg-white/15 border-white/35 text-white shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                  : "bg-black/30 border-white/10 text-white/55 hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPlanet.hasRings || false}
                onChange={(e) =>
                  onUpdate(selectedPlanet.id, {
                    hasRings: e.target.checked,
                  })
                }
                className="sr-only"
              />
              Rings
            </label>

            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-white/40 uppercase text-[9px] tracking-wider">
                Temp:
              </span>
              <input
                type="text"
                value={selectedPlanet.temp}
                onChange={(e) =>
                  onUpdate(selectedPlanet.id, {
                    temp: e.target.value,
                  })
                }
                className="w-16 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3.5 mt-2 border-t border-white/5">
            <button
              onClick={() => onDelete(selectedPlanet.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white rounded-lg text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 border-t border-white/5 pt-5 font-mono text-[11px] text-white/70">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">AVG SURFACE TEMP</span>
            <span>{selectedPlanet.temp}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">STELLAR CLASS</span>
            <span>G2V Dwarf Star</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">SYSTEM AGE</span>
            <span>4.6 Billion Years</span>
          </div>
        </div>
      )}

      {/* Label removed */}
    </div>
  );
}
