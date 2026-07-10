export type BassNote = {
  id: number;
  pitchIndex: number;
  start: number;
  length: number;
};

export type KitDefinition = {
  id: string;
  name: string;
  folder: string | null;
  samples: Record<string, string>;
};

export type DrumKit = string;

export type TrackConfig = {
  id: string;
  name: string;
  color: string;
  text: string;
  accent: string;
  glow: string;
};
