export interface Plant {
  id: string;
  x: number;
  y: number;
  type: string;
  rotation: number;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

export type BrushType = "standard" | "wave" | "water";

export interface Stroke {
  points: Point[];
  brushSize: number;
  brushType: BrushType;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface VisualRipple {
  id: string;
  x: number;
  y: number;
}

export interface Theme {
  id: string;
  name: string;
  bg: string;
  grooveColor: string;
  shadowColor: string;
  highlightColor: string;
  grainOpacity: number;
  textColor: string;
}

export interface HistoryEntry {
  plants: Plant[];
  strokes: Stroke[];
  ripples: Ripple[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

export type Atmosphere = "day" | "dusk" | "night";

export type GardenTool = "plant" | "rake" | "prune" | "water";

export interface ImportedGarden {
  plants?: unknown;
  strokes?: Stroke[];
  ripples?: Ripple[];
  theme?: string;
}

export interface GardenLayout {
  plants: Plant[];
  strokes: Stroke[];
  ripples: Ripple[];
  theme: string;
  atmosphere: Atmosphere;
}
