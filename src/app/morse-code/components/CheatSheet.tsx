// src/components/CheatSheet.tsx
import { MORSE_CODE } from "../lib/morse";
import { Kalam } from "next/font/google";

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const letters = Object.keys(MORSE_CODE).filter(
  (char) => char !== " " && isNaN(Number(char))
);
const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const orderedKeys = [...letters, ...numbers];

interface CheatSheetProps {
  onClose: () => void;
}

export function CheatSheet({ onClose }: CheatSheetProps) {
  return (
    <div
      className={`max-w-70 w-full bg-[#f4efe2] border-4 border-[#c0a080] p-5 rounded-sm shadow-2xl relative text-[#2d2219] ${kalam.className} animate-fade-in shrink-0`}
      style={{ boxShadow: "3px 3px 20px rgba(0,0,0,0.4)" }}
    >
      {/* Vintage Tape decoration at the top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#e2d8bd]/80 border border-[#b8ab8d]/30 transform -rotate-1 shadow-sm flex items-center justify-center text-[8px] text-[#8b5a2b]/40 font-sans tracking-widest select-none"></div>

      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 text-xl text-[#8b5a2b]/60 hover:text-[#8b5a2b] font-bold cursor-pointer transition-colors"
        aria-label="Close"
      >
        x
      </button>

      <h2 className="text-xl font-bold uppercase tracking-wide text-[#5c4033] mb-4 text-center border-b border-[#5c4033]/20 pb-1 mt-1">
        Morse Sheet
      </h2>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        {orderedKeys.map((char) => {
          const code = MORSE_CODE[char as keyof typeof MORSE_CODE];
          return (
            <div
              key={char}
              className="flex flex-col items-center bg-[#fdfbf7] py-1 px-0.5 rounded border border-[#c0a080]/30 shadow-sm"
            >
              <span className="text-[#5c4033] text-sm font-bold leading-tight">
                {char}
              </span>
              <span className="text-[#a0522d] tracking-wider text-xs font-bold leading-tight">
                {code}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
