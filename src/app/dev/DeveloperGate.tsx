"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, KeyRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { WebsiteEntry } from "@/lib/websites";

const PASSWORD = "olo";
const UNLOCK_STORAGE_KEY = "developer-gate-unlocked";

type DeveloperGateProps = {
  websites: WebsiteEntry[];
};

export function DeveloperGate({ websites }: DeveloperGateProps) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [hasCheckedSavedUnlock, setHasCheckedSavedUnlock] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    try {
      setUnlocked(window.localStorage.getItem(UNLOCK_STORAGE_KEY) === "true");
    } finally {
      setHasCheckedSavedUnlock(true);
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (value === PASSWORD) {
      try {
        window.localStorage.setItem(UNLOCK_STORAGE_KEY, "true");
      } catch {
        // Keep the current visit unlocked if local storage is unavailable.
      }
      setUnlocked(true);
      setError("");
      return;
    }

    setAttempts((count) => count + 1);
    setError("Incorrect password.");
  };

  if (!hasCheckedSavedUnlock) {
    return null;
  }

  if (!unlocked) {
    return (
      <main className="relative flex min-h-screen items-center overflow-hidden bg-[#050506] px-6 py-12 text-slate-100 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_26rem_at_50%_40%,rgba(34,211,238,0.08),transparent_70%)]"
        />
        <div className="relative mx-auto w-full max-w-md">
          <motion.div
            key={attempts}
            initial={false}
            animate={
              attempts > 0 && !reduceMotion
                ? { x: [0, -10, 9, -6, 4, 0] }
                : undefined
            }
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="rounded-4xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
              <KeyRound aria-hidden="true" className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-[0.12em] text-white sm:text-3xl">
              Enter Password
            </h1>

            <form
              className="mt-8 space-y-4"
              onSubmit={handleSubmit}
              suppressHydrationWarning
            >
              <input
                type="password"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "developer-gate-error" : undefined}
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3.5 font-mono tracking-[0.2em] text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:font-sans placeholder:tracking-normal placeholder:text-white/30 focus:border-cyan-300/50 focus:shadow-[0_0_0_4px_rgba(103,232,249,0.12)] aria-[invalid=true]:border-rose-400/50"
                placeholder="Password"
                autoComplete="off"
                suppressHydrationWarning
              />
              {error ? (
                <p
                  id="developer-gate-error"
                  role="alert"
                  className="text-sm text-rose-300"
                >
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="w-full rounded-full border border-white/10 bg-white px-5 py-3.5 text-sm font-black uppercase tracking-[0.24em] text-black transition-[transform,background-color] duration-200 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
                suppressHydrationWarning
              >
                Unlock
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] px-4 py-12 text-slate-100 sm:px-8 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(60rem_20rem_at_50%_-4rem,rgba(34,211,238,0.1),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 px-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[0.1em] text-white sm:text-4xl">
              Website Index
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Alphabetical quick navigation for every website in the collection.
            </p>
          </div>
          <p className="font-mono text-xs tabular-nums tracking-[0.2em] text-white/40">
            {String(websites.length).padStart(2, "0")}
          </p>
        </header>

        <ul className="mt-10 grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {websites.map((website, index) => (
            <motion.li
              key={website.path}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.02,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={website.path}
                className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-5 py-4 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${website.accent}`}
                />
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-75 ${website.accent}`}
                />
                <div className="relative min-w-0">
                  <p className="truncate text-lg font-semibold text-white">
                    {website.title}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-slate-400">
                    {website.path}
                  </p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="relative h-4 w-4 shrink-0 text-white/40 transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </main>
  );
}
