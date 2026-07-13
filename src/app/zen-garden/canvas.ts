import type { Atmosphere, Ripple, Stroke } from "./types";
import { randomUnit } from "./utils";

export function drawSandGrain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number,
  noiseCanvas: HTMLCanvasElement | null,
) {
  if (opacity <= 0) return noiseCanvas;

  let textureCanvas = noiseCanvas;
  if (!textureCanvas) {
    textureCanvas = document.createElement("canvas");
    textureCanvas.width = 128;
    textureCanvas.height = 128;
    const textureContext = textureCanvas.getContext("2d");
    if (textureContext) {
      const imageData = textureContext.createImageData(128, 128);
      for (let index = 0; index < imageData.data.length; index += 4) {
        const value = Math.floor(randomUnit() * 60) + 195;
        imageData.data[index] = value;
        imageData.data[index + 1] = value;
        imageData.data[index + 2] = value;
        imageData.data[index + 3] = 255;
      }
      textureContext.putImageData(imageData, 0, 0);
    }
  }

  context.save();
  context.globalAlpha = opacity;
  context.globalCompositeOperation = "multiply";
  const pattern = context.createPattern(textureCanvas, "repeat");
  if (pattern) {
    context.fillStyle = pattern;
    context.fillRect(0, 0, width, height);
  }
  context.restore();

  return textureCanvas;
}

export function drawRakeStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number,
  shadow: string,
  highlight: string,
  grooveColor: string,
  atmosphere: Atmosphere,
) {
  const { points } = stroke;
  if (points.length < 2) return;

  const spacing = Math.max(6, stroke.brushSize * 1.2);
  const numTines = stroke.brushType === "wave" ? 3 : 5;
  context.lineCap = "round";
  context.lineJoin = "round";

  const drawPath = (
    offsetX: number,
    offsetY: number,
    strokeStyle: string,
    lineWidth: number,
  ) => {
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.beginPath();

    for (let tine = 0; tine < numTines; tine += 1) {
      const tineOffset = (tine - (numTines - 1) / 2) * spacing;

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const x = point.x * width;
        const y = point.y * height;

        if (index === 0) {
          const next = points[1];
          const dx = next.x * width - x;
          const dy = next.y * height - y;
          const length = Math.sqrt(dx * dx + dy * dy) || 1;
          context.moveTo(
            x + (-dy / length) * tineOffset + offsetX,
            y + (dx / length) * tineOffset + offsetY,
          );
          continue;
        }

        const previous = points[index - 1];
        const dx = x - previous.x * width;
        const dy = y - previous.y * height;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const wave =
          stroke.brushType === "wave"
            ? Math.sin(index * 0.4) * (spacing * 0.6)
            : 0;
        context.lineTo(
          x + (-dy / length) * (tineOffset + wave) + offsetX,
          y + (dx / length) * (tineOffset + wave) + offsetY,
        );
      }
    }
    context.stroke();
  };

  const shadowOffset = atmosphere === "dusk" ? 2.5 : 1.5;
  drawPath(shadowOffset, shadowOffset, shadow, 2.2);
  drawPath(-0.8, -0.8, highlight, 2.2);
  drawPath(0, 0, grooveColor, 1.4);
}

export function drawWaterStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number,
) {
  const { points } = stroke;
  if (points.length === 0) return;

  context.lineCap = "round";
  context.lineJoin = "round";

  if (points.length === 1) {
    const x = points[0].x * width;
    const y = points[0].y * height;
    const size = stroke.brushSize * 2.2;
    context.fillStyle = "rgba(56, 189, 248, 0.25)";
    context.beginPath();
    context.arc(x, y, size * 1.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(14, 165, 233, 0.75)";
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255, 255, 255, 0.6)";
    context.beginPath();
    context.arc(x - size * 0.3, y - size * 0.3, size * 0.35, 0, Math.PI * 2);
    context.fill();
    return;
  }

  const drawPath = (strokeStyle: string, lineWidth: number) => {
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(points[0].x * width, points[0].y * height);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x * width, points[index].y * height);
    }
    context.stroke();
  };

  drawPath("rgba(56, 189, 248, 0.22)", stroke.brushSize * 4.5);
  drawPath("rgba(14, 165, 233, 0.7)", stroke.brushSize * 2.8);
  drawPath("rgba(255, 255, 255, 0.55)", stroke.brushSize * 0.8);
}

export function drawRipple(
  context: CanvasRenderingContext2D,
  ripple: Ripple,
  width: number,
  height: number,
  shadow: string,
  highlight: string,
  grooveColor: string,
) {
  const x = ripple.x * width;
  const y = ripple.y * height;
  const drawCircles = (
    offsetX: number,
    offsetY: number,
    strokeStyle: string,
    lineWidth: number,
  ) => {
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    for (let circle = 1; circle <= 4; circle += 1) {
      context.beginPath();
      context.arc(x + offsetX, y + offsetY, circle * 12, 0, Math.PI * 2);
      context.stroke();
    }
  };

  drawCircles(1.2, 1.2, shadow, 2.2);
  drawCircles(-0.8, -0.8, highlight, 2.2);
  drawCircles(0, 0, grooveColor, 1.4);
}
