import type { Difficulty, DifficultySetting, RaceRank } from "../types";

export const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"] as const;

export const DIFFICULTY_SETTINGS = {
  easy: {
    name: "ROOKIE",
    bot1Wpm: 35,
    bot2Wpm: 45,
    label: "Easy Competitors",
  },
  medium: {
    name: "PRO",
    bot1Wpm: 55,
    bot2Wpm: 68,
    label: "Medium Competitors",
  },
  hard: {
    name: "CYBER",
    bot1Wpm: 80,
    bot2Wpm: 92,
    label: "Expert Competitors",
  },
} satisfies Record<Difficulty, DifficultySetting>;

export const CPU_COMPETITORS = [
  {
    name: "CPU - VAPOR RUNNER",
    color: "#a855f7",
    wpmSetting: "bot1Wpm",
  },
  {
    name: "CPU - GLITCH CRUISER",
    color: "#ec4899",
    wpmSetting: "bot2Wpm",
  },
] as const satisfies ReadonlyArray<{
  name: string;
  color: string;
  wpmSetting: "bot1Wpm" | "bot2Wpm";
}>;

export const RANK_LABELS = {
  1: "\u{1F947} 1ST PLACE",
  2: "\u{1F948} 2ND PLACE",
  3: "\u{1F949} 3RD PLACE",
} satisfies Record<RaceRank, string>;

export const HIGH_SCORE_STORAGE_KEYS = [
  "typing_racer_high_score",
  "neon_racer_high_score",
] as const;
