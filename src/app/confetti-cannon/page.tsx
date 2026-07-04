"use client";

import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";

export default function ConfettiCannon() {
  const [isPartying, setIsPartying] = useState(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fireConfetti = () => {
    setIsPartying(true);

    // Reset party state after confetti ends, extending if user clicks again
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    
    resetTimeoutRef.current = setTimeout(() => {
      setIsPartying(false);
    }, 5500);

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const bigBang = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className={`min-h-screen bg-linear-to-t from-yellow-300 to-orange-400 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${
      isPartying ? "animate-party-bg" : ""
    }`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-20 pointer-events-none" />

      {/* Floating Party Emojis */}
      {isPartying && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {Array.from({ length: 15 }).map((_, i) => {
            const emojis = ["🎈", "🎉", "🥳", "✨", "🎁", "🍰", "🍾", "🥂"];
            const left = (i * 7) + 5; // Spaced evenly across screen
            const delay = (i * 0.45) + "s";
            const duration = (4.5 + (i % 3) * 1.2) + "s";
            const emoji = emojis[i % emojis.length];
            const size = (32 + (i % 4) * 12) + "px";
            return (
              <div
                key={i}
                className="absolute bottom-0 translate-y-full animate-float-up pointer-events-none"
                style={{
                  left: `${left}%`,
                  animationDelay: delay,
                  animationDuration: duration,
                  fontSize: size,
                }}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      )}

      <h1
        className={`text-4xl md:text-6xl font-black text-center text-white drop-shadow-md mb-12 origin-center transition-all duration-300 ${
          isPartying ? "animate-dance scale-110" : ""
        }`}
      >
        PARTY MODE
      </h1>

      <button
        onClick={() => {
          bigBang();
          fireConfetti();
        }}
        className="group relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium rounded-lg group bg-linear-to-br from-pink-500 to-orange-400 hover:text-white focus:ring-4 focus:outline-none focus:ring-pink-200"
      >
        <span className="relative flex items-center gap-4 px-12 py-6 transition-all ease-in duration-75 bg-white rounded-md text-2xl font-bold uppercase text-orange-500">
          <Sparkles className="w-8 h-8 animate-spin-slow" />
          CELEBRATE
        </span>
      </button>

      <p className="mt-8 text-white font-bold opacity-80 animate-bounce">
        Click for a party!
      </p>
    </div>
  );
}
