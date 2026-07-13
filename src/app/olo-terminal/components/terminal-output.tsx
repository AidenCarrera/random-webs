import type { RefObject } from "react";

import type { TerminalTheme } from "../types";

interface TerminalOutputProps {
  activeTheme: TerminalTheme;
  endRef: RefObject<HTMLDivElement | null>;
  history: string[];
  onFocusInput: () => void;
}

export function TerminalOutput({
  activeTheme,
  endRef,
  history,
  onFocusInput,
}: TerminalOutputProps) {
  return (
    <div
      className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-current scrollbar-track-transparent pr-2 font-bold transition-colors duration-200 ease-out"
      onClick={onFocusInput}
    >
      {history.map((line, index) => {
        const isPromptLine = line.includes("@olo:");
        if (isPromptLine) {
          const colonIndex = line.indexOf(":");
          const symbolIndex = line.includes("#")
            ? line.indexOf("#")
            : line.indexOf("$");
          const host = line.substring(0, colonIndex);
          const path = line.substring(colonIndex + 1, symbolIndex + 1);
          const rest = line.substring(symbolIndex + 1);
          return (
            <div
              key={index}
              className="whitespace-pre-wrap break-all mb-0.5 text-[13px] leading-tight transition-colors duration-200 ease-out sm:mb-1 sm:text-base sm:leading-relaxed"
            >
              <span style={{ color: activeTheme.text }}>{host}</span>
              <span style={{ color: activeTheme.text }}>:</span>
              <span style={{ color: activeTheme.text }}>{path}</span>
              <span style={{ color: activeTheme.text }}>{rest}</span>
            </div>
          );
        }

        return (
          <div
            key={index}
            className="whitespace-pre-wrap break-all mb-0.5 text-[12px] leading-tight transition-colors duration-200 ease-out sm:mb-1 sm:text-sm sm:leading-relaxed"
          >
            {line}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
