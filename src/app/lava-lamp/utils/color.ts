import type { Rgb } from "../types";
import { clamp, lerp } from "./math";

export function hexToRgb(hex: string): Rgb {
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

export function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixColor(from: Rgb, to: Rgb, amount: number): Rgb {
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
  const normalizedS = s / 100;
  const normalizedL = l / 100;
  const c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = normalizedL - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else if (h < 360) {
    r = c;
    b = x;
  }

  return `#${[r, g, b]
    .map((channel) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function generateLavaColors(
  baseColor: string,
): [string, string, string] {
  const { h, s, l } = hexToHsl(baseColor);
  const light = hslToHex(h, Math.min(100, s + 10), Math.min(95, l + 25));
  const dark = hslToHex(h, Math.min(100, s * 1.1), Math.max(10, l * 0.45));
  return [light, baseColor, dark];
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((channel) =>
      clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"),
    )
    .join("")}`;
}

export function generateBackgroundColors(
  bubbleColor: string,
  liquidColor: string,
): [string, string] {
  const dominantColor = rgbToHex(
    mixColor(hexToRgb(bubbleColor), hexToRgb(liquidColor), 0.18),
  );
  const { h, s, l } = hexToHsl(dominantColor);

  return [
    hslToHex(h, clamp(s * 0.72 + 10, 24, 82), clamp(l * 0.28 + 7, 10, 25)),
    hslToHex(h, clamp(s * 0.42 + 5, 16, 58), clamp(l * 0.1 + 2, 4, 11)),
  ];
}
