import type { DrumKit, KitDefinition, TrackConfig } from "./types";

export const STEPS = 16;

export const BASS_NOTES = [
  "C2",
  "B1",
  "A#1",
  "A1",
  "G#1",
  "G1",
  "F#1",
  "F1",
  "E1",
  "D#1",
  "D1",
  "C#1",
  "C1",
] as const;

export const SYNTH_KIT: KitDefinition = {
  id: "synth",
  name: "Synth Kit",
  folder: null,
  samples: {},
};

const SAMPLE_FILES = {
  kick: "kick.wav",
  snare: "snare.wav",
  hihat: "hi-hat.wav",
  clap: "clap.wav",
  openhat: "open-hat.wav",
  ride: "ride.wav",
  cowbell: "cowbell.wav",
  perc: "perc.wav",
  bass: "808.wav",
};

export const KIT_ORDER = ["808", "edm", "house", "trap"];

export const FALLBACK_KITS: KitDefinition[] = [
  ...["808", "EDM", "House", "Trap"].map((folder) => ({
    id: folder.toLowerCase(),
    name: `${folder} Kit`,
    folder,
    samples: SAMPLE_FILES,
  })),
  SYNTH_KIT,
];

export const PRESET_KITS: Record<string, DrumKit> = {
  default: "808",
  house: "house",
  techno: "edm",
  hiphop: "808",
  trap: "trap",
  fullkit: "edm",
};

export const INITIAL_TRACKS: TrackConfig[] = [
  {
    id: "kick",
    name: "KICK",
    color: "bg-rose-500",
    text: "text-rose-400",
    accent: "#f43f5e",
    glow: "rgba(244,63,94,0.4)",
  },
  {
    id: "snare",
    name: "SNARE",
    color: "bg-sky-500",
    text: "text-sky-400",
    accent: "#38bdf8",
    glow: "rgba(56,189,248,0.4)",
  },
  {
    id: "hihat",
    name: "HIHAT",
    color: "bg-amber-400",
    text: "text-amber-400",
    accent: "#fbbf24",
    glow: "rgba(251,191,36,0.4)",
  },
  {
    id: "clap",
    name: "CLAP",
    color: "bg-violet-500",
    text: "text-violet-400",
    accent: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
  },
];

export const EXTRA_TRACKS: TrackConfig[] = [
  {
    id: "openhat",
    name: "OPEN HAT",
    color: "bg-yellow-300",
    text: "text-yellow-300",
    accent: "#fde047",
    glow: "rgba(253,224,71,0.4)",
  },
  {
    id: "ride",
    name: "RIDE",
    color: "bg-orange-500",
    text: "text-orange-400",
    accent: "#fb923c",
    glow: "rgba(251,146,60,0.4)",
  },
  {
    id: "cowbell",
    name: "COWBELL",
    color: "bg-pink-500",
    text: "text-pink-400",
    accent: "#f472b6",
    glow: "rgba(244,114,182,0.4)",
  },
  {
    id: "perc",
    name: "PERC",
    color: "bg-teal-400",
    text: "text-teal-400",
    accent: "#2dd4bf",
    glow: "rgba(45,212,191,0.4)",
  },
];

export const BASS_MIXER_TRACK: TrackConfig = {
  id: "bass",
  name: "808 BASS",
  color: "bg-indigo-500",
  text: "text-indigo-400",
  accent: "#818cf8",
  glow: "rgba(99,102,241,0.5)",
};

export const ALL_DRUM_TRACKS = [...INITIAL_TRACKS, ...EXTRA_TRACKS];
export const ALL_MIXER_TRACKS = [...ALL_DRUM_TRACKS, BASS_MIXER_TRACK];
export const TRACK_BY_ID = Object.fromEntries(
  ALL_MIXER_TRACKS.map((track) => [track.id, track]),
) as Record<string, TrackConfig>;

export function resolveSampleUrl(
  registry: Record<string, KitDefinition>,
  kitId: DrumKit,
  trackId: string,
) {
  const kit = registry[kitId];
  const file = kit?.samples[trackId];
  if (!kit?.folder || !file) return null;
  return `/beat-maker/${encodeURIComponent(kit.folder)}/${encodeURIComponent(file)}`;
}
