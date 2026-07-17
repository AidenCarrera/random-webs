export enum Material {
  EMPTY = 0,
  SAND = 1,
  WATER = 2,
  FIRE = 3,
  LAVA = 4,
  PLANT = 5,
  ACID = 6,
  STONE = 7,
  WOOD = 8,
  OIL = 9,
  SALT = 10,
  GUNPOWDER = 11,
  ICE = 12,
  SMOKE = 13,
  STEAM = 14,
  DIRT = 15,
  MUD = 16,
  COAL = 17,
  METAL = 18,
  GLASS = 19,
  SNOW = 20,
  METHANE = 21,
  TNT = 22,
  NITRO = 23,
  C4 = 24,
  FUSE = 25,
  SEED = 26,
  FLOWER = 27,
  SPROUT = 28,
}

export const MATERIAL_COUNT = Material.SPROUT + 1;

export type MaterialDefinition = {
  id: Material;
  name: string;
  color: string;
  description: string;
  shortcut: string;
};

export type SandWorldStats = {
  cells: number;
  active: number;
  fps: number;
  materialCounts: number[];
};

export type SerializedWorld = {
  version: 1;
  width: number;
  height: number;
  cells: string;
  life: string;
  shade: string;
};

export type FallingSandSnapshot = {
  blob: Blob;
  fileName: string;
  imageSrc: string;
};

export type FallingSandCanvasHandle = {
  clear: () => void;
  load: (serialized: string) => void;
  reset: () => void;
  serialize: () => string;
  snapshot: () => Promise<FallingSandSnapshot>;
};

export type PanelTab = "elements" | "settings" | "statistics";

export type ToastState = {
  message: string;
  tone: "success" | "error";
};
