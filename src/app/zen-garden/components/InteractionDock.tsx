import { motion } from "motion/react";
import { Shuffle } from "lucide-react";
import { EMOJI_CATEGORIES } from "../constants";
import type { ZenGardenController } from "../hooks/useZenGarden";

type InteractionDockProps = Pick<
  ZenGardenController,
  | "activeTab"
  | "activeTool"
  | "randomMode"
  | "selectCategory"
  | "selectedEmoji"
  | "selectEmoji"
  | "setActiveTool"
  | "setRandomMode"
>;

const TOOLS = [
  {
    id: "plant",
    label: "Plant 🌱",
    active: "bg-emerald-500 shadow-emerald-500/25",
  },
  { id: "rake", label: "Rake ☰", active: "bg-amber-500 shadow-amber-500/25" },
  { id: "water", label: "Water 💧", active: "bg-sky-500 shadow-sky-500/25" },
  { id: "prune", label: "Shovel 🪏", active: "bg-rose-500 shadow-rose-500/25" },
] as const;

export function InteractionDock({
  activeTab,
  activeTool,
  randomMode,
  selectCategory,
  selectedEmoji,
  selectEmoji,
  setActiveTool,
  setRandomMode,
}: InteractionDockProps) {
  const activeCategory = EMOJI_CATEGORIES.find(({ id }) => id === activeTab);

  return (
    <footer className="zen-footer absolute bottom-3 sm:bottom-6 inset-x-0 px-2 sm:px-4 flex flex-col items-center gap-2 sm:gap-3 z-30 pointer-events-none">
      {activeTool === "plant" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="zen-emoji-box w-full max-w-lg sm:max-w-2xl bg-emerald-50/95 dark:bg-emerald-900/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-emerald-200/50 dark:border-emerald-700/60 shadow-[0_24px_50px_-20px_rgba(6,78,59,0.35)] p-2 sm:p-4 pointer-events-auto flex flex-col gap-1.5 sm:gap-3"
        >
          <div className="flex justify-between items-center border-b border-emerald-200/30 dark:border-emerald-700/40 pb-1 sm:pb-2 gap-2 overflow-x-auto">
            <div className="flex gap-0.5 sm:gap-1">
              {EMOJI_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category.id)}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all shrink-0 ${
                    activeTab === category.id
                      ? "bg-amber-100 dark:bg-emerald-800 text-amber-900 dark:text-emerald-100 font-semibold"
                      : "text-emerald-850/70 dark:text-emerald-300/70 hover:text-emerald-900 dark:hover:text-emerald-100"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="zen-cat-text hidden sm:inline">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setRandomMode(!randomMode)}
              className={`px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 border transition-all shrink-0 ${
                randomMode
                  ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold"
                  : "text-emerald-850/70 dark:text-emerald-300/70 hover:text-emerald-900 dark:hover:text-emerald-100 border-emerald-200/30 dark:border-emerald-700/45"
              }`}
              title="Plant a random emoji from the active tab on click"
            >
              <Shuffle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="zen-random-text">Random Mode</span>
            </button>
          </div>

          <div className="flex overflow-x-auto sm:grid sm:grid-cols-10 gap-1.5 max-h-14 sm:max-h-36 overflow-y-hidden sm:overflow-y-auto px-1 py-1 no-scrollbar">
            {activeCategory?.emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => selectEmoji(emoji)}
                className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-2xl sm:text-3xl flex items-center justify-center rounded-xl transition-all duration-200 ${
                  selectedEmoji === emoji && !randomMode
                    ? "bg-amber-200 dark:bg-emerald-800 border border-amber-400 dark:border-emerald-500 scale-105 shadow-inner"
                    : "bg-transparent border border-transparent hover:-translate-y-0.5 hover:rotate-[-6deg] hover:bg-emerald-100/60 dark:hover:bg-emerald-800/40 active:scale-95 text-emerald-900 dark:text-emerald-100"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="zen-tool-bar flex items-center gap-1 sm:gap-1.5 bg-emerald-50/95 dark:bg-emerald-900/90 backdrop-blur-md p-0.5 sm:p-1 rounded-full border border-emerald-200/60 dark:border-emerald-700/60 shadow-xl pointer-events-auto">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              aria-pressed={isActive}
              className={`relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                isActive
                  ? "text-white"
                  : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-800/60"
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="zen-active-tool"
                  className={`absolute inset-0 rounded-full shadow-md ${tool.active}`}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
