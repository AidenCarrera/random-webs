import type {
  AccessoryStyle,
  BackgroundColor,
  CarePace,
  HatStyle,
  PetStatus,
  SkinColor,
} from "../types";

export const SKIN_COLORS: Record<
  SkinColor,
  { base: string; dark: string; light: string }
> = {
  "cyber-cyan": { base: "#06b6d4", dark: "#0891b2", light: "#22d3ee" },
  "neon-pink": { base: "#ec4899", dark: "#db2777", light: "#f472b6" },
  "gameboy-olive": { base: "#8da45e", dark: "#657a42", light: "#b6c779" },
  "golden-orange": { base: "#f97316", dark: "#ea580c", light: "#fb923c" },
  "ocean-blue": { base: "#3b82b5", dark: "#285f89", light: "#67a9cf" },
  "slime-green": { base: "#22c55e", dark: "#16a34a", light: "#4ade80" },
  lavender: { base: "#9b87c7", dark: "#7562a4", light: "#c0afe0" },
  peach: { base: "#e99472", dark: "#bf684c", light: "#f3b49a" },
  "moon-gray": { base: "#9aa3a1", dark: "#6c7675", light: "#c3cac5" },
  "berry-purple": { base: "#8f4f83", dark: "#66375e", light: "#bd79ae" },
};

export const SKIN_LABELS: Record<SkinColor, string> = {
  "cyber-cyan": "CYAN",
  "neon-pink": "PINK",
  "gameboy-olive": "OLIVE",
  "golden-orange": "ORANGE",
  "ocean-blue": "OCEAN",
  "slime-green": "GREEN",
  lavender: "LAVENDER",
  peach: "PEACH",
  "moon-gray": "MOON GRAY",
  "berry-purple": "BERRY",
};

export const SKIN_OPTIONS = [
  "cyber-cyan",
  "neon-pink",
  "gameboy-olive",
  "golden-orange",
  "ocean-blue",
  "slime-green",
  "lavender",
  "peach",
  "moon-gray",
  "berry-purple",
] as const satisfies readonly SkinColor[];

export const HAT_OPTIONS = [
  "NONE",
  "COWBOY",
  "BEANIE",
  "CROWN",
  "PARTY",
  "WIZARD",
  "FLOWER",
  "BOW",
  "TOPHAT",
  "CHEF",
  "PIRATE",
  "SPACE",
] as const satisfies readonly HatStyle[];

export const ACCESSORY_OPTIONS = [
  "NONE",
  "SHADES",
  "SCARF",
  "BOWTIE",
  "MONOCLE",
  "HALO",
  "HEADPHONES",
  "WINGS",
  "MUSTACHE",
  "EARRINGS",
] as const satisfies readonly AccessoryStyle[];

export const PET_STATUSES = [
  "IDLE",
  "EATING",
  "SLEEPING",
  "PLAYING",
  "CLEANING",
  "DEAD",
] as const satisfies readonly PetStatus[];

export const CARE_PACES = [
  "COZY",
  "NORMAL",
  "ACTIVE",
] as const satisfies readonly CarePace[];

export const BACKGROUND_OPTIONS = [
  "BLUE",
  "FOREST",
  "BURGUNDY",
  "CHARCOAL",
  "PLUM",
] as const satisfies readonly BackgroundColor[];

export const SKIN_UNLOCK_LEVELS: Record<SkinColor, number> = {
  "cyber-cyan": 1,
  "neon-pink": 1,
  "gameboy-olive": 1,
  "golden-orange": 2,
  "ocean-blue": 2,
  "slime-green": 3,
  lavender: 3,
  peach: 4,
  "moon-gray": 4,
  "berry-purple": 5,
};

export const HAT_UNLOCK_LEVELS: Record<HatStyle, number> = {
  NONE: 1,
  COWBOY: 1,
  BEANIE: 1,
  CROWN: 2,
  PARTY: 2,
  WIZARD: 3,
  FLOWER: 3,
  BOW: 4,
  TOPHAT: 4,
  CHEF: 5,
  PIRATE: 5,
  SPACE: 6,
};

export const ACCESSORY_UNLOCK_LEVELS: Record<AccessoryStyle, number> = {
  NONE: 1,
  SHADES: 1,
  SCARF: 1,
  BOWTIE: 2,
  MONOCLE: 2,
  HALO: 3,
  HEADPHONES: 3,
  WINGS: 4,
  MUSTACHE: 4,
  EARRINGS: 5,
};

export const LEVEL_REWARDS: Record<number, string> = {
  2: "OCEAN SET",
  3: "MAGIC SET",
  4: "ROYAL SET",
  5: "CHEF + PIRATE SET",
  6: "SPACE HAT",
};

export const BACKGROUND_COLORS: Record<BackgroundColor, string> = {
  BLUE: "#172a33",
  FOREST: "#20342b",
  BURGUNDY: "#3a2229",
  CHARCOAL: "#242a2c",
  PLUM: "#35283a",
};

export const CARE_PACE_INTERVALS: Record<CarePace, number> = {
  COZY: 10000,
  NORMAL: 7500,
  ACTIVE: 5000,
};

export const SAVE_KEY = "style-pet-progress-v1";
