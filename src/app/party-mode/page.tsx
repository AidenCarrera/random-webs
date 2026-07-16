"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import styles from "./styles.module.css";

const PARTY_DURATION = 5_000;
const PARTY_RESET_DELAY = 5_500;
const PARTY_EMOJIS = ["🎈", "🎉", "🥳", "✨", "🎁", "🍰", "🍾", "🥂"];

const FLOATING_EMOJIS = Array.from({ length: 28 }, (_, index) => ({
  emoji: PARTY_EMOJIS[index % PARTY_EMOJIS.length],
  style: {
    left: `${((index * 37) % 94) + 3}%`,
    animationDelay: `${index * 0.12}s`,
    animationDuration: `${3.6 + (index % 3) * 0.9}s`,
    fontSize: `${32 + (index % 4) * 12}px`,
  },
}));

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export default function PartyMode() {
  const [isPartying, setIsPartying] = useState(false);
  const resetTimeoutRef = useRef<number>(null);
  const confettiIntervalsRef = useRef(new Set<number>());

  useEffect(() => {
    const intervals = confettiIntervalsRef.current;

    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      intervals.forEach(clearInterval);
    };
  }, []);

  const celebrate = () => {
    setIsPartying(true);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = window.setTimeout(
      () => setIsPartying(false),
      PARTY_RESET_DELAY,
    );

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    const animationEnd = Date.now() + PARTY_DURATION;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        confettiIntervalsRef.current.delete(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / PARTY_DURATION);
      [0.1, 0.7].forEach((minX) => {
        confetti({
          ...defaults,
          particleCount,
          origin: {
            x: randomInRange(minX, minX + 0.2),
            y: Math.random() - 0.2,
          },
        });
      });
    }, 250);

    confettiIntervalsRef.current.add(interval);
  };

  return (
    <main
      className={`${styles.root} min-h-screen bg-linear-to-t from-yellow-300 to-orange-400 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${
        isPartying ? "animate-party-bg" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-20 pointer-events-none" />

      {isPartying && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {FLOATING_EMOJIS.map(({ emoji, style }, index) => (
            <div
              key={index}
              className="absolute bottom-0 translate-y-full animate-float-up"
              style={style}
            >
              {emoji}
            </div>
          ))}
        </div>
      )}

      <h1
        className={`px-4 text-[clamp(2.75rem,13vw,3.5rem)] sm:text-6xl md:text-8xl leading-none tracking-tight font-black text-center text-white drop-shadow-md mb-8 sm:mb-12 origin-center transition-all duration-300 ${
          isPartying ? "animate-dance scale-105 sm:scale-110" : ""
        }`}
      >
        PARTY MODE
      </h1>

      <button
        onClick={celebrate}
        className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden rounded-lg bg-linear-to-br from-pink-500 to-orange-400 focus:ring-4 focus:outline-none focus:ring-pink-200"
      >
        <span className="flex px-12 py-6 bg-white rounded-md text-2xl font-bold uppercase text-orange-500">
          CELEBRATE
        </span>
      </button>

      <p className="mt-8 text-white font-bold opacity-80 animate-bounce">
        Click for a party!
      </p>
    </main>
  );
}
