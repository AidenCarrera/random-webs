export type PetStatus =
  "IDLE" | "EATING" | "SLEEPING" | "PLAYING" | "CLEANING" | "DEAD";

export type SkinColor =
  | "cyber-cyan"
  | "neon-pink"
  | "gameboy-olive"
  | "golden-orange"
  | "ocean-blue"
  | "slime-green"
  | "lavender"
  | "peach"
  | "moon-gray"
  | "berry-purple";

export type HatStyle =
  | "NONE"
  | "COWBOY"
  | "BEANIE"
  | "CROWN"
  | "PARTY"
  | "WIZARD"
  | "FLOWER"
  | "BOW"
  | "TOPHAT"
  | "CHEF"
  | "PIRATE"
  | "SPACE";

export type AccessoryStyle =
  | "NONE"
  | "SHADES"
  | "SCARF"
  | "BOWTIE"
  | "MONOCLE"
  | "HALO"
  | "HEADPHONES"
  | "WINGS"
  | "MUSTACHE"
  | "EARRINGS";

export type CarePace = "COZY" | "NORMAL" | "ACTIVE";
export type BackgroundColor =
  "BLUE" | "FOREST" | "BURGUNDY" | "CHARCOAL" | "PLUM";
export type Menu = "NONE" | "STYLE" | "SETTINGS";

export type PetNeeds = {
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
};

export type SavedProgress = PetNeeds & {
  version: 1;
  level: number;
  exp: number;
  status: PetStatus;
  skin: SkinColor;
  hat: HatStyle;
  accessory: AccessoryStyle;
  isMuted: boolean;
  petName: string;
  carePace: CarePace;
  backgroundColor: BackgroundColor;
};

export type SleepBubble = { id: number; x: number; y: number };
export type ScreenMessage = { id: number; text: string };
