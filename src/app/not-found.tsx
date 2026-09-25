"use client";

import Link from "next/link";
import { House } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { pickRandomWebsitePath } from "@/lib/websites";

import { ExploreButton } from "./_home/explore-button";
import styles from "./_home/not-found.module.css";
import {
  readRevealedWebsites,
  saveRevealedWebsites,
} from "./_home/revealed-websites";

export default function NotFound() {
  const router = useRouter();
  const isNavigating = useRef(false);
  const [loading, setLoading] = useState(false);

  const exploreRandomWebsite = () => {
    if (isNavigating.current) {
      return;
    }

    isNavigating.current = true;
    setLoading(true);

    const saved = readRevealedWebsites();
    const randomPage = pickRandomWebsitePath(saved);
    const nextRevealed = Array.from(new Set([...saved, randomPage]));

    saveRevealedWebsites(nextRevealed);
    router.prefetch(randomPage);

    window.setTimeout(() => {
      router.push(randomPage);
    }, 500);
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050506] px-6 text-center text-white">
      <div className="relative z-10 flex flex-col items-center">
        <h1 className={styles.code}>404</h1>
        <h2 className="mt-4 text-sm font-normal text-white/60 sm:text-base">
          This page could not be found.
        </h2>
      </div>

      <div className="relative z-10 mt-10 flex w-full max-w-3xl flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <ExploreButton
          loading={loading}
          onClick={exploreRandomWebsite}
          size="compact"
        />

        <Link
          href="/"
          className="group inline-flex min-h-16 items-center justify-center gap-3 whitespace-nowrap rounded-full border border-white/20 bg-black/40 px-6 py-5 text-sm font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-colors duration-300 hover:border-white hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px sm:px-10 sm:text-base sm:tracking-[0.28em]"
        >
          <House
            aria-hidden="true"
            className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
          />
          Return to Home
        </Link>
      </div>
    </main>
  );
}
