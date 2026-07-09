"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { WebsiteEntry } from "@/lib/websites";

const PASSWORD = "olo";

type DeveloperGateProps = {
  websites: WebsiteEntry[];
};

export function DeveloperGate({ websites }: DeveloperGateProps) {
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (value === PASSWORD) {
      setUnlocked(true);
      setError("");
      return;
    }

    setError("Incorrect password.");
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Hidden Developer Page
            </p>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-[0.08em] text-white">
              Enter Password
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Direct-link access only.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit} suppressHydrationWarning>
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
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Hidden Developer Page
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.08em] text-white">
            Website Index
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Alphabetical quick navigation for every public website in the
            collection. This route is intentionally unlinked and excluded from the
            random rotation.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((website) => (
              <Link
                key={website.path}
                href={website.path}
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-5 py-4 transition-colors duration-200 hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                <p className="text-lg font-semibold text-white">{website.title}</p>
                <p className="mt-2 text-sm text-slate-300">{website.path}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
