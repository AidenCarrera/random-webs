import type { KeyboardEventHandler, RefObject } from "react";

import type { TerminalTheme } from "../types";

interface TerminalInputProps {
  activeTheme: TerminalTheme;
  input: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isPasswordPrompt: boolean;
  onChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  prompt: string;
}

export function TerminalInput({
  activeTheme,
  input,
  inputRef,
  isPasswordPrompt,
  onChange,
  onKeyDown,
  prompt,
}: TerminalInputProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold leading-tight transition-colors duration-200 ease-out sm:gap-2 sm:text-lg sm:leading-normal">
      <span className="break-all" style={{ color: activeTheme.text }}>
        {isPasswordPrompt ? "[sudo] password for user:" : prompt}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={`olo-shell-input min-w-0 flex-1 bg-transparent border-none text-base outline-none sm:text-lg ${
          isPasswordPrompt ? "text-transparent caret-transparent" : ""
        } transition-colors duration-200 ease-out`}
        style={
          isPasswordPrompt
            ? undefined
            : {
                color: activeTheme.text,
                caretColor: activeTheme.text,
              }
        }
        autoFocus
        autoComplete="off"
        enterKeyHint="send"
        inputMode="text"
        placeholder=""
        spellCheck="false"
      />
    </div>
  );
}
