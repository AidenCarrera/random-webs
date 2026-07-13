"use client";

import { Download, LoaderCircle, Plus, Trash2 } from "lucide-react";

import { TEXTURE_MAP, TEXTURE_OPTIONS, TYPE_OPTIONS } from "../constants";
import type { PlanetEditorController } from "../hooks/usePlanetEditor";
import type { BackgroundTheme, Planet, SolarTextureKey } from "../types";
import { getSuggestedPlanetType } from "../utils";

type Props = {
  editor: PlanetEditorController;
  mounted: boolean;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  showOrbits: boolean;
  onShowOrbitsChange: (show: boolean) => void;
  showMoons: boolean;
  onShowMoonsChange: (show: boolean) => void;
  enableGlow: boolean;
  onEnableGlowChange: (enabled: boolean) => void;
  bgTheme: BackgroundTheme;
  onBackgroundThemeChange: (theme: BackgroundTheme) => void;
  ambientVolume: number;
  onAmbientVolumeChange: (volume: number) => void;
  isGeneratingPng: boolean;
  onExport: () => void;
};

export function ControlPanel({
  editor,
  mounted,
  sidebarOpen,
  onSidebarOpenChange: setSidebarOpen,
  showOrbits,
  onShowOrbitsChange: setShowOrbits,
  showMoons,
  onShowMoonsChange: setShowMoons,
  enableGlow,
  onEnableGlowChange: setEnableGlow,
  bgTheme,
  onBackgroundThemeChange: setBgTheme,
  ambientVolume,
  onAmbientVolumeChange: setAmbientVolume,
  isGeneratingPng,
  onExport,
}: Props) {
  const {
    planets,
    selectedPlanet,
    setSelectedPlanet,
    handleLoadPreset,
    handleAddPlanet,
    handleDeletePlanet,
    beginAdding,
    newPlanetName,
    setNewPlanetName,
    newPlanetTexture,
    setNewPlanetTexture,
    newPlanetSize,
    setNewPlanetSize,
    newPlanetOrbit,
    setNewPlanetOrbit,
    newPlanetDuration,
    setNewPlanetDuration,
    newPlanetType,
    setNewPlanetType,
    newPlanetTemp,
    setNewPlanetTemp,
    newPlanetDesc,
    setNewPlanetDesc,
    newPlanetHasMoon,
    setNewPlanetHasMoon,
    newPlanetHasRings,
    setNewPlanetHasRings,
    isAdding,
    setIsAdding,
  } = editor;

  return (
    <div
      className={`order-2 relative z-40 mb-4 w-full max-w-sm self-stretch bg-black/50 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col shadow-[0_15px_40px_rgba(0,0,0,0.6)] ${
        mounted ? "transition-all duration-300" : ""
      } md:absolute md:top-1/2 md:left-6 md:mb-0 md:w-80 md:max-w-none md:-translate-y-1/2 ${
        sidebarOpen
          ? "max-h-[70vh] md:max-h-[80vh]"
          : "max-h-13.5 overflow-hidden"
      }`}
    >
      {/* Clickable Header Area */}
      <div
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="cursor-pointer group flex items-center justify-between select-none pb-1"
      >
        <span className="text-xs font-mono tracking-[0.15em] font-bold text-white/60 group-hover:text-white transition-colors uppercase">
          Control Panel
        </span>
        <span
          className={`text-white/40 group-hover:text-white/80 transition-transform duration-300 font-mono text-[9px] ${
            sidebarOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </div>

      {sidebarOpen && (
        <div className="flex flex-col gap-6 mt-5 animate-in fade-in duration-300 overflow-y-auto solar-system-scrollbar pr-1 max-h-[calc(70vh-80px)] md:max-h-[calc(80vh-80px)]">
          {/* Preset Selector */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
              PRESETS
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLoadPreset("full")}
                className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
              >
                Solar System
              </button>
              <button
                onClick={() => handleLoadPreset("inner")}
                className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
              >
                Rocky Planets
              </button>
              <button
                onClick={() => handleLoadPreset("outer")}
                className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
              >
                Giants
              </button>
              <button
                onClick={() => handleLoadPreset("empty")}
                className="px-3 py-2 text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg tracking-wider text-left transition-colors cursor-pointer"
              >
                Empty Star
              </button>
            </div>
          </div>

          {/* Engine Settings */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
              Visual Settings
            </h3>
            <div className="flex flex-col gap-3 font-mono text-[11px] text-white/70">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOrbits}
                  onChange={(e) => setShowOrbits(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 focus:ring-0 focus:ring-offset-0 text-white w-4 h-4 cursor-pointer"
                />
                Show Orbital Rings
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMoons}
                  onChange={(e) => setShowMoons(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 focus:ring-0 focus:ring-offset-0 text-white w-4 h-4 cursor-pointer"
                />
                Show Moons
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGlow}
                  onChange={(e) => setEnableGlow(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 focus:ring-0 focus:ring-offset-0 text-white w-4 h-4 cursor-pointer"
                />
                Enable Glow Effects
              </label>
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] text-white/40 uppercase">
                  Background
                </span>
                <select
                  value={bgTheme}
                  onChange={(e) => {
                    const theme = e.target.value;
                    if (theme === "stars" || theme === "stars_milky_way") {
                      setBgTheme(theme);
                    }
                  }}
                  className="bg-black/80 border border-white/15 px-2 py-1.5 rounded-lg text-xs font-mono w-full focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="stars">Default</option>
                  <option value="stars_milky_way">Milky Way</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between text-[10px] text-white/40 uppercase">
                  <label htmlFor="ambient-volume">Ambient Volume</label>
                  <span>{Math.round(ambientVolume * 100)}%</span>
                </div>
                <input
                  id="ambient-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
              </div>

              <button
                type="button"
                onClick={onExport}
                disabled={isGeneratingPng}
                className="mt-4 w-full py-3.5 bg-white/10 hover:bg-white/15 disabled:hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-[1.01] disabled:hover:scale-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait text-white disabled:text-white/70"
              >
                {isGeneratingPng ? (
                  <>
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    Generating PNG...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Download PNG
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Planet List */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
              CELESTIAL BODIES
            </h3>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto solar-system-scrollbar pr-1">
              {planets.filter((p: Planet) => p.id !== "preview-planet")
                .length === 0 ? (
                <span className="text-[10px] text-white/30 italic">
                  No celestial bodies in orbit
                </span>
              ) : (
                planets
                  .filter((p: Planet) => p.id !== "preview-planet")
                  .map((planet) => {
                    const isSelected = selectedPlanet?.id === planet.id;
                    return (
                      <div
                        key={planet.id}
                        onClick={() => setSelectedPlanet(planet)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-white/10 border-white/25 shadow-[0_0_4px_rgba(255,255,255,0.02)] text-white"
                            : "bg-black/25 border-white/5 hover:border-white/15 text-white/70 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Planet Icon */}
                          <div
                            className="w-6 h-6 rounded-full relative overflow-hidden bg-cover bg-center shrink-0 border border-white/10"
                            style={{
                              backgroundImage: `url(${TEXTURE_MAP[planet.textureKey]})`,
                            }}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0.6)_85%)]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-mono leading-tight">
                              {planet.name}
                            </span>
                            <span className="text-[8px] font-mono text-white/35 uppercase leading-none">
                              {planet.type}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlanet(planet.id);
                          }}
                          className="p-1 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                          title="Delete body"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Creation Section */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/60 mb-3 border-b border-white/5 pb-1">
              Planet Creator
            </h3>

            {isAdding ? (
              <form
                onSubmit={handleAddPlanet}
                className="flex flex-col gap-3 font-mono text-[11px] bg-white/5 p-3.5 rounded-xl border border-white/5 animate-in slide-in-from-top-4 duration-300"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/40">
                    Planet Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlanetName}
                    onChange={(e) => setNewPlanetName(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/40">Texture</label>
                    <select
                      value={newPlanetTexture}
                      onChange={(e) => {
                        const textureKey = e.target.value as SolarTextureKey;
                        setNewPlanetTexture(textureKey);
                        setNewPlanetType(getSuggestedPlanetType(textureKey));
                      }}
                      className="bg-black/80 border border-white/10 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer"
                    >
                      {TEXTURE_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/40">
                      Planet Type
                    </label>
                    <select
                      value={newPlanetType}
                      onChange={(e) => setNewPlanetType(e.target.value)}
                      className="bg-black/80 border border-white/10 rounded px-1.5 py-1 text-xs focus:outline-none cursor-pointer"
                    >
                      {TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <label className="text-[10px] text-white/40">
                      Planet Size ({newPlanetSize}px)
                    </label>
                    <span className="text-[9px] text-white/30">
                      Relative Scale
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="65"
                    value={newPlanetSize}
                    onChange={(e) => setNewPlanetSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <label className="text-[10px] text-white/40">
                      Orbit Radius ({Math.round(newPlanetOrbit / 2)}px)
                    </label>
                    <span className="text-[9px] text-white/30">Distance</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="850"
                    step="10"
                    value={newPlanetOrbit}
                    onChange={(e) =>
                      setNewPlanetOrbit(parseInt(e.target.value))
                    }
                    className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <label className="text-[10px] text-white/45">
                      Orbital Speed ({newPlanetDuration}s)
                    </label>
                    <span className="text-[9px] text-white/30">
                      Slower &rarr; Faster
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="120"
                    value={newPlanetDuration}
                    onChange={(e) =>
                      setNewPlanetDuration(parseInt(e.target.value))
                    }
                    className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 py-1.5 border-y border-white/5 my-1 text-[10px]">
                  <label
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                      newPlanetHasMoon
                        ? "bg-white/10 border-white/30 text-white shadow-[0_0_6px_rgba(255,255,255,0.06)]"
                        : "bg-black/35 border-white/10 text-white/55 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={newPlanetHasMoon}
                      onChange={(e) => setNewPlanetHasMoon(e.target.checked)}
                      className="sr-only"
                    />
                    Moon
                  </label>
                  <label
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer text-[10px] font-mono transition-all duration-300 ${
                      newPlanetHasRings
                        ? "bg-white/10 border-white/30 text-white shadow-[0_0_6px_rgba(255,255,255,0.06)]"
                        : "bg-black/35 border-white/10 text-white/55 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={newPlanetHasRings}
                      onChange={(e) => setNewPlanetHasRings(e.target.checked)}
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
                      value={newPlanetTemp}
                      onChange={(e) => setNewPlanetTemp(e.target.value)}
                      className="w-16 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[9px] text-white/40">
                    Description
                  </label>
                  <textarea
                    value={newPlanetDesc}
                    onChange={(e) => setNewPlanetDesc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 resize-y w-full font-sans leading-normal solar-system-scrollbar"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer text-white/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer text-white"
                  >
                    Create Planet
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={beginAdding}
                className="w-full py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Create a new Planet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
