"use client";

import { useState, useRef } from "react";
import { RefreshCw } from "lucide-react";

import styles from "./styles.module.css";

const ANSWERS = [
  // Affirmative
  "It is\ncertain.",
  "It is\ndecidedly\nso.",
  "Without\na doubt.",
  "Yes,\ndefinitely.",
  "You may\nrely on it.",
  "As I see\nit, yes.",
  "Most\nlikely.",
  "Outlook\ngood.",
  "Yes.",
  "Signs\npoint to\nyes.",

  // Non-committal
  "Reply hazy,\ntry again.",
  "Ask again\nlater.",
  "Better not\ntell you\nnow.",
  "Cannot\npredict\nnow.",
  "Concentrate\nand ask\nagain.",

  // Negative
  "Don't\ncount on it.",
  "My reply\nis no.",
  "My sources\nsay no.",
  "Outlook\nnot so\ngood.",
  "Very\ndoubtful.",
];

// Deterministic dust motes drifting through the spotlight.
const MOTES = Array.from({ length: 22 }, (_, index) => ({
  left: (index * 37) % 100,
  size: 1 + (index % 3),
  delay: -((index * 1.7) % 12),
  duration: 10 + (index % 5) * 2.5,
}));

export default function MagicEightBall() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [ballMode, setBallMode] = useState<"default" | "answer">("default");

  const formRef = useRef<HTMLFormElement>(null);

  const askBall = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isShaking) return;

    setIsShaking(true);
    setShowAnswer(false);

    const randomAnswer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

    setTimeout(() => {
      setAnswer(randomAnswer);
      setBallMode("answer");
      setIsShaking(false);

      setTimeout(() => {
        setShowAnswer(true);
      }, 50);
    }, 600);
  };

  const resetBall = () => {
    if (isShaking) return;

    setQuestion("");
    setAnswer("");
    setBallMode("default");
    setShowAnswer(false);
  };

  return (
    <main
      className={`${styles.root} min-h-screen bg-[#07070a] text-[#b4b4b8] flex flex-col items-center justify-center px-4 pt-4 pb-14 relative overflow-hidden font-serif select-none`}
      style={{
        backgroundImage:
          "radial-gradient(circle at center, #111116 0%, #030305 100%)",
      }}
    >
      <div aria-hidden="true" className={styles.spotlight} />
      <div aria-hidden="true" className={styles.motes}>
        {MOTES.map((mote, index) => (
          <span
            key={index}
            style={{
              left: `${mote.left}%`,
              width: mote.size,
              height: mote.size,
              animationDelay: `${mote.delay}s`,
              animationDuration: `${mote.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full flex flex-col items-center z-10 text-center gap-8">
        <header className="flex flex-col items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-[0.2em] text-stone-100 uppercase font-serif drop-shadow-[0_2px_24px_rgba(255,255,255,0.12)]">
            Magic Eight Ball
          </h1>
        </header>

        <div className="relative py-2 flex items-center justify-center">
          <div
            aria-hidden="true"
            className={`${styles.floorShadow} ${isShaking ? styles.floorShadowShake : ""}`}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label="Shake the Magic Eight Ball"
            onClick={() => askBall()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                askBall();
              }
            }}
            className={`w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden flex items-center justify-center cursor-pointer select-none relative transition-[box-shadow] duration-300 shadow-[0_35px_65px_-15px_rgba(0,0,0,0.95),inset_0_-10px_25px_rgba(0,0,0,0.9)] active:scale-95 border border-stone-800/50 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#07070a] ${
              isShaking ? "animate-shake" : ""
            }`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, #2c2c31 0%, #0e0e11 38%, #020203 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse 30% 20% at 32% 24%, rgba(255,255,255,0.32), rgba(255,255,255,0.05) 60%, transparent 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 rounded-full shadow-[inset_0_-18px_40px_rgba(0,0,0,0.9),inset_0_2px_0_rgba(255,255,255,0.08),inset_-8px_-8px_30px_rgba(120,120,160,0.08)]"
            />
            {ballMode === "default" ? (
              <div className="relative z-10 w-36 h-36 md:w-44 md:h-44 rounded-full bg-[radial-gradient(circle_at_40%_35%,#ffffff_0%,#f1efe9_45%,#d6d3cb_100%)] flex items-center justify-center shadow-[inset_0_-8px_16px_rgba(0,0,0,0.15),0_6px_15px_rgba(0,0,0,0.5)] border border-stone-300">
                <span className="text-stone-950 font-sans text-7xl md:text-8xl font-black">
                  8
                </span>
              </div>
            ) : (
              <div
                className="z-10 w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden flex items-center justify-center relative shadow-[inset_0_12px_24px_rgba(0,0,0,0.95),0_0_40px_rgba(37,99,235,0.18)]"
                style={{
                  background:
                    "radial-gradient(circle, #0b1830 0%, #020408 100%)",
                  border: "4px solid #0f141e",
                }}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-1800 ease-out ${
                    showAnswer
                      ? "opacity-100 scale-100 translate-y-0 filter blur-0"
                      : "opacity-0 scale-75 translate-y-8 filter blur-[3px]"
                  }`}
                >
                  <div className="relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center">
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 w-full h-full drop-shadow-[0_0_12px_rgba(37,99,235,0.65)]"
                    >
                      <polygon
                        points="50,88 12,22 88,22"
                        fill="#172554"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                      />
                    </svg>

                    <div className="absolute top-[16%] left-[16%] right-[16%] bottom-[34%] flex items-center justify-center text-center">
                      <span className="text-[7.5px] md:text-[8.5px] font-bold text-blue-200 uppercase tracking-wide leading-snug font-serif select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] whitespace-pre-line">
                        {answer}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-6">
          <form
            ref={formRef}
            onSubmit={askBall}
            className={`${styles.questionForm} relative w-full max-w-xs md:max-w-sm flex items-center gap-2 border-b border-stone-700/80 pb-2 transition-all`}
          >
            <input
              type="text"
              placeholder="Consult the sphere..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isShaking}
              aria-label="Your question"
              className="w-full bg-transparent text-stone-200 placeholder-stone-600 focus:outline-none font-serif text-sm italic py-1 disabled:opacity-50 text-center"
            />

            <button
              type="submit"
              disabled={isShaking}
              className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/80 hover:text-amber-400 disabled:opacity-50 active:scale-95 shrink-0 px-2 py-1 transition-all"
            >
              Shake
            </button>
          </form>

          {ballMode === "answer" && !isShaking && (
            <button
              onClick={resetBall}
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-amber-500 transition-all border border-stone-800/80 rounded-sm px-4 py-2 bg-stone-950/40 hover:border-amber-900/40 active:scale-95"
            >
              <RefreshCw className="w-2.5 h-2.5 transition-transform duration-500 group-hover:-rotate-180" />
              Reset Sphere
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
