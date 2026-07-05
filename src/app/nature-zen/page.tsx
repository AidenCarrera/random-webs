"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shuffle,
  Trash2,
  Volume2,
  VolumeX,
  Undo,
  Redo,
  ChevronLeft,
  Settings2,
  Info,
  Download,
  Upload,
  Sparkles,
  Compass,
  Smile,
  Check,
  Music,
} from "lucide-react";
import Link from "next/link";

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------
interface Plant {
  id: string;
  x: number; // 0 to 1 relative to container width
  y: number; // 0 to 1 relative to container height
  type: string;
  rotation: number; // in degrees
  scale: number; // size multiplier
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  brushSize: number;
  brushType: "standard" | "wave" | "water";
}

interface Ripple {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface VisualRipple {
  id: string;
  x: number;
  y: number;
}

interface Theme {
  id: string;
  name: string;
  bg: string;
  grooveColor: string;
  shadowColor: string;
  highlightColor: string;
  grainOpacity: number;
  textColor: string;
  accentClass: string;
}

interface HistoryEntry {
  plants: Plant[];
  strokes: Stroke[];
  ripples: Ripple[];
}

// -------------------------------------------------------------
// STATIC DATA & CONFIGS
// -------------------------------------------------------------
const EMOJI_CATEGORIES = [
  {
    id: "flora",
    name: "Plants",
    icon: "🌱",
    emojis: [
      "🌱",
      "🌿",
      "🍀",
      "🌵",
      "🌴",
      "🌲",
      "🌳",
      "🍁",
      "🍂",
      "🍃",
      "🌻",
      "🌹",
      "🌷",
      "🌼",
      "🌸",
      "🌺",
      "🪷",
      "🍄",
      "🌾",
      "🎋",
    ],
  },
  {
    id: "stones",
    name: "Stones and Decorations",
    icon: "🪨",
    emojis: ["🪨", "🪵", "💎", "🔮", "🧱", "🏮", "⛩️", "⛲", "🗿", "🔔"],
  },
  {
    id: "fauna",
    name: "Animals",
    icon: "🦋",
    emojis: [
      "🦋",
      "🐞",
      "🐌",
      "🐝",
      "🦚",
      "🐸",
      "🐢",
      "🐟",
      "🐠",
      "🦆",
      "🐦",
      "🐉",
    ],
  },
  {
    id: "zen",
    name: "Misc",
    icon: "🧘",
    emojis: ["🧘", "📿", "🕯️", "🏺", "🎐", "🍵", "⛅", "🌙", "⭐", "🌈"],
  },
];

const THEMES: Theme[] = [
  {
    id: "shirakawa",
    name: "White Sand",
    bg: "#f3efe6",
    grooveColor: "rgba(180, 168, 145, 0.45)",
    shadowColor: "rgba(100, 90, 80, 0.12)",
    highlightColor: "rgba(255, 255, 255, 0.9)",
    grainOpacity: 0.08,
    textColor: "text-zinc-800",
    accentClass: "bg-amber-700/10 text-amber-900 border-amber-500/30",
  },
  {
    id: "dune",
    name: "Golden Sand",
    bg: "#f3d298",
    grooveColor: "rgba(145, 105, 55, 0.45)",
    shadowColor: "rgba(80, 50, 20, 0.12)",
    highlightColor: "rgba(255, 253, 240, 0.85)",
    grainOpacity: 0.09,
    textColor: "text-amber-950",
    accentClass: "bg-amber-950/10 text-amber-950 border-amber-950/30",
  },
  {
    id: "moss",
    name: "Grass Green",
    bg: "#3b873e",
    grooveColor: "rgba(20, 60, 20, 0.45)",
    shadowColor: "rgba(10, 35, 10, 0.22)",
    highlightColor: "rgba(255, 255, 255, 0.26)",
    grainOpacity: 0.12,
    textColor: "text-emerald-50",
    accentClass: "bg-emerald-50/10 text-emerald-100 border-emerald-500/30",
  },
  {
    id: "obsidian",
    name: "Black Sand",
    bg: "#16161c",
    grooveColor: "rgba(0, 0, 0, 0.6)",
    shadowColor: "rgba(0, 0, 0, 0.8)",
    highlightColor: "rgba(255, 255, 255, 0.07)",
    grainOpacity: 0.05,
    textColor: "text-zinc-200",
    accentClass: "bg-zinc-800/50 text-zinc-100 border-zinc-700",
  },
  {
    id: "clay",
    name: "Red Clay",
    bg: "#c88566",
    grooveColor: "rgba(140, 70, 40, 0.45)",
    shadowColor: "rgba(80, 30, 10, 0.15)",
    highlightColor: "rgba(255, 220, 200, 0.7)",
    grainOpacity: 0.1,
    textColor: "text-orange-950",
    accentClass: "bg-orange-950/10 text-orange-950 border-orange-950/30",
  },
];

const DEFAULT_RIPPLES: Ripple[] = [
  { id: "def-1", x: 0.3, y: 0.45, radius: 48 },
  { id: "def-2", x: 0.7, y: 0.55, radius: 48 },
];

const generateDefaultStrokes = (): Stroke[] => {
  const strokes: Stroke[] = [];
  for (let row = 1; row <= 3; row++) {
    const points: Point[] = [];
    const yVal = 0.25 * row;
    for (let i = 0; i <= 20; i++) {
      const x = i / 20;
      const y = yVal + Math.sin(x * Math.PI * 4) * 0.03;
      points.push({ x, y });
    }
    strokes.push({
      points,
      brushSize: 6,
      brushType: "wave",
    });
  }
  return strokes;
};

// -------------------------------------------------------------
// AUDIO SYNTHESIZER CLASS
// -------------------------------------------------------------
class ZenAudio {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  init() {
    if (typeof window === "undefined") return;
    if (this.isInitialized) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create ambient breeze noise
      const bufferSize = this.ctx.sampleRate * 6; // 6s loop
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(200, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.lfoNode = this.ctx.createOscillator();
      this.lfoNode.type = "sine";
      this.lfoNode.frequency.setValueAtTime(0.06, this.ctx.currentTime); // ~16s cycle

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(100, this.ctx.currentTime); // mod filter

      this.lfoNode.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.02, this.ctx.currentTime); // soft volume

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      this.noiseNode.start(0);
      this.lfoNode.start(0);

      this.isInitialized = true;
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  playChime() {
    if (!this.ctx || this.ctx.state === "suspended") return;

    // Japanese Akebono scale (A minor/pentatonic feeling)
    const scale = [
      440.0, 493.88, 523.25, 659.25, 698.46, 880.0, 987.77, 1046.5,
    ];
    const freq = scale[Math.floor(Math.random() * scale.length)];
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2.76, now); // soft bell overtone

    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const chimeGain = this.ctx.createGain();

    gain1.gain.setValueAtTime(0.07, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 3.5); // long decay

    gain2.gain.setValueAtTime(0.03, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(chimeGain);
    gain2.connect(chimeGain);

    chimeGain.connect(this.masterGain!);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 3.8);
    osc2.stop(now + 1.0);
  }

  playPlantSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playRakeSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    source.start(now);
    source.stop(now + 0.09);
  }

  playPruneSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playWaterSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Soft "bloop" water bubble sound
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.12);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  resume() {
    if (this.ctx) this.ctx.resume();
  }

  suspend() {
    if (this.ctx) this.ctx.suspend();
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.isInitialized = false;
    }
  }
}

// -------------------------------------------------------------
// MAIN COMPONENTS
// -------------------------------------------------------------
export default function NatureZen() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [visualRipples, setVisualRipples] = useState<VisualRipple[]>([]);

  // History for Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Configuration
  const [activeTab, setActiveTab] = useState<string>("flora");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("🌱");
  const [randomMode, setRandomMode] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<
    "plant" | "rake" | "rake-wave" | "rake-ripple" | "prune" | "water"
  >("plant");
  const [selectedTheme, setSelectedTheme] = useState<string>("shirakawa");
  const [emojiSize, setEmojiSize] = useState<number>(1.2);
  const [rakeSize, setRakeSize] = useState<number>(6);
  const [waterBrushSize, setWaterBrushSize] = useState<number>(16);
  const atmosphere: any = "day";
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Settings & Panels UI states
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [importString, setImportString] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawing current state
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);
  const [isShoveling, setIsShoveling] = useState<boolean>(false);

  const plantsRef = useRef<Plant[]>([]);
  plantsRef.current = plants;
  const strokesRef = useRef<Stroke[]>([]);
  strokesRef.current = strokes;
  const ripplesRef = useRef<Ripple[]>([]);
  ripplesRef.current = ripples;

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<ZenAudio | null>(null);

  const activeTheme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new ZenAudio();
    return () => {
      audioRef.current?.destroy();
    };
  }, []);

  // Sync volume & status
  useEffect(() => {
    if (soundEnabled) {
      audioRef.current?.init();
      audioRef.current?.resume();
    } else {
      audioRef.current?.suspend();
    }
  }, [soundEnabled]);

  // Ambient Wind Chime Trigger Logic
  useEffect(() => {
    if (!soundEnabled) return;
    let timerId: NodeJS.Timeout;

    const scheduleChime = () => {
      const delay = 4000 + Math.random() * 8000; // 4s to 12s
      timerId = setTimeout(() => {
        if (audioRef.current && soundEnabled) {
          const repetitions = Math.floor(Math.random() * 2) + 1;
          for (let i = 0; i < repetitions; i++) {
            setTimeout(() => {
              audioRef.current?.playChime();
            }, i * 350);
          }
          scheduleChime();
        }
      }, delay);
    };

    scheduleChime();
    return () => clearTimeout(timerId);
  }, [soundEnabled]);

  // Load default layout on first mount (blank sheet)
  useEffect(() => {
    setStrokes([]);
    setRipples([]);

    const initialEntry: HistoryEntry = {
      plants: [],
      strokes: [],
      ripples: [],
    };
    setHistory([initialEntry]);
    setHistoryIndex(0);
  }, []);

  // Canvas resize and render listener
  useEffect(() => {
    const handleResize = () => {
      drawCanvas();
    };

    window.addEventListener("resize", handleResize);
    // Draw canvas whenever these variables modify
    drawCanvas();

    return () => window.removeEventListener("resize", handleResize);
  }, [strokes, ripples, currentStroke, selectedTheme, atmosphere]);

  // Render trigger whenever elements change
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const width = rect.width * dpr;
    const height = rect.height * dpr;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Apply Atmosphere colors overrides
    let bg = activeTheme.bg;
    let shadow = activeTheme.shadowColor;
    let highlight = activeTheme.highlightColor;
    let groove = activeTheme.grooveColor;

    if (atmosphere === "dusk") {
      // Warm orange tint overrides
      bg = blendColors(bg, "#f97316", 0.15);
      shadow = "rgba(70, 30, 0, 0.25)";
      highlight = "rgba(255, 230, 200, 0.6)";
    } else if (atmosphere === "night") {
      // Dark cool blue overrides
      bg = blendColors(bg, "#1e1b4b", 0.35);
      shadow = "rgba(0, 0, 0, 0.7)";
      highlight = "rgba(250, 250, 255, 0.06)";
      groove = "rgba(0, 0, 0, 0.5)";
    }

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Grain texture overlay
    drawSandGrain(ctx, width, height, activeTheme.grainOpacity);

    // Redraw strokes
    strokes.forEach((stroke) => {
      if (stroke.brushType === "water") {
        drawWaterStroke(ctx, stroke, width, height);
      } else {
        drawRakeStroke(ctx, stroke, width, height, shadow, highlight, groove);
      }
    });

    // If drag stroke is active, draw it
    if (currentStroke) {
      if (currentStroke.brushType === "water") {
        drawWaterStroke(ctx, currentStroke, width, height);
      } else {
        drawRakeStroke(
          ctx,
          currentStroke,
          width,
          height,
          shadow,
          highlight,
          groove,
        );
      }
    }

    // Redraw ripples
    ripples.forEach((ripple) => {
      drawRipple(ctx, ripple, width, height, shadow, highlight, groove);
    });
  };

  const blendColors = (c1: string, c2: string, ratio: number) => {
    // Simple hex blend helper
    if (!c1.startsWith("#")) return c1;
    const r1 = parseInt(c1.substring(1, 3), 16);
    const g1 = parseInt(c1.substring(3, 5), 16);
    const b1 = parseInt(c1.substring(5, 7), 16);

    const r2 = parseInt(c2.substring(1, 3), 16);
    const g2 = parseInt(c2.substring(3, 5), 16);
    const b2 = parseInt(c2.substring(5, 7), 16);

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    const rs = r.toString(16).padStart(2, "0");
    const gs = g.toString(16).padStart(2, "0");
    const bs = b.toString(16).padStart(2, "0");

    return `#${rs}${gs}${bs}`;
  };

  const drawSandGrain = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    opacity: number,
  ) => {
    if (opacity <= 0) return;
    if (!noiseCanvasRef.current) {
      const nCanvas = document.createElement("canvas");
      nCanvas.width = 128;
      nCanvas.height = 128;
      const nCtx = nCanvas.getContext("2d");
      if (nCtx) {
        const imgData = nCtx.createImageData(128, 128);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.floor(Math.random() * 60) + 195;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
          data[i + 3] = 255;
        }
        nCtx.putImageData(imgData, 0, 0);
        noiseCanvasRef.current = nCanvas;
      }
    }

    if (noiseCanvasRef.current) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = "multiply";
      const pattern = ctx.createPattern(noiseCanvasRef.current, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }
  };

  const drawRakeStroke = (
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    width: number,
    height: number,
    shadow: string,
    highlight: string,
    grooveColor: string,
  ) => {
    const points = stroke.points;
    if (points.length < 2) return;

    // Spacing based on rake size state
    const spacing = Math.max(6, stroke.brushSize * 1.2);
    const numTines = stroke.brushType === "wave" ? 3 : 5;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Sub-drawing helper
    const drawPath = (
      offsetX: number,
      offsetY: number,
      strokeStyle: string,
      lineWidth: number,
    ) => {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (let t = 0; t < numTines; t++) {
        const tineOffset = (t - (numTines - 1) / 2) * spacing;

        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          const px = pt.x * width;
          const py = pt.y * height;

          if (i === 0) {
            if (points.length > 1) {
              const next = points[1];
              const dx = next.x * width - px;
              const dy = next.y * height - py;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const nx = -dy / len;
              const ny = dx / len;
              ctx.moveTo(
                px + nx * tineOffset + offsetX,
                py + ny * tineOffset + offsetY,
              );
            } else {
              ctx.moveTo(px + offsetX, py + offsetY);
            }
          } else {
            const prev = points[i - 1];
            const prevX = prev.x * width;
            const prevY = prev.y * height;
            const dx = px - prevX;
            const dy = py - prevY;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            let wave = 0;
            if (stroke.brushType === "wave") {
              wave = Math.sin(i * 0.4) * (spacing * 0.6);
            }

            ctx.lineTo(
              px + nx * (tineOffset + wave) + offsetX,
              py + ny * (tineOffset + wave) + offsetY,
            );
          }
        }
      }
      ctx.stroke();
    };

    // Draw offset shadow (depth)
    const shadowOffset = atmosphere === "dusk" ? 2.5 : 1.5;
    drawPath(shadowOffset, shadowOffset, shadow, 2.2);

    // Draw offset highlight (reflection)
    drawPath(-0.8, -0.8, highlight, 2.2);

    // Draw main furrow center line
    drawPath(0, 0, grooveColor, 1.4);
  };

  const drawWaterStroke = (
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    width: number,
    height: number,
  ) => {
    const points = stroke.points;
    if (points.length === 0) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (points.length === 1) {
      const px = points[0].x * width;
      const py = points[0].y * height;
      const size = stroke.brushSize * 2.2;
      
      // Draw outer pool glow
      ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      ctx.beginPath();
      ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main water pool
      ctx.fillStyle = "rgba(14, 165, 233, 0.75)";
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();

      // Glistening highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(px - size * 0.3, py - size * 0.3, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Draw outer glowing water border
    ctx.strokeStyle = "rgba(56, 189, 248, 0.22)"; // light blue sky-400
    ctx.lineWidth = stroke.brushSize * 4.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * width, points[i].y * height);
    }
    ctx.stroke();

    // Draw main water body
    ctx.strokeStyle = "rgba(14, 165, 233, 0.7)"; // blue sky-500
    ctx.lineWidth = stroke.brushSize * 2.8;
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * width, points[i].y * height);
    }
    ctx.stroke();

    // Draw inner glistening stream
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)"; // white highlight
    ctx.lineWidth = stroke.brushSize * 0.8;
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * width, points[i].y * height);
    }
    ctx.stroke();
  };

  const drawRipple = (
    ctx: CanvasRenderingContext2D,
    ripple: Ripple,
    width: number,
    height: number,
    shadow: string,
    highlight: string,
    grooveColor: string,
  ) => {
    const rx = ripple.x * width;
    const ry = ripple.y * height;
    const numCircles = 4;
    const spacing = 12;

    const drawCircles = (
      offsetX: number,
      offsetY: number,
      strokeStyle: string,
      lineWidth: number,
    ) => {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      for (let c = 1; c <= numCircles; c++) {
        ctx.beginPath();
        ctx.arc(rx + offsetX, ry + offsetY, c * spacing, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    drawCircles(1.2, 1.2, shadow, 2.2);
    drawCircles(-0.8, -0.8, highlight, 2.2);
    drawCircles(0, 0, grooveColor, 1.4);
  };

  // -------------------------------------------------------------
  // HISTORY UTILITY
  // -------------------------------------------------------------
  const saveToHistory = (
    newPlants: Plant[],
    newStrokes: Stroke[],
    newRipples: Ripple[],
  ) => {
    const cutHistory = history.slice(0, historyIndex + 1);
    const newEntry: HistoryEntry = {
      plants: newPlants,
      strokes: newStrokes,
      ripples: newRipples,
    };
    const nextHistory = [...cutHistory, newEntry];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const triggerUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const entry = history[prevIdx];
      setPlants(entry.plants);
      setStrokes(entry.strokes);
      setRipples(entry.ripples);
      setHistoryIndex(prevIdx);
      audioRef.current?.playPruneSound();
      showToast("Undone last action");
    }
  };

  const triggerRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const entry = history[nextIdx];
      setPlants(entry.plants);
      setStrokes(entry.strokes);
      setRipples(entry.ripples);
      setHistoryIndex(nextIdx);
      audioRef.current?.playPlantSound();
      showToast("Redone action");
    }
  };

  // -------------------------------------------------------------
  // INTERACTION HANDLERS
  // -------------------------------------------------------------
  const shovelEmojiAt = (x: number, y: number) => {
    let deletedAny = false;
    setPlants((prev) => {
      const updated = prev.filter((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isNear = dist < 0.055;
        if (isNear) deletedAny = true;
        return !isNear;
      });
      if (deletedAny) {
        audioRef.current?.playPruneSound();
      }
      return updated;
    });
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (draggingPlantId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (activeTool === "plant") {
      plantEmojiAt(x, y);
    } else if (activeTool === "rake" || activeTool === "rake-wave") {
      setCurrentStroke({
        points: [{ x, y }],
        brushSize: rakeSize,
        brushType: activeTool === "rake-wave" ? "wave" : "standard",
      });
      audioRef.current?.playRakeSound();
    } else if (activeTool === "prune") {
      setIsShoveling(true);
      shovelEmojiAt(x, y);
    } else if (activeTool === "water") {
      setCurrentStroke({
        points: [{ x, y }],
        brushSize: waterBrushSize,
        brushType: "water",
      });
      audioRef.current?.playWaterSound();
      triggerVisualRipple(x, y);
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (draggingPlantId) {
      setPlants((prev) =>
        prev.map((p) => (p.id === draggingPlantId ? { ...p, x, y } : p)),
      );
      return;
    }

    if (isShoveling) {
      shovelEmojiAt(x, y);
      return;
    }

    if (currentStroke) {
      const lastPoint = currentStroke.points[currentStroke.points.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Add points if drag is sufficiently long to avoid jitter and save memory
      if (dist > 0.006) {
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, { x, y }],
        });
        if (Math.random() < 0.22) {
          if (currentStroke.brushType === "water") {
            audioRef.current?.playWaterSound();
            triggerVisualRipple(x, y);
          } else {
            audioRef.current?.playRakeSound();
          }
        }
      }
    }
  };

  const handleContainerMouseUp = () => {
    if (draggingPlantId) {
      setDraggingPlantId(null);
      saveToHistory(plantsRef.current, strokesRef.current, ripplesRef.current);
      return;
    }

    if (isShoveling) {
      setIsShoveling(false);
      saveToHistory(plantsRef.current, strokesRef.current, ripplesRef.current);
      return;
    }

    if (currentStroke) {
      if (currentStroke.points.length > 1) {
        const updatedStrokes = [...strokes, currentStroke];
        setStrokes(updatedStrokes);
        saveToHistory(plants, updatedStrokes, ripples);
      }
      setCurrentStroke(null);
    }
  };

  // Touch Events (Mobile support)
  const handleTouchStart = (e: React.TouchEvent, plantId?: string) => {
    // If touched a plant
    if (plantId) {
      e.stopPropagation();
      if (activeTool === "prune") {
        setIsShoveling(true);
        const pObj = plants.find((p) => p.id === plantId);
        if (pObj) {
          shovelEmojiAt(pObj.x, pObj.y);
        }
        return;
      }
      setDraggingPlantId(plantId);

      // Instantly center the plant on the pointer to grab from the middle
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const pointerEvent =
          "touches" in e && e.touches[0] ? e.touches[0] : (e as any);
        const x = Math.max(
          0,
          Math.min(1, (pointerEvent.clientX - rect.left) / rect.width),
        );
        const y = Math.max(
          0,
          Math.min(1, (pointerEvent.clientY - rect.top) / rect.height),
        );
        setPlants((prev) =>
          prev.map((p) => (p.id === plantId ? { ...p, x, y } : p)),
        );
      }
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;

    if (activeTool === "plant") {
      plantEmojiAt(x, y);
    } else if (activeTool === "rake" || activeTool === "rake-wave") {
      setCurrentStroke({
        points: [{ x, y }],
        brushSize: rakeSize,
        brushType: activeTool === "rake-wave" ? "wave" : "standard",
      });
      audioRef.current?.playRakeSound();
    } else if (activeTool === "prune") {
      setIsShoveling(true);
      shovelEmojiAt(x, y);
    } else if (activeTool === "water") {
      setCurrentStroke({
        points: [{ x, y }],
        brushSize: waterBrushSize,
        brushType: "water",
      });
      audioRef.current?.playWaterSound();
      triggerVisualRipple(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = Math.max(
      0,
      Math.min(1, (touch.clientX - rect.left) / rect.width),
    );
    const y = Math.max(
      0,
      Math.min(1, (touch.clientY - rect.top) / rect.height),
    );

    if (draggingPlantId) {
      setPlants((prev) =>
        prev.map((p) => (p.id === draggingPlantId ? { ...p, x, y } : p)),
      );
      return;
    }

    if (isShoveling) {
      shovelEmojiAt(x, y);
      return;
    }

    if (currentStroke) {
      const lastPoint = currentStroke.points[currentStroke.points.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Add points if drag is sufficiently long to avoid jitter and save memory
      if (dist > 0.006) {
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, { x, y }],
        });
        if (Math.random() < 0.22) {
          if (currentStroke.brushType === "water") {
            audioRef.current?.playWaterSound();
            triggerVisualRipple(x, y);
          } else {
            audioRef.current?.playRakeSound();
          }
        }
      }
    }

    if (currentStroke) {
      const lastPoint = currentStroke.points[currentStroke.points.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.006) {
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, { x, y }],
        });
        if (Math.random() < 0.22) {
          audioRef.current?.playRakeSound();
        }
      }
    }
  };

  // Helper to determine relative scale factors for different emojis
  const getEmojiScaleFactor = (emojiStr: string): number => {
    // Huge / Background / Special structures
    if (["🐉", "⛩️"].includes(emojiStr)) return 2.4;
    // Very Large / Trees / Main structures
    if (["🌳", "🌲", "⛲"].includes(emojiStr)) return 2.2;
    if (["🌴", "🗿", "🌈"].includes(emojiStr)) return 2.0;
    if (["🪨"].includes(emojiStr)) return 1.8;
    // Large elements
    if (["🦚"].includes(emojiStr)) return 1.75; // Peacock is now larger
    if (["🎋"].includes(emojiStr)) return 1.6;
    if (["🌵", "⛅", "🌙"].includes(emojiStr)) return 1.5;
    // Medium elements
    if (["🪵", "🧱", "🏮", "🧘"].includes(emojiStr)) return 1.35;
    if (["🌻"].includes(emojiStr)) return 1.25;
    if (["🏺"].includes(emojiStr)) return 1.2;
    if (["🦆"].includes(emojiStr)) return 1.15;
    if (["🔔"].includes(emojiStr)) return 1.1;
    // Under-standard / Small (0.7 - 0.9)
    if (["🌿", "🐸"].includes(emojiStr)) return 0.85;
    if (
      ["🍁", "🍂", "🍃", "🐦", "🕯️", "🍵", "⭐", "💎", "🌾"].includes(emojiStr)
    )
      return 0.8;
    if (["🍄"].includes(emojiStr)) return 0.75;
    if (["🌱", "🍀"].includes(emojiStr)) return 0.7;
    // Tiny creatures
    if (["🦋", "🐟", "🐠"].includes(emojiStr)) return 0.65;
    if (["🐌"].includes(emojiStr)) return 0.55;
    if (["🐞", "🐝"].includes(emojiStr)) return 0.4;

    // Standard items (flowers, crystal balls, chimes, turtles, etc.)
    return 1.0;
  };

  // -------------------------------------------------------------
  // PLANTING LOGIC
  // -------------------------------------------------------------
  const plantEmojiAt = (x: number, y: number) => {
    let emoji = selectedEmoji;
    let catId = "flora";

    if (randomMode) {
      const activeCat =
        EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];
      emoji =
        activeCat.emojis[Math.floor(Math.random() * activeCat.emojis.length)];
      catId = activeCat.id;
    } else {
      const matchedCat = EMOJI_CATEGORIES.find((c) =>
        c.emojis.includes(selectedEmoji),
      );
      if (matchedCat) catId = matchedCat.id;
    }

    // Add natural scale variation (+/- 15%) for more variety
    const scaleVariation = 0.85 + Math.random() * 0.3;

    const newPlant: Plant = {
      id: Math.random().toString(),
      x,
      y,
      type: emoji,
      rotation: Math.floor(Math.random() * 32) - 16, // -16 to +16 deg
      scale: emojiSize * getEmojiScaleFactor(emoji) * scaleVariation,
    };

    const updatedPlants = [...plants, newPlant];
    setPlants(updatedPlants);

    // Audio & Visual elements
    audioRef.current?.playPlantSound();
    audioRef.current?.playChime();
    triggerVisualRipple(x, y);

    // Ripples are only drawn manually in this version
    let updatedRipples = ripples;

    saveToHistory(updatedPlants, strokes, updatedRipples);
  };

  const handlePlantClick = (e: React.MouseEvent, plantId: string) => {
    e.stopPropagation();
    if (activeTool === "prune") {
      const updated = plants.filter((p) => p.id !== plantId);
      setPlants(updated);
      saveToHistory(updated, strokes, ripples);
      audioRef.current?.playPruneSound();
      showToast("Pruned emoji");
    } else {
      // Toggle a funny chime strike on click!
      audioRef.current?.playChime();
    }
  };

  const triggerVisualRipple = (x: number, y: number) => {
    const ripId = Math.random().toString();
    setVisualRipples((prev) => [...prev, { id: ripId, x, y }]);
    setTimeout(() => {
      setVisualRipples((prev) => prev.filter((r) => r.id !== ripId));
    }, 1000);
  };

  // -------------------------------------------------------------
  // CONTROLS & UTILITIES
  // -------------------------------------------------------------
  const selectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    setRandomMode(false);
    setActiveTool("plant");
    audioRef.current?.playPlantSound();
  };

  const clearAllPlants = () => {
    setPlants([]);
    saveToHistory([], strokes, ripples);
    audioRef.current?.playPruneSound();
    showToast("Cleared all plants");
  };

  const clearRake = () => {
    setStrokes([]);
    setRipples([]);
    saveToHistory(plants, [], []);
    audioRef.current?.playPruneSound();
    showToast("Raked sand flat");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // Export base64 hash of layout
  const exportLayout = () => {
    try {
      const data = {
        plants,
        strokes,
        ripples,
        theme: selectedTheme,
        atmosphere,
      };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      navigator.clipboard.writeText(b64);
      showToast("Layout code copied to clipboard!");
    } catch (e) {
      showToast("Failed to export garden.");
    }
  };

  // Import base64 hash of layout
  const importLayout = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(importString.trim())));
      const data = JSON.parse(decoded);

      const parsedPlants = (data.plants || []).map((p: any) => ({
        id: p.id || Math.random().toString(),
        x: Number(p.x) || 0.5,
        y: Number(p.y) || 0.5,
        type: String(p.type || "🌱"),
        rotation: Number(p.rotation) || 0,
        scale: Number(p.scale) || 1.2,
      }));

      setPlants(parsedPlants);
      setStrokes(data.strokes || []);
      setRipples(data.ripples || []);
      if (data.theme) setSelectedTheme(data.theme);

      saveToHistory(parsedPlants, data.strokes || [], data.ripples || []);
      audioRef.current?.playPlantSound();
      audioRef.current?.playChime();
      setShowImportDialog(false);
      setImportString("");
      showToast("Garden loaded successfully!");
    } catch (e) {
      showToast("Invalid code. Please try again.");
    }
  };

  return (
    <div
      className={`min-h-screen ${activeTheme.textColor} select-none relative overflow-hidden transition-colors duration-1000 bg-zinc-950 font-sans`}
      style={{ touchAction: "none" }}
    >
      <style>{`
        .zen-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        .zen-slider::-webkit-slider-runnable-track {
          background: rgba(16, 185, 129, 0.15);
          height: 6px;
          border-radius: 9999px;
        }
        .dark .zen-slider::-webkit-slider-runnable-track {
          background: rgba(16, 185, 129, 0.2);
        }
        .zen-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #059669;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          margin-top: -5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: transform 0.1s ease;
        }
        .zen-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .zen-slider::-moz-range-track {
          background: rgba(16, 185, 129, 0.15);
          height: 6px;
          border-radius: 9999px;
        }
        .dark .zen-slider::-moz-range-track {
          background: rgba(16, 185, 129, 0.2);
        }
        .zen-slider::-moz-range-thumb {
          background: #059669;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: transform 0.1s ease;
        }
        .zen-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
      {/* -------------------------------------------------------------
          BACKGROUND INTERACTIVE LAYER (CANVAS)
          ------------------------------------------------------------- */}
      <div
        ref={containerRef}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleContainerMouseUp}
        className="absolute inset-0 z-0 cursor-crosshair overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleContainerMouseDown}
          onTouchStart={(e) => handleTouchStart(e)}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Atmosphere Overlay (Color mix filters) */}
        {atmosphere === "dusk" && (
          <div className="absolute inset-0 bg-orange-600/10 pointer-events-none mix-blend-color-burn transition-all duration-1000" />
        )}
        {atmosphere === "night" && (
          <div className="absolute inset-0 bg-indigo-950/20 pointer-events-none mix-blend-multiply transition-all duration-1000" />
        )}

        {/* -------------------------------------------------------------
            PLANTED EMOJIS RENDER
            ------------------------------------------------------------- */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <AnimatePresence>
            {plants.map((plant) => {
              const isRakeOrWater = [
                "rake",
                "rake-wave",
                "rake-ripple",
                "water",
              ].includes(activeTool);

              return (
                <motion.div
                  key={plant.id}
                  initial={{ scale: 0, opacity: 0, rotate: plant.rotation }}
                  animate={{
                    scale: plant.scale,
                    opacity: 1,
                    rotate: plant.rotation,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  onMouseDown={(e) => {
                    if (typeof window !== "undefined") {
                      if (!isRakeOrWater) {
                        handleTouchStart(e as any, plant.id);
                      }
                    }
                  }}
                  onTouchStart={(e) => {
                    if (!isRakeOrWater) {
                      handleTouchStart(e, plant.id);
                    }
                  }}
                  onClick={(e) => {
                    if (!isRakeOrWater) {
                      handlePlantClick(e, plant.id);
                    }
                  }}
                  className={`absolute select-none origin-center flex items-center justify-center transition-transform duration-100 ${
                    isRakeOrWater
                      ? "pointer-events-none"
                      : "pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95"
                  }`}
                  style={{
                    left: `${plant.x * 100}%`,
                    top: `${plant.y * 100}%`,
                    marginLeft: "-40px",
                    marginTop: "-40px",
                    fontSize: "3.5rem",
                    width: "80px",
                    height: "80px",
                  }}
                >
                  {plant.type}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* -------------------------------------------------------------
            VISUAL RIPPLES IN DOM
            ------------------------------------------------------------- */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {visualRipples.map((r) => (
            <motion.div
              key={r.id}
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute border border-white/60 dark:border-zinc-300/40 rounded-full"
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: "48px",
                height: "48px",
                marginLeft: "-24px",
                marginTop: "-24px",
              }}
            />
          ))}
        </div>
      </div>
      {/* -------------------------------------------------------------
          TOP LEFT TITLE AREA
          ------------------------------------------------------------- */}
      <div className="absolute top-10 left-10 z-30 pointer-events-none">
        <h1
          className={`text-4xl font-light tracking-wide font-serif transition-colors duration-1000 pointer-events-none ${
            activeTheme.id === "moss" || activeTheme.id === "obsidian"
              ? "text-emerald-50 dark:text-emerald-100 drop-shadow-sm"
              : "text-green-900"
          }`}
        >
          The Zen Garden
        </h1>
        <p
          className={`mt-2 transition-colors duration-1000 pointer-events-none ${
            activeTheme.id === "moss" || activeTheme.id === "obsidian"
              ? "text-emerald-100/70 dark:text-emerald-200/60"
              : "text-green-700/60 opacity-60"
          }`}
        >
          Click anywhere to sow life.
        </p>
      </div>

      {/* -------------------------------------------------------------
          TOP BAR CONTROLS
          ------------------------------------------------------------- */}
      <header className="absolute top-0 inset-x-0 p-4 flex justify-end items-center z-30 gap-4 pointer-events-none">
        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 bg-emerald-50/95 dark:bg-emerald-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-700/60 shadow-lg pointer-events-auto">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${
              soundEnabled
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-inner"
                : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
            }`}
            title={soundEnabled ? "Mute chimes" : "Enable ambient wind chimes"}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            )}
          </button>

          {/* History control */}
          <button
            onClick={triggerUndo}
            disabled={historyIndex <= 0}
            className="p-2.5 rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={triggerRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2.5 rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>

          <span className="w-px h-6 bg-emerald-200/60 dark:bg-emerald-700/60 mx-1" />

          {/* Settings panel toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${
              sidebarOpen
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-inner"
                : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
            }`}
            title="Settings and Themes"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </header>
      {/* -------------------------------------------------------------
          BOTTOM INTERACTION DOCK
          ------------------------------------------------------------- */}
      <footer className="absolute bottom-6 inset-x-0 px-4 flex flex-col items-center gap-3 z-30 pointer-events-none">
        {/* Emojis selection grid (Visible when plant tool is active) */}
        {activeTool === "plant" && (
          <div className="w-full max-w-2xl bg-emerald-50/95 dark:bg-emerald-900/90 backdrop-blur-md rounded-3xl border border-emerald-200/50 dark:border-emerald-700/60 shadow-2xl p-4 pointer-events-auto flex flex-col gap-3">
            {/* Category tabs */}
            <div className="flex justify-between items-center border-b border-emerald-200/30 dark:border-emerald-700/40 pb-2 gap-2 overflow-x-auto">
              <div className="flex gap-1">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                      activeTab === cat.id
                        ? "bg-amber-100 dark:bg-emerald-800 text-amber-900 dark:text-emerald-100 font-semibold"
                        : "text-emerald-850/70 dark:text-emerald-300/70 hover:text-emerald-900 dark:hover:text-emerald-100"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="hidden sm:inline">{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Random Mode Trigger */}
              <button
                onClick={() => setRandomMode(!randomMode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all ${
                  randomMode
                    ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold"
                    : "text-emerald-850/70 dark:text-emerald-300/70 hover:text-emerald-900 dark:hover:text-emerald-100 border-emerald-200/30 dark:border-emerald-700/45"
                }`}
                title="Plant a random emoji from the active tab on click"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Mode</span>
              </button>
            </div>

            {/* Emojis grid */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-36 overflow-y-auto px-2 py-1.5">
              {EMOJI_CATEGORIES.find((c) => c.id === activeTab)?.emojis.map(
                (emoji) => (
                  <button
                    key={emoji}
                    onClick={() => selectEmoji(emoji)}
                    className={`aspect-square text-3xl flex items-center justify-center rounded-xl transition-all duration-100 ${
                      selectedEmoji === emoji && !randomMode
                        ? "bg-amber-200 dark:bg-emerald-800 border border-amber-400 dark:border-emerald-500 scale-105 shadow-inner"
                        : "bg-transparent border border-transparent hover:bg-emerald-100/60 dark:hover:bg-emerald-800/40 active:scale-95 text-emerald-900 dark:text-emerald-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ),
              )}
            </div>

            {randomMode && (
              <div className="text-center text-xs text-indigo-700 dark:text-indigo-300 italic animate-pulse font-medium">
                ✨ Random Mode active: Clicking on sand plants a random emoji
                from the "
                {EMOJI_CATEGORIES.find((c) => c.id === activeTab)?.name}"
                category.
              </div>
            )}
          </div>
        )}

        {/* Tool selector */}
        <div className="flex items-center gap-1.5 bg-emerald-50/95 dark:bg-emerald-900/90 backdrop-blur-md p-1 rounded-full border border-emerald-200/60 dark:border-emerald-700/60 shadow-xl pointer-events-auto">
          <button
            onClick={() => setActiveTool("plant")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTool === "plant"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
            }`}
          >
            Plant 🌱
          </button>
          <button
            onClick={() => setActiveTool("rake")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTool === "rake"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
            }`}
          >
            Rake ☰
          </button>
          <button
            onClick={() => setActiveTool("water")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTool === "water"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
            }`}
          >
            Water 💧
          </button>
          <button
            onClick={() => setActiveTool("prune")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTool === "prune"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
            }`}
          >
            Shovel 🪏
          </button>
        </div>
      </footer>
      {/* -------------------------------------------------------------
          SIDE SETTINGS PANEL
          ------------------------------------------------------------- */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-emerald-50/95 dark:bg-emerald-900/90 text-emerald-950 dark:text-emerald-50 border-l border-emerald-200/60 dark:border-emerald-700/60 backdrop-blur-lg shadow-2xl p-6 z-50 overflow-y-auto flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-emerald-200/60 dark:border-emerald-700/60">
                <h2 className="text-lg font-serif font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Settings2 className="w-5 h-5 text-amber-500" />
                  Garden Settings
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 transition-colors text-lg"
                >
                  &times;
                </button>
              </div>

              {/* Sand Themes selection */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs text-emerald-800/80 dark:text-emerald-300/80 uppercase tracking-widest font-bold">
                  Sand Color Theme
                </label>
                <div className="flex flex-col gap-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setSelectedTheme(theme.id);
                        showToast(`Theme: ${theme.name}`);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                        selectedTheme === theme.id
                          ? "bg-emerald-100 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-700 shadow-sm"
                          : "bg-emerald-50/50 dark:bg-emerald-900/20 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-5 h-5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-inner"
                          style={{ backgroundColor: theme.bg }}
                        />
                        <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                          {theme.name}
                        </span>
                      </div>
                      {selectedTheme === theme.id && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adjust Sizes */}
              <div className="flex flex-col gap-3">
                <label className="text-xs text-emerald-800/80 dark:text-emerald-300/80 uppercase tracking-widest font-bold">
                  Sizing
                </label>
                <div className="flex flex-col gap-2.5 bg-emerald-100/40 dark:bg-emerald-800/30 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-700/60">
                  <div>
                    <div className="flex justify-between text-xs text-emerald-850 dark:text-emerald-300 mb-1">
                      <span>Planted Emoji Size</span>
                      <span className="font-mono font-bold">
                        {emojiSize.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.2"
                      step="0.2"
                      value={emojiSize}
                      onChange={(e) => setEmojiSize(parseFloat(e.target.value))}
                      className="w-full zen-slider"
                    />
                  </div>

                  <hr className="border-emerald-200/60 dark:border-emerald-700/60 my-1" />

                  <div>
                    <div className="flex justify-between text-xs text-emerald-850 dark:text-emerald-300 mb-1">
                      <span>Rake Brush Width</span>
                      <span className="font-mono font-bold">{rakeSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="12"
                      step="1"
                      value={rakeSize}
                      onChange={(e) => setRakeSize(parseInt(e.target.value))}
                      className="w-full zen-slider"
                    />
                  </div>

                  <hr className="border-emerald-200/60 dark:border-emerald-700/60 my-1" />

                  <div>
                    <div className="flex justify-between text-xs text-emerald-850 dark:text-emerald-300 mb-1">
                      <span>Water Brush Width</span>
                      <span className="font-mono font-bold">{waterBrushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      step="2"
                      value={waterBrushSize}
                      onChange={(e) => setWaterBrushSize(parseInt(e.target.value))}
                      className="w-full zen-slider"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Controls */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={clearRake}
                  className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Clear Sand
                </button>
                <button
                  onClick={clearAllPlants}
                  className="w-full py-2.5 rounded-xl bg-rose-500/20 text-rose-800 dark:text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Emojis
                </button>
              </div>

              {/* Import / Export layout */}
              <div className="flex flex-col gap-2 border-t border-emerald-200/60 dark:border-emerald-700/60 pt-4 mt-auto">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={exportLayout}
                    className="py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                    title="Copy layout code to clipboard"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                  <button
                    onClick={() => setShowImportDialog(true)}
                    className="py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* -------------------------------------------------------------
          IMPORT DIALOG
          ------------------------------------------------------------- */}
      <AnimatePresence>
        {showImportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-4">
              <h3 className="text-md font-semibold text-zinc-200 font-serif">
                Import Zen Garden Layout
              </h3>
              <p className="text-xs text-zinc-400">
                Paste your exported garden string below to rebuild your garden
                sanctuary.
              </p>
              <textarea
                value={importString}
                onChange={(e) => setImportString(e.target.value)}
                placeholder="Paste code here..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 font-mono resize-none"
              />
              <div className="flex justify-end gap-2 text-xs font-semibold mt-2">
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportString("");
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={importLayout}
                  disabled={!importString.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  Import Garden
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      {/* -------------------------------------------------------------
          CENTER TOAST NOTIFICATION
          ------------------------------------------------------------- */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-zinc-900/90 text-zinc-100 border border-zinc-800 text-xs px-4 py-2 rounded-xl shadow-lg backdrop-blur"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
