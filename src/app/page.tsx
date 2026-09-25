"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { pickRandomWebsitePath, WEBSITES } from "@/lib/websites";

import { ExploreButton } from "./_home/explore-button";
import styles from "./_home/home.module.css";
import {
  readRevealedWebsites,
  saveRevealedWebsites,
} from "./_home/revealed-websites";
import { WebsiteCard } from "./_home/website-card";

export default function Home() {
  const router = useRouter();
  const isNavigating = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [revealedWebsites, setRevealedWebsites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setIsMounted(true);
      setRevealedWebsites(readRevealedWebsites());
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  // Cards below the fold rise in as the grid scrolls into view. Without
  // JavaScript the grid simply renders in place.
  useEffect(() => {
    const grid = gridRef.current;
    if (
      !grid ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      grid.getBoundingClientRect().top < window.innerHeight
    ) {
      return;
    }

    let settleTimer = 0;
    grid.dataset.entrance = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          grid.dataset.entrance = "in";
          observer.disconnect();
          // Drop the staggered transition so hover feedback stays instant.
          settleTimer = window.setTimeout(() => {
            delete grid.dataset.entrance;
          }, 2000);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(grid);

    return () => {
      observer.disconnect();
      window.clearTimeout(settleTimer);
      delete grid.dataset.entrance;
    };
  }, []);

  const revealedSet = useMemo(
    () => new Set(isMounted ? revealedWebsites : []),
    [isMounted, revealedWebsites],
  );
  const discoveredCount = WEBSITES.filter((website) =>
    revealedSet.has(website.path),
  ).length;
  const progress = discoveredCount / WEBSITES.length;

  const visitRandomWebsite = () => {
    if (isNavigating.current) {
      return;
    }

    isNavigating.current = true;
    setLoading(true);
    const randomPage = pickRandomWebsitePath(revealedWebsites);
    const nextRevealedWebsites = Array.from(
      new Set([...revealedWebsites, randomPage]),
    );

    router.prefetch(randomPage);
    setRevealedWebsites(nextRevealedWebsites);
    saveRevealedWebsites(nextRevealedWebsites);

    setTimeout(() => {
      router.push(randomPage);
    }, 500);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
      <section className={styles.hero}>
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-8 px-4 sm:gap-10">
          <h1 className="text-center text-xl font-black uppercase tracking-[0.32em] text-white sm:text-3xl sm:tracking-[0.4em]">
            Random Webs
          </h1>
          <div className={styles.heroCta}>
            <ExploreButton loading={loading} onClick={visitRandomWebsite} />
          </div>
        </div>

        <a href="#websites" className={styles.scrollCue}>
          <span className="sr-only">Browse every website</span>
          <ArrowDown aria-hidden="true" className="h-4 w-4" />
        </a>
      </section>

      <section
        id="websites"
        className="relative mx-auto flex min-h-screen max-w-7xl scroll-mt-6 flex-col items-stretch px-3 pb-10 sm:px-8 lg:px-12"
      >
        <div className="relative w-full pt-8">
          <div className={styles.progressBar}>
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.24em] text-white/45">
              Discovered
            </p>
            <div
              role="progressbar"
              aria-label="Websites discovered"
              aria-valuemin={0}
              aria-valuemax={WEBSITES.length}
              aria-valuenow={discoveredCount}
              className={styles.progressTrack}
            >
              <span
                className={styles.progressFill}
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
            <p className="font-mono text-[0.7rem] tabular-nums tracking-[0.12em] text-white/70">
              <span className="text-white">
                {String(discoveredCount).padStart(2, "0")}
              </span>
              <span className="text-white/35">
                {" / "}
                {WEBSITES.length}
              </span>
            </p>
          </div>

          <div className={styles.gridShell}>
            <div
              ref={gridRef}
              className={`${styles.grid} grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4`}
              data-website-grid
            >
              {WEBSITES.map((website, index) => (
                <WebsiteCard
                  key={website.path}
                  website={website}
                  index={index}
                  isRevealed={revealedSet.has(website.path)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 pb-10 text-center sm:flex-row sm:justify-between sm:px-8 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-white/35">
          © {new Date().getFullYear()} Random Webs
        </p>
        <Link
          href="/privacy"
          className="rounded-sm text-[0.65rem] uppercase tracking-[0.22em] text-white/45 transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Privacy
        </Link>
      </footer>
    </main>
  );
}
