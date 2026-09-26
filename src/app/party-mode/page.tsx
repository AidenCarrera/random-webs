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

const BUNTING_COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#22c55e", "#ffffff"];
const PENNANTS = Array.from({ length: 22 }, (_, index) => ({
  color: BUNTING_COLORS[index % BUNTING_COLORS.length],
  // Pennants sag along a shallow curve toward the middle of the string.
  drop: Math.round(Math.sin((index / 21) * Math.PI) * 28),
}));
const TITLE = "PARTY MODE";

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export default function PartyMode() {
  const [isPartying, setIsPartying] = useState(false);
  const resetTimeoutRef = useRef<number>(null);
  const confettiIntervalsRef = useRef(new Set<number>());
  const musicRef = useRef<HTMLAudioElement>(null);

  // The music plays for exactly as long as the party does.
  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;

    if (isPartying) {
      music.play().catch(() => {});
    } else {
      music.pause();
      music.currentTime = 0;
    }
  }, [isPartying]);

  useEffect(() => {
    const intervals = confettiIntervalsRef.current;
    const music = musicRef.current;

    return () => {
      music?.pause();
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
      className={`${styles.root} relative min-h-screen bg-linear-to-t from-yellow-300 to-orange-400 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${
        isPartying ? "animate-party-bg" : ""
      }`}
    >
      <audio
        ref={musicRef}
        src="/party-mode/party-music.mp3"
        loop
        preload="auto"
      />
      <div aria-hidden="true" className={styles.sunburst} />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-20 pointer-events-none" />

      <div aria-hidden="true" className={styles.bunting}>
        <svg
          className={styles.buntingString}
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0 Q50 12 100 0"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.35"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {PENNANTS.map((pennant, index) => (
          <span
            key={index}
            className={styles.pennant}
            data-partying={isPartying || undefined}
            style={
              {
                "--pennant": pennant.color,
                "--drop": `${pennant.drop}px`,
                animationDelay: `${(index % 7) * -0.35}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {isPartying && (
        <div aria-hidden="true" className={styles.lights}>
          <span />
          <span />
          <span />
        </div>
      )}

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
        className={`${styles.title} relative z-20 px-4 text-[clamp(2.75rem,13vw,3.5rem)] sm:text-6xl md:text-8xl leading-none tracking-tight font-black text-center text-white mb-8 sm:mb-12 origin-center transition-all duration-300 ${
          isPartying ? "animate-dance scale-105 sm:scale-110" : ""
        }`}
      >
        {TITLE.split("").map((letter, index) => (
          <span
            key={index}
            className={styles.letter}
            data-partying={isPartying || undefined}
            style={{ animationDelay: `${index * 0.07}s` }}
          >
            {letter === " " ? "\u00a0" : letter}
          </span>
        ))}
      </h1>

      <button
        onClick={celebrate}
        className={`${styles.celebrate} relative z-20 inline-flex items-center justify-center rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-200`}
      >
        <span className={styles.celebrateFace}>CELEBRATE</span>
      </button>

      <p className="relative z-20 mt-8 text-white font-bold opacity-90 drop-shadow-[0_2px_6px_rgba(194,65,12,0.45)] motion-safe:animate-bounce">
        Click for a party!
      </p>
    </main>
  );
}
