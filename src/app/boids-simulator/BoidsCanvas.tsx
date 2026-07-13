"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { canvasToBlob } from "@/lib/canvasExport";

import {
  getFrameScale,
  getSeparationRadius,
  type BoidsSettings,
  type PointerMode,
} from "./simulator";

type Boid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  previousX: number;
  previousY: number;
  phase: number;
  size: number;
  tone: number;
  palette: number;
  wander: number;
  trail: Array<{ x: number; y: number }>;
};

type PointerState = {
  x: number;
  y: number;
  active: boolean;
  pressed: boolean;
  mode: PointerMode;
};

type ActivePointer = {
  x: number;
  y: number;
  mode: PointerMode;
};

export type BoidsMetrics = {
  fps: number;
  neighbors: number;
};

export type BoidsCanvasHandle = {
  reseed: () => void;
  scatter: () => void;
  snapshot: () => Promise<BoidsSnapshot | null>;
};

export type BoidsSnapshot = {
  blob: Blob;
  fileName: string;
  imageSrc: string;
};

type BoidsCanvasProps = {
  settings: BoidsSettings;
  paused: boolean;
  trails: boolean;
  onMetrics: (metrics: BoidsMetrics) => void;
};

const BACKGROUND = "#10140f";
const VELOCITY_RETENTION = 0.996;
const COLOR_PALETTE = [
  [92, 220, 255],
  [100, 255, 190],
  [218, 255, 92],
  [255, 181, 83],
  [255, 112, 154],
  [196, 142, 255],
] as const;

function clampMagnitude(x: number, y: number, maximum: number) {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= maximum || magnitude === 0) return { x, y };
  const scale = maximum / magnitude;
  return { x: x * scale, y: y * scale };
}

function clampSpeed(
  x: number,
  y: number,
  minimum: number,
  maximum: number,
  fallbackAngle: number,
) {
  const magnitude = Math.hypot(x, y);
  if (magnitude < 0.0001) {
    return {
      x: Math.cos(fallbackAngle) * minimum,
      y: Math.sin(fallbackAngle) * minimum,
    };
  }
  if (magnitude < minimum) {
    const scale = minimum / magnitude;
    return { x: x * scale, y: y * scale };
  }
  return clampMagnitude(x, y, maximum);
}

function colorForBoid(tone: number, paletteIndex: number, alpha: number) {
  const palette = COLOR_PALETTE[paletteIndex % COLOR_PALETTE.length];
  const red = Math.max(0, Math.min(255, Math.round(palette[0] + tone * 0.2)));
  const green = Math.max(0, Math.min(255, Math.round(palette[1] + tone * 0.3)));
  const blue = Math.max(0, Math.min(255, Math.round(palette[2] - tone * 0.1)));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function steerToward(
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  maximumSpeed: number,
  steeringForce: number,
) {
  const magnitude = Math.hypot(x, y);
  if (magnitude < 0.0001) return { x: 0, y: 0 };
  const desired = {
    x: (x / magnitude) * maximumSpeed,
    y: (y / magnitude) * maximumSpeed,
  };
  return clampMagnitude(
    desired.x - velocityX,
    desired.y - velocityY,
    steeringForce,
  );
}

function createBoid(
  width: number,
  height: number,
  minimumSpeed: number,
  maximumSpeed: number,
): Boid {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.min(width, height) * (0.08 + Math.random() * 0.28);
  const x = width / 2 + Math.cos(angle) * radius;
  const y = height / 2 + Math.sin(angle) * radius;
  const heading = angle + Math.PI / 2 + (Math.random() - 0.5) * 1.4;
  const velocity =
    minimumSpeed + Math.random() * Math.max(0, maximumSpeed - minimumSpeed);

  return {
    x,
    y,
    vx: Math.cos(heading) * velocity,
    vy: Math.sin(heading) * velocity,
    previousX: x,
    previousY: y,
    phase: Math.random() * Math.PI * 2,
    size: 5.2 + Math.random() * 3.2,
    tone: (Math.random() - 0.5) * 10,
    palette: Math.floor(Math.random() * COLOR_PALETTE.length),
    wander: (Math.random() - 0.5) * 0.4,
    trail: [{ x, y }],
  };
}

function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export const BoidsCanvas = forwardRef<BoidsCanvasHandle, BoidsCanvasProps>(
  function BoidsCanvas({ settings, paused, trails, onMetrics }, forwardedRef) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number | null>(null);
    const boidsRef = useRef<Boid[]>([]);
    const settingsRef = useRef(settings);
    const pausedRef = useRef(paused);
    const trailsRef = useRef(trails);
    const sizeRef = useRef({ width: 1, height: 1 });
    const resetRef = useRef(true);
    const activePointersRef = useRef(new Map<number, ActivePointer>());
    const pointerRef = useRef<PointerState>({
      x: 0,
      y: 0,
      active: false,
      pressed: false,
      mode: "attract",
    });

    useEffect(() => {
      settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
      pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
      trailsRef.current = trails;
    }, [trails]);

    useImperativeHandle(
      forwardedRef,
      () => ({
        reseed: () => {
          resetRef.current = true;
        },
        scatter: () => {
          for (const boid of boidsRef.current) {
            const angle = Math.random() * Math.PI * 2;
            const power = 3 + Math.random() * 4;
            boid.vx = Math.cos(angle) * power;
            boid.vy = Math.sin(angle) * power;
          }
        },
        snapshot: async () => {
          if (!canvasRef.current) return null;
          const fileName = `boids-simulator-${Date.now()}.png`;
          const blob = await canvasToBlob(canvasRef.current);
          return {
            blob,
            fileName,
            imageSrc: canvasRef.current.toDataURL("image/png"),
          };
        },
      }),
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (!canvas || !parent) return;

      const context = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });
      if (!context) return;

      const syncSize = () => {
        const bounds = parent.getBoundingClientRect();
        const previousSize = sizeRef.current;
        sizeRef.current = {
          width: Math.max(1, bounds.width),
          height: Math.max(1, bounds.height),
        };
        fitCanvas(canvas, sizeRef.current.width, sizeRef.current.height);
        context.fillStyle = BACKGROUND;
        context.fillRect(0, 0, sizeRef.current.width, sizeRef.current.height);
        if (
          boidsRef.current.length > 0 &&
          previousSize.width > 1 &&
          previousSize.height > 1
        ) {
          const scaleX = sizeRef.current.width / previousSize.width;
          const scaleY = sizeRef.current.height / previousSize.height;
          for (const boid of boidsRef.current) {
            boid.x *= scaleX;
            boid.y *= scaleY;
            boid.previousX *= scaleX;
            boid.previousY *= scaleY;
            boid.trail = boid.trail.map((point) => ({
              x: point.x * scaleX,
              y: point.y * scaleY,
            }));
          }
        }
      };

      syncSize();
      const observer = new ResizeObserver(syncSize);
      observer.observe(parent);

      let previousTime = performance.now();
      let metricsTime = previousTime;
      let frames = 0;
      let neighborSamples = 0;

      const render = (time: number) => {
        const { width, height } = sizeRef.current;
        const currentSettings = settingsRef.current;
        const boids = boidsRef.current;
        const delta = getFrameScale(time - previousTime);
        previousTime = time;

        if (resetRef.current) {
          boidsRef.current = Array.from({ length: currentSettings.count }, () =>
            createBoid(
              width,
              height,
              currentSettings.minSpeed,
              currentSettings.maxSpeed,
            ),
          );
          resetRef.current = false;
          context.fillStyle = BACKGROUND;
          context.fillRect(0, 0, width, height);
        } else if (boids.length !== currentSettings.count) {
          if (boids.length < currentSettings.count) {
            while (boids.length < currentSettings.count) {
              boids.push(
                createBoid(
                  width,
                  height,
                  currentSettings.minSpeed,
                  currentSettings.maxSpeed,
                ),
              );
            }
          } else {
            boids.length = currentSettings.count;
          }
        }

        const activeBoids = boidsRef.current;
        context.fillStyle = BACKGROUND;
        context.fillRect(0, 0, width, height);

        let totalNeighbors = 0;
        if (!pausedRef.current) {
          const perceptionSquared = currentSettings.boidVision ** 2;
          const separationRadius = getSeparationRadius(
            currentSettings.boidVision,
            currentSettings.separationForce,
          );
          const separationRadiusSquared = separationRadius ** 2;
          const columns = Math.max(
            1,
            Math.floor(width / currentSettings.boidVision),
          );
          const rows = Math.max(
            1,
            Math.floor(height / currentSettings.boidVision),
          );
          const cellWidth = width / columns;
          const cellHeight = height / rows;
          const spatialGrid = new Map<number, number[]>();

          for (let index = 0; index < activeBoids.length; index += 1) {
            const boid = activeBoids[index];
            const normalizedX = ((boid.x % width) + width) % width;
            const normalizedY = ((boid.y % height) + height) % height;
            const column = Math.min(
              columns - 1,
              Math.floor(normalizedX / cellWidth),
            );
            const row = Math.min(
              rows - 1,
              Math.floor(normalizedY / cellHeight),
            );
            const key = row * columns + column;
            const cell = spatialGrid.get(key);
            if (cell) cell.push(index);
            else spatialGrid.set(key, [index]);
          }

          for (let index = 0; index < activeBoids.length; index += 1) {
            const boid = activeBoids[index];
            let alignmentX = 0;
            let alignmentY = 0;
            let cohesionX = 0;
            let cohesionY = 0;
            let separationX = 0;
            let separationY = 0;
            let neighbors = 0;
            let neighborWeight = 0;
            let separationNeighbors = 0;
            const normalizedX = ((boid.x % width) + width) % width;
            const normalizedY = ((boid.y % height) + height) % height;
            const column = Math.min(
              columns - 1,
              Math.floor(normalizedX / cellWidth),
            );
            const row = Math.min(
              rows - 1,
              Math.floor(normalizedY / cellHeight),
            );
            const visitedCells: number[] = [];

            neighborSearch: for (
              let rowOffset = -1;
              rowOffset <= 1;
              rowOffset += 1
            ) {
              for (
                let columnOffset = -1;
                columnOffset <= 1;
                columnOffset += 1
              ) {
                const neighborColumn =
                  (column + columnOffset + columns) % columns;
                const neighborRow = (row + rowOffset + rows) % rows;
                const cellKey = neighborRow * columns + neighborColumn;
                if (visitedCells.includes(cellKey)) continue;
                visitedCells.push(cellKey);

                const candidates = spatialGrid.get(cellKey);
                if (!candidates) continue;

                for (const otherIndex of candidates) {
                  if (index === otherIndex) continue;
                  const other = activeBoids[otherIndex];
                  let dx = other.x - boid.x;
                  let dy = other.y - boid.y;

                  if (Math.abs(dx) > width / 2) dx -= Math.sign(dx) * width;
                  if (Math.abs(dy) > height / 2) dy -= Math.sign(dy) * height;

                  const distanceSquared = dx * dx + dy * dy;
                  if (
                    distanceSquared === 0 ||
                    distanceSquared > perceptionSquared
                  ) {
                    continue;
                  }

                  const distance = Math.sqrt(distanceSquared);
                  const visionWeight = Math.max(
                    0.02,
                    1 - distance / currentSettings.boidVision,
                  );
                  alignmentX += other.vx * visionWeight;
                  alignmentY += other.vy * visionWeight;
                  cohesionX += dx * visionWeight;
                  cohesionY += dy * visionWeight;
                  neighborWeight += visionWeight;

                  if (
                    separationRadius > 0 &&
                    distanceSquared < separationRadiusSquared
                  ) {
                    const proximity = 1 - distance / separationRadius;
                    const separationWeight = proximity * proximity;
                    separationX -= (dx / distance) * separationWeight;
                    separationY -= (dy / distance) * separationWeight;
                    separationNeighbors += 1;
                  }
                  neighbors += 1;
                  if (neighbors >= currentSettings.movementAccuracy) {
                    break neighborSearch;
                  }
                }
              }
            }

            totalNeighbors += neighbors;
            boid.wander = Math.max(
              -0.7,
              Math.min(0.7, boid.wander + (Math.random() - 0.5) * 0.09),
            );
            const heading = Math.atan2(boid.vy, boid.vx);
            const wanderHeading = heading + boid.wander;
            let accelerationX =
              Math.cos(wanderHeading) * currentSettings.steeringForce * 0.22;
            let accelerationY =
              Math.sin(wanderHeading) * currentSettings.steeringForce * 0.22;

            if (neighbors > 0 && neighborWeight > 0) {
              const alignment = steerToward(
                alignmentX / neighborWeight,
                alignmentY / neighborWeight,
                boid.vx,
                boid.vy,
                currentSettings.maxSpeed,
                currentSettings.steeringForce,
              );
              const cohesion = steerToward(
                cohesionX / neighborWeight,
                cohesionY / neighborWeight,
                boid.vx,
                boid.vy,
                currentSettings.maxSpeed,
                currentSettings.steeringForce,
              );
              const separation =
                separationNeighbors > 0
                  ? steerToward(
                      separationX,
                      separationY,
                      boid.vx,
                      boid.vy,
                      currentSettings.maxSpeed,
                      currentSettings.steeringForce,
                    )
                  : { x: 0, y: 0 };

              accelerationX +=
                alignment.x * currentSettings.alignmentForce +
                cohesion.x * currentSettings.cohesionForce +
                separation.x * currentSettings.separationForce;
              accelerationY +=
                alignment.y * currentSettings.alignmentForce +
                cohesion.y * currentSettings.cohesionForce +
                separation.y * currentSettings.separationForce;
            }

            const pointer = pointerRef.current;
            if (pointer.active && pointer.pressed) {
              const dx = pointer.x - boid.x;
              const dy = pointer.y - boid.y;
              const distance = Math.hypot(dx, dy);
              const radius = 280;
              if (distance > 1 && distance < radius) {
                const direction = pointer.mode === "attract" ? 1 : -1;
                const influence = (1 - distance / radius) * 0.19;
                accelerationX += (dx / distance) * influence * direction;
                accelerationY += (dy / distance) * influence * direction;
              }
            }

            boid.previousX = boid.x;
            boid.previousY = boid.y;
            boid.vx += accelerationX * delta;
            boid.vy += accelerationY * delta;
            boid.vx *= VELOCITY_RETENTION;
            boid.vy *= VELOCITY_RETENTION;
            const velocity = clampSpeed(
              boid.vx,
              boid.vy,
              currentSettings.minSpeed,
              currentSettings.maxSpeed,
              boid.phase,
            );
            boid.vx = velocity.x;
            boid.vy = velocity.y;
            boid.x += boid.vx * delta;
            boid.y += boid.vy * delta;

            const margin = 10;
            let wrapped = false;
            if (boid.x < -margin) {
              boid.x = width + margin;
              wrapped = true;
            }
            if (boid.x > width + margin) {
              boid.x = -margin;
              wrapped = true;
            }
            if (boid.y < -margin) {
              boid.y = height + margin;
              wrapped = true;
            }
            if (boid.y > height + margin) {
              boid.y = -margin;
              wrapped = true;
            }

            if (wrapped) boid.trail = [];
            boid.trail.push({ x: boid.x, y: boid.y });
            if (boid.trail.length > 10) boid.trail.shift();
          }
        }

        for (let index = 0; index < activeBoids.length; index += 1) {
          const boid = activeBoids[index];
          const angle = Math.atan2(boid.vy, boid.vx);
          if (trailsRef.current && boid.trail.length > 1) {
            context.strokeStyle = colorForBoid(boid.tone, boid.palette, 0.28);
            context.lineWidth = 0.9;
            context.beginPath();
            context.moveTo(boid.trail[0].x, boid.trail[0].y);
            for (
              let trailIndex = 1;
              trailIndex < boid.trail.length;
              trailIndex += 1
            ) {
              context.lineTo(
                boid.trail[trailIndex].x,
                boid.trail[trailIndex].y,
              );
            }
            context.stroke();
          }

          context.save();
          context.translate(boid.x, boid.y);
          context.rotate(angle);
          context.beginPath();
          context.moveTo(boid.size * 1.75, 0);
          context.lineTo(-boid.size, boid.size * 0.68);
          context.lineTo(-boid.size * 0.48, 0);
          context.lineTo(-boid.size, -boid.size * 0.68);
          context.closePath();
          context.fillStyle = colorForBoid(boid.tone, boid.palette, 1);
          context.fill();
          context.restore();
        }

        frames += 1;
        neighborSamples += totalNeighbors / Math.max(1, activeBoids.length);
        if (time - metricsTime >= 600) {
          onMetrics({
            fps: Math.round((frames * 1000) / (time - metricsTime)),
            neighbors: Math.round(neighborSamples / Math.max(1, frames)),
          });
          frames = 0;
          neighborSamples = 0;
          metricsTime = time;
        }

        frameRef.current = requestAnimationFrame(render);
      };

      frameRef.current = requestAnimationFrame(render);
      return () => {
        observer.disconnect();
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }, [onMetrics]);

    const syncPointerState = () => {
      const pointers = Array.from(activePointersRef.current.values());
      if (pointers.length === 0) {
        pointerRef.current.active = false;
        pointerRef.current.pressed = false;
        return;
      }

      pointerRef.current.x =
        pointers.reduce((total, pointer) => total + pointer.x, 0) /
        pointers.length;
      pointerRef.current.y =
        pointers.reduce((total, pointer) => total + pointer.y, 0) /
        pointers.length;
      pointerRef.current.active = true;
      pointerRef.current.pressed = true;
      pointerRef.current.mode =
        pointers.length >= 2 ? "repel" : pointers[0].mode;
    };

    const trackPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const trackedPointer = activePointersRef.current.get(event.pointerId);
      activePointersRef.current.set(event.pointerId, {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        mode:
          trackedPointer?.mode ?? (event.button === 2 ? "repel" : "attract"),
      });
      syncPointerState();
    };

    return (
      <canvas
        ref={canvasRef}
        aria-label="Interactive Boids Simulator"
        onPointerDown={(event) => {
          event.preventDefault();
          trackPointer(event);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (activePointersRef.current.has(event.pointerId)) {
            trackPointer(event);
          }
        }}
        onPointerUp={(event) => {
          activePointersRef.current.delete(event.pointerId);
          syncPointerState();
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          activePointersRef.current.delete(event.pointerId);
          syncPointerState();
        }}
        onPointerLeave={() => {
          if (activePointersRef.current.size === 0) {
            pointerRef.current.active = false;
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
    );
  },
);
