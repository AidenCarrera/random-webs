"use client";

import { useEffect, useRef } from "react";

/**
 * A scrolling strip chart of the telegraph line: the trace jumps high while
 * the signal lamp is lit, so dots and dashes read as pulses.
 */
export function SignalTrace({ lightOn }: { lightOn: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef(lightOn);

  useEffect(() => {
    lightRef.current = lightOn;
  }, [lightOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const samples: number[] = [];
    let frame = 0;

    const draw = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const capacity = Math.max(1, Math.floor(width / 2));
      samples.push(lightRef.current ? 1 : 0);
      while (samples.length > capacity) samples.shift();

      context.clearRect(0, 0, width, height);

      // Faint graticule.
      context.strokeStyle = "rgba(255, 140, 0, 0.08)";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 16) {
        context.beginPath();
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, height);
        context.stroke();
      }

      const low = height * 0.78;
      const high = height * 0.22;
      const offset = width - samples.length * 2;

      context.beginPath();
      samples.forEach((value, index) => {
        const x = offset + index * 2;
        const y = value ? high : low;
        if (index === 0) context.moveTo(x, y);
        else {
          const previous = samples[index - 1] ? high : low;
          if (previous !== y) context.lineTo(x, previous);
          context.lineTo(x, y);
        }
      });
      context.strokeStyle = "#ffae00";
      context.lineWidth = 2;
      context.shadowColor = "rgba(255, 174, 0, 0.8)";
      context.shadowBlur = 8;
      context.stroke();
      context.shadowBlur = 0;

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full"
    />
  );
}
