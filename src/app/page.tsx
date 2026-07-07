"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { RANDOM_WEBSITE_PATHS, WEBSITES } from "@/lib/websites";

const REVEALED_WEBSITES_KEY = "random-webs-revealed-websites";

function maskText(value: string) {
  return value.replace(/\S/g, "?");
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [revealedWebsites, setRevealedWebsites] = useState<string[]>([]);

  useEffect(() => {
    const savedWebsites = window.localStorage.getItem(REVEALED_WEBSITES_KEY);

    if (!savedWebsites) {
      return;
    }

    try {
      const parsedWebsites = JSON.parse(savedWebsites);

      if (Array.isArray(parsedWebsites)) {
        setRevealedWebsites(parsedWebsites);
      }
    } catch {
      window.localStorage.removeItem(REVEALED_WEBSITES_KEY);
    }
  }, []);

  const visitRandomWebsite = () => {
    setLoading(true);
    const randomPage =
      RANDOM_WEBSITE_PATHS[
        Math.floor(Math.random() * RANDOM_WEBSITE_PATHS.length)
      ];
    const nextRevealedWebsites = Array.from(
      new Set([...revealedWebsites, randomPage]),
    );

    setRevealedWebsites(nextRevealedWebsites);
    window.localStorage.setItem(
      REVEALED_WEBSITES_KEY,
      JSON.stringify(nextRevealedWebsites),
    );

    setTimeout(() => {
      router.push(randomPage);
    }, 500);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-b from-black via-zinc-950 to-zinc-950 text-white">
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-20 sm:px-8 lg:px-12">
        <div className="flex w-full items-center justify-center">
          <button
            onClick={visitRandomWebsite}
            disabled={loading}
            className="group inline-flex items-center justify-center gap-4 rounded-full border border-white/12 bg-zinc-100 px-10 py-6 text-base font-black uppercase tracking-[0.28em] text-black transition-opacity duration-300 disabled:opacity-70"
          >
            <Shuffle className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" />
            <span>Explore Random Website</span>
          </button>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-2xl text-white/35">
          ↓
        </div>
      </section>

      <section className="relative mx-auto flex min-h-screen max-w-7xl items-start px-6 pb-20 sm:px-8 lg:px-12">
        <div className="relative w-full pt-8">
          <div className="relative rounded-4xl border border-white/6 bg-white/1.5 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {WEBSITES.map((website, index) => {
                const isRevealed = revealedWebsites.includes(website.path);
                const cardClassName = isRevealed
                  ? "group relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-zinc-950 p-4 text-left text-zinc-100 shadow-[0_8px_18px_rgba(0,0,0,0.22)] transition-colors duration-300"
                  : "relative overflow-hidden rounded-[1.6rem] border border-white/7 bg-black p-4 text-left text-white/90 shadow-[0_8px_18px_rgba(0,0,0,0.2)]";
                const innerClassName = isRevealed
                  ? "relative min-h-32 rounded-[1.2rem] bg-zinc-950 p-4"
                  : "relative min-h-32 rounded-[1.2rem] bg-black p-4";

                const cardContent = (
                  <div className={innerClassName}>
                    <h2
                      className={
                        isRevealed
                          ? "text-xl font-black uppercase tracking-[0.08em] text-zinc-100"
                          : "text-xl font-black uppercase tracking-[0.22em] text-white/95"
                      }
                    >
                      {isRevealed ? website.title : maskText(website.title)}
                    </h2>
                    <p
                      className={
                        isRevealed
                          ? "mt-3 max-w-56 text-sm leading-6 text-zinc-400"
                          : "mt-3 max-w-56 text-sm leading-6 text-white/55"
                      }
                    >
                      {isRevealed ? website.blurb : maskText(website.blurb)}
                    </p>
                  </div>
                );

                if (!isRevealed) {
                  return (
                    <div
                      key={website.path}
                      className={cardClassName}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={website.path}
                    href={website.path}
                    aria-label={website.title}
                    className={cardClassName}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
