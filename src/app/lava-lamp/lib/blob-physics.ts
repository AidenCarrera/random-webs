import type { Blob, Geometry, PointerState, Preset } from "../types";
import { halfWidthAt } from "../utils/geometry";
import { clamp } from "../utils/math";

export function createBlobs(preset: Preset) {
  return Array.from({ length: preset.blobCount }, (_, index): Blob => {
    const y = 0.1 + Math.random() * 0.8;
    const r = 0.055 + Math.random() * 0.045;
    const availableWidth = Math.max(0.05, halfWidthAt(y) - r * 1.7);

    return {
      x: (Math.random() * 2 - 1) * availableWidth,
      y,
      r,
      vx: (Math.random() - 0.5) * 0.025,
      vy: (Math.random() - 0.5) * 0.025,
      temperature: clamp(0.2 + y * 0.72 + Math.random() * 0.12, 0, 1),
      phase: (index / preset.blobCount) * Math.PI * 2 + Math.random(),
    };
  });
}

export function syncBlobCount(blobs: Blob[], preset: Preset) {
  if (!blobs.length || blobs.length === preset.blobCount) return;

  if (blobs.length < preset.blobCount) {
    blobs.push(
      ...createBlobs({
        ...preset,
        blobCount: preset.blobCount - blobs.length,
      }),
    );
  } else {
    blobs.splice(preset.blobCount);
  }
}

type BlobUpdateOptions = {
  blobs: Blob[];
  geometry: Geometry;
  pointer: PointerState;
  preset: Preset;
  delta: number;
  elapsed: number;
};

export function updateBlobs({
  blobs,
  geometry,
  pointer,
  preset,
  delta,
  elapsed,
}: BlobUpdateOptions) {
  const bodyToHeight = geometry.bodyHalf / geometry.glassHeight;
  const damping = Math.pow(preset.viscosity, delta * 60);

  for (const blob of blobs) {
    if (blob.y > 0.76) {
      blob.temperature += delta * (0.12 + (blob.y - 0.76) * 0.4);
    } else if (blob.y < 0.24) {
      blob.temperature -= delta * (0.11 + (0.24 - blob.y) * 0.34);
    } else {
      blob.temperature += (0.5 - blob.temperature) * delta * 0.025;
    }
    blob.temperature = clamp(blob.temperature, 0.02, 0.98);

    const currentHalf = halfWidthAt(blob.y);
    const radiusY = blob.r;
    const radiusX = blob.r / bodyToHeight;
    const thermalLift = (0.5 - blob.temperature) * preset.buoyancy;
    const drift =
      Math.sin(elapsed * 0.00042 + blob.phase + blob.y * 4.5) * preset.drift;

    blob.vy += thermalLift * delta;
    blob.vx += drift * delta;
    blob.vx += -blob.x * 0.006 * delta;

    if (pointer.active) {
      const blobX = blob.x * bodyToHeight;
      const pointerX = pointer.x * bodyToHeight;
      const dx = pointerX - blobX;
      const dy = pointer.y - blob.y;
      const distance = Math.hypot(dx, dy);
      const radius = pointer.down ? 0.3 : 0.2;

      if (distance < radius && distance > 0.0001) {
        const force = (1 - distance / radius) * (pointer.down ? 1.45 : 0.38);
        blob.vx += ((dx / distance) * force * delta) / bodyToHeight;
        blob.vy += (dy / distance) * force * delta;
        blob.vx += (pointer.dx / bodyToHeight) * force * 0.52;
        blob.vy += pointer.dy * force * 0.52;
        if (pointer.down) {
          blob.temperature = clamp(blob.temperature + delta * 0.16, 0, 1);
        }
      }
    }

    blob.vx *= damping;
    blob.vy *= damping;
    blob.x += blob.vx * delta;
    blob.y += blob.vy * delta;

    const updatedHalf = halfWidthAt(clamp(blob.y, 0, 1));
    const sideLimit = Math.max(0.02, updatedHalf - radiusX * 0.92);
    if (Math.abs(blob.x) > sideLimit) {
      blob.x = Math.sign(blob.x) * sideLimit;
      blob.vx *= -0.52;
    }

    if (blob.y < radiusY * 0.82) {
      blob.y = radiusY * 0.82;
      blob.vy = Math.abs(blob.vy) * 0.45;
      blob.temperature = Math.max(0.04, blob.temperature - 0.08);
    } else if (blob.y > 1 - radiusY * 0.8) {
      blob.y = 1 - radiusY * 0.8;
      blob.vy = -Math.abs(blob.vy) * 0.42;
      blob.temperature = Math.min(0.96, blob.temperature + 0.08);
    }

    if (currentHalf < 0.4 && blob.y < 0.15) {
      blob.vx += -blob.x * delta * 0.04;
    }
  }

  separateBlobs(blobs, bodyToHeight);
  pointer.dx *= 0.72;
  pointer.dy *= 0.72;
}

function separateBlobs(blobs: Blob[], bodyToHeight: number) {
  for (let index = 0; index < blobs.length; index += 1) {
    for (
      let otherIndex = index + 1;
      otherIndex < blobs.length;
      otherIndex += 1
    ) {
      const a = blobs[index];
      const b = blobs[otherIndex];
      const dx = (b.x - a.x) * bodyToHeight;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      const preferred = (a.r + b.r) * 0.72;

      if (distance < preferred) {
        const push = (preferred - distance) * 0.018;
        const nx = dx / distance;
        const ny = dy / distance;
        a.vx -= (nx * push) / bodyToHeight;
        b.vx += (nx * push) / bodyToHeight;
        a.vy -= ny * push;
        b.vy += ny * push;
      }
    }
  }
}
