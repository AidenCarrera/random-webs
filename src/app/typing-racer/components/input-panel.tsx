import type { ChangeEvent, RefObject } from "react";

import { PassageText } from "./passage-text";

interface InputPanelProps {
  passage: string;
  typedText: string;
  errors: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function InputPanel({
  passage,
  typedText,
  errors,
  inputRef,
  onInputChange,
}: InputPanelProps) {
  return (
    <div className="lg:col-span-3 bg-[#110a22]/70 border border-purple-900/40 rounded-3xl p-8 backdrop-blur-xl shadow-xl flex flex-col gap-6">
      <div
        className="bg-black/30 border border-purple-950/50 rounded-2xl p-6 leading-relaxed select-text min-h-30"
        aria-label="Passage to type"
      >
        <PassageText passage={passage} typedText={typedText} />
      </div>

      <div
        className={`relative rounded-2xl bg-black/50 border p-2 flex items-center transition-all ${
          errors > 0
            ? "border-pink-600 shadow-[0_0_15px_rgba(219,39,119,0.3)]"
            : "border-purple-900/60 focus-within:border-cyan-500 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
        }`}
      >
        <span className="text-purple-500 text-lg font-bold pl-3 pr-2 select-none">
          $
        </span>
        <label htmlFor="typing-racer-input" className="sr-only">
          Type the passage exactly as shown
        </label>
        <input
          id="typing-racer-input"
          ref={inputRef}
          type="text"
          value={typedText}
          onChange={onInputChange}
          className="w-full bg-transparent border-none text-white text-xl p-3 focus:outline-none tracking-wide"
          placeholder="TYPE THE PASSAGE EXACTLY AS SHOWN..."
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
