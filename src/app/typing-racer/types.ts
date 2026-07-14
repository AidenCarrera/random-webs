export type GameState = "menu" | "countdown" | "playing" | "finished";

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultySetting {
  name: string;
  bot1Wpm: number;
  bot2Wpm: number;
  label: string;
}

export interface Competitor {
  name: string;
  wpm: number;
  color: string;
  progress: number;
}

export interface LeaderboardRunner {
  name: string;
  wpm: number;
  isPlayer: boolean;
  progress: number;
}

export type RaceRank = 1 | 2 | 3;
