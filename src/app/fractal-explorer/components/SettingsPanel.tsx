"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Download,
  Maximize2,
  RefreshCw,
  Sliders,
  Volume1,
  VolumeX,
  X,
} from "lucide-react";
import {
  CPU_MAX_ITERATIONS,
  JULIA_SEED_ADJUST_RANGE,
  JULIA_SEED_STEP,
  LANDMARKS,
  MAX_RENDER_ITERATIONS,
  PALETTE_GRADIENTS,
} from "../constants";
import type { FractalExplorerController } from "../hooks/useFractalExplorer";
import type { PaletteName } from "../types";

interface SettingsPanelProps {
  explorer: FractalExplorerController;
}

export function SettingsPanel({ explorer }: SettingsPanelProps) {
  const {
    activeLandmarkIndex,
    audioLoadingProgress,
    currentIterations,
    currentMode,
    currentPalette,
    downloadFractalImage,
    enterJuliaModeWithSeed,
    enterMandelbrotMode,
    flyToLandmark,
    handleIterationChange,
    handleJuliaCSlider,
    handlePaletteChange,
    isAudioEnabled,
    isAudioLoading,
    isCpuRenderActive,
    isJuliaFrozen,
    isSettingsOpen,
    juliaCDisplay,
    juliaCLocked,
    miniCanvasRef,
    resetJuliaSeedToLocked,
    setIsJuliaFrozen,
    setIsSettingsOpen,
    setShowCoordinates,
    showCoordinates,
    toggleAudio,
  } = explorer;

  return (
    <div className="absolute right-3 top-3 bottom-3 sm:right-6 sm:top-6 sm:bottom-6 w-[min(21.5rem,calc(100vw-1.5rem))] sm:w-86 pointer-events-none z-30 flex flex-col justify-start items-end gap-3">
      {/* Floating Settings Trigger (only shown when closed) */}
      <AnimatePresence>
        {!isSettingsOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className="group pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/[0.14] bg-[#0a0b1c]/76 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-200 shadow-[0_16px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-[#11122a]/88 active:scale-95 sm:px-4 sm:text-xs cursor-pointer"
          >
            <Sliders className="size-4 text-violet-300 transition-transform duration-300 group-hover:rotate-90" />
            <span>Settings</span>
            <ChevronRight className="size-3.5 text-zinc-500" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Collapsible Panel content */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fractal-scrollbar w-full flex-1 pointer-events-auto flex flex-col overflow-y-auto max-h-[74vh] sm:max-h-[86vh] rounded-[1.45rem] border border-white/13 bg-[#0a0b1b]/82 p-4 text-zinc-200 shadow-[0_24px_70px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl sm:p-5 touch-pan-y"
          >
            <div className="mb-4 flex items-start justify-between border-b border-white/9 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.08)]">
                    <Sliders className="size-3.5" />
                  </span>
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-50">
                    Settings
                  </h2>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={downloadFractalImage}
                  title="Export Fractal PNG"
                  className="rounded-lg border border-violet-300/25 bg-violet-400/10 p-2 text-violet-200 transition-all hover:border-violet-200/45 hover:bg-violet-400/20 hover:text-white cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  title="Close Settings"
                  className="rounded-lg border border-white/9 bg-white/4 p-2 text-zinc-500 transition-colors hover:bg-white/9 hover:text-zinc-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SECTION: FRACTAL SELECTION */}
            <div className="mb-3.5 rounded-xl border border-white/8 bg-white/2.5 p-3">
              <label className="mb-2.5 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                <span>Fractal Type</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-black/20 p-1">
                <button
                  onClick={enterMandelbrotMode}
                  className={`py-2 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-md border transition-all cursor-pointer ${
                    currentMode === "mandelbrot"
                      ? "border-violet-300/30 bg-violet-400/15 text-violet-100 shadow-[0_4px_12px_rgba(124,58,237,0.14)]"
                      : "border-transparent text-zinc-500 hover:bg-white/6 hover:text-zinc-300"
                  }`}
                >
                  Mandelbrot
                </button>
                <button
                  onClick={enterJuliaModeWithSeed}
                  className={`py-2 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-md border transition-all cursor-pointer ${
                    currentMode === "julia"
                      ? "border-violet-300/30 bg-violet-400/15 text-violet-100 shadow-[0_4px_12px_rgba(124,58,237,0.14)]"
                      : "border-transparent text-zinc-500 hover:bg-white/6 hover:text-zinc-300"
                  }`}
                >
                  Julia Set
                </button>
              </div>
            </div>

            {/* SECTION: RENDER QUALITY (ITERATIONS) */}
            <div className="mb-3.5 rounded-xl border border-white/8 bg-white/2.5 p-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Depth Complexity
                </label>
                <span className="rounded-md border border-white/8 bg-black/20 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-200">
                  {currentIterations}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max={MAX_RENDER_ITERATIONS}
                step="20"
                value={currentIterations}
                onChange={(e) => handleIterationChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800/80 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-300 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#17172b] hover:[&::-webkit-slider-thumb]:bg-violet-200 [&::-webkit-slider-thumb]:transition-all active:[&::-webkit-slider-thumb]:scale-90 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-300 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#17172b]"
              />
              {isCpuRenderActive && (
                <p className="mt-1.5 text-[9px] font-medium text-amber-200/85">
                  CPU precision mode active. Depth is capped at{" "}
                  {CPU_MAX_ITERATIONS}.
                </p>
              )}
              <p className="mt-1.5 text-[9px] leading-relaxed text-zinc-500">
                Higher complexity increases detail but slows rendering.
              </p>
            </div>

            {/* SECTION: COLOR SCHEME */}
            <div className="mb-3.5 rounded-xl border border-white/8 bg-white/2.5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Color Preview
                </label>
              </div>
              <div
                className="mb-2 h-1.5 w-full rounded-full opacity-80 shadow-[0_0_10px_rgba(167,139,250,0.08)]"
                style={{ backgroundImage: PALETTE_GRADIENTS[currentPalette] }}
              />
              <select
                value={currentPalette}
                onChange={(e) =>
                  handlePaletteChange(e.target.value as PaletteName)
                }
                className="w-full rounded-lg border border-white/9 bg-black/25 px-2.5 py-2 text-xs font-medium text-zinc-300 outline-none transition-colors focus:border-violet-300/45 cursor-pointer"
              >
                <option value="Neon">Neon</option>
                <option value="Solar">Solar</option>
                <option value="Forest">Forest</option>
                <option value="Ocean">Ocean</option>
                <option value="Spectrum">Spectrum</option>
                <option value="Monochrome">Monochrome</option>
              </select>
            </div>

            {/* SECTION: PREFERENCES */}
            <div className="mb-3.5 rounded-xl border border-white/8 bg-white/2.5 p-3">
              <label className="mb-2.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Preferences
              </label>
              <div className="flex flex-col gap-1.5 pointer-events-auto">
                {/* Audio Sonification */}
                <div className="flex flex-col gap-1.5 rounded-lg bg-black/20 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                      {isAudioEnabled ? (
                        <Volume1 className="size-3.5 text-violet-300" />
                      ) : (
                        <VolumeX className="size-3.5 text-zinc-600" />
                      )}
                      Audio
                    </span>
                    <button
                      onClick={toggleAudio}
                      disabled={isAudioLoading}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        isAudioEnabled ? "bg-violet-500" : "bg-zinc-800/90"
                      } ${isAudioLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isAudioLoading ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                        </span>
                      ) : (
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            isAudioEnabled ? "translate-x-4.5" : "translate-x-1"
                          }`}
                        />
                      )}
                    </button>
                  </div>
                  {isAudioLoading && (
                    <div className="w-full bg-zinc-900/80 border border-white/6 rounded-full h-1.5 overflow-hidden relative">
                      <div
                        className="bg-violet-400 h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_6px_rgba(196,181,253,0.28)]"
                        style={{ width: `${audioLoadingProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Show Coordinates */}
                <div className="flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Maximize2 className="size-3.5 text-cyan-200/80" />
                    Show Coordinates
                  </span>
                  <button
                    onClick={() => setShowCoordinates(!showCoordinates)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showCoordinates ? "bg-violet-500" : "bg-zinc-800/90"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showCoordinates ? "translate-x-4.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION: FRACTAL SPECIFIC CONTROLS */}
            {currentMode === "mandelbrot" ? (
              // Mandelbrot: Show interactive Julia seed generator
              <div className="mb-3.5 rounded-xl border border-violet-300/13 bg-[linear-gradient(135deg,rgba(124,58,237,0.10),rgba(255,255,255,0.025)_50%)] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/75">
                    Julia Seed Finder
                  </label>
                </div>
                <p className="mb-2.5 text-[9px] leading-relaxed text-zinc-500">
                  Click or tap the canvas to lock the seed. Drag to pan without
                  locking.
                </p>
                <div className="relative mb-2.5 flex justify-center overflow-hidden rounded-xl border border-white/8 bg-black/35 p-3 shadow-inner">
                  <canvas
                    ref={miniCanvasRef}
                    width={130}
                    height={130}
                    className="rounded-lg border border-white/11 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
                  />

                  <button
                    onClick={() => setIsJuliaFrozen(!isJuliaFrozen)}
                    className={`absolute bottom-2.5 right-2.5 rounded-md px-1.5 py-1 text-[8px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      isJuliaFrozen
                        ? "border border-violet-300/45 bg-violet-500 text-white"
                        : "border border-white/10 bg-[#101124]/90 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {isJuliaFrozen ? "Seed Locked" : "Lock Seed"}
                  </button>
                </div>

                <div className="rounded-lg border border-white/[0.07] bg-black/20 p-2 text-[9.5px] font-mono leading-relaxed text-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Seed c_r:</span>
                    <span>{juliaCDisplay[0].toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Seed c_i:</span>
                    <span>{juliaCDisplay[1].toFixed(5)}</span>
                  </div>
                </div>

                <button
                  onClick={enterJuliaModeWithSeed}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-300/35 bg-violet-500 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition-all hover:bg-violet-400 active:scale-[0.98] cursor-pointer"
                >
                  Render Selected Julia Set
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            ) : (
              // Julia Mode controls: Sliders to adjust seed values manually
              <div className="mb-3.5 rounded-xl border border-violet-300/13 bg-[linear-gradient(135deg,rgba(124,58,237,0.10),rgba(255,255,255,0.025)_50%)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/75">
                    Seed Constants
                  </label>
                  <button
                    onClick={resetJuliaSeedToLocked}
                    className="flex items-center gap-1 rounded-md border border-white/9 bg-black/20 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-400 transition-all hover:bg-white/[0.07] hover:text-zinc-200 cursor-pointer"
                    title={`Reset to c = ${juliaCLocked[0].toFixed(6)} + ${juliaCLocked[1].toFixed(6)}i`}
                  >
                    <RefreshCw size={10} />
                    Reset Seed
                  </button>
                </div>
                <p className="text-[9px] text-zinc-500 leading-relaxed mb-3">
                  Fine-tune around the selected seed (±
                  {JULIA_SEED_ADJUST_RANGE}). Locked:{" "}
                  {juliaCLocked[0].toFixed(5)} + {juliaCLocked[1].toFixed(5)}i
                </p>

                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Seed Constant R (c_r)
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {juliaCDisplay[0].toFixed(6)}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.max(
                    -2.0,
                    juliaCLocked[0] - JULIA_SEED_ADJUST_RANGE,
                  )}
                  max={Math.min(2.0, juliaCLocked[0] + JULIA_SEED_ADJUST_RANGE)}
                  step={JULIA_SEED_STEP}
                  value={juliaCDisplay[0]}
                  onChange={(e) =>
                    handleJuliaCSlider(Number(e.target.value), false)
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800/80 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-300 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#17172b] hover:[&::-webkit-slider-thumb]:bg-violet-200 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-300 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#17172b]"
                />

                <div className="flex justify-between items-center mt-3 mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Seed Constant I (c_i)
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {juliaCDisplay[1].toFixed(6)}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.max(
                    -2.0,
                    juliaCLocked[1] - JULIA_SEED_ADJUST_RANGE,
                  )}
                  max={Math.min(2.0, juliaCLocked[1] + JULIA_SEED_ADJUST_RANGE)}
                  step={JULIA_SEED_STEP}
                  value={juliaCDisplay[1]}
                  onChange={(e) =>
                    handleJuliaCSlider(Number(e.target.value), true)
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800/80 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-300 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#17172b] hover:[&::-webkit-slider-thumb]:bg-violet-200 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-300 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#17172b]"
                />

                <button
                  onClick={enterMandelbrotMode}
                  className="mt-4 w-full rounded-lg border border-white/10 bg-black/25 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-300 transition-all hover:border-white/18 hover:bg-white/[0.07] active:scale-[0.98] cursor-pointer"
                >
                  Back to Mandelbrot Overview
                </button>
              </div>
            )}

            {/* LANDMARKS GALLERY */}
            <div className="mt-auto rounded-xl border border-white/8 bg-white/2.5 p-3">
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Coordinate Landmarks
                </label>
              </div>
              <div className="fractal-scrollbar flex max-h-[22vh] flex-col gap-1.5 overflow-y-auto pr-1">
                {LANDMARKS.filter(
                  (lm) =>
                    currentMode === "mandelbrot" || lm.name === "Default View",
                ).map((landmark, idx) => (
                  <button
                    key={landmark.name}
                    onClick={() => flyToLandmark(landmark, idx)}
                    className={`group flex flex-col items-start rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      activeLandmarkIndex === idx
                        ? "border-violet-300/30 bg-violet-400/12 shadow-[inset_2px_0_0_rgba(196,181,253,0.9)]"
                        : "border-white/6 bg-black/15 hover:border-white/13 hover:bg-white/5.5"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-200">
                      {landmark.name}
                    </span>
                    <span className="mt-0.5 line-clamp-1 text-[9px] leading-normal text-zinc-500 group-hover:text-zinc-400">
                      {landmark.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
