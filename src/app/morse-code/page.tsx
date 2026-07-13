// src/app/page.tsx
"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Courier_Prime } from "next/font/google";
import { useTelegraph } from "./hooks/useTelegraph";
import { CheatSheet } from "./components/CheatSheet";

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
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
    <div
      className={`min-h-screen bg-[#2a2320] text-[#d4b483] ${courierPrime.className} flex flex-col lg:flex-row items-center justify-center gap-8 p-4 lg:p-12 relative`}
    >
      <div className="max-w-3xl w-full bg-[#1e1815] border-8 border-[#8b5a2b] p-8 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col gap-8">
        {/* Screw Details */}
        <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#5c4033] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center text-black/50 text-[8px] transform rotate-45">
          +
        </div>
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#5c4033] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center text-black/50 text-[8px] transform -rotate-12">
          +
        </div>
        <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-[#5c4033] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center text-black/50 text-[8px] transform rotate-90">
          +
        </div>
        <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#5c4033] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center text-black/50 text-[8px] transform rotate-180">
          +
        </div>

        <div className="text-center border-b-2 border-[#8b5a2b]/30 pb-4">
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-widest text-[#c0a080] drop-shadow-[2px_2px_0px_#000]">
            Telegraph
          </h1>
          <p className="text-sm opacity-50 mt-2 italic">
            Morse Transmission Unit
          </p>
        </div>

        {/* Display Panel */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-wider text-[#8b5a2b]">
                Input Message
              </label>
              {input && (
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="px-2 py-0.5 bg-[#8b0000] text-white hover:bg-red-700 text-[10px] font-bold uppercase tracking-wider border-b-2 border-[#4a0000] active:border-b-0 active:translate-y-0.5 rounded transition-all cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="TYPE MESSAGE HERE..."
              className="flex-1 min-h-37.5 bg-[#e6dcc3] text-[#2a2320] p-4 text-xl font-bold uppercase border-4 border-[#8b5a2b] shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] focus:outline-none resize-none placeholder-[#2a2320]/30"
            />
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold uppercase tracking-wider text-[#8b5a2b]">
              Encoded Signal
            </label>
            <div className={`flex-1 min-h-37.5 bg-[#1a1512] text-[#ff8c00] p-4 font-bold border-4 border-[#3e3228] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-y-auto w-full break-all tracking-widest leading-loose ${encoded ? "text-2xl" : "text-xl text-[#ff8c00]/30"}`}>
              {encoded || "AWAITING INPUT..."}
            </div>
          </div>
        </div>

        {/* Control Desk */}
        <div className="bg-[#2a2321] p-6 rounded border-t-2 border-[#8b5a2b]/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="relative group">
            <div
              className={`w-24 h-24 rounded-full border-4 border-[#2f2f2f] bg-[#1a1512] relative transition-all duration-100 ${lightOn ? "shadow-[0_0_60px_#ffae00] bg-[#ffecb3]" : "shadow-none"}`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <Zap
                  className={`w-12 h-12 transition-colors ${lightOn ? "text-[#ff8c00]" : "text-[#4a3b32]"}`}
                />
              </div>
            </div>
            <div className="w-16 h-8 bg-linear-to-b from-[#5c4033] to-[#3e2b22] mx-auto -mt-1 border-x-2 border-[#1a1512]" />
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {isTransmitting ? (
              <button
                type="button"
                onClick={stopTransmission}
                className="px-8 py-4 bg-[#8b0000] text-white font-bold text-xl uppercase tracking-widest border-b-4 border-[#4a0000] active:border-b-0 active:translate-y-1 transition-all shadow-lg rounded"
              >
                STOP SIGNAL
              </button>
            ) : (
              <button
                type="button"
                onClick={transmit}
                disabled={!encoded}
                className="px-8 py-4 bg-[#8b5a2b] text-[#ffeebb] font-bold text-xl uppercase tracking-widest border-b-4 border-[#5c3a1b] active:border-b-0 active:translate-y-1 transition-all shadow-lg hover:bg-[#9c6b3c] disabled:opacity-50 disabled:cursor-not-allowed rounded"
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
              className="px-6 py-2 bg-[#5c4033] text-[#ffeebb] font-bold text-xs uppercase tracking-widest border-b-4 border-[#3e2b22] active:border-b-0 active:translate-y-1 transition-all shadow-md hover:bg-[#6e4e3f] rounded cursor-pointer text-center"
            >
              Morse Sheet
            </button>
          </div>

          <div className="flex flex-col gap-2 items-center">
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
              className="w-32 h-32 rounded-full bg-linear-to-b from-[#d4af37] to-[#8b7500] shadow-[0_10px_0_#5c4d00,0_15px_20px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#5c4d00,0_5px_10px_rgba(0,0,0,0.5)] active:translate-y-2 transition-all border-4 border-[#ffdf80] flex items-center justify-center touch-none select-none cursor-pointer"
            >
              <span className="text-[#3e2b22] font-bold text-lg opacity-50">
                TAP
              </span>
            </button>
          </div>
        </div>
      </div>

      {showCheatSheet && (
        <CheatSheet onClose={() => setShowCheatSheet(false)} />
      )}
    </div>
  );
}
