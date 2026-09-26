// src/app/page.tsx
"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import localFont from "next/font/local";
import { useTelegraph } from "./hooks/useTelegraph";
import { CheatSheet } from "./components/CheatSheet";
import { SignalTrace } from "./components/SignalTrace";
import styles from "./styles.module.css";

const courierPrime = localFont({
  src: [
    {
      path: "../../../public/fonts/courier-prime-400-normal-latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/courier-prime-400-italic-latin.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../../public/fonts/courier-prime-700-normal-latin.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../public/fonts/courier-prime-700-italic-latin.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
});

export default function MorseTelegraph() {
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const {
    input,
    setInput,
    encoded,
    isTransmitting,
    lightOn,
    transmit,
    stopTransmission,
    manualTapStart,
    manualTapEnd,
  } = useTelegraph();

  return (
    <main
      className={`${styles.room} min-h-screen text-[#d4b483] ${courierPrime.className} relative flex flex-col items-center justify-center gap-8 p-4 lg:flex-row lg:items-start lg:p-12`}
    >
      <div
        className={`${styles.casing} relative flex w-full max-w-3xl flex-col gap-8 overflow-hidden rounded-xl p-6 sm:p-8`}
      >
        {/* Screw Details */}
        {[
          "left-2.5 top-2.5 rotate-45",
          "right-2.5 top-2.5 -rotate-12",
          "bottom-2.5 left-2.5 rotate-90",
          "bottom-2.5 right-2.5 rotate-180",
        ].map((position) => (
          <div
            key={position}
            aria-hidden="true"
            className={`${styles.screw} absolute ${position}`}
          />
        ))}

        <div className="text-center border-b-2 border-[#8b5a2b]/30 pb-4">
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-widest text-[#c0a080] drop-shadow-[2px_2px_0px_#000]">
            Telegraph
          </h1>
          <p className="text-sm opacity-50 mt-2 italic">
            Morse Transmission Unit
          </p>
        </div>

        {/* Display Panel */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="telegraph-input"
                className="text-sm font-bold uppercase tracking-wider text-[#c08a4b]"
              >
                Input Message
              </label>
              {input && (
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="cursor-pointer rounded border-b-2 border-[#4a0000] bg-[#8b0000] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-red-700 active:translate-y-0.5 active:border-b-0"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              id="telegraph-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="TYPE MESSAGE HERE..."
              className={`${styles.telegram} min-h-37.5 flex-1 resize-none border-4 border-[#8b5a2b] p-4 text-xl font-bold uppercase text-[#2a2320] placeholder-[#2a2320]/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] transition-shadow focus:shadow-[inset_0_0_20px_rgba(0,0,0,0.2),0_0_0_3px_rgba(255,174,0,0.35)] focus:outline-none`}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold uppercase tracking-wider text-[#c08a4b]">
              Encoded Signal
            </label>
            <div
              className={`${styles.phosphor} min-h-37.5 w-full flex-1 overflow-y-auto break-all border-4 border-[#3e3228] p-4 font-bold leading-loose tracking-widest ${encoded ? "text-2xl text-[#ff9d1a]" : "text-xl text-[#ff8c00]/30"}`}
              data-empty={!encoded || undefined}
              aria-live="polite"
            >
              {encoded || "AWAITING INPUT..."}
            </div>
          </div>
        </div>

        {/* Signal strip chart */}
        <div
          aria-hidden="true"
          className={`${styles.phosphor} relative h-14 overflow-hidden rounded border-2 border-[#3e3228]`}
        >
          <SignalTrace lightOn={lightOn} />
        </div>

        {/* Control Desk */}
        <div className="flex flex-col items-center justify-between gap-8 rounded-lg border-t-2 border-[#8b5a2b]/30 bg-[#2a2321]/80 p-6 shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)] md:flex-row">
          <div className="relative">
            <div
              className={`${styles.bulb} relative h-24 w-24 rounded-full border-4 border-[#2f2f2f] transition-all duration-100`}
              data-on={lightOn || undefined}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <Zap
                  className={`h-12 w-12 transition-colors ${lightOn ? "text-[#ff8c00]" : "text-[#4a3b32]"}`}
                />
              </div>
            </div>
            <div className="mx-auto -mt-1 h-8 w-16 border-x-2 border-[#1a1512] bg-linear-to-b from-[#6b4b3a] via-[#4a3327] to-[#3e2b22]" />
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto">
            {isTransmitting ? (
              <button
                type="button"
                onClick={stopTransmission}
                className="rounded border-b-4 border-[#4a0000] bg-[#8b0000] px-8 py-4 text-xl font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:bg-[#a00000] active:translate-y-1 active:border-b-0"
              >
                STOP SIGNAL
              </button>
            ) : (
              <button
                type="button"
                onClick={transmit}
                disabled={!encoded}
                className="rounded border-b-4 border-[#5c3a1b] bg-linear-to-b from-[#a06a35] to-[#8b5a2b] px-8 py-4 text-xl font-bold uppercase tracking-widest text-[#ffeebb] shadow-lg transition-all hover:from-[#b27a41] hover:to-[#9c6b3c] active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                TRANSMIT
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowCheatSheet((prev) => !prev);
              }}
              aria-expanded={showCheatSheet}
              className="cursor-pointer rounded border-b-4 border-[#3e2b22] bg-[#5c4033] px-6 py-2 text-center text-xs font-bold uppercase tracking-widest text-[#ffeebb] shadow-md transition-all hover:bg-[#6e4e3f] active:translate-y-1 active:border-b-0"
            >
              Morse Sheet
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onMouseDown={manualTapStart}
              onMouseUp={manualTapEnd}
              onMouseLeave={manualTapEnd}
              onTouchStart={(e) => {
                e.preventDefault();
                manualTapStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                manualTapEnd();
              }}
              className={`${styles.brassKey} flex h-32 w-32 cursor-pointer touch-none select-none items-center justify-center rounded-full border-4 border-[#b8942a] transition-all active:translate-y-2`}
            >
              <span className="text-lg font-bold text-[#3e2b22] opacity-60">
                TAP
              </span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCheatSheet && (
          <CheatSheet onClose={() => setShowCheatSheet(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
