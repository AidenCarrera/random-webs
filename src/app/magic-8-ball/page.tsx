"use client";

import { useState, useRef } from "react";
import { RefreshCw } from "lucide-react";

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
    <div
      className="min-h-screen bg-[#07070a] text-[#b4b4b8] flex flex-col items-center justify-center p-4 relative overflow-hidden font-serif select-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, #111116 0%, #030305 100%)",
      }}
    >
      <div className="max-w-md w-full flex flex-col items-center z-10 text-center gap-8">
        <header className="flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-[0.2em] text-stone-100 uppercase font-serif">
            Magic Eight Ball
          </h1>
        </header>

        <div className="relative py-2 flex items-center justify-center">
          <div
            onClick={() => askBall()}
            className={`w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden flex items-center justify-center cursor-pointer select-none relative transition-all duration-300 shadow-[0_35px_65px_-15px_rgba(0,0,0,0.95),inset_0_-10px_25px_rgba(0,0,0,0.9)] active:scale-95 border border-stone-800/50 ${
              isShaking ? "animate-shake" : ""
            }`}
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0) 38%), radial-gradient(circle at 35% 35%, #2a2a2e 0%, #0e0e11 35%, #020203 100%)",
            }}
          >
            {ballMode === "default" ? (
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-stone-100 flex items-center justify-center shadow-[inset_0_-8px_16px_rgba(0,0,0,0.15),0_6px_15px_rgba(0,0,0,0.5)] border border-stone-300">
                <span className="text-stone-950 font-sans text-7xl md:text-8xl font-black tracking-tighter">
                  8
                </span>
              </div>
            ) : (
              <div
                className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden flex items-center justify-center relative shadow-[inset_0_12px_24px_rgba(0,0,0,0.95)]"
                style={{
                  background:
                    "radial-gradient(circle, #081223 0%, #020408 100%)",
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
            className="w-full max-w-xs md:max-w-sm flex items-center gap-2 border-b border-stone-700/80 pb-2 focus-within:border-amber-700/80 transition-all"
          >
            <input
              type="text"
              placeholder="Consult the sphere..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isShaking}
              className="w-full bg-transparent text-stone-150 placeholder-stone-600 focus:outline-none font-serif text-sm italic py-1 disabled:opacity-50 text-center"
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
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-amber-500 transition-all border border-stone-800/80 rounded-sm px-4 py-2 bg-stone-950/40 hover:border-amber-900/30"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset Sphere
            </button>
          )}
        </div>
      </div>
    </div>
  );
}