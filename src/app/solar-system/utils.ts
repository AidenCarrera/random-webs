import type { Planet, SolarTextureKey } from "./types";

export function getSuggestedPlanetType(textureKey: SolarTextureKey) {
  switch (textureKey) {
    case "earth":
      return "Habitable";
    case "jupiter":
    case "saturn":
      return "Gas Giant";
    case "uranus":
    case "neptune":
      return "Ice Giant";
    case "ceres":
    case "eris":
    case "haumea":
    case "makemake":
      return "Dwarf Planet";
    default:
      return "Rocky";
  }
}

export function getNextOrbitSize(planets: Planet[]) {
  return Math.min(
    850,
    Math.max(140, ...planets.map((planet) => planet.orbitSize), 100) + 70,
  );
}

export function getViewportLayout(width: number, height: number) {
  const isMobileViewport = width < 768;

  if (isMobileViewport) {
    const scaleX = (width - 12) / 760;
    const scaleY = (height - 260) / 760;

    return {
      isMobileViewport,
      containerScale: Math.min(0.62, Math.max(0.42, Math.min(scaleX, scaleY))),
    };
  }

  const scaleX = (width - (width < 1024 ? 40 : 380)) / 920;
  const scaleY = (height - 160) / 920;

  return {
    isMobileViewport,
    containerScale: Math.min(1.2, Math.max(0.25, Math.min(scaleX, scaleY))),
  };
}

export function parseBackgroundLength(
  value: string,
  containerSize: number,
  fallbackSize: number,
) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "auto") return fallbackSize;
  if (normalized.endsWith("%")) {
    return (containerSize * Number.parseFloat(normalized)) / 100;
  }
  if (normalized.endsWith("px")) return Number.parseFloat(normalized);

  const numericValue = Number.parseFloat(normalized);
  return Number.isFinite(numericValue) ? numericValue : fallbackSize;
}

export function parseBackgroundPosition(
  value: string,
  containerSize: number,
  imageSize: number,
) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 0;
  if (normalized === "left" || normalized === "top") return 0;
  if (normalized === "center") return (containerSize - imageSize) / 2;
  if (normalized === "right" || normalized === "bottom") {
    return containerSize - imageSize;
  }
  if (normalized.endsWith("%")) {
    return ((containerSize - imageSize) * Number.parseFloat(normalized)) / 100;
  }
  if (normalized.endsWith("px")) return Number.parseFloat(normalized);
  return 0;
}

export function getRingGradient(textureKey: SolarTextureKey) {
  if (textureKey === "saturn") {
    return `radial-gradient(
      circle,
      transparent 38%,
      rgba(224, 205, 167, 0.25) 39%,
      rgba(224, 205, 167, 0.65) 42%,
      rgba(168, 132, 94, 0.35) 46%,
      transparent 48%,
      rgba(224, 205, 167, 0.55) 50%,
      rgba(199, 165, 117, 0.45) 55%,
      rgba(224, 205, 167, 0.25) 62%,
      transparent 65%
    )`;
  }

  if (textureKey === "uranus") {
    return `radial-gradient(
      circle,
      transparent 55%,
      rgba(173, 216, 230, 0.4) 56%,
      rgba(173, 216, 230, 0.1) 58%,
      transparent 59%
    )`;
  }

  return `radial-gradient(
    circle,
    transparent 42%,
    rgba(255, 255, 255, 0.2) 43%,
    rgba(255, 255, 255, 0.45) 46%,
    transparent 48%,
    rgba(255, 255, 255, 0.2) 52%,
    transparent 56%
  )`;
}
