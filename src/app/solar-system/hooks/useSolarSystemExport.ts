"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { canvasToBlob } from "@/lib/canvasExport";
import { TEXTURE_MAP } from "../constants";
import type {
  BackgroundTheme,
  Planet,
  PlanetElementRegistry,
  SolarTextureKey,
} from "../types";
import { parseBackgroundLength, parseBackgroundPosition } from "../utils";

type Options = {
  planets: Planet[];
  planetRotations: React.RefObject<Record<string, number>>;
  planetElements: React.RefObject<PlanetElementRegistry>;
  isMobileViewport: boolean;
  showOrbits: boolean;
  showMoons: boolean;
  enableGlow: boolean;
  bgTheme: BackgroundTheme;
};

export function useSolarSystemExport({
  planets: displayedPlanets,
  planetRotations,
  planetElements,
  isMobileViewport,
  showOrbits,
  showMoons,
  enableGlow,
  bgTheme,
}: Options) {
  // Export Modal state
  const [exportImage, setExportImage] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState(
    "helios-solar-system.png",
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  // Refs for animation loop updates (to prevent loop resets)
  const exportStageRef = useRef<HTMLDivElement>(null);
  const systemViewportRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportObjectUrlRef = useRef<string | null>(null);
  const textureAssetCacheRef = useRef<Map<string, string> | null>(null);
  const textureAssetCachePromiseRef = useRef<Promise<
    Map<string, string>
  > | null>(null);
  const loadedImageCacheRef = useRef<
    Map<string, Promise<HTMLImageElement | null>>
  >(new Map());
  const ringTextureCacheRef = useRef<Map<SolarTextureKey, HTMLCanvasElement>>(
    new Map(),
  );

  useEffect(() => {
    return () => {
      if (exportObjectUrlRef.current) {
        URL.revokeObjectURL(exportObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const warmTextureExportCache = async () => {
      if (textureAssetCacheRef.current || textureAssetCachePromiseRef.current) {
        return;
      }

      const urlToDataUrl = async (url: string): Promise<string> => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();

          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result));
            reader.readAsDataURL(blob);
          });
        } catch {
          return url;
        }
      };

      textureAssetCachePromiseRef.current = Promise.all(
        Object.values(TEXTURE_MAP).map(
          async (url): Promise<[string[], string]> => [
            [url, new URL(url, window.location.href).href],
            await urlToDataUrl(url),
          ],
        ),
      ).then((textureDataUrls) => {
        const nextCache = new Map<string, string>();
        textureDataUrls.forEach(([urls, dataUrl]) => {
          urls.forEach((url) => nextCache.set(url, dataUrl));
        });
        if (!cancelled) {
          textureAssetCacheRef.current = nextCache;
        }
        return nextCache;
      });
    };

    let idleCallbackId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(warmTextureExportCache);
    } else {
      timeoutId = setTimeout(warmTextureExportCache, 600);
    }

    return () => {
      cancelled = true;
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Capture the already-rendered DOM system into a square PNG.
  const captureSolarSystem = async (): Promise<string> => {
    // Three renders a complete, self-contained scene. Exporting its canvas is
    // deterministic and avoids the fragile DOM/CSS reconstruction previously
    // required for textures, gradients, clipping, and transforms.
    const rendererCanvas = threeCanvasRef.current;
    if (rendererCanvas) {
      if (exportObjectUrlRef.current) {
        URL.revokeObjectURL(exportObjectUrlRef.current);
        exportObjectUrlRef.current = null;
      }

      const blob = await canvasToBlob(rendererCanvas);
      const objectUrl = URL.createObjectURL(blob);
      exportObjectUrlRef.current = objectUrl;
      return objectUrl;
    }

    // This fallback only applies before WebGL has initialized.
    const systemViewport = systemViewportRef.current;
    if (!systemViewport) return "";

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
      const cachedPromise = loadedImageCacheRef.current.get(url);
      if (cachedPromise) return cachedPromise;

      const nextPromise = new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
      });
      loadedImageCacheRef.current.set(url, nextPromise);
      return nextPromise;
    };

    const urlToDataUrl = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.readAsDataURL(blob);
        });
      } catch {
        return url;
      }
    };

    const buildTextureAssetCache = async () => {
      if (textureAssetCacheRef.current) return textureAssetCacheRef.current;
      if (!textureAssetCachePromiseRef.current) {
        textureAssetCachePromiseRef.current = Promise.all(
          Object.values(TEXTURE_MAP).map(
            async (url): Promise<[string[], string]> => [
              [url, new URL(url, window.location.href).href],
              await urlToDataUrl(url),
            ],
          ),
        ).then((textureDataUrls) => {
          const nextCache = new Map<string, string>();
          textureDataUrls.forEach(([urls, dataUrl]) => {
            urls.forEach((url) => nextCache.set(url, dataUrl));
          });
          textureAssetCacheRef.current = nextCache;
          return nextCache;
        });
      }
      return textureAssetCachePromiseRef.current;
    };

    const textureDataUrlByUrl = await buildTextureAssetCache();

    const resolveTextureAssetUrl = (url: string) => {
      if (!url) return "";
      if (textureDataUrlByUrl.has(url)) {
        return textureDataUrlByUrl.get(url) || url;
      }
      try {
        const absoluteUrl = new URL(url, window.location.href).href;
        return textureDataUrlByUrl.get(absoluteUrl) || absoluteUrl;
      } catch {
        return url;
      }
    };

    const baseSize = 900;
    const exportResolution = isMobileViewport ? 960 : 1200;
    const renderScale = exportResolution / baseSize;
    const canvas = document.createElement("canvas");
    canvas.width = exportResolution;
    canvas.height = exportResolution;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const drawOrbit = (diameter: number) => {
      if (!showOrbits) return;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = Math.max(1, renderScale);
      ctx.beginPath();
      ctx.arc(
        450 * renderScale,
        450 * renderScale,
        (diameter / 2) * renderScale,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    };

    const drawRingHalf = (
      x: number,
      y: number,
      size: number,
      textureKey: SolarTextureKey,
      frontHalf: boolean,
    ) => {
      const ringDiameter =
        size *
        (textureKey === "saturn" ? 2.8 : textureKey === "uranus" ? 2.2 : 2.4);
      const scaleDiameter = ringDiameter * renderScale;
      const cx = x * renderScale;
      const cy = y * renderScale;
      const rotation = 12 * (Math.PI / 180);
      const verticalScale = textureKey === "uranus" ? 0.24 : 0.3;
      let ringTexture = ringTextureCacheRef.current.get(textureKey);
      if (!ringTexture) {
        ringTexture = document.createElement("canvas");
        ringTexture.width = 512;
        ringTexture.height = 512;
        const ringCtx = ringTexture.getContext("2d");
        if (ringCtx) {
          const gradient = ringCtx.createRadialGradient(
            256,
            256,
            0,
            256,
            256,
            256,
          );
          if (textureKey === "saturn") {
            gradient.addColorStop(0.38, "rgba(0,0,0,0)");
            gradient.addColorStop(0.39, "rgba(224,205,167,0.25)");
            gradient.addColorStop(0.42, "rgba(224,205,167,0.65)");
            gradient.addColorStop(0.46, "rgba(168,132,94,0.35)");
            gradient.addColorStop(0.48, "rgba(0,0,0,0)");
            gradient.addColorStop(0.5, "rgba(224,205,167,0.55)");
            gradient.addColorStop(0.55, "rgba(199,165,117,0.45)");
            gradient.addColorStop(0.62, "rgba(224,205,167,0.25)");
            gradient.addColorStop(0.65, "rgba(0,0,0,0)");
          } else if (textureKey === "uranus") {
            gradient.addColorStop(0.55, "rgba(0,0,0,0)");
            gradient.addColorStop(0.56, "rgba(173,216,230,0.4)");
            gradient.addColorStop(0.58, "rgba(173,216,230,0.1)");
            gradient.addColorStop(0.59, "rgba(0,0,0,0)");
          } else {
            gradient.addColorStop(0.42, "rgba(0,0,0,0)");
            gradient.addColorStop(0.43, "rgba(255,255,255,0.2)");
            gradient.addColorStop(0.46, "rgba(255,255,255,0.45)");
            gradient.addColorStop(0.48, "rgba(0,0,0,0)");
            gradient.addColorStop(0.52, "rgba(255,255,255,0.2)");
            gradient.addColorStop(0.56, "rgba(0,0,0,0)");
          }
          ringCtx.fillStyle = gradient;
          ringCtx.fillRect(0, 0, 512, 512);
        }
        ringTextureCacheRef.current.set(textureKey, ringTexture);
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.scale(1, verticalScale);
      ctx.beginPath();
      if (frontHalf) {
        ctx.rect(-scaleDiameter, 0, scaleDiameter * 2, scaleDiameter);
      } else {
        ctx.rect(
          -scaleDiameter,
          -scaleDiameter,
          scaleDiameter * 2,
          scaleDiameter,
        );
      }
      ctx.clip();
      ctx.globalAlpha = frontHalf ? 0.8 : 0.68;
      ctx.drawImage(
        ringTexture,
        -scaleDiameter / 2,
        -scaleDiameter / 2,
        scaleDiameter,
        scaleDiameter,
      );
      ctx.restore();
    };

    const drawShadowOverlay = (
      x: number,
      y: number,
      size: number,
      highlightAlpha: number,
      shadowAlpha: number,
    ) => {
      const cx = x * renderScale;
      const cy = y * renderScale;
      const radius = (size / 2) * renderScale;
      const gradient = ctx.createRadialGradient(
        cx - radius * 0.25,
        cy - radius * 0.25,
        radius * 0.1,
        cx,
        cy,
        radius,
      );
      gradient.addColorStop(0, `rgba(255,255,255,${highlightAlpha})`);
      gradient.addColorStop(0.45, "rgba(255,255,255,0.02)");
      gradient.addColorStop(1, `rgba(0,0,0,${shadowAlpha})`);
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawTexturedSphere = async (
      x: number,
      y: number,
      size: number,
      textureUrl: string,
      element: HTMLElement | null,
      glowColor?: string,
      highlightAlpha = 0.12,
      shadowAlpha = 0.88,
    ) => {
      const resolvedTextureUrl = resolveTextureAssetUrl(textureUrl);
      const textureImage = await loadImage(resolvedTextureUrl);
      const scaledSize = size * renderScale;
      const cx = x * renderScale;
      const cy = y * renderScale;
      const radius = scaledSize / 2;

      if (glowColor && enableGlow) {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = radius * 0.45;
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      if (textureImage?.complete && textureImage.naturalWidth > 0) {
        const computedStyle = element ? window.getComputedStyle(element) : null;
        const backgroundSizeParts = computedStyle?.backgroundSize.split(
          " ",
        ) || ["200%", "140%"];
        const backgroundPositionParts = computedStyle?.backgroundPosition.split(
          " ",
        ) || ["0%", "50%"];
        const renderedWidth = parseBackgroundLength(
          backgroundSizeParts[0] || "200%",
          size,
          size * 2,
        );
        const renderedHeight = parseBackgroundLength(
          backgroundSizeParts[1] || "140%",
          size,
          size * 1.4,
        );
        const offsetX = parseBackgroundPosition(
          backgroundPositionParts[0] || "0%",
          size,
          renderedWidth,
        );
        const offsetY = parseBackgroundPosition(
          backgroundPositionParts[1] || "50%",
          size,
          renderedHeight,
        );

        const patternCanvas = document.createElement("canvas");
        patternCanvas.width = Math.max(
          1,
          Math.round(renderedWidth * renderScale),
        );
        patternCanvas.height = Math.max(
          1,
          Math.round(renderedHeight * renderScale),
        );
        const patternCtx = patternCanvas.getContext("2d");
        if (patternCtx) {
          patternCtx.drawImage(
            textureImage,
            0,
            0,
            patternCanvas.width,
            patternCanvas.height,
          );
          const pattern = ctx.createPattern(patternCanvas, "repeat");
          if (pattern) {
            pattern.setTransform(
              new DOMMatrix().translate(
                (x - size / 2 + offsetX) * renderScale,
                (y - size / 2 + offsetY) * renderScale,
              ),
            );
            ctx.fillStyle = pattern;
            ctx.fillRect(cx - radius, cy - radius, scaledSize, scaledSize);
          }
        }
      } else {
        ctx.fillStyle = "#555";
        ctx.fillRect(cx - radius, cy - radius, scaledSize, scaledSize);
      }

      drawShadowOverlay(x, y, size, highlightAlpha, shadowAlpha);
      ctx.restore();
    };

    const backgroundImage = await loadImage(
      resolveTextureAssetUrl(TEXTURE_MAP[bgTheme]),
    );
    ctx.fillStyle = "#03030b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showOrbits) {
      displayedPlanets.forEach((planet) => drawOrbit(planet.orbitSize));
    }

    await drawTexturedSphere(
      450,
      450,
      96,
      TEXTURE_MAP.sun,
      systemViewport.querySelector(`[data-texture-url="${TEXTURE_MAP.sun}"]`),
      "rgba(253, 184, 19, 0.32)",
      0.25,
      0.5,
    );

    for (let index = 0; index < displayedPlanets.length; index += 1) {
      const planet = displayedPlanets[index];
      const angleDeg = planetRotations.current[planet.id] ?? (index * 45) % 360;
      const angle = (angleDeg * Math.PI) / 180;
      const orbitRadius = planet.orbitSize / 2;
      const x = 450 + Math.sin(angle) * orbitRadius;
      const y = 450 - Math.cos(angle) * orbitRadius;
      const orbitElement = planetElements.current[planet.id];
      const sphereElement = orbitElement?.querySelector(
        `[data-texture-url="${TEXTURE_MAP[planet.textureKey]}"]`,
      ) as HTMLElement | null;

      if (planet.hasRings) {
        drawRingHalf(x, y, planet.size, planet.textureKey, false);
      }

      await drawTexturedSphere(
        x,
        y,
        planet.size,
        TEXTURE_MAP[planet.textureKey],
        sphereElement,
        undefined,
        0.08,
        0.9,
      );

      if (planet.hasRings) {
        drawRingHalf(x, y, planet.size, planet.textureKey, true);
      }

      if (planet.hasMoon && showMoons) {
        const moonOrbitDiameter = planet.size + 22;
        const moonOrbitRadius = moonOrbitDiameter / 2;
        const moonAngle =
          ((planetRotations.current[planet.id] ?? angleDeg) * 4.5 * Math.PI) /
          180;

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = Math.max(1, renderScale * 0.75);
        ctx.beginPath();
        ctx.arc(
          x * renderScale,
          y * renderScale,
          moonOrbitRadius * renderScale,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();

        const moonX = x + Math.sin(moonAngle) * moonOrbitRadius;
        const moonY = y - Math.cos(moonAngle) * moonOrbitRadius;
        const moonElement = orbitElement?.querySelector(
          `[data-texture-url="${TEXTURE_MAP.moon}"]`,
        ) as HTMLElement | null;
        await drawTexturedSphere(
          moonX,
          moonY,
          5,
          TEXTURE_MAP.moon,
          moonElement,
          undefined,
          0.08,
          0.92,
        );
      }
    }

    if (exportObjectUrlRef.current) {
      URL.revokeObjectURL(exportObjectUrlRef.current);
      exportObjectUrlRef.current = null;
    }

    const blob = await canvasToBlob(canvas);
    const objectUrl = URL.createObjectURL(blob);
    exportObjectUrlRef.current = objectUrl;
    return objectUrl;
  };

  const handleExport = async () => {
    if (isGeneratingPng) return;

    setIsGeneratingPng(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => setTimeout(resolve, 0));
      });
      const imageUrl = await captureSolarSystem();
      if (!imageUrl) return;

      setExportFileName(`helios-solar-system-${Date.now()}.png`);
      setExportImage(imageUrl);
      setIsExporting(true);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    threeCanvasRef.current = canvas;
  }, []);

  const closeExport = () => {
    if (exportObjectUrlRef.current) {
      URL.revokeObjectURL(exportObjectUrlRef.current);
      exportObjectUrlRef.current = null;
    }
    setIsExporting(false);
    setExportImage(null);
  };

  const saveExportImage = async () => {
    if (!exportImage) return;

    try {
      const response = await fetch(exportImage);
      const blob = await response.blob();
      const pngFile = new File([blob], exportFileName, {
        type: "image/png",
      });
      const canShareFile =
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [pngFile] });

      if (canShareFile) {
        await navigator.share({
          files: [pngFile],
          title: "Helios Solar System",
          text: "Save this solar system snapshot.",
        });
        return;
      }

      window.open(exportImage, "_blank", "noopener,noreferrer");
    } catch {}
  };

  return {
    exportStageRef,
    systemViewportRef,
    exportImage,
    exportFileName,
    isExporting,
    isGeneratingPng,
    handleExport,
    handleCanvasReady,
    closeExport,
    saveExportImage,
  };
}
