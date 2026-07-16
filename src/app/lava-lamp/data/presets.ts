import type { Preset, PresetId } from "../types";

export const PRESETS: Record<PresetId, Preset> = {
  ember: {
    name: "Ember",
    background: ["#3a1924", "#160d16"],
    glass: "#5f2730",
    glow: "#ff6b48",
    lava: ["#ffd08a", "#ff6848", "#b91f42"],
    blobCount: 9,
    buoyancy: 0.34,
    viscosity: 0.978,
    drift: 0.04,
  },
  lagoon: {
    name: "Lagoon",
    background: ["#103b48", "#07151c"],
    glass: "#17454f",
    glow: "#38d8c7",
    lava: ["#c8fff1", "#42dfc2", "#14799a"],
    blobCount: 10,
    buoyancy: 0.29,
    viscosity: 0.982,
    drift: 0.035,
  },
  orchid: {
    name: "Orchid",
    background: ["#321844", "#140d20"],
    glass: "#4b295d",
    glow: "#d884ff",
    lava: ["#f4d5ff", "#c77cff", "#7137b8"],
    blobCount: 8,
    buoyancy: 0.26,
    viscosity: 0.984,
    drift: 0.032,
  },
  honey: {
    name: "Honey",
    background: ["#463015", "#1c140b"],
    glass: "#6a4a1d",
    glow: "#ffc857",
    lava: ["#fff3b7", "#ffc54f", "#d56d20"],
    blobCount: 11,
    buoyancy: 0.31,
    viscosity: 0.976,
    drift: 0.045,
  },
};

export const PRESET_IDS = Object.keys(PRESETS) as PresetId[];
export const DEFAULT_PRESET_ID: PresetId = "ember";
