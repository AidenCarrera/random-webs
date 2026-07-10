"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Maximize2, Minimize2, Pause, Play, RefreshCw } from "lucide-react";

type PresetId = "ember" | "lagoon" | "orchid" | "honey";

type Preset = {
  name: string;
  background: [string, string];
  glass: string;
  glow: string;
  lava: [string, string, string];
  blobCount: number;
  buoyancy: number;
  viscosity: number;
  drift: number;
};

type Blob = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  temperature: number;
  phase: number;
};

type Geometry = {
  width: number;
  height: number;
  centerX: number;
  lampTop: number;
  lampHeight: number;
  glassTop: number;
  glassBottom: number;
  glassHeight: number;
  bodyHalf: number;
  topCapHeight: number;
  baseHeight: number;
};

type PointerState = {
  active: boolean;
  down: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

const PRESETS: Record<PresetId, Preset> = {
  ember: {
    name: "Ember",
    background: ["#3a1924", "#160d16"],
    glass: "#5f2730",
    glow: "#ff6b48",
    lava: ["#ffd08a", "#ff6848", "#b91f42"],
    blobCount: 9,
    buoyancy: 0.34,
    viscosity: 0.978,
    drift: 0.04,
  },
  lagoon: {
    name: "Lagoon",
    background: ["#103b48", "#07151c"],
    glass: "#17454f",
    glow: "#38d8c7",
    lava: ["#c8fff1", "#42dfc2", "#14799a"],
    blobCount: 10,
    buoyancy: 0.29,
    viscosity: 0.982,
    drift: 0.035,
  },
  orchid: {
    name: "Orchid",
    background: ["#321844", "#140d20"],
    glass: "#4b295d",
    glow: "#d884ff",
    lava: ["#f4d5ff", "#c77cff", "#7137b8"],
    blobCount: 8,
    buoyancy: 0.26,
    viscosity: 0.984,
    drift: 0.032,
  },
  honey: {
    name: "Honey",
    background: ["#463015", "#1c140b"],
    glass: "#6a4a1d",
    glow: "#ffc857",
    lava: ["#fff3b7", "#ffc54f", "#d56d20"],
    blobCount: 11,
    buoyancy: 0.31,
    viscosity: 0.976,
    drift: 0.045,
  },
};

const PRESET_IDS = Object.keys(PRESETS) as PresetId[];
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixColor(
  from: ReturnType<typeof hexToRgb>,
  to: ReturnType<typeof hexToRgb>,
  amount: number,
) {
  return {
    r: Math.round(lerp(from.r, to.r, amount)),
    g: Math.round(lerp(from.g, to.g, amount)),
    b: Math.round(lerp(from.b, to.b, amount)),
  };
}

function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${rHex}${gHex}${bHex}`;
}

function generateLavaColors(baseColor: string): [string, string, string] {
  const { h, s, l } = hexToHsl(baseColor);
  const lightHex = hslToHex(h, Math.min(100, s + 10), Math.min(95, l + 25));
  const darkHex = hslToHex(h, Math.min(100, s * 1.1), Math.max(10, l * 0.45));
  return [lightHex, baseColor, darkHex];
}

function rgbToHex({ r, g, b }: ReturnType<typeof hexToRgb>) {
  return `#${[r, g, b]
    .map((channel) =>
      clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"),
    )
    .join("")}`;
}

function generateBackgroundColors(
  bubbleColor: string,
  liquidColor: string,
): [string, string] {
  // The bubble color drives the room, with a small amount of liquid color mixed in.
  const dominantColor = rgbToHex(
    mixColor(hexToRgb(bubbleColor), hexToRgb(liquidColor), 0.18),
  );
  const { h, s, l } = hexToHsl(dominantColor);

  return [
    hslToHex(h, clamp(s * 0.72 + 10, 24, 82), clamp(l * 0.28 + 7, 10, 25)),
    hslToHex(h, clamp(s * 0.42 + 5, 16, 58), clamp(l * 0.1 + 2, 4, 11)),
  ];
}

function halfWidthAt(y: number) {
  return 0.3 + 0.35 * y;
}

function createGlassPath(geometry: Geometry) {
  const { centerX: cx, glassTop, glassBottom, bodyHalf } = geometry;
  const topW = bodyHalf * 0.3;
  const bottomW = bodyHalf * 0.65;

  const path = new Path2D();
  path.moveTo(cx - topW, glassTop);
  path.lineTo(cx - bottomW, glassBottom);
  path.lineTo(cx + bottomW, glassBottom);
  path.lineTo(cx + topW, glassTop);
  path.closePath();
  return path;
}

function makeGeometry(width: number, height: number): Geometry {
  const isLandscapeMobile = width > height && height < 500;
  const topPadding = isLandscapeMobile ? 12 : 35;
  const bottomPadding = isLandscapeMobile ? 54 : 125;

  // Ensure the lamp leaves enough space at the bottom for the UI and top cap shadow
  const maxAvailableHeight = height - (topPadding + bottomPadding);

  // totalDrawnHeight = topCapHeight (0.16) + glassHeight (0.60) + baseHeight (0.44) = 1.20 * lampHeight
  const lampHeight = Math.min(Math.max(maxAvailableHeight / 1.2, 200), 850);

  const topCapHeight = lampHeight * 0.16;
  const glassHeight = lampHeight * 0.6;
  const baseHeight = lampHeight * 0.44;

  const totalDrawnHeight = topCapHeight + glassHeight + baseHeight;
  // Leave controls space at the bottom of the canvas and at least topPadding at the top
  const lampTop = Math.max(
    height - totalDrawnHeight - bottomPadding,
    topPadding,
  );

  const glassTop = lampTop + topCapHeight;
  // Adjust width percentage to look perfectly proportioned on mobile
  const bodyHalf = Math.min(width * 0.4, lampHeight * 0.26);

  return {
    width,
    height,
    centerX: width / 2,
    lampTop,
    lampHeight,
    glassTop,
    glassBottom: glassTop + glassHeight,
    glassHeight,
    bodyHalf,
    topCapHeight,
    baseHeight,
  };
}

function createBlobs(preset: Preset) {
  return Array.from({ length: preset.blobCount }, (_, index): Blob => {
    const y = 0.1 + Math.random() * 0.8;
    const r = 0.055 + Math.random() * 0.045;
    const availableWidth = Math.max(0.05, halfWidthAt(y) - r * 1.7);

    return {
      x: (Math.random() * 2 - 1) * availableWidth,
      y,
      r,
      vx: (Math.random() - 0.5) * 0.025,
      vy: (Math.random() - 0.5) * 0.025,
      temperature: clamp(0.2 + y * 0.72 + Math.random() * 0.12, 0, 1),
      phase: (index / preset.blobCount) * Math.PI * 2 + Math.random(),
    };
  });
}

function drawLampHardware(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  preset: Preset,
  glowStrength: number,
) {
  const {
    centerX: cx,
    lampTop,
    lampHeight,
    glassTop,
    glassBottom,
    bodyHalf,
    topCapHeight,
    baseHeight,
  } = geometry;

  const metal = context.createLinearGradient(
    cx - bodyHalf * 1.25,
    0,
    cx + bodyHalf * 1.25,
    0,
  );
  metal.addColorStop(0, "rgba(12, 13, 16, 0.98)");
  metal.addColorStop(0.24, "rgba(72, 74, 82, 0.98)");
  metal.addColorStop(0.5, "rgba(150, 151, 157, 0.98)");
  metal.addColorStop(0.68, "rgba(59, 61, 68, 0.98)");
  metal.addColorStop(1, "rgba(10, 11, 14, 0.98)");

  context.save();
  context.shadowBlur = bodyHalf * 0.12;
  context.shadowColor = "rgba(0, 0, 0, 0.55)";

  const topWBottom = bodyHalf * 0.3 + 2;
  const topWTop = bodyHalf * 0.18;
  const top = new Path2D();
  top.moveTo(cx - topWBottom, glassTop + 2);
  top.lineTo(cx - topWTop, lampTop + topCapHeight * 0.1);
  top.quadraticCurveTo(
    cx,
    lampTop - 4,
    cx + topWTop,
    lampTop + topCapHeight * 0.1,
  );
  top.lineTo(cx + topWBottom, glassTop + 2);
  top.closePath();
  context.fillStyle = metal;
  context.fill(top);

  const baseTop = glassBottom - 4;
  const baseBottom = glassBottom + baseHeight;
  const waistY = baseTop + baseHeight * 0.5;
  const baseWTop = bodyHalf * 0.65 + 2;
  const baseWWaist = bodyHalf * 0.45;
  const baseWBottom = baseWTop;

  const base = new Path2D();
  base.moveTo(cx - baseWTop, baseTop);
  base.lineTo(cx - baseWWaist, waistY);
  base.lineTo(cx - baseWBottom, baseBottom);
  base.quadraticCurveTo(
    cx,
    baseBottom + lampHeight * 0.03,
    cx + baseWBottom,
    baseBottom,
  );
  base.lineTo(cx + baseWWaist, waistY);
  base.lineTo(cx + baseWTop, baseTop);
  base.closePath();
  context.fillStyle = metal;
  context.fill(base);
  context.restore();

  context.save();
  context.globalAlpha = 0.28;
  context.strokeStyle = "rgba(255, 255, 255, 0.7)";
  context.lineWidth = 1;

  context.beginPath();
  context.moveTo(cx - topWTop * 0.6, lampTop + topCapHeight * 0.1);
  context.lineTo(cx - topWBottom * 0.6, glassTop - 2);
  context.stroke();

  context.beginPath();
  context.moveTo(cx - baseWWaist, waistY);
  context.quadraticCurveTo(cx, waistY + 4, cx + baseWWaist, waistY);
  context.stroke();

  context.beginPath();
  context.moveTo(cx - baseWBottom * 0.7, baseBottom - 4);
  context.quadraticCurveTo(
    cx,
    baseBottom + 5,
    cx + baseWBottom * 0.7,
    baseBottom - 4,
  );
  context.stroke();
  context.restore();
}

function drawGlass(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  preset: Preset,
  path: Path2D,
  glowStrength: number,
) {
  const { centerX: cx, glassTop, glassHeight, bodyHalf } = geometry;

  context.save();
  const fill = context.createLinearGradient(cx - bodyHalf, 0, cx + bodyHalf, 0);
  fill.addColorStop(0, rgba(preset.glass, 0.15));
  fill.addColorStop(0.18, rgba(preset.glass, 0.36));
  fill.addColorStop(0.52, rgba(preset.glass, 0.22));
  fill.addColorStop(0.82, rgba(preset.glass, 0.32));
  fill.addColorStop(1, rgba(preset.glass, 0.12));
  context.fillStyle = fill;
  context.fill(path);
  context.restore();

  context.save();
  context.clip(path);
  const bottomLight = context.createRadialGradient(
    cx,
    glassTop + glassHeight * 0.96,
    0,
    cx,
    glassTop + glassHeight * 0.96,
    bodyHalf * 1.15,
  );
  bottomLight.addColorStop(0, rgba(preset.glow, 0.22 * glowStrength));
  bottomLight.addColorStop(0.48, rgba(preset.glow, 0.07 * glowStrength));
  bottomLight.addColorStop(1, rgba(preset.glow, 0));
  context.fillStyle = bottomLight;
  context.fillRect(cx - bodyHalf * 1.15, glassTop, bodyHalf * 2.3, glassHeight);
  context.restore();

  context.save();
  const outline = context.createLinearGradient(
    cx - bodyHalf,
    0,
    cx + bodyHalf,
    0,
  );
  outline.addColorStop(0, "rgba(255, 255, 255, 0.16)");
  outline.addColorStop(0.22, "rgba(255, 255, 255, 0.04)");
  outline.addColorStop(0.75, "rgba(255, 255, 255, 0.025)");
  outline.addColorStop(1, "rgba(255, 255, 255, 0.11)");

  const outlinePath = new Path2D();
  outlinePath.moveTo(cx - bodyHalf * 0.3, glassTop);
  outlinePath.lineTo(cx - bodyHalf * 0.65, glassTop + glassHeight);
  outlinePath.moveTo(cx + bodyHalf * 0.3, glassTop);
  outlinePath.lineTo(cx + bodyHalf * 0.65, glassTop + glassHeight);

  context.strokeStyle = outline;
  context.lineWidth = 1.4;
  context.stroke(outlinePath);

  context.globalAlpha = 0.42;
  context.strokeStyle = "rgba(255, 255, 255, 0.48)";
  context.lineWidth = Math.max(1, bodyHalf * 0.014);
  context.lineCap = "round";
  context.beginPath();
  const highlightTopY = glassTop + glassHeight * 0.05;
  const highlightBottomY = glassTop + glassHeight * 0.85;
  const highlightTopX = cx - (0.3 + 0.35 * 0.05) * bodyHalf + bodyHalf * 0.08;
  const highlightBottomX =
    cx - (0.3 + 0.35 * 0.85) * bodyHalf + bodyHalf * 0.15;
  context.moveTo(highlightTopX, highlightTopY);
  context.quadraticCurveTo(
    cx - (0.3 + 0.35 * 0.45) * bodyHalf + bodyHalf * 0.12,
    glassTop + glassHeight * 0.45,
    highlightBottomX,
    highlightBottomY,
  );
  context.stroke();
  context.restore();
}

export default function LavaLampPage() {
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
  const pausedRef = useRef(false);
  const cursorModeRef = useRef<"default" | "grab" | "grabbing">("default");

  const [presetId, setPresetId] = useState<PresetId>("ember");
  const [bubbleColor, setBubbleColor] = useState(PRESETS.ember.glow);
  const [liquidColor, setLiquidColor] = useState(PRESETS.ember.glass);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorMode, setCursorMode] = useState<"default" | "grab" | "grabbing">(
    "default",
  );
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
  const renderPresetRef = useRef(renderPreset);
  const physicsPresetRef = useRef(PRESETS[presetId]);
  const isUsingExactPreset =
    bubbleColor === PRESETS[presetId].glow &&
    liquidColor === PRESETS[presetId].glass;

  const glowStrength = 1.8;
  const pageStyle = useMemo(() => {
    const rgb = hexToRgb(renderPreset.glow);
    const bgA = renderPreset.background[0];
    const bgB = renderPreset.background[1];
    return {
      "--bg-a": bgA,
      "--bg-b": bgB,
      "--accent": renderPreset.glow,
      "--accent-soft": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`,
      background: `
          radial-gradient(
            circle at 50% 28%,
            rgba(255, 255, 255, 0.07),
            transparent 38%
          ),
          radial-gradient(
            circle at 50% 25%,
            rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28),
            transparent 48%
          ),
          linear-gradient(145deg, ${bgA}, ${bgB} 70%)
        `.replace(/\s+/g, " "),
    } as CSSProperties;
  }, [renderPreset]);

  const changeCursorMode = useCallback(
    (next: "default" | "grab" | "grabbing") => {
      if (cursorModeRef.current === next) return;
      cursorModeRef.current = next;
      setCursorMode(next);
    },
    [],
  );

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    renderPresetRef.current = renderPreset;
  }, [renderPreset]);

  useEffect(() => {
    physicsPresetRef.current = PRESETS[presetId];
  }, [presetId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const blobs = blobsRef.current;
    const targetCount = PRESETS[presetId].blobCount;
    if (!blobs.length || blobs.length === targetCount) return;

    if (blobs.length < targetCount) {
      const additions = createBlobs({
        ...PRESETS[presetId],
        blobCount: targetCount - blobs.length,
      });
      blobs.push(...additions);
    } else {
      blobs.splice(targetCount);
    }
  }, [presetId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const buffer = document.createElement("canvas");
    const bufferContext = buffer.getContext("2d");
    if (!bufferContext) return;

    let imageData = bufferContext.createImageData(1, 1);
    const blobs = createBlobs(physicsPresetRef.current);
    blobsRef.current = blobs;
    let animationFrame = 0;
    let previousTime = performance.now();
    let width = 1;
    let height = 1;
    let dpr = 1;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const geometry = makeGeometry(width, height);
      geometryRef.current = geometry;

      buffer.width = clamp(Math.round(geometry.bodyHalf * 1.3), 120, 250);
      buffer.height = clamp(Math.round(geometry.glassHeight * 0.62), 180, 390);
      imageData = bufferContext.createImageData(buffer.width, buffer.height);
    };

    const update = (delta: number, elapsed: number) => {
      const geometry = geometryRef.current;
      if (!geometry) return;

      const pointer = pointerRef.current;
      const bodyToHeight = geometry.bodyHalf / geometry.glassHeight;
      const physicsPreset = physicsPresetRef.current;
      const damping = Math.pow(physicsPreset.viscosity, delta * 60);

      for (const blob of blobs) {
        if (blob.y > 0.76) {
          blob.temperature += delta * (0.12 + (blob.y - 0.76) * 0.4);
        } else if (blob.y < 0.24) {
          blob.temperature -= delta * (0.11 + (0.24 - blob.y) * 0.34);
        } else {
          blob.temperature += (0.5 - blob.temperature) * delta * 0.025;
        }
        blob.temperature = clamp(blob.temperature, 0.02, 0.98);

        const currentHalf = halfWidthAt(blob.y);
        const rY = blob.r;
        const rX = blob.r / bodyToHeight;
        const thermalLift = (0.5 - blob.temperature) * physicsPreset.buoyancy;
        const drift =
          Math.sin(elapsed * 0.00042 + blob.phase + blob.y * 4.5) *
          physicsPreset.drift;

        blob.vy += thermalLift * delta;
        blob.vx += drift * delta;
        blob.vx += -blob.x * 0.006 * delta;

        if (pointer.active) {
          const blobX = blob.x * bodyToHeight;
          const pointerX = pointer.x * bodyToHeight;
          const dx = pointerX - blobX;
          const dy = pointer.y - blob.y;
          const distance = Math.hypot(dx, dy);
          const radius = pointer.down ? 0.3 : 0.2;

          if (distance < radius && distance > 0.0001) {
            const force =
              (1 - distance / radius) * (pointer.down ? 1.45 : 0.38);
            blob.vx += ((dx / distance) * force * delta) / bodyToHeight;
            blob.vy += (dy / distance) * force * delta;
            blob.vx += (pointer.dx / bodyToHeight) * force * 0.52;
            blob.vy += pointer.dy * force * 0.52;
            if (pointer.down)
              blob.temperature = clamp(blob.temperature + delta * 0.16, 0, 1);
          }
        }

        blob.vx *= damping;
        blob.vy *= damping;
        blob.x += blob.vx * delta;
        blob.y += blob.vy * delta;

        const updatedHalf = halfWidthAt(clamp(blob.y, 0, 1));
        const sideLimit = Math.max(0.02, updatedHalf - rX * 0.92);
        if (Math.abs(blob.x) > sideLimit) {
          blob.x = Math.sign(blob.x) * sideLimit;
          blob.vx *= -0.52;
        }

        if (blob.y < rY * 0.82) {
          blob.y = rY * 0.82;
          blob.vy = Math.abs(blob.vy) * 0.45;
          blob.temperature = Math.max(0.04, blob.temperature - 0.08);
        } else if (blob.y > 1 - rY * 0.8) {
          blob.y = 1 - rY * 0.8;
          blob.vy = -Math.abs(blob.vy) * 0.42;
          blob.temperature = Math.min(0.96, blob.temperature + 0.08);
        }

        if (currentHalf < 0.4 && blob.y < 0.15) {
          blob.vx += -blob.x * delta * 0.04;
        }
      }

      // Soft separation keeps the field lively while still allowing blobs to merge visually.
      for (let i = 0; i < blobs.length; i += 1) {
        for (let j = i + 1; j < blobs.length; j += 1) {
          const a = blobs[i];
          const b = blobs[j];
          const dx = (b.x - a.x) * bodyToHeight;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.0001;
          const preferred = (a.r + b.r) * 0.72;

          if (distance < preferred) {
            const push = (preferred - distance) * 0.018;
            const nx = dx / distance;
            const ny = dy / distance;
            a.vx -= (nx * push) / bodyToHeight;
            b.vx += (nx * push) / bodyToHeight;
            a.vy -= ny * push;
            b.vy += ny * push;
          }
        }
      }

      pointer.dx *= 0.72;
      pointer.dy *= 0.72;
    };

    const renderLava = (geometry: Geometry, activePreset: Preset) => {
      const { bodyHalf, glassHeight } = geometry;
      const lavaColors = activePreset.lava.map(hexToRgb) as [
        ReturnType<typeof hexToRgb>,
        ReturnType<typeof hexToRgb>,
        ReturnType<typeof hexToRgb>,
      ];
      const data = imageData.data;
      const bufferWidth = buffer.width;
      const bufferHeight = buffer.height;
      const spanX = bodyHalf * 2.18;
      const halfSpanInHeightUnits = spanX / glassHeight / 2;
      const bodyToHeight = bodyHalf / glassHeight;

      let offset = 0;
      for (let py = 0; py < bufferHeight; py += 1) {
        const y = (py + 0.5) / bufferHeight;
        const permittedHalf = halfWidthAt(y) * bodyToHeight;

        for (let px = 0; px < bufferWidth; px += 1) {
          const x =
            ((px + 0.5) / bufferWidth - 0.5) * halfSpanInHeightUnits * 2;

          if (Math.abs(x) > permittedHalf) {
            data[offset + 3] = 0;
            offset += 4;
            continue;
          }

          let field = 0;
          let weightedTemperature = 0;
          for (const blob of blobs) {
            const blobX = blob.x * bodyToHeight;
            const dx = x - blobX;
            const dy = y - blob.y;
            const contribution =
              (blob.r * blob.r) / (dx * dx + dy * dy + 0.00034);
            field += contribution;
            weightedTemperature += blob.temperature * contribution;
          }

          const alpha = smoothstep(0.82, 1.08, field);
          if (alpha <= 0.002) {
            data[offset + 3] = 0;
            offset += 4;
            continue;
          }

          const temperature = weightedTemperature / Math.max(field, 0.0001);
          const colorPosition = clamp(temperature * 0.72 + y * 0.18, 0, 1);
          const base =
            colorPosition < 0.5
              ? mixColor(lavaColors[0], lavaColors[1], colorPosition * 2)
              : mixColor(
                  lavaColors[1],
                  lavaColors[2],
                  (colorPosition - 0.5) * 2,
                );
          const innerLight = clamp((field - 1.1) * 0.055, 0, 0.15);
          const color = mixColor(base, lavaColors[0], innerLight);

          data[offset] = color.r;
          data[offset + 1] = color.g;
          data[offset + 2] = color.b;
          data[offset + 3] = Math.round(alpha * 246);
          offset += 4;
        }
      }

      bufferContext.putImageData(imageData, 0, 0);

      const path = createGlassPath(geometry);
      context.save();
      context.clip(path);
      context.globalAlpha = 0.98;
      context.filter = `drop-shadow(0 0 ${Math.max(7, bodyHalf * 0.055)}px ${rgba(
        activePreset.glow,
        0.46 * glowStrength,
      )})`;
      context.imageSmoothingEnabled = true;
      context.drawImage(
        buffer,
        geometry.centerX - spanX / 2,
        geometry.glassTop,
        spanX,
        geometry.glassHeight,
      );
      context.restore();
    };

    const draw = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.034);
      previousTime = time;

      const geometry = geometryRef.current;
      if (geometry) {
        const activePreset = renderPresetRef.current;
        if (!pausedRef.current) update(delta, time);

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);

        const halo = context.createRadialGradient(
          geometry.centerX,
          geometry.glassTop + geometry.glassHeight * 0.58,
          0,
          geometry.centerX,
          geometry.glassTop + geometry.glassHeight * 0.58,
          geometry.bodyHalf * 2.3,
        );
        halo.addColorStop(0, rgba(activePreset.glow, 0.22 * glowStrength));
        halo.addColorStop(0.45, rgba(activePreset.glow, 0.075 * glowStrength));
        halo.addColorStop(1, rgba(activePreset.glow, 0));
        context.fillStyle = halo;
        context.fillRect(0, 0, width, height);

        const glassPath = createGlassPath(geometry);
        drawGlass(context, geometry, activePreset, glassPath, glowStrength);
        renderLava(geometry, activePreset);
        drawGlass(context, geometry, activePreset, glassPath, glowStrength);
        drawLampHardware(context, geometry, activePreset, glowStrength);
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

  const updatePointer = useCallback(
    (event: ReactPointerEvent<HTMLElement>, down = pointerRef.current.down) => {
      const target = event.target as HTMLElement;
      if (target.closest(".controls")) {
        if (!pointerRef.current.down) changeCursorMode("default");
        return;
      }

      const canvas = canvasRef.current;
      const geometry = geometryRef.current;
      if (!canvas || !geometry) return;

      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const nextX = (localX - geometry.centerX) / geometry.bodyHalf;
      const nextY = (localY - geometry.glassTop) / geometry.glassHeight;
      const inside =
        nextY >= 0 &&
        nextY <= 1 &&
        Math.abs(nextX) <= halfWidthAt(clamp(nextY, 0, 1));
      const bodyToHeight = geometry.bodyHalf / geometry.glassHeight;
      const pointerX = nextX * bodyToHeight;
      let lavaField = 0;

      if (inside) {
        for (const blob of blobsRef.current) {
          const dx = pointerX - blob.x * bodyToHeight;
          const dy = nextY - blob.y;
          lavaField += (blob.r * blob.r) / (dx * dx + dy * dy + 0.00034);
        }
      }

      const overLava = inside && lavaField >= 0.82;
      const pointer = pointerRef.current;
      const dragging = down && inside && (pointer.down || overLava);

      pointer.dx = clamp(nextX - pointer.x, -0.12, 0.12);
      pointer.dy = clamp(nextY - pointer.y, -0.12, 0.12);
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.active = inside;
      pointer.down = dragging;

      changeCursorMode(dragging ? "grabbing" : overLava ? "grab" : "default");
    },
    [changeCursorMode],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest(".controls")) return;
    updatePointer(event, true);
    if (pointerRef.current.down) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) =>
    updatePointer(event);

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    updatePointer(event, false);
    pointerRef.current.down = false;
  };

  const handlePointerLeave = () => {
    pointerRef.current.active = false;
    pointerRef.current.down = false;
    changeCursorMode("default");
  };

  const toggleFullscreen = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    if (isFullscreen) {
      if (document.fullscreenElement)
        await document.exitFullscreen().catch(() => undefined);
      setIsFullscreen(false);
      return;
    }

    setIsFullscreen(true);
    if (stage.requestFullscreen) {
      await stage.requestFullscreen().catch(() => undefined);
    }
  };

  return (
    <main
      className={`flex h-svh min-h-svh flex-col overflow-hidden p-6 sm:p-8 md:p-12 pb-3 max-[700px]:p-0 lava-page ${isFullscreen ? "is-fullscreen" : ""}`}
      style={pageStyle}
    >
      <section
        ref={stageRef}
        className={`relative w-full max-w-270 flex-1 min-h-0 mx-auto overflow-visible select-none touch-none lamp-stage cursor-${cursorMode}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDragStart={(event) => event.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          draggable={false}
          aria-label="Interactive animated lava lamp"
        />

        <div
          className="absolute z-10 left-1/2 bottom-3.5 max-[700px]:bottom-5 max-[700px]:landscape:bottom-1.5 -translate-x-1/2 flex items-center gap-2.5 max-[700px]:gap-1.75 w-max max-w-[calc(100%-28px)] max-[700px]:w-[calc(100%-24px)] max-[700px]:justify-between p-1.5 border border-white/10 rounded-2xl bg-[#08090c]/58 shadow-[0_12px_38px_rgba(0,0,0,0.3)] backdrop-blur-lg cursor-default controls"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div
            className="flex items-center gap-0.5 overflow-x-auto no-scrollbar preset-list"
            aria-label="Fluid presets"
          >
            {PRESET_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`flex-none px-2.75 max-[700px]:px-2.25 max-[410px]:px-2 py-2 border-0 rounded-[9px] text-[0.76rem] max-[410px]:text-[0.7rem] font-[610] tracking-[0.015em] cursor-pointer transition-all duration-150 active:scale-95 ${
                  id === presetId && isUsingExactPreset
                    ? "text-white bg-white/11 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.045)] active"
                    : "text-white/58 bg-transparent hover:text-white/92 hover:bg-white/7.5"
                }`}
                onClick={() => {
                  setPresetId(id);
                  setBubbleColor(PRESETS[id].glow);
                  setLiquidColor(PRESETS[id].glass);
                }}
              >
                {PRESETS[id].name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 pl-1.5 border-l border-white/8 icon-actions">
            <label
              className="grid w-8.5 h-8.5 place-items-center border border-white/11 rounded-[9px] bg-white/4.5 cursor-pointer color-picker"
              title="Liquid color"
            >
              <span className="sr-only">Liquid color</span>
              <input
                type="color"
                className="w-5 h-5 p-0 border-0 rounded-full bg-transparent cursor-pointer"
                value={liquidColor}
                onChange={(event) => setLiquidColor(event.target.value)}
                aria-label="Liquid color"
              />
            </label>
            <label
              className="grid w-8.5 h-8.5 place-items-center border border-white/11 rounded-[9px] bg-white/4.5 cursor-pointer color-picker"
              title="Bubble color"
            >
              <span className="sr-only">Bubble color</span>
              <input
                type="color"
                className="w-5 h-5 p-0 border-0 rounded-full bg-transparent cursor-pointer"
                value={bubbleColor}
                onChange={(event) => setBubbleColor(event.target.value)}
                aria-label="Bubble color"
              />
            </label>

            <button
              type="button"
              className="grid w-8.5 h-8.5 place-items-center border-0 rounded-[9px] cursor-pointer transition-all duration-150 active:scale-95 text-white/58 bg-transparent hover:text-white/92 hover:bg-white/7.5 icon-button"
              onClick={() => setIsPaused((value) => !value)}
              aria-label={isPaused ? "Resume animation" : "Pause animation"}
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play size={17} /> : <Pause size={17} />}
            </button>
            <button
              type="button"
              className="grid w-8.5 h-8.5 place-items-center border-0 rounded-[9px] cursor-pointer transition-all duration-150 active:scale-95 text-white/58 bg-transparent hover:text-white/92 hover:bg-white/7.5 icon-button"
              onClick={() => setResetKey((value) => value + 1)}
              aria-label="Reset fluid"
              title="Reset"
            >
              <RefreshCw size={17} />
            </button>
            <button
              type="button"
              className="hidden sm:grid w-8.5 h-8.5 place-items-center border-0 rounded-[9px] cursor-pointer transition-all duration-150 active:scale-95 text-white/58 bg-transparent hover:text-white/92 hover:bg-white/7.5 icon-button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          background: var(--bg-b);
        }

        :global(body) {
          margin: 0;
          background: var(--bg-b);
        }

        :global(button) {
          font: inherit;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .lava-page {
          color: rgba(255, 255, 255, 0.92);
          transition: background 450ms ease;
        }

        .lamp-stage.cursor-grab {
          cursor: grab;
        }

        .lamp-stage.cursor-grabbing {
          cursor: grabbing;
        }

        canvas {
          display: block;
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          pointer-events: none;
          -webkit-user-drag: none;
        }

        .preset-list {
          scrollbar-width: none;
        }

        .preset-list::-webkit-scrollbar {
          display: none;
        }

        .color-picker input::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .color-picker input::-webkit-color-swatch {
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
        }

        .is-fullscreen {
          position: fixed;
          z-index: 9999;
          inset: 0;
          width: 100%;
          min-height: 100svh;
          padding: 0;
        }

        .is-fullscreen .page-header {
          display: none;
        }

        .is-fullscreen .lamp-stage {
          width: 100%;
          height: 100svh;
          min-height: 0;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }

        @media (max-width: 900px) and (orientation: landscape) {
          .controls {
            bottom: 6px !important;
          }
        }

        .lamp-stage:fullscreen {
          width: 100vw;
          height: 100vh;
          min-height: 0;
          border: 0;
          border-radius: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .preset-list button,
          .icon-button,
          .lava-page {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
