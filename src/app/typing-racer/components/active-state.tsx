import type { ChangeEvent, RefObject } from "react";

import type {
  Competitor,
  GameState,
  LeaderboardRunner,
  RaceRank,
} from "../types";
import { StatsPanel } from "./stats-panel";
import { Results } from "./results";
import { Racetrack } from "./racetrack";
import { InputPanel } from "./input-panel";

interface ActiveStateProps {
  gameState: Extract<GameState, "playing" | "finished">;
  passage: string;
  typedText: string;
  errors: number;
  wpm: number;
  accuracy: number;
  timeElapsed: number;
  competitors: Competitor[];
  playerProgress: number;
  currentRank: RaceRank;
  leaderboard: LeaderboardRunner[];
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRaceAgain: () => void;
  onReturnToMenu: () => void;
}

export function ActiveState({
  gameState,
  passage,
  typedText,
  errors,
  wpm,
  accuracy,
  timeElapsed,
  competitors,
  playerProgress,
  currentRank,
  leaderboard,
  inputRef,
  onInputChange,
  onRaceAgain,
  onReturnToMenu,
}: ActiveStateProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <Racetrack
        gameState={gameState}
        competitors={competitors}
        playerProgress={playerProgress}
        currentRank={currentRank}
      />

      {gameState === "playing" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <InputPanel
            passage={passage}
            typedText={typedText}
            errors={errors}
            inputRef={inputRef}
            onInputChange={onInputChange}
          />
          <StatsPanel wpm={wpm} accuracy={accuracy} timeElapsed={timeElapsed} />
        </div>
      )}

      {gameState === "finished" && (
        <Results
          wpm={wpm}
          accuracy={accuracy}
          timeElapsed={timeElapsed}
          errors={errors}
          currentRank={currentRank}
          leaderboard={leaderboard}
          onRaceAgain={onRaceAgain}
          onReturnToMenu={onReturnToMenu}
        />
      )}
    </div>
  );
}
