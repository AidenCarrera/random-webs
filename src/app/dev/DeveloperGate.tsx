"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { WebsiteEntry } from "@/lib/websites";

const PASSWORD = "olo";
const UNLOCK_STORAGE_KEY = "developer-gate-unlocked";

type DeveloperGateProps = {
  websites: WebsiteEntry[];
};

export function DeveloperGate({ websites }: DeveloperGateProps) {
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [hasCheckedSavedUnlock, setHasCheckedSavedUnlock] = useState(false);
  const [error, setError] = useState("");

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

    setError("Incorrect password.");
  };

  if (!hasCheckedSavedUnlock) {
    return null;
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center bg-neutral-950 px-6 py-12 text-slate-100 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-white">
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
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-cyan-300/40"
                placeholder="Password"
                suppressHydrationWarning
              />
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <button
                type="submit"
                className="rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.24em] text-black"
                suppressHydrationWarning
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-white">
            Website Index
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Alphabetical quick navigation for every website in the collection.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((website) => (
              <Link
                key={website.path}
                href={website.path}
                className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25"
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br opacity-30 transition-opacity duration-200 group-hover:opacity-40 ${website.accent}`}
                />
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-75 ${website.accent}`}
                />
                <p className="relative text-lg font-semibold text-white">
                  {website.title}
                </p>
                <p className="relative mt-2 text-sm text-slate-300">
                  {website.path}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
