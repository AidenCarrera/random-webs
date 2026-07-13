import { Camera, Redo, Settings2, Undo, Volume2, VolumeX } from "lucide-react";
import type { ZenGardenController } from "../hooks/useZenGarden";

type QuickToolbarProps = Pick<
  ZenGardenController,
  | "downloadGardenAsImage"
  | "history"
  | "historyIndex"
  | "setSidebarOpen"
  | "setSoundEnabled"
  | "sidebarOpen"
  | "soundEnabled"
  | "triggerRedo"
  | "triggerUndo"
>;

export function QuickToolbar({
  downloadGardenAsImage,
  history,
  historyIndex,
  setSidebarOpen,
  setSoundEnabled,
  sidebarOpen,
  soundEnabled,
  triggerRedo,
  triggerUndo,
}: QuickToolbarProps) {
  return (
    <header className="zen-header absolute top-3 right-4 sm:top-0 sm:inset-x-0 sm:p-4 flex justify-end items-center z-30 gap-4 pointer-events-none">
      <div className="flex items-center gap-1 sm:gap-2 bg-emerald-50/95 dark:bg-emerald-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-emerald-200/60 dark:border-emerald-700/60 shadow-lg pointer-events-auto">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`zen-header-btn p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 ${
            soundEnabled
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-inner"
              : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
          }`}
          title={soundEnabled ? "Mute chimes" : "Enable ambient wind chimes"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 dark:text-emerald-300" />
          )}
        </button>

        <button
          onClick={downloadGardenAsImage}
          className="zen-header-btn p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60 transition-all hover:scale-105 active:scale-95"
          title="Download Garden as Image"
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={triggerUndo}
          disabled={historyIndex <= 0}
          className="zen-header-btn p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
          title="Undo"
        >
          <Undo className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={triggerRedo}
          disabled={historyIndex >= history.length - 1}
          className="zen-header-btn p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
          title="Redo"
        >
          <Redo className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <span className="zen-header-sep w-px h-4 sm:h-6 bg-emerald-200/60 dark:bg-emerald-700/60 mx-0.5 sm:mx-1" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 ${
            sidebarOpen
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-inner"
              : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
          }`}
          title="Settings and Themes"
        >
          <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
}
