"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Download, LoaderCircle, Trash2, X } from "lucide-react";

// --- Types ---
type Phase = "TYPING" | "SUCKING" | "DIGESTING";

interface Particle {
  id: number;
  char: string;
  startX: number;
  startY: number;
  startRotation: number;
}

const GIF_SIZE = 420;
const GIF_FRAMES = 56;
const GIF_DELAY_MS = 45;
const GIF_PURPLE_FRAMES = 18;
const GIF_VOID_SIZE = 244;
const GIF_VOID_X = 146;
const GIF_VOID_Y = 88;
const GIF_VOID_CENTER_X = GIF_VOID_X + GIF_VOID_SIZE / 2;
const GIF_VOID_CENTER_Y = GIF_VOID_Y + GIF_VOID_SIZE / 2;
const GIF_STAR_DRIFT_PER_FRAME = 0.72;
const LIVE_STAR_SPEED_MULTIPLIER = 0.38;
const MOBILE_BREAKPOINT = 768;

type GifGlyph = {
  char: string;
  x: number;
  y: number;
};

type GifStar = {
  x: number;
  y: number;
  size: number;
  baseSpeed: number;
  hasTrail: boolean;
  opacity: number;
};

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = fileName;
  link.href = objectUrl;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function createGifStars(): GifStar[] {
  return Array.from({ length: 240 }, (_, idx) => {
    const isDeepBackground = idx >= 40;
    const hasTrail = !isDeepBackground && idx % 13 === 0;

    return {
      x: (((Math.sin(idx * 91.7) * 10000) % 1) + 1) % 1,
      y: (((Math.sin(idx * 47.3 + 1.7) * 10000) % 1) + 1) % 1,
      size: isDeepBackground ? 0.7 : ((idx * 17) % 10) / 10 + 0.7,
      baseSpeed: isDeepBackground
        ? 0.0014 + (((idx * 19) % 10) / 10) * 0.005
        : 0.015 + (((idx * 23) % 10) / 10) * (hasTrail ? 0.22 : 0.055),
      hasTrail,
      opacity: isDeepBackground
        ? 0.08 + (((idx * 29) % 10) / 10) * 0.2
        : 0.3 + (((idx * 31) % 10) / 10) * 0.4,
    };
  });
}

function drawVoidGifFrame(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  stars: GifStar[],
  frame: number,
) {
  const size = GIF_SIZE;
  const drift = frame * GIF_STAR_DRIFT_PER_FRAME;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#07060c";
  ctx.fillRect(0, 0, size, size);

  stars.forEach((star) => {
    const starX = star.x * size;
    const starY = (star.y * size + drift * star.baseSpeed * 8) % size;

    if (star.hasTrail) {
      ctx.beginPath();
      ctx.moveTo(starX, starY);
      ctx.lineTo(starX, starY - 6);
      ctx.strokeStyle = `rgba(168, 85, 247, ${star.baseSpeed * 0.45})`;
      ctx.lineWidth = star.size * 0.9;
      ctx.stroke();
    }

    ctx.fillStyle = star.hasTrail
      ? "rgba(216, 180, 254, 0.8)"
      : `rgba(255, 255, 255, ${star.opacity})`;
    ctx.beginPath();
    ctx.arc(starX, starY, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.drawImage(image, GIF_VOID_X, GIF_VOID_Y, GIF_VOID_SIZE, GIF_VOID_SIZE);
}

function createVoidSvgMarkup(frame: number, mass = 1) {
  const outerRotation = -(360 * frame) / 42;
  const middleRotation = (360 * frame) / 24;
  const innerRotation = -(360 * frame) / 12;
  const pulse = mass + Math.sin((frame / GIF_FRAMES) * Math.PI * 2) * 0.04;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs>
        <filter id="bh-glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
        </filter>
        <filter id="bh-glow-mid" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>
        <filter id="bh-glow-fine" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <radialGradient id="outer-shroud" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1e0b36" stop-opacity="0.75" />
          <stop offset="45%" stop-color="#2e1065" stop-opacity="0.45" />
          <stop offset="80%" stop-color="#172554" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#07060c" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="mid-vortex" cx="50%" cy="50%" r="50%">
          <stop offset="25%" stop-color="#db2777" stop-opacity="0" />
          <stop offset="45%" stop-color="#a855f7" stop-opacity="0.5" />
          <stop offset="65%" stop-color="#6d28d9" stop-opacity="0.35" />
          <stop offset="90%" stop-color="#1e3a8a" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#07060c" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="inner-vortex" cx="50%" cy="50%" r="50%">
          <stop offset="35%" stop-color="#c084fc" stop-opacity="0" />
          <stop offset="50%" stop-color="#7c3aed" stop-opacity="0.75" />
          <stop offset="70%" stop-color="#4338ca" stop-opacity="0.4" />
          <stop offset="90%" stop-color="#1e3a8a" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#07060c" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000" stop-opacity="1" />
          <stop offset="90%" stop-color="#000" stop-opacity="1" />
          <stop offset="96%" stop-color="#6d28d9" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0" />
        </radialGradient>
      </defs>

      <g transform="rotate(${outerRotation} 200 200)">
        <circle cx="200" cy="200" r="170" fill="url(#outer-shroud)" filter="url(#bh-glow-heavy)" />
        <path
          d="M 200 200 Q 280 120 330 200 T 200 350"
          fill="none"
          stroke="rgba(91, 33, 182, 0.2)"
          stroke-width="35"
          stroke-linecap="round"
          filter="url(#bh-glow-heavy)"
        />
        <path
          d="M 200 200 Q 120 280 70 200 T 200 50"
          fill="none"
          stroke="rgba(30, 58, 138, 0.15)"
          stroke-width="35"
          stroke-linecap="round"
          filter="url(#bh-glow-heavy)"
        />
      </g>

      <g transform="rotate(${middleRotation} 200 200)">
        <circle cx="200" cy="200" r="130" fill="url(#mid-vortex)" filter="url(#bh-glow-mid)" />
        <path
          d="M 200 200 Q 250 140 280 200 T 200 310"
          fill="none"
          stroke="rgba(219, 39, 119, 0.25)"
          stroke-width="16"
          stroke-linecap="round"
          filter="url(#bh-glow-mid)"
        />
        <path
          d="M 200 200 Q 150 260 120 200 T 200 90"
          fill="none"
          stroke="rgba(109, 40, 217, 0.3)"
          stroke-width="16"
          stroke-linecap="round"
          filter="url(#bh-glow-mid)"
        />
      </g>

      <g transform="rotate(${innerRotation} 200 200)">
        <circle cx="200" cy="200" r="95" fill="url(#inner-vortex)" filter="url(#bh-glow-fine)" />
        <path
          d="M 200 200 Q 230 160 250 200 T 200 270"
          fill="none"
          stroke="rgba(124, 58, 237, 0.65)"
          stroke-width="7"
          stroke-linecap="round"
          filter="url(#bh-glow-fine)"
        />
        <path
          d="M 200 200 Q 170 240 150 200 T 200 130"
          fill="none"
          stroke="rgba(29, 78, 216, 0.45)"
          stroke-width="7"
          stroke-linecap="round"
          filter="url(#bh-glow-fine)"
        />
      </g>

      <g transform="translate(200 200) scale(${pulse}) translate(-200 -200)">
        <circle cx="200" cy="200" r="55" fill="url(#core-glow)" />
        <circle cx="200" cy="200" r="53" fill="#000000" />
      </g>
    </svg>
  `;
}

function loadSvgImage(svgMarkup: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to render black hole SVG frame."));
    };
    img.src = objectUrl;
  });
}

function getGifGlyphs(ctx: CanvasRenderingContext2D, text: string): GifGlyph[] {
  const maxWidth = 165;
  const lineHeight = 18;
  const glyphs: GifGlyph[] = [];
  const rawLines = text.trim().length > 0 ? text.split("\n") : ["VOID"];
  const lines: string[] = [];

  rawLines.forEach((rawLine) => {
    if (!rawLine.length) {
      lines.push("");
      return;
    }

    let currentLine = "";
    rawLine.split(" ").forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
        currentLine = candidate;
        return;
      }

      lines.push(currentLine);
      currentLine = word;
    });

    lines.push(currentLine);
  });

  const blockHeight = Math.max(lines.length, 1) * lineHeight;
  const startY = GIF_SIZE / 2 - blockHeight / 2 + 4;

  lines.forEach((line, lineIndex) => {
    const lineWidth = ctx.measureText(line).width;
    let cursorX = 110 - lineWidth / 2;
    const y = startY + lineIndex * lineHeight;

    line.split("").forEach((char) => {
      const charWidth = ctx.measureText(char || " ").width;
      glyphs.push({
        char,
        x: cursorX + charWidth / 2,
        y,
      });
      cursorX += charWidth;
    });
  });

  return glyphs;
}

function drawGifPhraseFrame(
  ctx: CanvasRenderingContext2D,
  text: string,
  frame: number,
) {
  ctx.save();
  ctx.font =
    "900 15px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const glyphs = getGifGlyphs(ctx, text);
  const purpleProgress = Math.min(1, frame / GIF_PURPLE_FRAMES);
  const suctionProgress =
    frame <= GIF_PURPLE_FRAMES
      ? 0
      : Math.min(
          1,
          (frame - GIF_PURPLE_FRAMES) / (GIF_FRAMES - GIF_PURPLE_FRAMES - 1),
        );

  glyphs.forEach((glyph, index) => {
    const dx = GIF_VOID_CENTER_X - glyph.x;
    const dy = GIF_VOID_CENTER_Y - glyph.y;
    let x = glyph.x;
    let y = glyph.y;
    let rotation = 0;
    let scale = 1.04 + Math.sin(purpleProgress * Math.PI) * 0.06;

    if (suctionProgress > 0) {
      const startDist = Math.hypot(dx, dy);
      const startAngle = Math.atan2(dy, dx);
      const currentDist = startDist * Math.pow(1 - suctionProgress, 2.1);
      const currentAngle =
        startAngle +
        suctionProgress * (Math.PI * 4) +
        Math.sin(index * 1.7) * 0.22;
      x = GIF_VOID_CENTER_X - Math.cos(currentAngle) * currentDist;
      y = GIF_VOID_CENTER_Y - Math.sin(currentAngle) * currentDist;
      rotation = suctionProgress * 540 + Math.sin(index) * 18;
      scale = (1 - suctionProgress) * 1.08;
    }

    const red = Math.round(212 - purpleProgress * 44);
    const green = Math.round(212 - purpleProgress * 127);
    const blue = Math.round(216 + purpleProgress * 38);
    const glow = 0.2 + purpleProgress * 0.65;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    ctx.shadowBlur = 12 * purpleProgress;
    ctx.shadowColor = `rgba(168,85,247,${glow})`;
    ctx.fillText(glyph.char, 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

export default function SubmitToVoid() {
  const [complaint, setComplaint] = useState("");
  const [lastShreddedText, setLastShreddedText] = useState("");
  const [phase, setPhase] = useState<Phase>("TYPING");
  const [voidMass, setVoidMass] = useState(1);
  const [isMakingGif, setIsMakingGif] = useState(false);
  const [showGifPrompt, setShowGifPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const reduceMotion = useReducedMotion();
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voidCenterRef = useRef<HTMLDivElement>(null);
  const particleElementsRef = useRef(new Map<number, HTMLSpanElement>());

  useEffect(() => {
    const media = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px), (pointer: coarse)`,
    );
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Background star field engine
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    interface Star {
      x: number;
      y: number;
      size: number;
      baseSpeed: number;
      hasTrail: boolean;
      opacity: number;
    }

    let raf = 0;
    let resizeTimer: number | undefined;
    let lastFrameTime = 0;
    let stars: Star[] = [];
    const mobileMedia = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px), (pointer: coarse)`,
    );
    const reducedMotionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const isMobileCanvas = mobileMedia.matches;
    const starCount = isMobileCanvas ? 190 : 620;
    const foregroundCount = isMobileCanvas ? 42 : 110;
    const frameInterval = isMobileCanvas ? 1000 / 30 : 1000 / 50;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: starCount }, (_, idx) => {
        const isDeepBackground = idx >= foregroundCount;
        const hasTrail = !isDeepBackground && Math.random() < 0.08;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: isDeepBackground ? 0.7 : Math.random() * 1.5 + 0.5,
          baseSpeed: isDeepBackground
            ? (Math.random() * 0.01 + 0.002) * LIVE_STAR_SPEED_MULTIPLIER
            : (Math.random() * (hasTrail ? 0.9 : 0.15) + 0.04) *
              LIVE_STAR_SPEED_MULTIPLIER,
          hasTrail,
          opacity: isDeepBackground
            ? Math.random() * 0.2 + 0.08
            : Math.random() * 0.4 + 0.3,
        };
      });
    };
    handleResize();
    const queueResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 160);
    };
    window.addEventListener("resize", queueResize, { passive: true });

    const draw = (time: number) => {
      if (time - lastFrameTime < frameInterval) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = time;

      ctx.fillStyle = "#07060c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.y += star.baseSpeed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }

        if (star.hasTrail) {
          ctx.beginPath();
          ctx.moveTo(star.x, star.y - 6);
          ctx.lineTo(star.x, star.y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${star.baseSpeed * 0.45})`;
          ctx.lineWidth = star.size * 0.9;
          ctx.stroke();
        }

        ctx.fillStyle = star.hasTrail
          ? "rgba(216, 180, 254, 0.8)"
          : `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    if (reducedMotionMedia.matches) {
      draw(frameInterval);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", queueResize);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Handle typing effects
  const handleInputChange = (val: string) => {
    setComplaint(val);
    // Pulse void size temporarily on type
    setVoidMass(1 + val.length * 0.008);
  };

  const logMsg = useCallback((msg: string) => {
    console.info(`[void] ${msg}`);
  }, []);

  const getTextParticleOrigins = useCallback((text: string) => {
    if (!textareaRef.current || !voidCenterRef.current) {
      return text.split("").map(() => ({ x: -450, y: 0 }));
    }

    const textarea = textareaRef.current;
    const textRect = textarea.getBoundingClientRect();
    const voidRect = voidCenterRef.current.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);
    const measureCanvas = document.createElement("canvas");
    const ctx = measureCanvas.getContext("2d");
    const fontSize = parseFloat(style.fontSize) || 14;
    const lineHeight =
      parseFloat(style.lineHeight) || Math.round(fontSize * 1.45);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const contentWidth =
      textarea.clientWidth -
      paddingLeft -
      (parseFloat(style.paddingRight) || 0);
    const voidCenterX = voidRect.left + voidRect.width / 2;
    const voidCenterY = voidRect.top + voidRect.height / 2;
    const origins: { x: number; y: number }[] = [];

    if (ctx) {
      ctx.font = style.font;
    }

    let cursorX = 0;
    let cursorY = 0;

    text.split("").forEach((char) => {
      const charWidth = ctx
        ? ctx.measureText(char || " ").width
        : fontSize * 0.62;

      if (char === "\n") {
        origins.push({
          x: textRect.left + paddingLeft + cursorX - voidCenterX,
          y:
            textRect.top +
            paddingTop +
            cursorY +
            lineHeight * 0.5 -
            voidCenterY,
        });
        cursorX = 0;
        cursorY += lineHeight;
        return;
      }

      if (cursorX + charWidth > contentWidth && cursorX > 0) {
        cursorX = 0;
        cursorY += lineHeight;
      }

      origins.push({
        x:
          textRect.left + paddingLeft + cursorX + charWidth * 0.5 - voidCenterX,
        y: textRect.top + paddingTop + cursorY + lineHeight * 0.5 - voidCenterY,
      });
      cursorX += charWidth;
    });

    return origins;
  }, []);

  const handleDownloadGif = useCallback(async () => {
    if (isMakingGif) return;

    const gifText = lastShreddedText.trim() || "THE VOID";

    setIsMakingGif(true);
    setShowGifPrompt(false);
    logMsg("rendering void gif...");

    try {
      const { GIFEncoder, applyPalette, quantize } = await import("gifenc");
      const canvas = document.createElement("canvas");
      const exportSize = isMobile ? 300 : GIF_SIZE;
      const frameCount = isMobile ? 32 : GIF_FRAMES;
      const frameDelay = Math.round((GIF_DELAY_MS * GIF_FRAMES) / frameCount);
      canvas.width = exportSize;
      canvas.height = exportSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        throw new Error("Unable to start GIF renderer.");
      }

      const gif = GIFEncoder();
      const gifStars = createGifStars();
      const logicalScale = exportSize / GIF_SIZE;
      ctx.setTransform(logicalScale, 0, 0, logicalScale, 0, 0);

      for (let frame = 0; frame < frameCount; frame += 1) {
        const sourceFrame = Math.round(
          (frame / Math.max(1, frameCount - 1)) * (GIF_FRAMES - 1),
        );
        const voidImage = await loadSvgImage(
          createVoidSvgMarkup(sourceFrame, voidMass),
        );
        drawVoidGifFrame(ctx, voidImage, gifStars, sourceFrame);
        drawGifPhraseFrame(ctx, gifText, sourceFrame);
        const rgba = ctx.getImageData(0, 0, exportSize, exportSize).data;
        const palette = quantize(rgba, 256, { format: "rgb444" });
        const index = applyPalette(rgba, palette, "rgb444");
        gif.writeFrame(index, exportSize, exportSize, {
          palette,
          delay: frameDelay,
          repeat: 0,
        });

        if (frame % 8 === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      }

      gif.finish();
      const bytes = gif.bytes();
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      downloadBlob(
        new Blob([buffer], { type: "image/gif" }),
        "submit-to-void-blackhole.gif",
      );
      logMsg("gif export complete.");
    } catch (error) {
      console.error(error);
      logMsg("gif export failed.");
    } finally {
      setIsMakingGif(false);
    }
  }, [isMakingGif, lastShreddedText, logMsg, voidMass, isMobile]);

  // Update particle DOM nodes directly so React does not reconcile the entire
  // page on every animation frame.
  useEffect(() => {
    if (phase !== "SUCKING" || particles.length === 0) return;

    let raf = 0;
    let lastFrameTime = 0;
    const startedAt = performance.now();
    const purpleDuration = reduceMotion ? 80 : isMobile ? 360 : 720;
    const suctionDuration = reduceMotion ? 220 : isMobile ? 1280 : 1900;
    const totalDuration = purpleDuration + suctionDuration;
    const frameInterval = isMobile ? 1000 / 30 : 1000 / 60;

    const step = (time: number) => {
      if (time - lastFrameTime < frameInterval) {
        raf = requestAnimationFrame(step);
        return;
      }
      lastFrameTime = time;

      const elapsed = time - startedAt;
      const purpleProgress = Math.min(1, elapsed / purpleDuration);
      const suctionProgress = Math.max(
        0,
        Math.min(1, (elapsed - purpleDuration) / suctionDuration),
      );
      const red = Math.round(212 - purpleProgress * 44);
      const green = Math.round(212 - purpleProgress * 127);
      const blue = Math.round(216 + purpleProgress * 38);

      particles.forEach((particle) => {
        const element = particleElementsRef.current.get(particle.id);
        if (!element) return;

        let x = particle.startX;
        let y = particle.startY;
        let scale = 1.06 + Math.sin(purpleProgress * Math.PI) * 0.08;
        let rotation = 0;

        if (suctionProgress > 0) {
          const startDist = Math.hypot(particle.startX, particle.startY);
          const startAngle = Math.atan2(particle.startY, particle.startX);
          const currentDist = startDist * Math.pow(1 - suctionProgress, 2.1);
          const currentAngle =
            startAngle +
            suctionProgress * (Math.PI * 4) +
            Math.sin(particle.id * 1.7) * 0.22;

          x = Math.cos(currentAngle) * currentDist;
          y = Math.sin(currentAngle) * currentDist;
          scale = (1 - suctionProgress) * 1.1;
          rotation = particle.startRotation + suctionProgress * 540;
        }

        element.style.color = `rgb(${red}, ${green}, ${blue})`;
        element.style.textShadow = `0 0 ${Math.round(
          purpleProgress * (isMobile ? 9 : 16),
        )}px rgba(168,85,247,${0.2 + purpleProgress * 0.65})`;
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
      });

      if (elapsed >= totalDuration) {
        setParticles([]);
        setPhase("DIGESTING");
        setVoidMass(1.8);
        setShowGifPrompt(true);
        logMsg("swallow sequence complete.");
        logMsg("the void remains satisfied.");
        return;
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [phase, particles, isMobile, reduceMotion, logMsg]);

  useEffect(() => {
    if (phase !== "DIGESTING") return;

    const timer = window.setTimeout(
      () => {
        setVoidMass(1);
        setPhase("TYPING");
      },
      isMobile ? 700 : 1100,
    );

    return () => window.clearTimeout(timer);
  }, [phase, isMobile]);

  // Shred & swallow action
  const handleShred = () => {
    if (!complaint || phase !== "TYPING") return;

    const submittedText = complaint;
    setShowGifPrompt(false);
    setPhase("SUCKING");
    logMsg("commencing shred protocol...");
    logMsg(`spaghettifying ${submittedText.length} characters...`);
    setLastShreddedText(submittedText);

    const charList = submittedText.split("");
    const origins = getTextParticleOrigins(submittedText);
    const newParticles: Particle[] = charList.map((char, index) => {
      const startRotation = Math.random() * 360;
      const origin = origins[index] ?? { x: -450, y: 0 };
      const sX = origin.x;
      const sY = origin.y;
      return {
        id: index,
        char,
        startX: sX,
        startY: sY,
        startRotation,
      };
    });
    setParticles(newParticles);
    setComplaint("");
  };

  return (
    <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-[#07060c] font-mono text-white select-none">
      {/* Background star field */}
      <canvas
        ref={backgroundCanvasRef}
        className="fixed inset-0 z-0 h-full w-full pointer-events-none"
      />

      {/* CORE WORKSPACE */}
      <main className="z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-0 px-4 py-5 lg:flex-row lg:gap-12 lg:p-6">
        {/* INPUT CARD */}
        <div className="w-full lg:w-[48%] flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">
            {phase !== "DIGESTING" ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full rounded-3xl border border-zinc-800/60 bg-[#12111a]/94 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.42)] md:bg-[#12111a]/70 md:p-8 md:backdrop-blur-xl md:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-linear-to-r from-zinc-100 to-zinc-400">
                  SEND TO THE VOID
                </h1>
                <p className="text-zinc-500 text-xs mb-6">
                  Shred your frustrations, anger, and other thoughts.
                  Submissions are sent to the void and deleted forever.
                </p>

                <div className="flex flex-col gap-1.5 relative mb-6">
                  <textarea
                    ref={textareaRef}
                    value={complaint}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={phase !== "TYPING"}
                    maxLength={140}
                    className="h-24 w-full resize-none rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 font-mono text-sm text-zinc-200 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-purple-900/60 focus:ring-1 focus:ring-purple-900/60 focus:outline-none disabled:text-zinc-700 md:h-32"
                    placeholder="ENTER YOUR FRUSTRATION..."
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600">
                    {complaint.length}/140
                  </div>
                </div>

                <button
                  onClick={handleShred}
                  disabled={!complaint.trim() || phase !== "TYPING"}
                  className="w-full py-4 bg-linear-to-r from-purple-950 to-indigo-950 border border-transparent hover:border-purple-800/40 hover:from-purple-900 hover:to-indigo-900 text-purple-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 active:scale-[0.98] shadow-lg shadow-purple-950/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>
                    {phase === "SUCKING" ? "SHREDDING..." : "SHRED FOREVER"}
                  </span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full rounded-3xl border border-zinc-900/40 bg-zinc-950/90 p-6 text-center md:bg-zinc-950/30 md:p-8 md:backdrop-blur-md"
              >
                <div className="text-sm font-bold text-zinc-400 animate-pulse">
                  SPAGETTHIFIYING TEXT...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GLOWING SINGULARITY (Void Graphic) */}
        <div className="relative flex min-h-72 w-full items-center justify-center lg:min-h-100 lg:w-[48%] lg:translate-x-20">
          {/* Sucking particles overlay */}
          {phase === "SUCKING" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              {particles.map((p) => {
                return (
                  <span
                    key={p.id}
                    ref={(element) => {
                      if (element) {
                        particleElementsRef.current.set(p.id, element);
                      } else {
                        particleElementsRef.current.delete(p.id);
                      }
                    }}
                    className="absolute font-black text-sm font-mono"
                    style={{
                      color: "rgb(212, 212, 216)",
                      transform: `translate3d(${p.startX}px, ${p.startY}px, 0) scale(1.06)`,
                      willChange: "transform",
                    }}
                    aria-hidden="true"
                  >
                    {p.char}
                  </span>
                );
              })}
            </div>
          )}

          {/* Singular Orb Container */}
          <div
            ref={voidCenterRef}
            className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80 md:h-130 md:w-130 lg:h-145 lg:w-145"
          >
            <svg
              viewBox="0 0 400 400"
              className="h-full w-full md:drop-shadow-[0_0_80px_rgba(124,58,237,0.2)]"
            >
              <defs>
                {/* Glow Filters */}
                <filter
                  id="bh-glow-heavy"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
                </filter>
                <filter
                  id="bh-glow-mid"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
                </filter>
                <filter
                  id="bh-glow-fine"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>

                {/* Accretion Gradients */}
                <radialGradient id="outer-shroud" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e0b36" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#2e1065" stopOpacity="0.45" />
                  <stop offset="80%" stopColor="#172554" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#07060c" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="mid-vortex" cx="50%" cy="50%" r="50%">
                  <stop offset="25%" stopColor="#db2777" stopOpacity="0" />
                  <stop offset="45%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="65%" stopColor="#6d28d9" stopOpacity="0.35" />
                  <stop offset="90%" stopColor="#1e3a8a" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#07060c" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="inner-vortex" cx="50%" cy="50%" r="50%">
                  <stop offset="35%" stopColor="#c084fc" stopOpacity="0" />
                  <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.75" />
                  <stop offset="70%" stopColor="#4338ca" stopOpacity="0.4" />
                  <stop offset="90%" stopColor="#1e3a8a" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#07060c" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#000" stopOpacity="1" />
                  <stop offset="90%" stopColor="#000" stopOpacity="1" />
                  <stop offset="96%" stopColor="#6d28d9" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Layer 1: Outer Sapphire Swirling Disk */}
              <motion.g
                animate={
                  isMobile || reduceMotion ? undefined : { rotate: -360 }
                }
                transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                className="origin-center"
              >
                {/* Large outer base glow */}
                <circle
                  cx="200"
                  cy="200"
                  r="170"
                  fill="url(#outer-shroud)"
                  filter="url(#bh-glow-heavy)"
                />
                {/* Outer swirl arm paths */}
                <path
                  d="M 200 200 Q 280 120 330 200 T 200 350"
                  fill="none"
                  stroke="rgba(91, 33, 182, 0.2)"
                  strokeWidth="35"
                  strokeLinecap="round"
                  filter="url(#bh-glow-heavy)"
                />
                <path
                  d="M 200 200 Q 120 280 70 200 T 200 50"
                  fill="none"
                  stroke="rgba(30, 58, 138, 0.15)"
                  strokeWidth="35"
                  strokeLinecap="round"
                  filter="url(#bh-glow-heavy)"
                />
              </motion.g>

              {/* Layer 2: Middle Purple/Magenta Vortex */}
              <motion.g
                animate={isMobile || reduceMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="origin-center"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="130"
                  fill="url(#mid-vortex)"
                  filter="url(#bh-glow-mid)"
                />
                {/* Spiraling violet threads */}
                <path
                  d="M 200 200 Q 250 140 280 200 T 200 310"
                  fill="none"
                  stroke="rgba(219, 39, 119, 0.25)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  filter="url(#bh-glow-mid)"
                />
                <path
                  d="M 200 200 Q 150 260 120 200 T 200 90"
                  fill="none"
                  stroke="rgba(109, 40, 217, 0.3)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  filter="url(#bh-glow-mid)"
                />
              </motion.g>

              {/* Layer 3: Inner Neon Cyan Accretion Swirls */}
              <motion.g
                animate={
                  isMobile || reduceMotion ? undefined : { rotate: -360 }
                }
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                className="origin-center"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="95"
                  fill="url(#inner-vortex)"
                  filter="url(#bh-glow-fine)"
                />
                {/* Sharp bright inner accretion tails */}
                <path
                  d="M 200 200 Q 230 160 250 200 T 200 270"
                  fill="none"
                  stroke="rgba(124, 58, 237, 0.65)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter="url(#bh-glow-fine)"
                />
                <path
                  d="M 200 200 Q 170 240 150 200 T 200 130"
                  fill="none"
                  stroke="rgba(29, 78, 216, 0.45)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter="url(#bh-glow-fine)"
                />
              </motion.g>

              {/* Layer 4: Singularity Event Horizon Core */}
              <motion.g
                animate={{ scale: voidMass }}
                className="origin-center"
                transition={{ type: "spring", stiffness: 120, damping: 10 }}
              >
                {/* Solid pitch black core circle with glowing rim */}
                <circle cx="200" cy="200" r="55" fill="url(#core-glow)" />
                <circle cx="200" cy="200" r="53" fill="#000000" />
              </motion.g>
            </svg>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showGifPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="absolute bottom-5 left-1/2 z-40 w-[min(calc(100vw-2rem),30rem)] -translate-x-1/2 rounded-3xl border border-zinc-800/60 bg-[#12111a]/96 p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:bg-[#12111a]/78 md:backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-zinc-100 to-zinc-400">
                  Message Shredded
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Make a GIF of the black hole that took it?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGifPrompt(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 transition hover:border-purple-800/40 hover:bg-zinc-900 hover:text-white"
                aria-label="Dismiss GIF prompt"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadGif}
              disabled={isMakingGif}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-linear-to-r from-purple-950 to-indigo-950 px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-purple-200 transition hover:border-purple-800/40 hover:from-purple-900 hover:to-indigo-900 hover:text-white disabled:pointer-events-none disabled:opacity-60 shadow-lg shadow-purple-950/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]"
            >
              {isMakingGif ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>{isMakingGif ? "Making GIF" : "Save GIF"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
