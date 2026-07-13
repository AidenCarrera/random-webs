import type { PaletteName } from "../types";

function interpolatePalette(t: number, keyframes: number[][]): number[] {
  const lastIndex = keyframes.length - 1;
  const rawIndex = t * lastIndex;
  const index = Math.min(lastIndex - 1, Math.floor(rawIndex));
  const fraction = rawIndex - index;
  const start = keyframes[index];
  const end = keyframes[index + 1];

  return [
    Math.round(start[0] + (end[0] - start[0]) * fraction),
    Math.round(start[1] + (end[1] - start[1]) * fraction),
    Math.round(start[2] + (end[2] - start[2]) * fraction),
  ];
}

function hslToRgb(
  hue: number,
  saturation: number,
  lightness: number,
): number[] {
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  let red: number;
  let green: number;
  let blue: number;

  if (s === 0) {
    red = green = blue = l;
  } else {
    const hueToRgb = (p: number, q: number, value: number) => {
      let t = value;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    red = hueToRgb(p, q, h + 1 / 3);
    green = hueToRgb(p, q, h);
    blue = hueToRgb(p, q, h - 1 / 3);
  }

  return [
    Math.round(red * 255),
    Math.round(green * 255),
    Math.round(blue * 255),
  ];
}

export function getFractalColor(
  iteration: number,
  maxIterations: number,
  realSquared: number,
  imaginarySquared: number,
  palette: PaletteName,
): number[] {
  if (iteration === maxIterations) return [3, 3, 10];

  const logarithm = Math.log(realSquared + imaginarySquared) / 2;
  const smoothedIteration =
    iteration + 1 - Math.log(logarithm / 0.693147) / 0.693147;
  const colorPosition = Math.pow(
    Math.max(0, Math.min(1, smoothedIteration / maxIterations)),
    0.45,
  );

  switch (palette) {
    case "Neon":
      return interpolatePalette(colorPosition, [
        [3, 3, 15],
        [41, 10, 80],
        [106, 13, 173],
        [240, 0, 120],
        [0, 240, 255],
        [3, 3, 15],
      ]);
    case "Solar":
      return interpolatePalette(colorPosition, [
        [2, 0, 4],
        [120, 0, 0],
        [240, 60, 0],
        [255, 200, 0],
        [255, 255, 220],
        [2, 0, 4],
      ]);
    case "Ocean":
      return interpolatePalette(colorPosition, [
        [0, 5, 20],
        [0, 40, 100],
        [0, 128, 160],
        [70, 220, 160],
        [200, 255, 240],
        [0, 5, 20],
      ]);
    case "Spectrum":
      return hslToRgb((colorPosition * 360 * 3.5) % 360, 100, 50);
    case "Monochrome":
      return interpolatePalette(colorPosition, [
        [0, 0, 0],
        [30, 30, 30],
        [110, 110, 110],
        [230, 230, 230],
        [255, 255, 255],
        [0, 0, 0],
      ]);
    case "Forest":
      return interpolatePalette(colorPosition, [
        [2, 10, 8],
        [15, 60, 25],
        [160, 140, 40],
        [140, 35, 160],
        [220, 180, 255],
        [2, 10, 8],
      ]);
  }
}
