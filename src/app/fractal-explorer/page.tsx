"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Download,
  RefreshCw,
  Sliders,
  Maximize2,
  ChevronRight,
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

const MAX_SHADER_ITERATIONS = 2400;
const CPU_DEEP_ZOOM_THRESHOLD = 1e5;
const CPU_MAX_ITERATIONS = 1000;
const MAX_RENDER_ITERATIONS = 2400;
const MAX_ZOOM = 1e13;
const JULIA_SEED_ADJUST_RANGE = 0.06;
const JULIA_SEED_STEP = 0.00002;
const GPU_PALETTE_INDEX: Record<PaletteName, number> = {
  Neon: 0,
  Solar: 1,
  Forest: 2,
  Ocean: 3,
  Spectrum: 4,
  Monochrome: 5,
};

const PALETTE_GRADIENTS: Record<PaletteName, string> = {
  Neon: "linear-gradient(90deg, #1e1244 0%, #c026d3 48%, #22d3ee 100%)",
  Solar: "linear-gradient(90deg, #7f1d1d 0%, #f97316 52%, #fde68a 100%)",
  Forest: "linear-gradient(90deg, #123c2a 0%, #839735 48%, #e9d5ff 100%)",
  Ocean: "linear-gradient(90deg, #0c3a68 0%, #0891b2 52%, #a7f3d0 100%)",
  Spectrum: "linear-gradient(90deg, #ef4444, #facc15, #22c55e, #06b6d4, #8b5cf6)",
  Monochrome: "linear-gradient(90deg, #3f3f46 0%, #a1a1aa 52%, #fafafa 100%)",
};

type GpuFractalRenderer = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  buffer: WebGLBuffer;
  uniforms: {
    resolution: WebGLUniformLocation;
    centerX: WebGLUniformLocation;
    centerY: WebGLUniformLocation;
    pixelScaleX: WebGLUniformLocation;
    pixelScaleY: WebGLUniformLocation;
    maxIterations: WebGLUniformLocation;
    palette: WebGLUniformLocation;
    mode: WebGLUniformLocation;
    juliaX: WebGLUniformLocation;
    juliaY: WebGLUniformLocation;
  };
};

const FRACTAL_VERTEX_SHADER = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRACTAL_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 u_resolution;
uniform vec2 u_centerX;
uniform vec2 u_centerY;
uniform vec2 u_pixelScaleX;
uniform vec2 u_pixelScaleY;
uniform int u_maxIterations;
uniform int u_palette;
uniform int u_mode;
uniform vec2 u_juliaX;
uniform vec2 u_juliaY;

out vec4 outColor;

const float DS_SPLITTER = 4097.0;

vec2 dsNormalize(float hi, float lo) {
  float s = hi + lo;
  float e = lo - (s - hi);
  return vec2(s, e);
}

vec2 dsAdd(vec2 a, vec2 b) {
  float s = a.x + b.x;
  float v = s - a.x;
  float e = (a.x - (s - v)) + (b.x - v) + a.y + b.y;
  return dsNormalize(s, e);
}

vec2 dsSub(vec2 a, vec2 b) {
  return dsAdd(a, vec2(-b.x, -b.y));
}

void dsSplit(float a, out float hi, out float lo) {
  float t = DS_SPLITTER * a;
  hi = t - (t - a);
  lo = a - hi;
}

vec2 dsMul(vec2 a, vec2 b) {
  float ahi;
  float alo;
  float bhi;
  float blo;
  dsSplit(a.x, ahi, alo);
  dsSplit(b.x, bhi, blo);

  float p = a.x * b.x;
  float e = ((ahi * bhi - p) + ahi * blo + alo * bhi) + alo * blo;
  e += a.x * b.y + a.y * b.x;
  return dsNormalize(p, e);
}

vec2 dsMulFloat(vec2 a, float b) {
  float ahi;
  float alo;
  float bhi;
  float blo;
  dsSplit(a.x, ahi, alo);
  dsSplit(b, bhi, blo);

  float p = a.x * b;
  float e = ((ahi * bhi - p) + ahi * blo + alo * bhi) + alo * blo + a.y * b;
  return dsNormalize(p, e);
}

float dsToFloat(vec2 a) {
  return a.x + a.y;
}

vec3 mixPalette(float t, vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec3 c4, vec3 c5) {
  float scaled = clamp(t, 0.0, 1.0) * 5.0;
  if (scaled < 1.0) return mix(c0, c1, scaled);
  if (scaled < 2.0) return mix(c1, c2, scaled - 1.0);
  if (scaled < 3.0) return mix(c2, c3, scaled - 2.0);
  if (scaled < 4.0) return mix(c3, c4, scaled - 3.0);
  return mix(c4, c5, scaled - 4.0);
}

vec3 hslToRgb(float h, float s, float l) {
  vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

vec3 getFractalColor(int iter, int maxIterations, float zr2, float zi2) {
  if (iter >= maxIterations) {
    return vec3(3.0, 3.0, 10.0) / 255.0;
  }

  float logZn = log(zr2 + zi2) / 2.0;
  float nu = float(iter) + 1.0 - log(logZn / 0.693147) / 0.693147;
  float t = pow(clamp(nu / float(maxIterations), 0.0, 1.0), 0.45);

  if (u_palette == 0) {
    return mixPalette(t,
      vec3(3.0, 3.0, 15.0) / 255.0,
      vec3(41.0, 10.0, 80.0) / 255.0,
      vec3(106.0, 13.0, 173.0) / 255.0,
      vec3(240.0, 0.0, 120.0) / 255.0,
      vec3(0.0, 240.0, 255.0) / 255.0,
      vec3(3.0, 3.0, 15.0) / 255.0);
  }
  if (u_palette == 1) {
    return mixPalette(t,
      vec3(2.0, 0.0, 4.0) / 255.0,
      vec3(120.0, 0.0, 0.0) / 255.0,
      vec3(240.0, 60.0, 0.0) / 255.0,
      vec3(255.0, 200.0, 0.0) / 255.0,
      vec3(255.0, 255.0, 220.0) / 255.0,
      vec3(2.0, 0.0, 4.0) / 255.0);
  }
  if (u_palette == 2) {
    return mixPalette(t,
      vec3(2.0, 10.0, 8.0) / 255.0,
      vec3(15.0, 60.0, 25.0) / 255.0,
      vec3(160.0, 140.0, 40.0) / 255.0,
      vec3(140.0, 35.0, 160.0) / 255.0,
      vec3(220.0, 180.0, 255.0) / 255.0,
      vec3(2.0, 10.0, 8.0) / 255.0);
  }
  if (u_palette == 3) {
    return mixPalette(t,
      vec3(0.0, 5.0, 20.0) / 255.0,
      vec3(0.0, 40.0, 100.0) / 255.0,
      vec3(0.0, 128.0, 160.0) / 255.0,
      vec3(70.0, 220.0, 160.0) / 255.0,
      vec3(200.0, 255.0, 240.0) / 255.0,
      vec3(0.0, 5.0, 20.0) / 255.0);
  }
  if (u_palette == 4) {
    return hslToRgb(mod(t * 3.5, 1.0), 1.0, 0.5);
  }
  return mixPalette(t,
    vec3(0.0, 0.0, 0.0) / 255.0,
    vec3(30.0, 30.0, 30.0) / 255.0,
    vec3(110.0, 110.0, 110.0) / 255.0,
    vec3(230.0, 230.0, 230.0) / 255.0,
    vec3(255.0, 255.0, 255.0) / 255.0,
    vec3(0.0, 0.0, 0.0) / 255.0);
}

void main() {
  float px = gl_FragCoord.x - u_resolution.x * 0.5;
  float py = (u_resolution.y - gl_FragCoord.y) - u_resolution.y * 0.5;
  vec2 cx = dsAdd(u_centerX, dsMulFloat(u_pixelScaleX, px));
  vec2 cy = dsAdd(u_centerY, dsMulFloat(u_pixelScaleY, py));

  vec2 zr = u_mode == 0 ? vec2(0.0) : cx;
  vec2 zi = u_mode == 0 ? vec2(0.0) : cy;
  vec2 cr = u_mode == 0 ? cx : u_juliaX;
  vec2 ci = u_mode == 0 ? cy : u_juliaY;
  vec2 zr2 = dsMul(zr, zr);
  vec2 zi2 = dsMul(zi, zi);
  int iter = 0;

  for (int i = 0; i < ${MAX_SHADER_ITERATIONS}; i++) {
    if (i >= u_maxIterations || dsToFloat(zr2) + dsToFloat(zi2) > 4.0) {
      break;
    }

    vec2 zrzi = dsMul(zr, zi);
    vec2 nextZi = dsAdd(dsMulFloat(zrzi, 2.0), ci);
    vec2 nextZr = dsAdd(dsSub(zr2, zi2), cr);

    zr = nextZr;
    zi = nextZi;
    zr2 = dsMul(zr, zr);
    zi2 = dsMul(zi, zi);
    iter++;
  }

  outColor = vec4(
    getFractalColor(iter, u_maxIterations, max(0.0, dsToFloat(zr2)), max(0.0, dsToFloat(zi2))),
    1.0
  );
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Fractal shader compile failed", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createGpuFractalRenderer(
  canvas: HTMLCanvasElement,
): GpuFractalRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) return null;

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, FRACTAL_VERTEX_SHADER);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRACTAL_FRAGMENT_SHADER,
  );
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Fractal shader link failed", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const resolution = gl.getUniformLocation(program, "u_resolution");
  const centerX = gl.getUniformLocation(program, "u_centerX");
  const centerY = gl.getUniformLocation(program, "u_centerY");
  const pixelScaleX = gl.getUniformLocation(program, "u_pixelScaleX");
  const pixelScaleY = gl.getUniformLocation(program, "u_pixelScaleY");
  const maxIterations = gl.getUniformLocation(program, "u_maxIterations");
  const palette = gl.getUniformLocation(program, "u_palette");
  const mode = gl.getUniformLocation(program, "u_mode");
  const juliaX = gl.getUniformLocation(program, "u_juliaX");
  const juliaY = gl.getUniformLocation(program, "u_juliaY");

  if (
    !vao ||
    !buffer ||
    positionLocation < 0 ||
    !resolution ||
    !centerX ||
    !centerY ||
    !pixelScaleX ||
    !pixelScaleY ||
    !maxIterations ||
    !palette ||
    !mode ||
    !juliaX ||
    !juliaY
  ) {
    gl.deleteProgram(program);
    return null;
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  return {
    gl,
    program,
    vao,
    buffer,
    uniforms: {
      resolution,
      centerX,
      centerY,
      pixelScaleX,
      pixelScaleY,
      maxIterations,
      palette,
      mode,
      juliaX,
      juliaY,
    },
  };
}

function splitDouble(value: number): [number, number] {
  const high = Math.fround(value);
  return [high, value - high];
}

export default function FractalExplorer() {
  const router = useRouter();

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const gpuRendererRef = useRef<GpuFractalRenderer | null>(null);
  const gpuUnavailableRef = useRef<boolean>(false);

  // Math View Parameters (Refs for high performance rendering loop)
  const centerXRef = useRef<number>(-0.7);
  const centerYRef = useRef<number>(0.0);
  const zoomRef = useRef<number>(1.0);
  const iterationsRef = useRef<number>(200);
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
  const [currentIterations, setCurrentIterations] = useState<number>(200);
  const [currentPalette, setCurrentPalette] = useState<PaletteName>("Neon");
  const [currentMode, setCurrentMode] = useState<FractalMode>("mandelbrot");
  const [isCpuRenderActive, setIsCpuRenderActive] = useState<boolean>(false);

  // Display coordinates for UI tracking
  const [uiCoords, setUiCoords] = useState<{ r: number; i: number }>({
    r: -0.7,
    i: 0.0,
  });
  const [juliaCDisplay, setJuliaCDisplay] = useState<[number, number]>([
    -0.7, 0.27015,
  ]);
  const [juliaCLocked, setJuliaCLocked] = useState<[number, number]>([
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
  const hasDraggedRef = useRef<boolean>(false);
  const mouseDownStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startDragMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeTouchPointersRef = useRef<
    Map<number, { x: number; y: number }>
  >(new Map());
  const pinchRef = useRef<{
    distance: number;
    zoom: number;
    focusX: number;
    focusY: number;
  } | null>(null);
  const DRAG_THRESHOLD_PX = 5;
  const isAnimatingRef = useRef<boolean>(false);
  const recentTouchInteractionRef = useRef<boolean>(false);
  const touchResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Render control state to handle cancelation
  const renderIdRef = useRef<number>(0);
  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCpuRenderActiveRef = useRef<boolean>(false);

  // -------------------------------------------------------------
  // Drawing Pipeline
  // -------------------------------------------------------------

  const setCpuCanvasVisible = (visible: boolean) => {
    const canvas = cpuCanvasRef.current;
    if (!canvas) return;
    canvas.style.opacity = visible ? "1" : "0";
    if (isCpuRenderActiveRef.current !== visible) {
      isCpuRenderActiveRef.current = visible;
      setIsCpuRenderActive(visible);
    }
  };

  const syncCpuCanvasSize = () => {
    const sourceCanvas = canvasRef.current;
    const cpuCanvas = cpuCanvasRef.current;
    if (!sourceCanvas || !cpuCanvas) return;

    if (
      cpuCanvas.width !== sourceCanvas.width ||
      cpuCanvas.height !== sourceCanvas.height
    ) {
      cpuCanvas.width = sourceCanvas.width;
      cpuCanvas.height = sourceCanvas.height;
    }
  };

  const renderGpuFractal = useCallback((renderId: number): boolean => {
    if (
      renderId !== renderIdRef.current ||
      gpuUnavailableRef.current ||
      zoomRef.current > CPU_DEEP_ZOOM_THRESHOLD
    ) {
      return false;
    }

    const canvas = canvasRef.current;
    if (!canvas) return false;

    let renderer = gpuRendererRef.current;
    if (!renderer) {
      renderer = createGpuFractalRenderer(canvas);
      if (!renderer) {
        gpuUnavailableRef.current = true;
        return false;
      }
      gpuRendererRef.current = renderer;
    }

    const { gl, program, vao, uniforms } = renderer;
    const widthInComplex = 3.0 / zoomRef.current;
    const heightInComplex = widthInComplex * (canvas.height / canvas.width);
    const centerX = splitDouble(centerXRef.current);
    const centerY = splitDouble(centerYRef.current);
    const pixelScaleX = splitDouble(widthInComplex / canvas.width);
    const pixelScaleY = splitDouble(heightInComplex / canvas.height);
    const juliaX = splitDouble(juliaCRef.current[0]);
    const juliaY = splitDouble(juliaCRef.current[1]);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.centerX, centerX[0], centerX[1]);
    gl.uniform2f(uniforms.centerY, centerY[0], centerY[1]);
    gl.uniform2f(uniforms.pixelScaleX, pixelScaleX[0], pixelScaleX[1]);
    gl.uniform2f(uniforms.pixelScaleY, pixelScaleY[0], pixelScaleY[1]);
    gl.uniform1i(
      uniforms.maxIterations,
      Math.min(iterationsRef.current, MAX_SHADER_ITERATIONS),
    );
    gl.uniform1i(uniforms.palette, GPU_PALETTE_INDEX[paletteRef.current]);
    gl.uniform1i(uniforms.mode, modeRef.current === "mandelbrot" ? 0 : 1);
    gl.uniform2f(uniforms.juliaX, juliaX[0], juliaX[1]);
    gl.uniform2f(uniforms.juliaY, juliaY[0], juliaY[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    setCpuCanvasVisible(false);

    return true;
  }, []);

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

    if (renderGpuFractal(currentRenderId)) {
      return;
    }

    // Pass 1: Render 4x4 pixel scaling (very fast)
    drawPass(4, currentRenderId, () => {
      // Pass 2: Render 2x2 pixel scaling (decent detail)
      drawPass(2, currentRenderId, () => {
        // Pass 3: Render 1x1 full resolution (Stripe-by-stripe to keep main thread completely unblocked)
        drawPassStriped(1, currentRenderId);
      });
    });
  }, [renderGpuFractal]);

  const drawPass = (
    ratio: number,
    renderId: number,
    onComplete?: () => void,
  ) => {
    if (renderId !== renderIdRef.current) return;

    if (renderGpuFractal(renderId)) {
      if (onComplete) {
        drawTimerRef.current = setTimeout(onComplete, 16);
      }
      return;
    }

    syncCpuCanvasSize();
    setCpuCanvasVisible(true);

    const canvas = cpuCanvasRef.current;
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

    const maxIter = Math.min(iterationsRef.current, CPU_MAX_ITERATIONS);
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

    if (renderGpuFractal(renderId)) return;

    syncCpuCanvasSize();
    setCpuCanvasVisible(true);

    const canvas = cpuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const widthInComplex = 3.0 / zoomRef.current;
    const heightInComplex = widthInComplex * (height / width);
    const cxMin = centerXRef.current - widthInComplex / 2;
    const cyMin = centerYRef.current - heightInComplex / 2;

    const maxIter = Math.min(iterationsRef.current, CPU_MAX_ITERATIONS);
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

  const markRecentTouchInteraction = () => {
    recentTouchInteractionRef.current = true;
    if (touchResetTimerRef.current) clearTimeout(touchResetTimerRef.current);
    touchResetTimerRef.current = setTimeout(() => {
      recentTouchInteractionRef.current = false;
    }, 500);
  };

  const getCanvasPointerPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      canvas,
      rect,
      px: (clientX - rect.left) * scaleX,
      py: (clientY - rect.top) * scaleY,
      widthInComplex: 3.0 / zoomRef.current,
      heightInComplex:
        (3.0 / zoomRef.current) * (canvas.height / canvas.width),
    };
  };

  const beginPinchGesture = () => {
    const [firstTouch, secondTouch] = Array.from(
      activeTouchPointersRef.current.values(),
    );
    if (!firstTouch || !secondTouch) return;

    const midpointX = (firstTouch.x + secondTouch.x) / 2;
    const midpointY = (firstTouch.y + secondTouch.y) / 2;
    const pointer = getCanvasPointerPosition(midpointX, midpointY);
    if (!pointer) return;

    const { canvas, px, py, widthInComplex, heightInComplex } = pointer;
    pinchRef.current = {
      distance: Math.hypot(
        secondTouch.x - firstTouch.x,
        secondTouch.y - firstTouch.y,
      ),
      zoom: zoomRef.current,
      focusX:
        centerXRef.current +
        (px - canvas.width / 2) * (widthInComplex / canvas.width),
      focusY:
        centerYRef.current +
        (py - canvas.height / 2) * (heightInComplex / canvas.height),
    };
    isDraggingRef.current = false;
    hasDraggedRef.current = true;
  };

  const updatePinchGesture = () => {
    const pinch = pinchRef.current;
    const [firstTouch, secondTouch] = Array.from(
      activeTouchPointersRef.current.values(),
    );
    if (!pinch || !firstTouch || !secondTouch || pinch.distance === 0) {
      return false;
    }

    const midpointX = (firstTouch.x + secondTouch.x) / 2;
    const midpointY = (firstTouch.y + secondTouch.y) / 2;
    const pointer = getCanvasPointerPosition(midpointX, midpointY);
    if (!pointer) return false;

    const distance = Math.hypot(
      secondTouch.x - firstTouch.x,
      secondTouch.y - firstTouch.y,
    );
    const newZoom = Math.max(
      0.1,
      Math.min(MAX_ZOOM, pinch.zoom * (distance / pinch.distance)),
    );
    const newWidthInComplex = 3.0 / newZoom;
    const newHeightInComplex =
      newWidthInComplex * (pointer.canvas.height / pointer.canvas.width);

    centerXRef.current =
      pinch.focusX -
      (pointer.px - pointer.canvas.width / 2) *
        (newWidthInComplex / pointer.canvas.width);
    centerYRef.current =
      pinch.focusY -
      (pointer.py - pointer.canvas.height / 2) *
        (newHeightInComplex / pointer.canvas.height);
    zoomRef.current = newZoom;

    setZoomLevel(newZoom);
    setUiCoords({ r: centerXRef.current, i: centerYRef.current });
    drawFastPreview();
    return true;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAnimatingRef.current) return;

    if (e.pointerType === "touch") {
      markRecentTouchInteraction();
      e.currentTarget.setPointerCapture(e.pointerId);
      activeTouchPointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });

      if (activeTouchPointersRef.current.size >= 2) {
        beginPinchGesture();
        return;
      }
    } else if (!e.isPrimary) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    mouseDownStartRef.current = { x: e.clientX, y: e.clientY };
    startDragMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "touch") {
      activeTouchPointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });

      if (activeTouchPointersRef.current.size >= 2) {
        e.preventDefault();
        updatePinchGesture();
        return;
      }
    } else if (!e.isPrimary) {
      return;
    }

    const pointer = getCanvasPointerPosition(e.clientX, e.clientY);
    if (!pointer) return;

    const { canvas, px, py, rect, widthInComplex, heightInComplex } = pointer;

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
      const totalDx = e.clientX - mouseDownStartRef.current.x;
      const totalDy = e.clientY - mouseDownStartRef.current.y;
      if (
        totalDx * totalDx + totalDy * totalDy >
        DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX
      ) {
        hasDraggedRef.current = true;
      }

      const dx = e.clientX - startDragMouseRef.current.x;
      const dy = e.clientY - startDragMouseRef.current.y;
      startDragMouseRef.current = { x: e.clientX, y: e.clientY };

      centerXRef.current -= dx * (widthInComplex / rect.width);
      centerYRef.current -= dy * (heightInComplex / rect.height);

      setUiCoords({ r: centerXRef.current, i: centerYRef.current });
      drawFastPreview();
    } else if (e.pointerType === "mouse") {
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

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "touch") {
      markRecentTouchInteraction();
      activeTouchPointersRef.current.delete(e.pointerId);
      pinchRef.current = null;

      const remainingTouch = Array.from(
        activeTouchPointersRef.current.values(),
      )[0];
      if (remainingTouch) {
        isDraggingRef.current = true;
        hasDraggedRef.current = true;
        mouseDownStartRef.current = remainingTouch;
        startDragMouseRef.current = remainingTouch;
      } else if (isDraggingRef.current) {
        isDraggingRef.current = false;
        triggerProgressiveRender();
      }

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      return;
    }

    if (!e.isPrimary) return;

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
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
    const newZoom = Math.max(
      0.1,
      Math.min(MAX_ZOOM, zoomRef.current * factor),
    );

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

  // Double click zooms into the clicked point (desktop only)
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimatingRef.current || recentTouchInteractionRef.current) return;
    e.preventDefault();
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

    const newZoom = Math.min(MAX_ZOOM, zoomRef.current * 2.2);
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

  // Click on main canvas Mandelbrot to freeze Julia constant (not when dragging)
  const handleCanvasClick = () => {
    if (modeRef.current === "mandelbrot" && !hasDraggedRef.current) {
      setIsJuliaFrozen((f) => !f);
    }
  };

  // Enter Julia Mode using selected seed coordinate
  const enterJuliaModeWithSeed = () => {
    const lockedSeed: [number, number] = [
      juliaCDisplay[0],
      juliaCDisplay[1],
    ];

    modeRef.current = "julia";
    juliaCRef.current = lockedSeed;
    setJuliaCLocked(lockedSeed);

    centerXRef.current = 0.0;
    centerYRef.current = 0.0;
    zoomRef.current = 1.0;

    setCurrentMode("julia");
    setZoomLevel(1.0);
    setUiCoords({ r: 0.0, i: 0.0 });

    triggerProgressiveRender();
  };

  const resetJuliaSeedToLocked = () => {
    juliaCRef.current = [juliaCLocked[0], juliaCLocked[1]];
    setJuliaCDisplay([juliaCLocked[0], juliaCLocked[1]]);
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
    const cpuCanvas = cpuCanvasRef.current;
    const canvas =
      cpuCanvas?.style.opacity === "1" ? cpuCanvas : canvasRef.current;
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

      const viewport = window.visualViewport;
      canvas.width = viewport?.width ?? window.innerWidth;
      canvas.height = viewport?.height ?? window.innerHeight;
      syncCpuCanvasSize();

      const currentRenderId = ++renderIdRef.current;
      drawPass(8, currentRenderId, () => {
        triggerProgressiveRender();
      });
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
      if (touchResetTimerRef.current) clearTimeout(touchResetTimerRef.current);

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
      if (gpuRendererRef.current) {
        const { gl, program, vao, buffer } = gpuRendererRef.current;
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
        gpuRendererRef.current = null;
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
    const nextIterations = Math.min(MAX_RENDER_ITERATIONS, newVal);
    iterationsRef.current = nextIterations;
    setCurrentIterations(nextIterations);
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#050611] font-sans select-none overscroll-none">
      {/* Dynamic Background Shader / Main Rendering Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onPointerLeave={handlePointerUpOrCancel}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={handleCanvasClick}
        className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing block animate-fade-in duration-300 touch-none"
      />
      <canvas
        ref={cpuCanvasRef}
        aria-hidden="true"
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 block"
      />

      {/* Atmospheric interface layers */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(89,76,183,0.08),transparent_31%),radial-gradient(circle_at_87%_90%,rgba(34,211,238,0.04),transparent_26%)]" />
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent 74%)",
        }}
      />
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
            className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 pointer-events-none z-30 flex flex-col gap-2 max-w-[calc(100vw-6.5rem)] sm:max-w-75"
          >
            <div className="min-w-57 rounded-2xl border border-white/13 bg-[#0a0b1a]/72 p-3 sm:p-3.5 text-zinc-400 shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl text-[9px] sm:text-[10px] font-mono leading-relaxed">
              <div className="mb-2 flex items-center justify-between border-b border-white/8 pb-2">
                <span className="uppercase font-semibold tracking-[0.18em] text-zinc-500">
                  Coordinates
                </span>
              </div>
              <div className="grid grid-cols-[2.25rem_1fr] gap-y-0.5">
                <span className="text-zinc-600">RE</span>
                <span className="text-zinc-300">{uiCoords.r.toFixed(10)}</span>
                <span className="text-zinc-600">IM</span>
                <span className="text-zinc-300">{uiCoords.i.toFixed(10)}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07]">
                <div className="bg-[#090a18]/75 px-2 py-1.5">
                  <span className="block text-[8px] font-sans font-semibold uppercase tracking-wider text-zinc-600">
                    Zoom
                  </span>
                  <span className="text-zinc-200">
                  {zoomLevel < 1000
                    ? zoomLevel.toFixed(1)
                    : zoomLevel.toExponential(2)}
                    ×
                  </span>
                </div>
                <div className="bg-[#090a18]/75 px-2 py-1.5">
                  <span className="block text-[8px] font-sans font-semibold uppercase tracking-wider text-zinc-600">
                    Iter
                  </span>
                  <span className="text-zinc-200">{currentIterations}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          Interactive Sidebar Control Panel (Right Side)
          ------------------------------------------------------------- */}
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
                  onChange={(e) =>
                    handleIterationChange(Number(e.target.value))
                  }
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
                              isAudioEnabled
                                ? "translate-x-4.5"
                                : "translate-x-1"
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
                    Click or tap the canvas to lock the seed. Drag to pan
                    without locking.
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
                    min={Math.max(-2.0, juliaCLocked[0] - JULIA_SEED_ADJUST_RANGE)}
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
                    min={Math.max(-2.0, juliaCLocked[1] - JULIA_SEED_ADJUST_RANGE)}
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
                      currentMode === "mandelbrot" ||
                      lm.name === "Default View",
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

      {/* Welcome Audio Prompt Modal */}
      <AnimatePresence>
        {showWelcomePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#03040c]/70 p-4 backdrop-blur-xl pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-md rounded-3xl border border-white/[0.14] bg-[#0b0c1d]/92 p-6 text-center text-zinc-200 shadow-[0_28px_90px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            >
              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl border border-violet-300/25 bg-violet-400/10 p-3 text-violet-200 shadow-[0_0_16px_rgba(167,139,250,0.10)] animate-pulse">
                  <Volume2 className="w-6 h-6" />
                </div>
              </div>
              <h1 className="mb-2 text-lg font-semibold tracking-[-0.035em] text-zinc-50">
                Fractal Audio
              </h1>
              <p className="mb-6 text-xs leading-relaxed text-zinc-400">
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
                  className="flex-1 rounded-xl border border-violet-300/35 bg-violet-500 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition-all duration-300 hover:bg-violet-400 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Enable Audio
                </button>
                <button
                  onClick={() => {
                    setIsAudioEnabled(false);
                    setShowWelcomePrompt(false);
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 transition-all duration-300 hover:bg-white/8 hover:text-zinc-200 active:scale-95 cursor-pointer"
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
