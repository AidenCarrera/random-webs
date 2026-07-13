export type PointerMode = "attract" | "repel";

export type BoidsSettings = {
  count: number;
  movementAccuracy: number;
  boidVision: number;
  alignmentForce: number;
  cohesionForce: number;
  separationForce: number;
  steeringForce: number;
  minSpeed: number;
  maxSpeed: number;
};

export type BoidsPresetName = "Relaxed" | "Balanced" | "Frenzy";

export const MAX_SEPARATION_FORCE = 3;
export const BASE_FRAME_DURATION = 1000 / 60;

export function getFrameScale(elapsedMilliseconds: number) {
  return Math.min(1.8, Math.max(0, elapsedMilliseconds / BASE_FRAME_DURATION));
}

export function getSeparationRadius(
  boidVision: number,
  separationForce: number,
) {
  if (boidVision <= 0 || separationForce <= 0) return 0;
  const forceProgress = Math.min(1, separationForce / MAX_SEPARATION_FORCE);
  return boidVision * forceProgress * 0.9;
}

export const DEFAULT_BOIDS_SETTINGS: BoidsSettings = {
  count: 1000,
  movementAccuracy: 96,
  boidVision: 72,
  alignmentForce: 1.05,
  cohesionForce: 0.72,
  separationForce: 1.35,
  steeringForce: 0.052,
  minSpeed: 1.6,
  maxSpeed: 3.4,
};

export const BOIDS_PRESETS: Record<BoidsPresetName, BoidsSettings> = {
  Relaxed: {
    count: 900,
    movementAccuracy: 112,
    boidVision: 92,
    alignmentForce: 1.55,
    cohesionForce: 0.52,
    separationForce: 0.82,
    steeringForce: 0.044,
    minSpeed: 1.4,
    maxSpeed: 2.8,
  },
  Balanced: DEFAULT_BOIDS_SETTINGS,
  Frenzy: {
    count: 1400,
    movementAccuracy: 64,
    boidVision: 48,
    alignmentForce: 0.55,
    cohesionForce: 0.38,
    separationForce: 2.1,
    steeringForce: 0.08,
    minSpeed: 2.4,
    maxSpeed: 4.8,
  },
};

export const BOIDS_PRESET_DESCRIPTIONS: Record<BoidsPresetName, string> = {
  Relaxed: "Soft forces create broad turns and calm, river-like streams.",
  Balanced: "Evenly tuned rules form dense, responsive groups.",
  Frenzy: "High separation and speed create nervous, electric movement.",
};
