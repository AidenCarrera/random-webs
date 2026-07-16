import type { Geometry } from "../types";

export function halfWidthAt(y: number) {
  return 0.3 + 0.35 * y;
}

export function createGlassPath(geometry: Geometry) {
  const { centerX, glassTop, glassBottom, bodyHalf } = geometry;
  const topWidth = bodyHalf * 0.3;
  const bottomWidth = bodyHalf * 0.65;
  const path = new Path2D();

  path.moveTo(centerX - topWidth, glassTop);
  path.lineTo(centerX - bottomWidth, glassBottom);
  path.lineTo(centerX + bottomWidth, glassBottom);
  path.lineTo(centerX + topWidth, glassTop);
  path.closePath();
  return path;
}

export function makeGeometry(width: number, height: number): Geometry {
  const isLandscapeMobile = width > height && height < 500;
  const topPadding = isLandscapeMobile ? 12 : 35;
  const bottomPadding = isLandscapeMobile ? 54 : 125;
  const maxAvailableHeight = height - (topPadding + bottomPadding);
  const lampHeight = Math.min(Math.max(maxAvailableHeight / 1.2, 200), 850);
  const topCapHeight = lampHeight * 0.16;
  const glassHeight = lampHeight * 0.6;
  const baseHeight = lampHeight * 0.44;
  const totalDrawnHeight = topCapHeight + glassHeight + baseHeight;
  const lampTop = Math.max(
    height - totalDrawnHeight - bottomPadding,
    topPadding,
  );
  const glassTop = lampTop + topCapHeight;
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
