import type {
  Competitor,
  DifficultySetting,
  LeaderboardRunner,
} from "../types";
import { CPU_COMPETITORS } from "../data/race-config";

const CHARACTERS_PER_WORD = 5;

export function pickRandomPassage(passages: readonly string[]): string {
  return passages[Math.floor(Math.random() * passages.length)];
}

export function createCompetitors(settings: DifficultySetting): Competitor[] {
  return CPU_COMPETITORS.map((competitor) => ({
    name: competitor.name,
    wpm: settings[competitor.wpmSetting],
    color: competitor.color,
    progress: 0,
  }));
}

export function calculateProgress(
  charactersTyped: number,
  passageLength: number,
): number {
  if (passageLength === 0) return 0;
  return Math.min(100, (charactersTyped / passageLength) * 100);
}

export function calculateBotProgress(
  wpm: number,
  elapsedSeconds: number,
  passageLength: number,
): number {
  const charactersPerSecond = (wpm * CHARACTERS_PER_WORD) / 60;
  return calculateProgress(elapsedSeconds * charactersPerSecond, passageLength);
}

export function countErrors(typedText: string, passage: string): number {
  let errors = 0;

  for (let index = 0; index < typedText.length; index++) {
    if (typedText[index] !== passage[index]) errors++;
  }

  return errors;
}

export function countCorrectPrefix(typedText: string, passage: string): number {
  let correctCharacters = 0;

  for (let index = 0; index < typedText.length; index++) {
    if (typedText[index] !== passage[index]) break;
    correctCharacters++;
  }

  return correctCharacters;
}

export function calculateWpm(
  correctCharacters: number,
  elapsedSeconds: number,
): number {
  const minutes = elapsedSeconds / 60;
  return minutes > 0
    ? Math.round(correctCharacters / CHARACTERS_PER_WORD / minutes)
    : 0;
}

export function calculateAccuracy(
  totalKeysTyped: number,
  errors: number,
): number {
  if (totalKeysTyped === 0) return 100;
  const correctKeys = totalKeysTyped - errors;
  return Math.max(0, Math.round((correctKeys / totalKeysTyped) * 100));
}

export function buildLeaderboard(
  wpm: number,
  playerProgress: number,
  competitors: Competitor[],
): LeaderboardRunner[] {
  const runners: LeaderboardRunner[] = [
    {
      name: "YOU (PLAYER)",
      wpm,
      isPlayer: true,
      progress: playerProgress,
    },
    ...competitors.map((competitor) => ({
      name: competitor.name,
      wpm: competitor.wpm,
      isPlayer: false,
      progress: competitor.progress,
    })),
  ];

  return runners.sort(
    (first, second) =>
      second.progress - first.progress || second.wpm - first.wpm,
  );
}
