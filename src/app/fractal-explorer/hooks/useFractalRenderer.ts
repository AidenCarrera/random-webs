"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  CPU_DEEP_ZOOM_THRESHOLD,
  CPU_MAX_ITERATIONS,
  GPU_PALETTE_INDEX,
  MAX_SHADER_ITERATIONS,
} from "../constants";
import type {
  ComplexPoint,
  FractalMode,
  GpuFractalRenderer,
  PaletteName,
} from "../types";
import { getFractalColor } from "../utils/color";
import { createGpuFractalRenderer, splitDouble } from "../utils/webgl";

interface UseFractalRendererOptions {
  isAnimatingRef: RefObject<boolean>;
}

export function useFractalRenderer({
  isAnimatingRef,
}: UseFractalRendererOptions) {
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const gpuRendererRef = useRef<GpuFractalRenderer | null>(null);
  const gpuUnavailableRef = useRef<boolean>(false);

  // Math View Parameters (Refs for high performance rendering loop)
  const centerXRef = useRef<number>(-0.7);
  const centerYRef = useRef<number>(0.0);
  const zoomRef = useRef<number>(1.0);
  const iterationsRef = useRef<number>(200);
  const paletteRef = useRef<PaletteName>("Neon");
  const modeRef = useRef<FractalMode>("mandelbrot");

  // Julia specific seed coordinates
  const juliaCRef = useRef<ComplexPoint>([-0.7, 0.27015]);

  const [isCpuRenderActive, setIsCpuRenderActive] = useState(false);

  // Render control state to handle cancelation
  const renderIdRef = useRef<number>(0);
  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCpuRenderActiveRef = useRef<boolean>(false);

  // Drawing pipeline
  const setCpuCanvasVisible = useCallback((visible: boolean) => {
    const canvas = cpuCanvasRef.current;
    if (!canvas) return;
    canvas.style.opacity = visible ? "1" : "0";
    if (isCpuRenderActiveRef.current !== visible) {
      isCpuRenderActiveRef.current = visible;
      setIsCpuRenderActive(visible);
    }
  }, []);

  const syncCpuCanvasSize = useCallback(() => {
    const sourceCanvas = canvasRef.current;
    const cpuCanvas = cpuCanvasRef.current;
    if (!sourceCanvas || !cpuCanvas) return;

    if (
      cpuCanvas.width !== sourceCanvas.width ||
      cpuCanvas.height !== sourceCanvas.height
    ) {
      cpuCanvas.width = sourceCanvas.width;
      cpuCanvas.height = sourceCanvas.height;
    }
  }, []);

  const renderGpuFractal = useCallback(
    (renderId: number): boolean => {
      if (
        renderId !== renderIdRef.current ||
        gpuUnavailableRef.current ||
        zoomRef.current > CPU_DEEP_ZOOM_THRESHOLD
      ) {
        return false;
      }

      const canvas = canvasRef.current;
      if (!canvas) return false;

      let renderer = gpuRendererRef.current;
      if (!renderer) {
        renderer = createGpuFractalRenderer(canvas);
        if (!renderer) {
          gpuUnavailableRef.current = true;
          return false;
        }
        gpuRendererRef.current = renderer;
      }

      const { gl, program, vao, uniforms } = renderer;
      const widthInComplex = 3.0 / zoomRef.current;
      const heightInComplex = widthInComplex * (canvas.height / canvas.width);
      const centerX = splitDouble(centerXRef.current);
      const centerY = splitDouble(centerYRef.current);
      const pixelScaleX = splitDouble(widthInComplex / canvas.width);
      const pixelScaleY = splitDouble(heightInComplex / canvas.height);
      const juliaX = splitDouble(juliaCRef.current[0]);
      const juliaY = splitDouble(juliaCRef.current[1]);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.centerX, centerX[0], centerX[1]);
      gl.uniform2f(uniforms.centerY, centerY[0], centerY[1]);
      gl.uniform2f(uniforms.pixelScaleX, pixelScaleX[0], pixelScaleX[1]);
      gl.uniform2f(uniforms.pixelScaleY, pixelScaleY[0], pixelScaleY[1]);
      gl.uniform1i(
        uniforms.maxIterations,
        Math.min(iterationsRef.current, MAX_SHADER_ITERATIONS),
      );
      gl.uniform1i(uniforms.palette, GPU_PALETTE_INDEX[paletteRef.current]);
      gl.uniform1i(uniforms.mode, modeRef.current === "mandelbrot" ? 0 : 1);
      gl.uniform2f(uniforms.juliaX, juliaX[0], juliaX[1]);
      gl.uniform2f(uniforms.juliaY, juliaY[0], juliaY[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      setCpuCanvasVisible(false);

      return true;
    },
    [setCpuCanvasVisible],
  );

  const drawPass = useCallback(
    (ratio: number, renderId: number, onComplete?: () => void) => {
      if (renderId !== renderIdRef.current) return;

      if (renderGpuFractal(renderId)) {
        if (onComplete) {
          drawTimerRef.current = setTimeout(onComplete, 16);
        }
        return;
      }

      syncCpuCanvasSize();
      setCpuCanvasVisible(true);

      const canvas = cpuCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // View calculations
      const widthInComplex = 3.0 / zoomRef.current;
      const heightInComplex = widthInComplex * (height / width);
      const cxMin = centerXRef.current - widthInComplex / 2;
      const cyMin = centerYRef.current - heightInComplex / 2;

      const maxIter = Math.min(iterationsRef.current, CPU_MAX_ITERATIONS);
      const palette = paletteRef.current;
      const fractalMode = modeRef.current;
      const juliaC = juliaCRef.current;

      // Create downscaled canvas data
      const sw = Math.ceil(width / ratio);
      const sh = Math.ceil(height / ratio);

      if (sw <= 0 || sh <= 0) return;

      const imgData = ctx.createImageData(sw, sh);
      const data = imgData.data;

      for (let py = 0; py < sh; py++) {
        const cy = cyMin + py * ratio * (heightInComplex / height);
        for (let px = 0; px < sw; px++) {
          const cx = cxMin + px * ratio * (widthInComplex / width);

          let iter = 0;
          let zr = 0.0;
          let zi = 0.0;
          let zr2 = 0.0;
          let zi2 = 0.0;

          if (fractalMode === "mandelbrot") {
            while (zr2 + zi2 <= 4.0 && iter < maxIter) {
              zi = 2.0 * zr * zi + cy;
              zr = zr2 - zi2 + cx;
              zr2 = zr * zr;
              zi2 = zi * zi;
              iter++;
            }
          } else {
            zr = cx;
            zi = cy;
            zr2 = zr * zr;
            zi2 = zi * zi;
            while (zr2 + zi2 <= 4.0 && iter < maxIter) {
              zi = 2.0 * zr * zi + juliaC[1];
              zr = zr2 - zi2 + juliaC[0];
              zr2 = zr * zr;
              zi2 = zi * zi;
              iter++;
            }
          }

          const rgb = getFractalColor(iter, maxIter, zr2, zi2, palette);
          const idx = (py * sw + px) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = 255;
        }
      }

      const offscreen = document.createElement("canvas");
      offscreen.width = sw;
      offscreen.height = sh;
      const offscreenCtx = offscreen.getContext("2d");
      if (offscreenCtx) {
        offscreenCtx.putImageData(imgData, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreen, 0, 0, width, height);
      }

      if (onComplete) {
        drawTimerRef.current = setTimeout(onComplete, 16);
      }
    },
    [renderGpuFractal, setCpuCanvasVisible, syncCpuCanvasSize],
  );

  const drawPassStriped = useCallback(
    (ratio: number, renderId: number) => {
      if (renderId !== renderIdRef.current) return;

      if (renderGpuFractal(renderId)) return;

      syncCpuCanvasSize();
      setCpuCanvasVisible(true);

      const canvas = cpuCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      const widthInComplex = 3.0 / zoomRef.current;
      const heightInComplex = widthInComplex * (height / width);
      const cxMin = centerXRef.current - widthInComplex / 2;
      const cyMin = centerYRef.current - heightInComplex / 2;

      const maxIter = Math.min(iterationsRef.current, CPU_MAX_ITERATIONS);
      const palette = paletteRef.current;
      const fractalMode = modeRef.current;
      const juliaC = juliaCRef.current;

      const numStripes = 10;
      const stripeHeight = Math.ceil(height / numStripes);
      let currentStripe = 0;

      const drawNextStripe = () => {
        if (renderId !== renderIdRef.current) return;

        const yStart = currentStripe * stripeHeight;
        const yEnd = Math.min(height, (currentStripe + 1) * stripeHeight);
        const currHeight = yEnd - yStart;

        if (currHeight <= 0) return;

        const imgData = ctx.createImageData(width, currHeight);
        const data = imgData.data;

        for (let py = 0; py < currHeight; py++) {
          const canvasY = yStart + py;
          const cy = cyMin + canvasY * (heightInComplex / height);
          for (let px = 0; px < width; px++) {
            const cx = cxMin + px * (widthInComplex / width);

            let iter = 0;
            let zr = 0.0;
            let zi = 0.0;
            let zr2 = 0.0;
            let zi2 = 0.0;

            if (fractalMode === "mandelbrot") {
              while (zr2 + zi2 <= 4.0 && iter < maxIter) {
                zi = 2.0 * zr * zi + cy;
                zr = zr2 - zi2 + cx;
                zr2 = zr * zr;
                zi2 = zi * zi;
                iter++;
              }
            } else {
              zr = cx;
              zi = cy;
              zr2 = zr * zr;
              zi2 = zi * zi;
              while (zr2 + zi2 <= 4.0 && iter < maxIter) {
                zi = 2.0 * zr * zi + juliaC[1];
                zr = zr2 - zi2 + juliaC[0];
                zr2 = zr * zr;
                zi2 = zi * zi;
                iter++;
              }
            }

            const rgb = getFractalColor(iter, maxIter, zr2, zi2, palette);
            const idx = (py * width + px) * 4;
            data[idx] = rgb[0];
            data[idx + 1] = rgb[1];
            data[idx + 2] = rgb[2];
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, yStart);

        currentStripe++;
        if (currentStripe < numStripes) {
          drawTimerRef.current = setTimeout(drawNextStripe, 10);
        }
      };

      drawNextStripe();
    },
    [renderGpuFractal, setCpuCanvasVisible, syncCpuCanvasSize],
  );

  // Immediate low-res rendering during panning or zooming
  const drawFastPreview = useCallback(() => {
    if (isAnimatingRef.current) return;
    const currentRenderId = ++renderIdRef.current;
    drawPass(8, currentRenderId);
  }, [drawPass, isAnimatingRef]);

  const renderAnimationFrame = useCallback(
    (ratio: number) => drawPass(ratio, ++renderIdRef.current),
    [drawPass],
  );

  // Main rendering passes (draws low res to high res chunked)
  const triggerProgressiveRender = useCallback(() => {
    if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
    const currentRenderId = ++renderIdRef.current;

    if (renderGpuFractal(currentRenderId)) {
      return;
    }

    // Pass 1: Render 4x4 pixel scaling (very fast)
    drawPass(4, currentRenderId, () => {
      // Pass 2: Render 2x2 pixel scaling (decent detail)
      drawPass(2, currentRenderId, () => {
        // Pass 3: Render 1x1 full resolution (Stripe-by-stripe to keep main thread completely unblocked)
        drawPassStriped(1, currentRenderId);
      });
    });
  }, [drawPass, drawPassStriped, renderGpuFractal]);

  const scheduleProgressiveRender = useCallback(
    (delay: number) => {
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
      drawTimerRef.current = setTimeout(triggerProgressiveRender, delay);
    },
    [triggerProgressiveRender],
  );

  // Render Mini Julia Set Preview (for Mandelbrot Mode) â€” kept on 2D canvas,
  // cheap enough (130x130, 70 iterations) that it doesn't need the GPU path.
  const updateMiniJuliaPreview = (mx: number, my: number) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const jcReal = mx;
    const jcImag = my;
    const miniMaxIter = 70;

    const zoom = 1.25;
    const complexRange = 3.0 / zoom;

    for (let py = 0; py < size; py++) {
      const cy = -complexRange / 2 + py * (complexRange / size);
      for (let px = 0; px < size; px++) {
        const cx = -complexRange / 2 + px * (complexRange / size);

        let zr = cx;
        let zi = cy;
        let zr2 = zr * zr;
        let zi2 = zi * zi;
        let iter = 0;

        while (zr2 + zi2 <= 4.0 && iter < miniMaxIter) {
          zi = 2.0 * zr * zi + jcImag;
          zr = zr2 - zi2 + jcReal;
          zr2 = zr * zr;
          zi2 = zi * zi;
          iter++;
        }

        const rgb = getFractalColor(
          iter,
          miniMaxIter,
          zr2,
          zi2,
          paletteRef.current,
        );
        const idx = (py * size + px) * 4;
        data[idx] = rgb[0];
        data[idx + 1] = rgb[1];
        data[idx + 2] = rgb[2];
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = window.visualViewport;
      canvas.width = viewport?.width ?? window.innerWidth;
      canvas.height = viewport?.height ?? window.innerHeight;
      syncCpuCanvasSize();

      const currentRenderId = ++renderIdRef.current;
      drawPass(8, currentRenderId, triggerProgressiveRender);
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);

      const renderer = gpuRendererRef.current;
      if (renderer) {
        const { gl, program, vao, buffer } = renderer;
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
        gpuRendererRef.current = null;
      }
    };
  }, [drawPass, syncCpuCanvasSize, triggerProgressiveRender]);

  return {
    canvasRef,
    centerXRef,
    centerYRef,
    cpuCanvasRef,
    drawFastPreview,
    isCpuRenderActive,
    iterationsRef,
    juliaCRef,
    miniCanvasRef,
    modeRef,
    paletteRef,
    renderAnimationFrame,
    scheduleProgressiveRender,
    triggerProgressiveRender,
    updateMiniJuliaPreview,
    zoomRef,
  };
}
