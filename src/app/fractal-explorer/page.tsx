"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Download,
  RefreshCw,
  Settings,
  Sliders,
  Maximize2,
  Info,
  ChevronRight,
  ChevronLeft,
  Volume1,
  X,
} from "lucide-react";

// Types
type PaletteName =
  "Neon" | "Solar" | "Forest" | "Ocean" | "Spectrum" | "Monochrome";
type FractalMode = "mandelbrot" | "julia";

interface Landmark {
  name: string;
  description: string;
  cx: number;
  cy: number;
  zoom: number;
}

// Preset Landmarks
const LANDMARKS: Landmark[] = [
  {
    name: "Default View",
    description: "The standard overview of the fractal plane.",
    cx: -0.7,
    cy: 0.0,
    zoom: 1.0,
  },
  {
    name: "Seahorse Valley",
    description: "A region of spiraling structures resembling seahorses.",
    cx: -0.7436438870371587,
    cy: 0.13182590420531197,
    zoom: 80000,
  },
  {
    name: "Triple Spiral Valley",
    description: "A boundary junction with three-way rotational symmetry.",
    cx: -0.088,
    cy: 0.654,
    zoom: 15000,
  },
  {
    name: "Julia Island",
    description: "A detached filament structure in the outer region.",
    cx: -0.161,
    cy: 1.03,
    zoom: 5000,
  },
  {
    name: "Elephant Valley",
    description: "A coastal region where elephant-trunk-like shapes emerge.",
    cx: 0.275,
    cy: 0.0,
    zoom: 700,
  },
  {
    name: "Mini-Mandelbrot Star",
    description: "A self-similar copy of the Mandelbrot set.",
    cx: -1.75,
    cy: 0.0,
    zoom: 6000,
  },
];

// Scales mapped to visual palettes for synesthetic audio mapping
const PALETTE_SCALES: Record<PaletteName, string[]> = {
  Neon: [
    "C3",
    "D3",
    "E3",
    "G3",
    "A3",
    "C4",
    "D4",
    "E4",
    "G4",
    "A4",
    "C5",
    "D5",
    "E5",
    "G5",
    "A5",
    "C6",
    "D6",
    "E6",
    "G6",
    "A6",
  ],
  Solar: [
    "G3",
    "A3",
    "B3",
    "D4",
    "E4",
    "G4",
    "A4",
    "B4",
    "D5",
    "E5",
    "G5",
    "A5",
    "B5",
    "D6",
    "E6",
    "G6",
  ],
  Forest: [
    "A3",
    "C4",
    "D4",
    "E4",
    "G4",
    "A4",
    "C5",
    "D5",
    "E5",
    "G5",
    "A5",
    "C6",
    "D6",
    "E6",
    "G6",
    "A6",
  ],
  Ocean: [
    "F#3",
    "A3",
    "B3",
    "C#4",
    "E4",
    "F#4",
    "A4",
    "B4",
    "C#5",
    "E5",
    "F#5",
    "A5",
    "B5",
    "C#6",
    "E6",
    "F#6",
  ],
  Spectrum: [
    "D3",
    "E3",
    "F#3",
    "A3",
    "B3",
    "D4",
    "E4",
    "F#4",
    "A4",
    "B4",
    "D5",
    "E5",
    "F#5",
    "A5",
    "B5",
    "D6",
  ],
  Monochrome: [
    "D3",
    "F3",
    "G3",
    "A3",
    "C4",
    "D4",
    "F4",
    "G4",
    "A4",
    "C5",
    "D5",
    "F5",
    "G5",
    "A5",
    "C6",
    "D6",
  ],
};

const DRONE_SCALES: Record<PaletteName, string[]> = {
  Neon: ["C2", "G2", "C3", "F2"],
  Solar: ["G2", "D3", "G3", "C2"],
  Forest: ["A2", "E3", "A3", "D2"],
  Ocean: ["F#2", "C#3", "F#3", "B2"],
  Spectrum: ["D2", "A2", "D3", "G2"],
  Monochrome: ["D2", "A2", "D3", "F2"],
};

// Helper: Linear Interpolation for Palettes (used by the 2D mini Julia preview only)
function interpolatePalette(t: number, keyframes: number[][]): number[] {
  const n = keyframes.length - 1;
  const rawIdx = t * n;
  const idx = Math.min(n - 1, Math.floor(rawIdx));
  const frac = rawIdx - idx;
  const c1 = keyframes[idx];
  const c2 = keyframes[idx + 1];
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * frac),
    Math.round(c1[1] + (c2[1] - c1[1]) * frac),
    Math.round(c1[2] + (c2[2] - c1[2]) * frac),
  ];
}

// Helper: HSL to RGB (used by the 2D mini Julia preview only)
function hslToRgb(h: number, s: number, l: number): number[] {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Get RGB based on iteration metrics and selected palette (mini Julia preview only —
// the main fractal is colored inside the WebGL2 fragment shader below)
function getColor(
  iter: number,
  maxIterations: number,
  zr2: number,
  zi2: number,
  paletteName: PaletteName,
): number[] {
  if (iter === maxIterations) {
    return [3, 3, 10]; // Very dark background inside the set
  }

  const log_zn = Math.log(zr2 + zi2) / 2.0;
  const nu = iter + 1.0 - Math.log(log_zn / 0.693147) / 0.693147;
  let t = Math.max(0.0, Math.min(1.0, nu / maxIterations));

  t = Math.pow(t, 0.45);

  switch (paletteName) {
    case "Neon":
      return interpolatePalette(t, [
        [3, 3, 15],
        [41, 10, 80],
        [106, 13, 173],
        [240, 0, 120],
        [0, 240, 255],
        [3, 3, 15],
      ]);
    case "Solar":
      return interpolatePalette(t, [
        [2, 0, 4],
        [120, 0, 0],
        [240, 60, 0],
        [255, 200, 0],
        [255, 255, 220],
        [2, 0, 4],
      ]);
    case "Ocean":
      return interpolatePalette(t, [
        [0, 5, 20],
        [0, 40, 100],
        [0, 128, 160],
        [70, 220, 160],
        [200, 255, 240],
        [0, 5, 20],
      ]);
    case "Spectrum":
      const hue = (t * 360 * 3.5) % 360;
      return hslToRgb(hue, 100, 50);
    case "Monochrome":
      return interpolatePalette(t, [
        [0, 0, 0],
        [30, 30, 30],
        [110, 110, 110],
        [230, 230, 230],
        [255, 255, 255],
        [0, 0, 0],
      ]);
    case "Forest":
      return interpolatePalette(t, [
        [2, 10, 8],
        [15, 60, 25],
        [160, 140, 40],
        [140, 35, 160],
        [220, 180, 255],
        [2, 10, 8],
      ]);
    default:
      return [0, 0, 0];
  }
}

export default function FractalExplorer() {
  const router = useRouter();

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);

  // Math View Parameters (Refs for high performance rendering loop)
  const centerXRef = useRef<number>(-0.7);
  const centerYRef = useRef<number>(0.0);
  const zoomRef = useRef<number>(1.0);
  const iterationsRef = useRef<number>(120);
  const paletteRef = useRef<PaletteName>("Neon");
  const modeRef = useRef<FractalMode>("mandelbrot");

  // Julia specific seed coordinates
  const juliaCRef = useRef<[number, number]>([-0.7, 0.27015]);

  // Audio system state (loaded dynamically to bypass SSR)
  const toneRef = useRef<any>(null);
  const synthRef = useRef<any>(null);
  const filterRef = useRef<any>(null);
  const delayRef = useRef<any>(null);
  const reverbRef = useRef<any>(null);
  const lastNoteTimeRef = useRef<number>(0);

  // React State for Control Panels and Indicators
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [currentIterations, setCurrentIterations] = useState<number>(120);
  const [currentPalette, setCurrentPalette] = useState<PaletteName>("Neon");
  const [currentMode, setCurrentMode] = useState<FractalMode>("mandelbrot");

  // Display coordinates for UI tracking
  const [uiCoords, setUiCoords] = useState<{ r: number; i: number }>({
    r: -0.7,
    i: 0.0,
  });
  const [juliaCDisplay, setJuliaCDisplay] = useState<[number, number]>([
    -0.7, 0.27015,
  ]);
  const [isJuliaFrozen, setIsJuliaFrozen] = useState<boolean>(false);

  // Audio configuration state
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState<number>(0);

  // Layout Panels Visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [showWelcomePrompt, setShowWelcomePrompt] = useState<boolean>(true);
  const [activeLandmarkIndex, setActiveLandmarkIndex] = useState<number>(-1);

  // Interactive interaction states
  const isDraggingRef = useRef<boolean>(false);
  const startDragMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isAnimatingRef = useRef<boolean>(false);

  // Render control state to handle cancelation
  const renderIdRef = useRef<number>(0);
  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------
  // Progressive Drawing Pipeline
  // -------------------------------------------------------------

  // Immediate low-res rendering during panning or zooming
  const drawFastPreview = useCallback(() => {
    if (isAnimatingRef.current) return;
    const currentRenderId = ++renderIdRef.current;
    drawPass(8, currentRenderId);
  }, []);

  // Main rendering passes (draws low res to high res chunked)
  const triggerProgressiveRender = useCallback(() => {
    if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
    const currentRenderId = ++renderIdRef.current;

    // Pass 1: Render 4x4 pixel scaling (very fast)
    drawPass(4, currentRenderId, () => {
      // Pass 2: Render 2x2 pixel scaling (decent detail)
      drawPass(2, currentRenderId, () => {
        // Pass 3: Render 1x1 full resolution (Stripe-by-stripe to keep main thread completely unblocked)
        drawPassStriped(1, currentRenderId);
      });
    });
  }, []);

  const drawPass = (
    ratio: number,
    renderId: number,
    onComplete?: () => void,
  ) => {
    if (renderId !== renderIdRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // View calculations
    const widthInComplex = 3.0 / zoomRef.current;
    const heightInComplex = widthInComplex * (height / width);
    const cxMin = centerXRef.current - widthInComplex / 2;
    const cyMin = centerYRef.current - heightInComplex / 2;

    const maxIter = iterationsRef.current;
    const palette = paletteRef.current;
    const fractalMode = modeRef.current;
    const juliaC = juliaCRef.current;

    // Create downscaled canvas data
    const sw = Math.ceil(width / ratio);
    const sh = Math.ceil(height / ratio);

    if (sw <= 0 || sh <= 0) return;

    const imgData = ctx.createImageData(sw, sh);
    const data = imgData.data;

    for (let py = 0; py < sh; py++) {
      const cy = cyMin + py * ratio * (heightInComplex / height);
      for (let px = 0; px < sw; px++) {
        const cx = cxMin + px * ratio * (widthInComplex / width);

        let iter = 0;
        let zr = 0.0;
        let zi = 0.0;
        let zr2 = 0.0;
        let zi2 = 0.0;

        if (fractalMode === "mandelbrot") {
          while (zr2 + zi2 <= 4.0 && iter < maxIter) {
            zi = 2.0 * zr * zi + cy;
            zr = zr2 - zi2 + cx;
            zr2 = zr * zr;
            zi2 = zi * zi;
            iter++;
          }
        } else {
          zr = cx;
          zi = cy;
          zr2 = zr * zr;
          zi2 = zi * zi;
          while (zr2 + zi2 <= 4.0 && iter < maxIter) {
            zi = 2.0 * zr * zi + juliaC[1];
            zr = zr2 - zi2 + juliaC[0];
            zr2 = zr * zr;
            zi2 = zi * zi;
            iter++;
          }
        }

        const rgb = getColor(iter, maxIter, zr2, zi2, palette);
        const idx = (py * sw + px) * 4;
        data[idx] = rgb[0];
        data[idx + 1] = rgb[1];
        data[idx + 2] = rgb[2];
        data[idx + 3] = 255;
      }
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = sw;
    offscreen.height = sh;
    const offscreenCtx = offscreen.getContext("2d");
    if (offscreenCtx) {
      offscreenCtx.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, width, height);
    }

    if (onComplete) {
      drawTimerRef.current = setTimeout(onComplete, 16);
    }
  };

  const drawPassStriped = (ratio: number, renderId: number) => {
    if (renderId !== renderIdRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const widthInComplex = 3.0 / zoomRef.current;
    const heightInComplex = widthInComplex * (height / width);
    const cxMin = centerXRef.current - widthInComplex / 2;
    const cyMin = centerYRef.current - heightInComplex / 2;

    const maxIter = iterationsRef.current;
    const palette = paletteRef.current;
    const fractalMode = modeRef.current;
    const juliaC = juliaCRef.current;

    const numStripes = 10;
    const stripeHeight = Math.ceil(height / numStripes);
    let currentStripe = 0;

    const drawNextStripe = () => {
      if (renderId !== renderIdRef.current) return;

      const yStart = currentStripe * stripeHeight;
      const yEnd = Math.min(height, (currentStripe + 1) * stripeHeight);
      const currHeight = yEnd - yStart;

      if (currHeight <= 0) return;

      const imgData = ctx.createImageData(width, currHeight);
      const data = imgData.data;

      for (let py = 0; py < currHeight; py++) {
        const canvasY = yStart + py;
        const cy = cyMin + canvasY * (heightInComplex / height);
        for (let px = 0; px < width; px++) {
          const cx = cxMin + px * (widthInComplex / width);

          let iter = 0;
          let zr = 0.0;
          let zi = 0.0;
          let zr2 = 0.0;
          let zi2 = 0.0;

          if (fractalMode === "mandelbrot") {
            while (zr2 + zi2 <= 4.0 && iter < maxIter) {
              zi = 2.0 * zr * zi + cy;
              zr = zr2 - zi2 + cx;
              zr2 = zr * zr;
              zi2 = zi * zi;
              iter++;
            }
          } else {
            zr = cx;
            zi = cy;
            zr2 = zr * zr;
            zi2 = zi * zi;
            while (zr2 + zi2 <= 4.0 && iter < maxIter) {
              zi = 2.0 * zr * zi + juliaC[1];
              zr = zr2 - zi2 + juliaC[0];
              zr2 = zr * zr;
              zi2 = zi * zi;
              iter++;
            }
          }

          const rgb = getColor(iter, maxIter, zr2, zi2, palette);
          const idx = (py * width + px) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, yStart);

      currentStripe++;
      if (currentStripe < numStripes) {
        drawTimerRef.current = setTimeout(drawNextStripe, 10);
      }
    };

    drawNextStripe();
  };

  // Render Mini Julia Set Preview (for Mandelbrot Mode) — kept on 2D canvas,
  // cheap enough (130x130, 70 iterations) that it doesn't need the GPU path.
  const updateMiniJuliaPreview = (mx: number, my: number) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const jcReal = mx;
    const jcImag = my;
    const miniMaxIter = 70;

    const zoom = 1.25;
    const complexRange = 3.0 / zoom;

    for (let py = 0; py < size; py++) {
      const cy = -complexRange / 2 + py * (complexRange / size);
      for (let px = 0; px < size; px++) {
        const cx = -complexRange / 2 + px * (complexRange / size);

        let zr = cx;
        let zi = cy;
        let zr2 = zr * zr;
        let zi2 = zi * zi;
        let iter = 0;

        while (zr2 + zi2 <= 4.0 && iter < miniMaxIter) {
          zi = 2.0 * zr * zi + jcImag;
          zr = zr2 - zi2 + jcReal;
          zr2 = zr * zr;
          zi2 = zi * zi;
          iter++;
        }

        const rgb = getColor(iter, miniMaxIter, zr2, zi2, paletteRef.current);
        const idx = (py * size + px) * 4;
        data[idx] = rgb[0];
        data[idx + 1] = rgb[1];
        data[idx + 2] = rgb[2];
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // -------------------------------------------------------------
  // Tone.js Ambient Audio Engine
  // -------------------------------------------------------------

  const initAudioEngine = async () => {
    if (synthRef.current) return;
    setIsAudioLoading(true);
    setAudioLoadingProgress(10);

    const progressInterval = setInterval(() => {
      setAudioLoadingProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 120);

    try {
      const Tone = await import("tone");
      toneRef.current = Tone;
      setAudioLoadingProgress(60);

      const filter = new Tone.Filter({
        frequency: 800,
        type: "lowpass",
        Q: 1,
      });

      const reverb = new Tone.Reverb({
        decay: 3.5,
        preDelay: 0.01,
        wet: 0.35,
      }).toDestination();
      setAudioLoadingProgress(75);

      // Reverb buffer generates in the background, no need to block main threat initialization
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

      // Set refs only after context is running to prevent note queuing/bursts
      synthRef.current = synth;
      filterRef.current = filter;
      delayRef.current = delay;
      reverbRef.current = reverb;

      // Apply active palette sound settings
      updateSynthForPalette(paletteRef.current);

      setAudioLoadingProgress(100);
      setIsAudioEnabled(true);
    } catch (e) {
      console.error("Failed to initialize Tone.js Audio Engine", e);
    } finally {
      clearInterval(progressInterval);
      setIsAudioLoading(false);
    }
  };

  const handleSonifyCoordinate = (cx: number, cy: number, iter: number) => {
    if (
      !synthRef.current ||
      !isAudioEnabled ||
      toneRef.current?.context?.state !== "running"
    )
      return;
    const now = Date.now();

    if (now - lastNoteTimeRef.current < 90) return;
    lastNoteTimeRef.current = now;

    const maxIter = iterationsRef.current;
    const activePalette = paletteRef.current;
    const scale = PALETTE_SCALES[activePalette] || PALETTE_SCALES.Ocean;
    const drones = DRONE_SCALES[activePalette] || DRONE_SCALES.Ocean;

    if (iter === maxIter) {
      const index =
        Math.floor(Math.abs(cx * 1.5 + cy) * drones.length) % drones.length;
      const note = drones[index];

      filterRef.current.frequency.rampTo(400, 0.1);

      synthRef.current.triggerAttackRelease(note, "2n", undefined, 0.05);
    } else {
      const depthPct = iter / maxIter;
      const scaleIndex = Math.min(
        scale.length - 1,
        Math.floor(depthPct * scale.length * 1.2),
      );
      const note = scale[scaleIndex] || "C4";

      const dist = Math.hypot(cx, cy);
      const filterCutoff = Math.min(2200, 300 + dist * 1000 + depthPct * 800);
      filterRef.current.frequency.rampTo(filterCutoff, 0.15);

      const velocity = 0.04 + (1 - depthPct) * 0.08;
      synthRef.current.triggerAttackRelease(note, "4n", undefined, velocity);
    }
  };

  const toggleAudio = async () => {
    if (!synthRef.current) {
      await initAudioEngine();
    } else {
      if (toneRef.current.context.state === "suspended") {
        await toneRef.current.context.resume();
        setIsAudioEnabled(true);
      } else {
        const newState = !isAudioEnabled;
        setIsAudioEnabled(newState);
        if (!newState) {
          synthRef.current.releaseAll();
        }
      }
    }
  };

  // -------------------------------------------------------------
  // Preset Landmark Fly-through Animation
  // -------------------------------------------------------------

  const flyToLandmark = (landmark: Landmark, index: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setActiveLandmarkIndex(index);

    const startX = centerXRef.current;
    const startY = centerYRef.current;
    const startZoom = zoomRef.current;

    const duration = 1500; // 1.5 seconds cinematic zoom
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      centerXRef.current = startX + (landmark.cx - startX) * ease;
      centerYRef.current = startY + (landmark.cy - startY) * ease;

      zoomRef.current = Math.exp(
        Math.log(startZoom) +
          (Math.log(landmark.zoom) - Math.log(startZoom)) * ease,
      );

      // Full-resolution GPU render on every frame — no need for a low-res
      drawPass(6, ++renderIdRef.current);

      setUiCoords({ r: centerXRef.current, i: centerYRef.current });
      setZoomLevel(zoomRef.current);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        triggerProgressiveRender();
      }
    };

    requestAnimationFrame(animate);
  };

  // -------------------------------------------------------------
  // Event Listeners: Zooming and Panning
  // -------------------------------------------------------------

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimatingRef.current) return;
    isDraggingRef.current = true;
    startDragMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const widthInComplex = 3.0 / zoomRef.current;
    const heightInComplex = widthInComplex * (canvas.height / canvas.width);

    const mouseX =
      centerXRef.current +
      (px - canvas.width / 2) * (widthInComplex / canvas.width);
    const mouseY =
      centerYRef.current +
      (py - canvas.height / 2) * (heightInComplex / canvas.height);

    if (modeRef.current === "mandelbrot" && !isJuliaFrozen) {
      updateMiniJuliaPreview(mouseX, mouseY);
      setJuliaCDisplay([mouseX, mouseY]);
    }

    if (isDraggingRef.current) {
      const dx = e.clientX - startDragMouseRef.current.x;
      const dy = e.clientY - startDragMouseRef.current.y;
      startDragMouseRef.current = { x: e.clientX, y: e.clientY };

      centerXRef.current -= dx * (widthInComplex / canvas.width);
      centerYRef.current -= dy * (heightInComplex / canvas.height);

      setUiCoords({ r: centerXRef.current, i: centerYRef.current });
      drawFastPreview();
    } else {
      let iter = 0;
      let zr = 0.0;
      let zi = 0.0;
      let zr2 = 0.0;
      let zi2 = 0.0;
      const maxIter = iterationsRef.current;

      if (modeRef.current === "mandelbrot") {
        while (zr2 + zi2 <= 4.0 && iter < maxIter) {
          zi = 2.0 * zr * zi + mouseY;
          zr = zr2 - zi2 + mouseX;
          zr2 = zr * zr;
          zi2 = zi * zi;
          iter++;
        }
      } else {
        const jc = juliaCRef.current;
        zr = mouseX;
        zi = mouseY;
        zr2 = zr * zr;
        zi2 = zi * zi;
        while (zr2 + zi2 <= 4.0 && iter < maxIter) {
          zi = 2.0 * zr * zi + jc[1];
          zr = zr2 - zi2 + jc[0];
          zr2 = zr * zr;
          zi2 = zi * zi;
          iter++;
        }
      }

      if (isAudioEnabled && !synthRef.current && !isAudioLoading) {
        initAudioEngine();
      }
      handleSonifyCoordinate(mouseX, mouseY, iter);
    }
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      triggerProgressiveRender();
    }
  };

  // Zoom logic based on scroll/wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (isAnimatingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mousePx = e.clientX - rect.left;
    const mousePy = e.clientY - rect.top;

    const widthInComplex = 3.0 / zoomRef.current;
    const heightInComplex = widthInComplex * (canvas.height / canvas.width);

    const mouseCX =
      centerXRef.current +
      (mousePx - canvas.width / 2) * (widthInComplex / canvas.width);
    const mouseCY =
      centerYRef.current +
      (mousePy - canvas.height / 2) * (heightInComplex / canvas.height);

    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    const newZoom = Math.max(0.1, Math.min(1e15, zoomRef.current * factor));

    const newWidthInComplex = 3.0 / newZoom;
    const newHeightInComplex =
      newWidthInComplex * (canvas.height / canvas.width);

    centerXRef.current =
      mouseCX -
      (mousePx - canvas.width / 2) * (newWidthInComplex / canvas.width);
    centerYRef.current =
      mouseCY -
      (mousePy - canvas.height / 2) * (newHeightInComplex / canvas.height);
    zoomRef.current = newZoom;

    setZoomLevel(newZoom);
    setUiCoords({ r: centerXRef.current, i: centerYRef.current });
    drawFastPreview();
    if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
    drawTimerRef.current = setTimeout(triggerProgressiveRender, 150);
  };

  // Double click zooms into the clicked point
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimatingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const widthInComplex = 3.0 / zoomRef.current;
    const heightInComplex = widthInComplex * (canvas.height / canvas.width);

    const mouseCX =
      centerXRef.current +
      (px - canvas.width / 2) * (widthInComplex / canvas.width);
    const mouseCY =
      centerYRef.current +
      (py - canvas.height / 2) * (heightInComplex / canvas.height);

    const newZoom = zoomRef.current * 2.2;
    const newWidthInComplex = 3.0 / newZoom;
    const newHeightInComplex =
      newWidthInComplex * (canvas.height / canvas.width);

    centerXRef.current =
      mouseCX - (px - canvas.width / 2) * (newWidthInComplex / canvas.width);
    centerYRef.current =
      mouseCY - (py - canvas.height / 2) * (newHeightInComplex / canvas.height);
    zoomRef.current = newZoom;

    setZoomLevel(newZoom);
    setUiCoords({ r: centerXRef.current, i: centerYRef.current });
    drawFastPreview();
    triggerProgressiveRender();
  };

  // Click on main canvas Mandelbrot to freeze Julia constant or change it
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (modeRef.current === "mandelbrot") {
      setIsJuliaFrozen((f) => !f);
    }
  };

  // Enter Julia Mode using selected seed coordinate
  const enterJuliaModeWithSeed = () => {
    modeRef.current = "julia";
    juliaCRef.current = [juliaCDisplay[0], juliaCDisplay[1]];

    centerXRef.current = 0.0;
    centerYRef.current = 0.0;
    zoomRef.current = 1.0;

    setCurrentMode("julia");
    setZoomLevel(1.0);
    setUiCoords({ r: 0.0, i: 0.0 });

    triggerProgressiveRender();
  };

  // Return to Mandelbrot set
  const enterMandelbrotMode = () => {
    modeRef.current = "mandelbrot";
    centerXRef.current = -0.7;
    centerYRef.current = 0.0;
    zoomRef.current = 1.0;

    setCurrentMode("mandelbrot");
    setZoomLevel(1.0);
    setUiCoords({ r: -0.7, i: 0.0 });

    triggerProgressiveRender();
  };

  // Download high-resolution PNG of canvas
  const downloadFractalImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `fractal-${currentMode}-${currentPalette}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // -------------------------------------------------------------
  // Initial mounting, WebGL2 init & resize listeners
  // -------------------------------------------------------------

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const currentRenderId = ++renderIdRef.current;
      drawPass(8, currentRenderId, () => {
        triggerProgressiveRender();
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);

      // Cleanup synth sounds on navigation
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (filterRef.current) {
        filterRef.current.dispose();
      }
      if (delayRef.current) {
        delayRef.current.dispose();
      }
      if (reverbRef.current) {
        reverbRef.current.dispose();
      }
    };
  }, [triggerProgressiveRender]);

  // Initialize audio on first user gesture to comply with browser autoplay policies
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (isAudioEnabled) {
        if (!synthRef.current && !isAudioLoading) {
          await initAudioEngine();
        }
        if (toneRef.current && toneRef.current.context.state === "suspended") {
          try {
            await toneRef.current.context.resume();
          } catch (e) {
            console.error("Failed to resume Tone context:", e);
          }
        }
        if (toneRef.current && toneRef.current.context.state === "running") {
          window.removeEventListener("click", handleFirstInteraction);
          window.removeEventListener("keydown", handleFirstInteraction);
          window.removeEventListener("touchstart", handleFirstInteraction);
          window.removeEventListener("mousedown", handleFirstInteraction);
        }
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
  }, [isAudioEnabled, isAudioLoading]);

  // Adjust parameters when slider inputs change
  const handleIterationChange = (newVal: number) => {
    iterationsRef.current = newVal;
    setCurrentIterations(newVal);
    triggerProgressiveRender();
  };

  const updateSynthForPalette = (palette: PaletteName) => {
    if (!synthRef.current) return;

    try {
      const synth = synthRef.current;
      const reverb = reverbRef.current;
      const delay = delayRef.current;

      switch (palette) {
        case "Neon":
          synth.set({
            oscillator: { type: "sine" },
            volume: -6,
          });
          if (reverb) reverb.decay = 2.0;
          if (delay) delay.feedback.value = 0.45;
          break;
        case "Solar":
          synth.set({
            oscillator: { type: "sawtooth" },
            volume: -13,
          });
          if (reverb) reverb.decay = 3.0;
          if (delay) delay.feedback.value = 0.35;
          break;
        case "Forest":
          synth.set({
            oscillator: { type: "sine" },
            volume: -6,
          });
          if (reverb) reverb.decay = 4.0;
          if (delay) delay.feedback.value = 0.3;
          break;
        case "Ocean":
          synth.set({
            oscillator: { type: "sine" },
            volume: -6,
          });
          if (reverb) reverb.decay = 10.0;
          if (delay) delay.feedback.value = 0.4;
          break;
        case "Spectrum":
          synth.set({
            oscillator: { type: "triangle" },
            volume: -8,
          });
          if (reverb) reverb.decay = 3.5;
          if (delay) delay.feedback.value = 0.5;
          break;
        case "Monochrome":
          synth.set({
            oscillator: { type: "sine" },
            volume: -6,
          });
          if (reverb) reverb.decay = 1.2;
          if (delay) delay.feedback.value = 0.15;
          break;
      }
    } catch (e) {
      console.error("Failed to update synth parameters for palette", e);
    }
  };

  const handlePaletteChange = (palette: PaletteName) => {
    paletteRef.current = palette;
    setCurrentPalette(palette);
    updateSynthForPalette(palette);

    if (modeRef.current === "mandelbrot") {
      updateMiniJuliaPreview(juliaCDisplay[0], juliaCDisplay[1]);
    }
    triggerProgressiveRender();
  };

  // Update slider variables for manual Julia Constant adjusting
  const handleJuliaCSlider = (val: number, isImaginary: boolean) => {
    const updated: [number, number] = isImaginary
      ? [juliaCRef.current[0], val]
      : [val, juliaCRef.current[1]];

    juliaCRef.current = updated;
    setJuliaCDisplay(updated);
    triggerProgressiveRender();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* Dynamic Background Shader / Main Rendering Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={handleCanvasClick}
        className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing block animate-fade-in duration-300"
      />

      {/* Modern Neon Glow Overlays (Borders) */}
      <div className="absolute inset-0 border border-zinc-900 pointer-events-none z-10" />

      {/* -------------------------------------------------------------
          Coordinates Overlay & Stats Panel (Bottom-Left)
          ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCoordinates && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-4 pointer-events-none z-30 flex flex-col gap-2"
          >
            <div className="px-4 py-3 bg-zinc-950/85 border border-zinc-800/70 text-zinc-400 rounded-xl backdrop-blur-md shadow-xl text-[10px] font-mono leading-relaxed max-w-[280px]">
              <div className="text-zinc-500 uppercase font-black tracking-widest text-[9px] mb-1.5 border-b border-zinc-800/50 pb-1">
                <span>Coordinates</span>
              </div>
              <div>
                <span className="text-zinc-500">Real:</span>{" "}
                {uiCoords.r.toFixed(10)}
              </div>
              <div>
                <span className="text-zinc-500">Imag:</span>{" "}
                {uiCoords.i.toFixed(10)}
              </div>
              <div className="flex gap-4 mt-1 border-t border-zinc-900 pt-1">
                <div>
                  <span className="text-zinc-500 font-sans">Zoom:</span>{" "}
                  {zoomLevel < 1000
                    ? zoomLevel.toFixed(1)
                    : zoomLevel.toExponential(2)}
                  x
                </div>
                <div>
                  <span className="text-zinc-500 font-sans">Iter:</span>{" "}
                  {currentIterations}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          Interactive Sidebar Control Panel (Right Side)
          ------------------------------------------------------------- */}
      <div className="absolute right-4 top-4 bottom-4 w-80 pointer-events-none z-30 flex flex-col justify-start items-end gap-3">
        {/* Floating Settings Trigger (only shown when closed) */}
        <AnimatePresence>
          {!isSettingsOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setIsSettingsOpen(true)}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Settings className="w-4 h-4 text-purple-400" />
              <span>Settings</span>
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
              className="w-full flex-1 pointer-events-auto flex flex-col bg-zinc-950/85 border border-zinc-800/80 rounded-2xl backdrop-blur-md shadow-2xl overflow-y-auto max-h-[85vh] p-5 text-zinc-200"
            >
              <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3 mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Settings
                </h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={downloadFractalImage}
                    title="Export Fractal PNG"
                    className="p-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 rounded-md text-purple-300 hover:text-purple-100 transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    title="Close Settings"
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SECTION: FRACTAL SELECTION */}
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                  Fractal Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={enterMandelbrotMode}
                    className={`py-1.5 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                      currentMode === "mandelbrot"
                        ? "bg-purple-950/40 border-purple-500/50 text-purple-300"
                        : "bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900"
                    }`}
                  >
                    Mandelbrot
                  </button>
                  <button
                    onClick={enterJuliaModeWithSeed}
                    className={`py-1.5 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                      currentMode === "julia"
                        ? "bg-purple-950/40 border-purple-500/50 text-purple-300"
                        : "bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900"
                    }`}
                  >
                    Julia Set
                  </button>
                </div>
              </div>

              {/* SECTION: RENDER QUALITY (ITERATIONS) */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Depth Complexity
                  </label>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {currentIterations}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1200"
                  step="10"
                  value={currentIterations}
                  onChange={(e) =>
                    handleIterationChange(Number(e.target.value))
                  }
                  className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white hover:[&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.7)] [&::-webkit-slider-thumb]:transition-all active:[&::-webkit-slider-thumb]:scale-90 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white hover:[&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.7)] [&::-moz-range-thumb]:transition-all active:[&::-moz-range-thumb]:scale-90"
                />
                <p className="text-[9px] text-zinc-500 mt-1">
                  Higher complexity increases detail but slows rendering.
                </p>
              </div>

              {/* SECTION: COLOR SCHEME */}
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Color Palette
                </label>
                <select
                  value={currentPalette}
                  onChange={(e) =>
                    handlePaletteChange(e.target.value as PaletteName)
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
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
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                  Preferences
                </label>
                <div className="flex flex-col gap-3 pointer-events-auto">
                  {/* Audio Sonification */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300">
                        Audio
                      </span>
                      <button
                        onClick={toggleAudio}
                        disabled={isAudioLoading}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                          isAudioEnabled ? "bg-purple-600" : "bg-zinc-800"
                        } ${isAudioLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isAudioLoading ? (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                          </span>
                        ) : (
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              isAudioEnabled
                                ? "translate-x-4.5"
                                : "translate-x-1"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                    {isAudioLoading && (
                      <div className="w-full bg-zinc-900 border border-zinc-800/80 rounded-full h-1.5 overflow-hidden relative">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                          style={{ width: `${audioLoadingProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Show Coordinates */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      Show Coordinates
                    </span>
                    <button
                      onClick={() => setShowCoordinates(!showCoordinates)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        showCoordinates ? "bg-purple-600" : "bg-zinc-800"
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
                <div className="border-t border-zinc-900 pt-4 mb-4">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                    Julia Seed Finder
                  </label>
                  <div className="relative flex justify-center bg-black/40 border border-zinc-900 rounded-xl p-3 mb-2.5 overflow-hidden">
                    <canvas
                      ref={miniCanvasRef}
                      width={130}
                      height={130}
                      className="rounded-lg shadow-lg border border-zinc-800"
                    />

                    <button
                      onClick={() => setIsJuliaFrozen(!isJuliaFrozen)}
                      className={`absolute bottom-2.5 right-2.5 p-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                        isJuliaFrozen
                          ? "bg-purple-600 border border-purple-500 text-white"
                          : "bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {isJuliaFrozen ? "Seed Locked" : "Lock Seed"}
                    </button>
                  </div>

                  <div className="text-[9.5px] font-mono leading-relaxed text-zinc-400 bg-zinc-900/40 p-2 border border-zinc-900 rounded-lg">
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
                    className="w-full mt-3 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-[0_4px_12px_rgba(168,85,247,0.3)] cursor-pointer"
                  >
                    Render Selected Julia Set
                  </button>
                </div>
              ) : (
                // Julia Mode controls: Sliders to adjust seed values manually
                <div className="border-t border-zinc-900 pt-4 mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      Seed Constant R (c_r)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {juliaCDisplay[0].toFixed(4)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.001"
                    value={juliaCDisplay[0]}
                    onChange={(e) =>
                      handleJuliaCSlider(Number(e.target.value), false)
                    }
                    className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white hover:[&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.7)] [&::-webkit-slider-thumb]:transition-all active:[&::-webkit-slider-thumb]:scale-90 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white hover:[&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.7)] [&::-moz-range-thumb]:transition-all active:[&::-moz-range-thumb]:scale-90"
                  />

                  <div className="flex justify-between items-center mt-3 mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      Seed Constant I (c_i)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {juliaCDisplay[1].toFixed(4)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.001"
                    value={juliaCDisplay[1]}
                    onChange={(e) =>
                      handleJuliaCSlider(Number(e.target.value), true)
                    }
                    className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white hover:[&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.7)] [&::-webkit-slider-thumb]:transition-all active:[&::-webkit-slider-thumb]:scale-90 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white hover:[&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.7)] [&::-moz-range-thumb]:transition-all active:[&::-moz-range-thumb]:scale-90"
                  />

                  <button
                    onClick={enterMandelbrotMode}
                    className="w-full mt-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 active:scale-95 text-zinc-200 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer"
                  >
                    Back to Mandelbrot Overview
                  </button>
                </div>
              )}

              {/* LANDMARKS GALLERY */}
              <div className="border-t border-zinc-900 pt-4 flex-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2.5">
                  Coordinate Landmarks
                </label>
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[22vh] pr-1">
                  {LANDMARKS.filter(
                    (lm) =>
                      currentMode === "mandelbrot" ||
                      lm.name === "Default View",
                  ).map((landmark, idx) => (
                    <button
                      key={landmark.name}
                      onClick={() => flyToLandmark(landmark, idx)}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        activeLandmarkIndex === idx
                          ? "bg-purple-950/30 border-purple-500/40"
                          : "bg-zinc-900/30 border-zinc-900/60 hover:bg-zinc-900/70"
                      }`}
                    >
                      <span className="text-[11px] font-black uppercase text-zinc-200">
                        {landmark.name}
                      </span>
                      <span className="text-[9px] text-zinc-500 leading-normal line-clamp-1 mt-0.5">
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

      {/* Welcome Audio Prompt Modal */}
      <AnimatePresence>
        {showWelcomePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="max-w-md w-full bg-zinc-950/95 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl text-center text-zinc-200"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-950/50 border border-purple-500/30 rounded-full text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse">
                  <Volume2 className="w-6 h-6" />
                </div>
              </div>
              <h1 className="text-sm font-black uppercase tracking-widest text-zinc-100 mb-2">
                Fractal Audio
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                This fractal explorer generates real-time audio based on its
                coordinates. Changing the color palette changes the tone of the
                synth. Would you like to enable audio?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    initAudioEngine();
                    setIsAudioEnabled(true);
                    setShowWelcomePrompt(false);
                  }}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider text-[10px] rounded-xl shadow-[0_4px_12px_rgba(168,85,247,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Enable Audio
                </button>
                <button
                  onClick={() => {
                    setIsAudioEnabled(false);
                    setShowWelcomePrompt(false);
                  }}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  Explore Silently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
