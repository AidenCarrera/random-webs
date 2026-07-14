"use client";

import { useRace } from "../hooks/use-race";
import styles from "../styles.module.css";
import { ActiveState } from "./active-state";
import { CountdownPanel } from "./countdown-panel";
import { Header } from "./header";
import { Menu } from "./menu";

export function TypingRacerMain() {
  const race = useRace();

  return (
    <div
      className={`${styles.root} min-h-[100dvh] bg-[#0d071c] text-white flex flex-col justify-center overflow-hidden relative select-none font-mono`}
    >
      <div className="absolute inset-0 bg-size-[50px_50px] bg-[linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] z-0 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.4)_100%)] opacity-60" />

      <div className="z-10 max-w-5xl w-full mx-auto p-6 flex flex-col gap-6">
        <Header highScore={race.highScore} />

        {race.gameState === "menu" && (
          <Menu
            difficulty={race.difficulty}
            onDifficultyChange={race.setDifficulty}
            onStart={race.setupGame}
          />
        )}

        {race.gameState === "countdown" && (
          <CountdownPanel countdown={race.countdown} />
        )}

        {(race.gameState === "playing" || race.gameState === "finished") && (
          <ActiveState
            gameState={race.gameState}
            passage={race.passage}
            typedText={race.typedText}
            errors={race.errors}
            wpm={race.wpm}
            accuracy={race.accuracy}
            timeElapsed={race.timeElapsed}
            competitors={race.competitors}
            playerProgress={race.playerProgress}
            currentRank={race.currentRank}
            leaderboard={race.leaderboard}
            inputRef={race.inputRef}
            onInputChange={race.handleInputChange}
            onRaceAgain={race.setupGame}
            onReturnToMenu={race.returnToMenu}
          />
        )}
      </div>
    </div>
  );
}
