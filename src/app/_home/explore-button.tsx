"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { Shuffle } from "lucide-react";
import type { PointerEvent } from "react";

import styles from "./home.module.css";

type ExploreButtonProps = {
  loading: boolean;
  onClick: () => void;
  size?: "hero" | "compact";
};

export function ExploreButton({
  loading,
  onClick,
  size = "hero",
}: ExploreButtonProps) {
  const reduceMotion = useReducedMotion();
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const x = useSpring(pullX, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(pullY, { stiffness: 220, damping: 18, mass: 0.6 });

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    pullX.set((event.clientX - (bounds.left + bounds.width / 2)) * 0.18);
    pullY.set((event.clientY - (bounds.top + bounds.height / 2)) * 0.3);
  };

  const release = () => {
    pullX.set(0);
    pullY.set(0);
  };

  const isHero = size === "hero";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={release}
      disabled={loading}
      aria-busy={loading}
      style={{ x, y }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      data-loading={loading || undefined}
      className={`${styles.explore} group relative isolate inline-flex min-h-16 items-center justify-center rounded-full p-[1.5px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait`}
    >
      <span aria-hidden="true" className={styles.exploreRing} />
      <span aria-hidden="true" className={styles.exploreGlow} />
      <span
        className={`relative inline-flex w-full items-center justify-center gap-3 rounded-full bg-zinc-100 font-black uppercase text-black transition-colors duration-300 group-hover:bg-white sm:gap-4 ${
          isHero
            ? "px-6 py-5 text-sm tracking-[0.2em] sm:px-10 sm:py-6 sm:text-base sm:tracking-[0.28em]"
            : "px-6 py-5 text-sm tracking-[0.18em] sm:px-10 sm:text-base sm:tracking-[0.28em]"
        }`}
      >
        <Shuffle
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 transition-transform duration-500 ease-(--ease-out-back) group-hover:rotate-180 ${
            loading ? styles.exploreIconSpin : ""
          }`}
        />
        <span aria-live="polite" className="whitespace-nowrap">
          {loading ? "Finding a website" : "Explore Random Website"}
        </span>
      </span>
    </motion.button>
  );
}
