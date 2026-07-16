import { useEffect, useLayoutEffect, useRef } from "react";

import { PRESETS } from "../data/presets";
import { createBlobs, syncBlobCount, updateBlobs } from "../lib/blob-physics";
import { createLampRenderer } from "../lib/renderer";
import type { Blob, Geometry, PointerState, Preset, PresetId } from "../types";
import { makeGeometry } from "../utils/geometry";

type UseLavaSimulationOptions = {
  presetId: PresetId;
  renderPreset: Preset;
  isPaused: boolean;
  resetKey: number;
};

export function useLavaSimulation({
  presetId,
  renderPreset,
  isPaused,
  resetKey,
}: UseLavaSimulationOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const geometryRef = useRef<Geometry | null>(null);
  const blobsRef = useRef<Blob[]>([]);
  const pointerRef = useRef<PointerState>({
    active: false,
    down: false,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
  });
  const pausedRef = useRef(isPaused);
  const renderPresetRef = useRef(renderPreset);
  const physicsPresetRef = useRef(PRESETS[presetId]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    renderPresetRef.current = renderPreset;
  }, [renderPreset]);

  useEffect(() => {
    physicsPresetRef.current = PRESETS[presetId];
    syncBlobCount(blobsRef.current, PRESETS[presetId]);
  }, [presetId]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const renderer = createLampRenderer(context);
    if (!renderer) return;

    const blobs = createBlobs(physicsPresetRef.current);
    blobsRef.current = blobs;
    let animationFrame = 0;
    let previousTime = performance.now();
    let viewport = { width: 1, height: 1, dpr: 1 };

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      viewport = {
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      };
      canvas.width = Math.round(viewport.width * viewport.dpr);
      canvas.height = Math.round(viewport.height * viewport.dpr);
      context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);

      const geometry = makeGeometry(viewport.width, viewport.height);
      geometryRef.current = geometry;
      renderer.resize(geometry);
    };

    const draw = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.034);
      previousTime = time;
      const geometry = geometryRef.current;

      if (geometry) {
        if (!pausedRef.current) {
          updateBlobs({
            blobs,
            geometry,
            pointer: pointerRef.current,
            preset: physicsPresetRef.current,
            delta,
            elapsed: time,
          });
        }
        renderer.draw(geometry, renderPresetRef.current, blobs, viewport);
      }

      animationFrame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      if (blobsRef.current === blobs) blobsRef.current = [];
    };
  }, [resetKey]);

  return { canvasRef, stageRef, geometryRef, blobsRef, pointerRef };
}
