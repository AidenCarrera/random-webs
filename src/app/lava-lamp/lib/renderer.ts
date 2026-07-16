import type { Blob, Geometry, Preset, Rgb } from "../types";
import { hexToRgb, mixColor, rgba } from "../utils/color";
import { createGlassPath, halfWidthAt } from "../utils/geometry";
import { clamp, smoothstep } from "../utils/math";
import {
  drawGlass,
  drawHalo,
  drawLampHardware,
  GLOW_STRENGTH,
} from "./lamp-drawing";

export function createLampRenderer(context: CanvasRenderingContext2D) {
  const buffer = document.createElement("canvas");
  const bufferContext = buffer.getContext("2d");
  if (!bufferContext) return null;

  let imageData = bufferContext.createImageData(1, 1);

  return {
    resize(geometry: Geometry) {
      buffer.width = clamp(Math.round(geometry.bodyHalf * 1.3), 120, 250);
      buffer.height = clamp(Math.round(geometry.glassHeight * 0.62), 180, 390);
      imageData = bufferContext.createImageData(buffer.width, buffer.height);
    },

    draw(
      geometry: Geometry,
      preset: Preset,
      blobs: Blob[],
      viewport: { width: number; height: number; dpr: number },
    ) {
      const { width, height, dpr } = viewport;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      drawHalo(context, geometry, preset);

      const glassPath = createGlassPath(geometry);
      drawGlass(context, geometry, preset, glassPath);
      renderLava(
        context,
        bufferContext,
        buffer,
        imageData,
        geometry,
        preset,
        blobs,
        glassPath,
      );
      drawGlass(context, geometry, preset, glassPath);
      drawLampHardware(context, geometry);
    },
  };
}

function renderLava(
  context: CanvasRenderingContext2D,
  bufferContext: CanvasRenderingContext2D,
  buffer: HTMLCanvasElement,
  imageData: ImageData,
  geometry: Geometry,
  preset: Preset,
  blobs: Blob[],
  glassPath: Path2D,
) {
  const { bodyHalf, glassHeight } = geometry;
  const lavaColors = preset.lava.map(hexToRgb) as [Rgb, Rgb, Rgb];
  const data = imageData.data;
  const bufferWidth = buffer.width;
  const bufferHeight = buffer.height;
  const spanX = bodyHalf * 2.18;
  const halfSpanInHeightUnits = spanX / glassHeight / 2;
  const bodyToHeight = bodyHalf / glassHeight;

  let offset = 0;
  for (let pixelY = 0; pixelY < bufferHeight; pixelY += 1) {
    const y = (pixelY + 0.5) / bufferHeight;
    const permittedHalf = halfWidthAt(y) * bodyToHeight;

    for (let pixelX = 0; pixelX < bufferWidth; pixelX += 1) {
      const x =
        ((pixelX + 0.5) / bufferWidth - 0.5) * halfSpanInHeightUnits * 2;

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
        const contribution = (blob.r * blob.r) / (dx * dx + dy * dy + 0.00034);
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
          : mixColor(lavaColors[1], lavaColors[2], (colorPosition - 0.5) * 2);
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
  context.save();
  context.clip(glassPath);
  context.globalAlpha = 0.98;
  context.filter = `drop-shadow(0 0 ${Math.max(7, bodyHalf * 0.055)}px ${rgba(
    preset.glow,
    0.46 * GLOW_STRENGTH,
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
}
