import type { Geometry, Preset } from "../types";
import { rgba } from "../utils/color";

export const GLOW_STRENGTH = 1.8;

export function drawHalo(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  preset: Preset,
) {
  const centerY = geometry.glassTop + geometry.glassHeight * 0.58;
  const halo = context.createRadialGradient(
    geometry.centerX,
    centerY,
    0,
    geometry.centerX,
    centerY,
    geometry.bodyHalf * 2.3,
  );
  halo.addColorStop(0, rgba(preset.glow, 0.22 * GLOW_STRENGTH));
  halo.addColorStop(0.45, rgba(preset.glow, 0.075 * GLOW_STRENGTH));
  halo.addColorStop(1, rgba(preset.glow, 0));
  context.fillStyle = halo;
  context.fillRect(0, 0, geometry.width, geometry.height);
}

export function drawGlass(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
  preset: Preset,
  path: Path2D,
) {
  const { centerX, glassTop, glassHeight, bodyHalf } = geometry;

  context.save();
  const fill = context.createLinearGradient(
    centerX - bodyHalf,
    0,
    centerX + bodyHalf,
    0,
  );
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
    centerX,
    glassTop + glassHeight * 0.96,
    0,
    centerX,
    glassTop + glassHeight * 0.96,
    bodyHalf * 1.15,
  );
  bottomLight.addColorStop(0, rgba(preset.glow, 0.22 * GLOW_STRENGTH));
  bottomLight.addColorStop(0.48, rgba(preset.glow, 0.07 * GLOW_STRENGTH));
  bottomLight.addColorStop(1, rgba(preset.glow, 0));
  context.fillStyle = bottomLight;
  context.fillRect(
    centerX - bodyHalf * 1.15,
    glassTop,
    bodyHalf * 2.3,
    glassHeight,
  );
  context.restore();

  context.save();
  const outline = context.createLinearGradient(
    centerX - bodyHalf,
    0,
    centerX + bodyHalf,
    0,
  );
  outline.addColorStop(0, "rgba(255, 255, 255, 0.16)");
  outline.addColorStop(0.22, "rgba(255, 255, 255, 0.04)");
  outline.addColorStop(0.75, "rgba(255, 255, 255, 0.025)");
  outline.addColorStop(1, "rgba(255, 255, 255, 0.11)");

  const outlinePath = new Path2D();
  outlinePath.moveTo(centerX - bodyHalf * 0.3, glassTop);
  outlinePath.lineTo(centerX - bodyHalf * 0.65, glassTop + glassHeight);
  outlinePath.moveTo(centerX + bodyHalf * 0.3, glassTop);
  outlinePath.lineTo(centerX + bodyHalf * 0.65, glassTop + glassHeight);
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
  const highlightTopX =
    centerX - (0.3 + 0.35 * 0.05) * bodyHalf + bodyHalf * 0.08;
  const highlightBottomX =
    centerX - (0.3 + 0.35 * 0.85) * bodyHalf + bodyHalf * 0.15;
  context.moveTo(highlightTopX, highlightTopY);
  context.quadraticCurveTo(
    centerX - (0.3 + 0.35 * 0.45) * bodyHalf + bodyHalf * 0.12,
    glassTop + glassHeight * 0.45,
    highlightBottomX,
    highlightBottomY,
  );
  context.stroke();
  context.restore();
}

export function drawLampHardware(
  context: CanvasRenderingContext2D,
  geometry: Geometry,
) {
  const {
    centerX,
    lampTop,
    lampHeight,
    glassTop,
    glassBottom,
    bodyHalf,
    topCapHeight,
    baseHeight,
  } = geometry;

  const metal = context.createLinearGradient(
    centerX - bodyHalf * 1.25,
    0,
    centerX + bodyHalf * 1.25,
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

  const topWidthBottom = bodyHalf * 0.3 + 2;
  const topWidthTop = bodyHalf * 0.18;
  const top = new Path2D();
  top.moveTo(centerX - topWidthBottom, glassTop + 2);
  top.lineTo(centerX - topWidthTop, lampTop + topCapHeight * 0.1);
  top.quadraticCurveTo(
    centerX,
    lampTop - 4,
    centerX + topWidthTop,
    lampTop + topCapHeight * 0.1,
  );
  top.lineTo(centerX + topWidthBottom, glassTop + 2);
  top.closePath();
  context.fillStyle = metal;
  context.fill(top);

  const baseTop = glassBottom - 4;
  const baseBottom = glassBottom + baseHeight;
  const waistY = baseTop + baseHeight * 0.5;
  const baseWidthTop = bodyHalf * 0.65 + 2;
  const baseWidthWaist = bodyHalf * 0.45;
  const baseWidthBottom = baseWidthTop;
  const base = new Path2D();
  base.moveTo(centerX - baseWidthTop, baseTop);
  base.lineTo(centerX - baseWidthWaist, waistY);
  base.lineTo(centerX - baseWidthBottom, baseBottom);
  base.quadraticCurveTo(
    centerX,
    baseBottom + lampHeight * 0.03,
    centerX + baseWidthBottom,
    baseBottom,
  );
  base.lineTo(centerX + baseWidthWaist, waistY);
  base.lineTo(centerX + baseWidthTop, baseTop);
  base.closePath();
  context.fillStyle = metal;
  context.fill(base);
  context.restore();

  context.save();
  context.globalAlpha = 0.28;
  context.strokeStyle = "rgba(255, 255, 255, 0.7)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(centerX - topWidthTop * 0.6, lampTop + topCapHeight * 0.1);
  context.lineTo(centerX - topWidthBottom * 0.6, glassTop - 2);
  context.stroke();

  context.beginPath();
  context.moveTo(centerX - baseWidthWaist, waistY);
  context.quadraticCurveTo(
    centerX,
    waistY + 4,
    centerX + baseWidthWaist,
    waistY,
  );
  context.stroke();

  context.beginPath();
  context.moveTo(centerX - baseWidthBottom * 0.7, baseBottom - 4);
  context.quadraticCurveTo(
    centerX,
    baseBottom + 5,
    centerX + baseWidthBottom * 0.7,
    baseBottom - 4,
  );
  context.stroke();
  context.restore();
}
