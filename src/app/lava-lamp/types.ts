export type PresetId = "ember" | "lagoon" | "orchid" | "honey";

export type Preset = {
  name: string;
  background: [string, string];
  glass: string;
  glow: string;
  lava: [string, string, string];
  blobCount: number;
  buoyancy: number;
  viscosity: number;
  drift: number;
};

export type Blob = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  temperature: number;
  phase: number;
};

export type Geometry = {
  width: number;
  height: number;
  centerX: number;
  lampTop: number;
  lampHeight: number;
  glassTop: number;
  glassBottom: number;
  glassHeight: number;
  bodyHalf: number;
  topCapHeight: number;
  baseHeight: number;
};

export type PointerState = {
  active: boolean;
  down: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

export type CursorMode = "default" | "grab" | "grabbing";

export type Rgb = { r: number; g: number; b: number };
