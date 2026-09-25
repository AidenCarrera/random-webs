"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

import styles from "../styles.module.css";
import type { Theme } from "../types";

export const HeaderTitle = memo(function HeaderTitle({
  name,
  theme,
  isRainbow,
}: {
  name: string;
  theme: Theme;
  isRainbow: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute left-0 top-8 z-10 w-full select-none px-4 text-center sm:top-12">
      <h1 className="flex flex-col items-center uppercase">
        <span
          className={`block text-sm font-bold tracking-[0.38em] transition-colors duration-500 sm:text-lg md:text-xl ${
            isRainbow
              ? "text-pink-200/85"
              : theme.isDark
                ? "text-stone-400/70"
                : "text-sky-900/55"
          }`}
        >
          Cloudy with a chance of
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={name}
            initial={
              reduceMotion
                ? false
                : { y: -36, opacity: 0, filter: "blur(8px)", scaleY: 1.15 }
            }
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", scaleY: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { y: 28, opacity: 0, filter: "blur(6px)" }
            }
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`mt-2 block max-w-full break-words text-4xl font-black leading-[0.95] tracking-tight sm:mt-3 sm:text-7xl md:text-8xl ${
              isRainbow
                ? styles.rainbowText
                : `transition-colors duration-500 ${theme.color} ${
                    theme.isDark
                      ? "drop-shadow-[0_2px_18px_rgba(255,255,255,0.18)]"
                      : "drop-shadow-[0_6px_20px_rgba(255,255,255,0.9)]"
                  }`
            }`}
          >
            {name}
          </motion.span>
        </AnimatePresence>
      </h1>
    </div>
  );
});
