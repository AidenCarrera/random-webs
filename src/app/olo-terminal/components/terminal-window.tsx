import type { TerminalController } from "../hooks/use-terminal-controller";

import { TerminalHeader } from "./terminal-header";
import { TerminalInput } from "./terminal-input";
import { TerminalOutput } from "./terminal-output";
import styles from "./terminal-window.module.css";

interface TerminalWindowProps {
  terminal: TerminalController;
}

export function TerminalWindow({ terminal }: TerminalWindowProps) {
  const {
    activeTheme,
    canvasRef,
    customAccent,
    customBackground,
    endRef,
    getPromptString,
    handleKeyDown,
    history,
    input,
    inputRef,
    isMatrixMode,
    passwordState,
    selectedTheme,
    setCustomAccent,
    setCustomBackground,
    setInput,
    setPreviewThemeId,
    setSettingsOpen,
    settingsOpen,
    setThemeId,
    themeId,
  } = terminal;

  return (
    <div
      className="min-h-screen p-4 font-mono flex items-center justify-center transition-[background-color,color] duration-200 ease-out"
      style={{
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
      }}
    >
      {isMatrixMode && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none opacity-[0.22] z-0"
        />
      )}

      <div
        className="relative z-10 w-full max-w-5xl border-2 overflow-hidden p-6 rounded-lg min-h-[80vh] flex flex-col transition-[background-color,border-color,color,box-shadow] duration-200 ease-out"
        style={{
          backgroundColor: activeTheme.panel,
          borderColor: `${activeTheme.border}99`,
          boxShadow: activeTheme.shadow,
        }}
      >
        {isMatrixMode && (
          <div
            className={`${styles.scanlines} absolute inset-0 pointer-events-none opacity-[0.06] z-50 bg-size-[100%_4px]`}
          />
        )}

        <TerminalHeader
          activeTheme={activeTheme}
          customAccent={customAccent}
          customBackground={customBackground}
          isMatrixMode={isMatrixMode}
          selectedTheme={selectedTheme}
          setCustomAccent={setCustomAccent}
          setCustomBackground={setCustomBackground}
          setPreviewThemeId={setPreviewThemeId}
          setSettingsOpen={setSettingsOpen}
          settingsOpen={settingsOpen}
          setThemeId={setThemeId}
          themeId={themeId}
        />
        <TerminalOutput
          activeTheme={activeTheme}
          endRef={endRef}
          history={history}
          onFocusInput={() => inputRef.current?.focus()}
        />
        <TerminalInput
          activeTheme={activeTheme}
          input={input}
          inputRef={inputRef}
          isPasswordPrompt={Boolean(passwordState)}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          prompt={getPromptString()}
        />
      </div>
    </div>
  );
}
