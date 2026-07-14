"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { DIFFICULTY_SETTINGS } from "../data/race-config";
import { PASSAGES } from "../data/passages";
import type { Competitor, Difficulty, GameState, RaceRank } from "../types";
import {
  buildLeaderboard,
  calculateAccuracy,
  calculateBotProgress,
  calculateProgress,
  calculateWpm,
  countCorrectPrefix,
  countErrors,
  createCompetitors,
  pickRandomPassage,
} from "../utils/race";
import { audio } from "../utils/audio";
import { useHighScore } from "./use-high-score";

export function useRace() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [passage, setPassage] = useState("");
  const [typedText, setTypedText] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [totalKeysTyped, setTotalKeysTyped] = useState(0);
  const [errors, setErrors] = useState(0);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const gameLoopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const { highScore, saveHighScore } = useHighScore();

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  }, []);

  const clearGameLoop = useCallback(() => {
    if (gameLoopIntervalRef.current) {
      clearInterval(gameLoopIntervalRef.current);
    }
  }, []);

  const setupGame = useCallback(() => {
    setPassage(pickRandomPassage(PASSAGES));
    setTypedText("");
    setWpm(0);
    setTotalKeysTyped(0);
    setErrors(0);
    setStartTime(null);
    setTimeElapsed(0);
    setCompetitors(createCompetitors(DIFFICULTY_SETTINGS[difficulty]));
    setCountdown(3);
    setGameState("countdown");
    clearCountdown();
    clearGameLoop();
  }, [clearCountdown, clearGameLoop, difficulty]);

  useEffect(() => {
    if (gameState !== "countdown") return;

    audio.playBeep(440, 0.1);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          clearCountdown();
          setGameState("playing");
          setStartTime(Date.now());
          setTimeout(() => inputRef.current?.focus(), 20);
          audio.playBeep(880, 0.3);
          return 0;
        }

        audio.playBeep(440, 0.1);
        return previous - 1;
      });
    }, 1000);

    return clearCountdown;
  }, [clearCountdown, gameState]);

  useEffect(() => {
    if (gameState !== "playing" || !startTime) return;

    gameLoopIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setTimeElapsed(elapsed);
      setCompetitors((currentCompetitors) =>
        currentCompetitors.map((competitor) => ({
          ...competitor,
          progress: calculateBotProgress(
            competitor.wpm,
            elapsed,
            passage.length,
          ),
        })),
      );
    }, 100);

    return clearGameLoop;
  }, [clearGameLoop, gameState, passage.length, startTime]);

  const finishRace = useCallback(
    (textValue: string) => {
      if (textValue !== passage) return;

      setGameState("finished");
      clearGameLoop();

      const elapsed = startTime ? (Date.now() - startTime) / 1000 : 1;
      const finalWpm = calculateWpm(passage.length, elapsed);
      setWpm(finalWpm);
      saveHighScore(finalWpm);
    },
    [clearGameLoop, passage, saveHighScore, startTime],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (gameState !== "playing") return;

      const value = event.target.value;

      if (value.length > typedText.length) {
        setTotalKeysTyped(
          (currentTotal) => currentTotal + (value.length - typedText.length),
        );
      }

      setTypedText(value);
      setErrors(countErrors(value, passage));

      const elapsed = startTime ? (Date.now() - startTime) / 1000 : 1;
      setWpm(calculateWpm(countCorrectPrefix(value, passage), elapsed));
      finishRace(value);
    },
    [finishRace, gameState, passage, startTime, typedText.length],
  );

  const playerProgress = calculateProgress(typedText.length, passage.length);
  const accuracy = calculateAccuracy(totalKeysTyped, errors);
  const leaderboard = useMemo(
    () => buildLeaderboard(wpm, playerProgress, competitors),
    [competitors, playerProgress, wpm],
  );
  const currentRank = (leaderboard.findIndex((runner) => runner.isPlayer) +
    1) as RaceRank;

  const returnToMenu = useCallback(() => setGameState("menu"), []);

  return {
    gameState,
    difficulty,
    setDifficulty,
    passage,
    typedText,
    countdown,
    timeElapsed,
    wpm,
    errors,
    competitors,
    highScore,
    inputRef,
    playerProgress,
    accuracy,
    leaderboard,
    currentRank,
    setupGame,
    handleInputChange,
    returnToMenu,
  };
}
