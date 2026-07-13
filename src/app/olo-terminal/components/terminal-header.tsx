import { Check, Maximize2, Minus, Settings, Terminal, X } from "lucide-react";

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
      <div className="relative flex gap-2">
        <button
          type="button"
          aria-label="Open settings"
          title="Settings"
          onClick={() => setSettingsOpen((open) => !open)}
          className="opacity-60 hover:opacity-100 cursor-pointer"
        >
          <Settings className="h-4 w-4" />
        </button>
        <Minus className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" />
        <Maximize2 className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" />
        <X className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" />
        {settingsOpen && (
          <div
            className="absolute right-0 top-7 z-60 w-56 rounded border p-3 text-xs shadow-xl transition-[background-color,border-color,color,box-shadow] duration-200 ease-out"
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
                  className="flex h-9 items-center justify-center rounded border opacity-75 hover:opacity-100 transition-[background-color,border-color,color,opacity] duration-200 ease-out"
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
