"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { FractalExplorerController } from "../hooks/useFractalExplorer";

interface AudioPromptProps {
  explorer: FractalExplorerController;
}

export function AudioPrompt({ explorer }: AudioPromptProps) {
  const {
    initAudioEngine,
    setIsAudioEnabled,
    setShowWelcomePrompt,
    showWelcomePrompt,
  } = explorer;

  return (
    <AnimatePresence>
      {showWelcomePrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03040c]/70 p-4 backdrop-blur-xl pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="w-full max-w-md rounded-3xl border border-white/[0.14] bg-[#0b0c1d]/92 p-6 text-center text-zinc-200 shadow-[0_28px_90px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
          >
            <div className="mb-4 flex justify-center">
              <div className="rounded-2xl border border-violet-300/25 bg-violet-400/10 p-3 text-violet-200 shadow-[0_0_16px_rgba(167,139,250,0.10)] animate-pulse">
                <Volume2 className="w-6 h-6" />
              </div>
            </div>
            <h1 className="mb-2 text-lg font-semibold tracking-[-0.035em] text-zinc-50">
              Fractal Audio
            </h1>
            <p className="mb-6 text-xs leading-relaxed text-zinc-400">
              This fractal explorer generates real-time audio based on its
              coordinates. Changing the color palette changes the tone of the
              synth. Would you like to enable audio?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  void initAudioEngine();
                  setIsAudioEnabled(true);
                  setShowWelcomePrompt(false);
                }}
                className="flex-1 rounded-xl border border-violet-300/35 bg-violet-500 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition-all duration-300 hover:bg-violet-400 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Enable Audio
              </button>
              <button
                onClick={() => {
                  setIsAudioEnabled(false);
                  setShowWelcomePrompt(false);
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 transition-all duration-300 hover:bg-white/8 hover:text-zinc-200 active:scale-95 cursor-pointer"
              >
                Explore Silently
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
