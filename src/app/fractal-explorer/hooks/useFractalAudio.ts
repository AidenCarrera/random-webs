"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Filter, PingPongDelay, PolySynth, Reverb, Synth } from "tone";
import { DRONE_SCALES, PALETTE_SCALES } from "../constants";
import type { PaletteName } from "../types";

interface UseFractalAudioOptions {
  iterationsRef: RefObject<number>;
  paletteRef: RefObject<PaletteName>;
}

export function useFractalAudio({
  iterationsRef,
  paletteRef,
}: UseFractalAudioOptions) {
  const toneRef = useRef<typeof import("tone") | null>(null);
  const synthRef = useRef<PolySynth<Synth> | null>(null);
  const filterRef = useRef<Filter | null>(null);
  const delayRef = useRef<PingPongDelay | null>(null);
  const reverbRef = useRef<Reverb | null>(null);
  const lastNoteTimeRef = useRef(0);

  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState(0);

  const updateSynthForPalette = useCallback((palette: PaletteName) => {
    const synth = synthRef.current;
    if (!synth) return;

    try {
      const reverb = reverbRef.current;
      const delay = delayRef.current;

      switch (palette) {
        case "Neon":
          synth.set({ oscillator: { type: "sine" }, volume: -6 });
          if (reverb) reverb.decay = 2;
          if (delay) delay.feedback.value = 0.45;
          break;
        case "Solar":
          synth.set({ oscillator: { type: "sawtooth" }, volume: -13 });
          if (reverb) reverb.decay = 3;
          if (delay) delay.feedback.value = 0.35;
          break;
        case "Forest":
          synth.set({ oscillator: { type: "sine" }, volume: -6 });
          if (reverb) reverb.decay = 4;
          if (delay) delay.feedback.value = 0.3;
          break;
        case "Ocean":
          synth.set({ oscillator: { type: "sine" }, volume: -6 });
          if (reverb) reverb.decay = 10;
          if (delay) delay.feedback.value = 0.4;
          break;
        case "Spectrum":
          synth.set({ oscillator: { type: "triangle" }, volume: -8 });
          if (reverb) reverb.decay = 3.5;
          if (delay) delay.feedback.value = 0.5;
          break;
        case "Monochrome":
          synth.set({ oscillator: { type: "sine" }, volume: -6 });
          if (reverb) reverb.decay = 1.2;
          if (delay) delay.feedback.value = 0.15;
          break;
      }
    } catch (error) {
      console.error("Failed to update synth parameters for palette", error);
    }
  }, []);

  const initAudioEngine = useCallback(async () => {
    if (synthRef.current) return;
    setIsAudioLoading(true);
    setAudioLoadingProgress(10);

    const progressInterval = setInterval(() => {
      setAudioLoadingProgress((progress) =>
        progress >= 85
          ? progress
          : progress + Math.floor(Math.random() * 15) + 5,
      );
    }, 120);

    try {
      const Tone = await import("tone");
      toneRef.current = Tone;
      setAudioLoadingProgress(60);

      const filter = new Tone.Filter({ frequency: 800, type: "lowpass", Q: 1 });
      const reverb = new Tone.Reverb({
        decay: 3.5,
        preDelay: 0.01,
        wet: 0.35,
      }).toDestination();
      setAudioLoadingProgress(75);
      setAudioLoadingProgress(85);

      const delay = new Tone.PingPongDelay({
        delayTime: "8n.",
        feedback: 0.35,
        wet: 0.25,
      }).connect(reverb);
      const synth = new Tone.PolySynth(Tone.Synth, {
        volume: -6,
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.15,
          decay: 0.25,
          sustain: 0.8,
          release: 1.8,
        },
      }).connect(filter);

      filter.connect(delay);
      await Tone.start();

      synthRef.current = synth;
      filterRef.current = filter;
      delayRef.current = delay;
      reverbRef.current = reverb;
      setIsAudioReady(true);
      updateSynthForPalette(paletteRef.current);

      setAudioLoadingProgress(100);
      setIsAudioEnabled(true);
    } catch (error) {
      console.error("Failed to initialize Tone.js Audio Engine", error);
    } finally {
      clearInterval(progressInterval);
      setIsAudioLoading(false);
    }
  }, [paletteRef, updateSynthForPalette]);

  const sonifyCoordinate = useCallback(
    (cx: number, cy: number, iteration: number) => {
      const synth = synthRef.current;
      const filter = filterRef.current;
      if (
        !synth ||
        !filter ||
        !isAudioEnabled ||
        toneRef.current?.context?.state !== "running"
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastNoteTimeRef.current < 90) return;
      lastNoteTimeRef.current = now;

      const maxIterations = iterationsRef.current;
      const palette = paletteRef.current;
      const scale = PALETTE_SCALES[palette] || PALETTE_SCALES.Ocean;
      const drones = DRONE_SCALES[palette] || DRONE_SCALES.Ocean;

      if (iteration === maxIterations) {
        const index =
          Math.floor(Math.abs(cx * 1.5 + cy) * drones.length) % drones.length;
        filter.frequency.rampTo(400, 0.1);
        synth.triggerAttackRelease(drones[index], "2n", undefined, 0.05);
        return;
      }

      const depthPercentage = iteration / maxIterations;
      const scaleIndex = Math.min(
        scale.length - 1,
        Math.floor(depthPercentage * scale.length * 1.2),
      );
      const distance = Math.hypot(cx, cy);
      const filterCutoff = Math.min(
        2200,
        300 + distance * 1000 + depthPercentage * 800,
      );
      filter.frequency.rampTo(filterCutoff, 0.15);
      synth.triggerAttackRelease(
        scale[scaleIndex] || "C4",
        "4n",
        undefined,
        0.04 + (1 - depthPercentage) * 0.08,
      );
    },
    [isAudioEnabled, iterationsRef, paletteRef],
  );

  const toggleAudio = useCallback(async () => {
    if (!synthRef.current) {
      await initAudioEngine();
      return;
    }

    const tone = toneRef.current;
    if (!tone) return;

    if (tone.context.state === "suspended") {
      await tone.context.resume();
      setIsAudioEnabled(true);
      return;
    }

    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    if (!nextState) synthRef.current.releaseAll();
  }, [initAudioEngine, isAudioEnabled]);

  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!isAudioEnabled) return;

      if (!synthRef.current && !isAudioLoading) await initAudioEngine();
      if (toneRef.current?.context.state === "suspended") {
        try {
          await toneRef.current.context.resume();
        } catch (error) {
          console.error("Failed to resume Tone context:", error);
        }
      }

      if (toneRef.current?.context.state === "running") {
        window.removeEventListener("click", handleFirstInteraction);
        window.removeEventListener("keydown", handleFirstInteraction);
        window.removeEventListener("touchstart", handleFirstInteraction);
        window.removeEventListener("mousedown", handleFirstInteraction);
      }
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);
    window.addEventListener("mousedown", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("mousedown", handleFirstInteraction);
    };
  }, [initAudioEngine, isAudioEnabled, isAudioLoading]);

  useEffect(
    () => () => {
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      delayRef.current?.dispose();
      reverbRef.current?.dispose();
    },
    [],
  );

  return {
    audioLoadingProgress,
    initAudioEngine,
    isAudioEnabled,
    isAudioLoading,
    isAudioReady,
    setIsAudioEnabled,
    sonifyCoordinate,
    toggleAudio,
    updateSynthForPalette,
  };
}
