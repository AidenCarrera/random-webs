"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { DEFAULT_PRESET_ID, PRESETS } from "../data/presets";
import { useFullscreen } from "../hooks/use-fullscreen";
import { useLampPointer } from "../hooks/use-lamp-pointer";
import { useLavaSimulation } from "../hooks/use-lava-simulation";
import type { Preset, PresetId } from "../types";
import {
  generateBackgroundColors,
  generateLavaColors,
  hexToRgb,
} from "../utils/color";
import styles from "../styles.module.css";
import { LampControls } from "./lamp-controls";

export function LavaLamp() {
  const [presetId, setPresetId] = useState<PresetId>(DEFAULT_PRESET_ID);
  const [bubbleColor, setBubbleColor] = useState(PRESETS.ember.glow);
  const [liquidColor, setLiquidColor] = useState(PRESETS.ember.glass);
  const [isPaused, setIsPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const renderPreset = useMemo<Preset>(
    () => ({
      ...PRESETS[presetId],
      background: generateBackgroundColors(bubbleColor, liquidColor),
      glass: liquidColor,
      glow: bubbleColor,
      lava: generateLavaColors(bubbleColor),
    }),
    [bubbleColor, liquidColor, presetId],
  );
  const pageStyle = useMemo(
    () => createPageStyle(renderPreset),
    [renderPreset],
  );
  const { canvasRef, stageRef, geometryRef, blobsRef, pointerRef } =
    useLavaSimulation({
      presetId,
      renderPreset,
      isPaused,
      resetKey,
    });
  const pointer = useLampPointer({
    canvasRef,
    geometryRef,
    blobsRef,
    pointerRef,
  });
  const { isFullscreen, toggleFullscreen } = useFullscreen(stageRef);
  const isUsingExactPreset =
    bubbleColor === PRESETS[presetId].glow &&
    liquidColor === PRESETS[presetId].glass;

  const selectPreset = (nextPresetId: PresetId) => {
    const preset = PRESETS[nextPresetId];
    setPresetId(nextPresetId);
    setBubbleColor(preset.glow);
    setLiquidColor(preset.glass);
  };

  return (
    <main
      className={`${styles.root} flex h-svh min-h-svh flex-col overflow-hidden p-6 sm:p-8 md:p-12 pb-3 max-[700px]:p-0 lava-page ${isFullscreen ? "is-fullscreen" : ""}`}
      style={pageStyle}
    >
      <section
        ref={stageRef}
        className={`relative w-full max-w-270 flex-1 min-h-0 mx-auto overflow-visible select-none touch-none lamp-stage cursor-${pointer.cursorMode}`}
        onPointerDown={pointer.handlePointerDown}
        onPointerMove={pointer.handlePointerMove}
        onPointerUp={pointer.handlePointerUp}
        onPointerCancel={pointer.handlePointerUp}
        onPointerLeave={pointer.handlePointerLeave}
        onDragStart={(event) => event.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          draggable={false}
          aria-label="Interactive animated lava lamp"
        />

        <LampControls
          presetId={presetId}
          isUsingExactPreset={isUsingExactPreset}
          liquidColor={liquidColor}
          bubbleColor={bubbleColor}
          isPaused={isPaused}
          isFullscreen={isFullscreen}
          onSelectPreset={selectPreset}
          onLiquidColorChange={setLiquidColor}
          onBubbleColorChange={setBubbleColor}
          onTogglePaused={() => setIsPaused((value) => !value)}
          onReset={() => setResetKey((value) => value + 1)}
          onToggleFullscreen={toggleFullscreen}
        />
      </section>
    </main>
  );
}

function createPageStyle(preset: Preset): CSSProperties {
  const { r, g, b } = hexToRgb(preset.glow);
  const [backgroundA, backgroundB] = preset.background;

  return {
    "--bg-a": backgroundA,
    "--bg-b": backgroundB,
    "--accent": preset.glow,
    "--accent-soft": `rgba(${r}, ${g}, ${b}, 0.28)`,
    background: `
      radial-gradient(
        circle at 50% 28%,
        rgba(255, 255, 255, 0.07),
        transparent 38%
      ),
      radial-gradient(
        circle at 50% 25%,
        rgba(${r}, ${g}, ${b}, 0.28),
        transparent 48%
      ),
      linear-gradient(145deg, ${backgroundA}, ${backgroundB} 70%)
    `.replace(/\s+/g, " "),
  } as CSSProperties;
}
