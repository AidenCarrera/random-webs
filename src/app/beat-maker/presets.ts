export type BeatPreset = {
  name: string;
  swing: number;
  tempo: number;
  bass: { pitch: string; start: number; length: number }[];
  grid: number[][];
};

export const PRESETS: Record<string, BeatPreset> = {
  default: {
    name: "Default",
    swing: 50,
    tempo: 120,
    bass: [],
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Kick
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Snare
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // HiHat
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Clap
    ],
  },
  house: {
    name: "House",
    swing: 58,
    tempo: 120,
    bass: [
      { pitch: "E1", start: 2, length: 2 },
      { pitch: "E1", start: 6, length: 2 },
      { pitch: "E1", start: 10, length: 2 },
      { pitch: "E1", start: 14, length: 2 },
    ],
    grid: [
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Snare
      [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], // HiHat
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], // Clap
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // Open Hat
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Ride
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Cowbell
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Perc
    ],
  },
  techno: {
    name: "Techno",
    swing: 50,
    tempo: 124,
    bass: [
      { pitch: "C1", start: 0, length: 2 },
      { pitch: "C1", start: 4, length: 2 },
      { pitch: "G1", start: 7, length: 1 },
      { pitch: "C2", start: 8, length: 3 },
      { pitch: "G1", start: 11, length: 1 },
      { pitch: "C1", start: 12, length: 2 },
      { pitch: "E1", start: 14, length: 1 },
      { pitch: "E1", start: 15, length: 1 },
    ],
    grid: [
      [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0], // Kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Snare
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], // HiHat
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Clap
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // Open Hat
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Ride
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], // Cowbell
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Perc
    ],
  },
  hiphop: {
    name: "Hip Hop",
    swing: 60,
    tempo: 95,
    bass: [
      { pitch: "D#1", start: 0, length: 2 },
      { pitch: "D#1", start: 4, length: 2 },
      { pitch: "D#1", start: 7, length: 1 },
      { pitch: "D#1", start: 8, length: 2 },
      { pitch: "D#1", start: 10, length: 1 },
      { pitch: "F1", start: 12, length: 1 },
      { pitch: "F#1", start: 14, length: 1 },
    ],
    grid: [
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], // Kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Snare
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0], // HiHat
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Clap
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // Open Hat
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Ride
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Cowbell
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Perc
    ],
  },
  trap: {
    name: "Trap",
    swing: 50,
    tempo: 100,
    bass: [
      { pitch: "D1", start: 0, length: 4 },
      { pitch: "A1", start: 7, length: 2 },
      { pitch: "A#1", start: 10, length: 4 },
      { pitch: "F1", start: 14, length: 2 },
    ],
    grid: [
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0], // Kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Snare
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1], // HiHat
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Clap
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Open Hat
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Ride
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Cowbell
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // Perc
    ],
  },
  fullkit: {
    name: "Full Kit",
    swing: 56,
    tempo: 128,
    bass: [
      { pitch: "E1", start: 0, length: 3 },
      { pitch: "E1", start: 4, length: 3 },
      { pitch: "G1", start: 8, length: 3 },
      { pitch: "D1", start: 12, length: 4 },
    ],
    grid: [
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Kick
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1], // Snare
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], // HiHat
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Clap
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // Open Hat
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Ride
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Cowbell
      [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1], // Perc
    ],
  },
};
