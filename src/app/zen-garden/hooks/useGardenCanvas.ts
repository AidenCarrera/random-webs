import { useCallback, useEffect, useRef } from "react";
import {
  drawRakeStroke,
  drawRipple,
  drawSandGrain,
  drawWaterStroke,
} from "../canvas";
import type { Atmosphere, Ripple, Stroke, Theme } from "../types";
import { blendColors } from "../utils";

interface UseGardenCanvasOptions {
  atmosphere: Atmosphere;
  currentStroke: Stroke | null;
  ripples: Ripple[];
  strokes: Stroke[];
  theme: Theme;
}

export function useGardenCanvas({
  atmosphere,
  currentStroke,
  ripples,
  strokes,
  theme,
}: UseGardenCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = rect.width * devicePixelRatio;
    const height = rect.height * devicePixelRatio;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.clearRect(0, 0, width, height);
    let background = theme.bg;
    let shadow = theme.shadowColor;
    let highlight = theme.highlightColor;
    let groove = theme.grooveColor;

    if (atmosphere === "dusk") {
      background = blendColors(background, "#f97316", 0.15);
      shadow = "rgba(70, 30, 0, 0.25)";
      highlight = "rgba(255, 230, 200, 0.6)";
    } else if (atmosphere === "night") {
      background = blendColors(background, "#1e1b4b", 0.35);
      shadow = "rgba(0, 0, 0, 0.7)";
      highlight = "rgba(250, 250, 255, 0.06)";
      groove = "rgba(0, 0, 0, 0.5)";
    }

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    noiseCanvasRef.current = drawSandGrain(
      context,
      width,
      height,
      theme.grainOpacity,
      noiseCanvasRef.current,
    );

    const drawStroke = (stroke: Stroke) => {
      if (stroke.brushType === "water") {
        drawWaterStroke(context, stroke, width, height);
      } else {
        drawRakeStroke(
          context,
          stroke,
          width,
          height,
          shadow,
          highlight,
          groove,
          atmosphere,
        );
      }
    };

    strokes.forEach(drawStroke);
    if (currentStroke) drawStroke(currentStroke);
    ripples.forEach((ripple) =>
      drawRipple(context, ripple, width, height, shadow, highlight, groove),
    );
  }, [atmosphere, currentStroke, ripples, strokes, theme]);

  useEffect(() => {
    drawCanvas();
    window.addEventListener("resize", drawCanvas);
    return () => window.removeEventListener("resize", drawCanvas);
  }, [drawCanvas]);

  return { canvasRef, containerRef, drawCanvas };
}
