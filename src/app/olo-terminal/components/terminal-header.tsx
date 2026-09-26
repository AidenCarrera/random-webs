import { Check, Settings, Terminal } from "lucide-react";

import styles from "./terminal-window.module.css";

import { TERMINAL_THEMES } from "../constants";
import type { TerminalTheme } from "../types";

interface TerminalHeaderProps {
  activeTheme: TerminalTheme;
  customAccent: string;
  customBackground: string;
  isMatrixMode: boolean;
  selectedTheme: TerminalTheme;
  setCustomAccent: (value: string) => void;
  setCustomBackground: (value: string) => void;
  setPreviewThemeId: (value: string | null) => void;
  setSettingsOpen: (value: boolean | ((open: boolean) => boolean)) => void;
  settingsOpen: boolean;
  setThemeId: (value: string) => void;
  themeId: string;
}

export function TerminalHeader({
  activeTheme,
  customAccent,
  customBackground,
  isMatrixMode,
  selectedTheme,
  setCustomAccent,
  setCustomBackground,
  setPreviewThemeId,
  setSettingsOpen,
  settingsOpen,
  setThemeId,
  themeId,
}: TerminalHeaderProps) {
  return (
    <div
      className="mb-4 flex items-center justify-between border-b pb-2 transition-[border-color,color] duration-200 ease-out"
      style={{ borderColor: `${activeTheme.border}73` }}
    >
      <div className="flex items-center gap-2">
        <Terminal className="h-5 w-5" />
        <span className="text-sm font-bold tracking-wider">
          {isMatrixMode ? "@@@@@@@@@@" : "OLO_SHELL_V2.0"}
        </span>
      </div>
      <div className="relative flex items-center gap-4">
        <button
          type="button"
          aria-label="Open settings"
          aria-expanded={settingsOpen}
          title="Settings"
          onClick={() => setSettingsOpen((open) => !open)}
          className="group grid h-7 w-7 cursor-pointer place-items-center rounded-md opacity-60 transition-[opacity,background-color] hover:bg-white/5 hover:opacity-100"
        >
          <Settings className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
        </button>
        <div aria-hidden="true" className={styles.lights}>
          <span style={{ background: "#e0af68" }} />
          <span style={{ background: "#9ece6a" }} />
          <span style={{ background: "#f7768e" }} />
        </div>
        {settingsOpen && (
          <div
            className="absolute right-0 top-9 z-60 w-60 rounded-lg border p-3 text-xs shadow-xl transition-[background-color,border-color,color,box-shadow] duration-200 ease-out"
            onMouseLeave={() => setPreviewThemeId(null)}
            style={{
              backgroundColor: activeTheme.panel,
              borderColor: `${activeTheme.border}99`,
              boxShadow: activeTheme.shadow,
            }}
          >
            <div className="mb-2 font-bold uppercase tracking-wider opacity-80">
              Settings
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {TERMINAL_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  title={theme.name}
                  onMouseEnter={() => setPreviewThemeId(theme.id)}
                  onFocus={() => setPreviewThemeId(theme.id)}
                  onBlur={() => setPreviewThemeId(null)}
                  onClick={() => {
                    setThemeId(theme.id);
                    setPreviewThemeId(null);
                    setCustomAccent("");
                    setCustomBackground("");
                    setSettingsOpen(false);
                  }}
                  className="flex h-10 items-center justify-center rounded-md border opacity-75 hover:-translate-y-px hover:opacity-100 transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out"
                  style={{
                    backgroundColor: theme.panel,
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                >
                  {themeId === theme.id &&
                  !customAccent &&
                  !customBackground ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-current" />
                  )}
                </button>
              ))}
            </div>
            <label className="mb-2 flex items-center justify-between gap-3">
              <span className="opacity-75">Accent</span>
              <input
                type="color"
                value={customAccent || selectedTheme.text}
                onFocus={() => setPreviewThemeId(null)}
                onChange={(event) => {
                  setPreviewThemeId(null);
                  setCustomAccent(event.target.value);
                }}
                className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="opacity-75">Background</span>
              <input
                type="color"
                value={customBackground || selectedTheme.bg}
                onFocus={() => setPreviewThemeId(null)}
                onChange={(event) => {
                  setPreviewThemeId(null);
                  setCustomBackground(event.target.value);
                }}
                className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
