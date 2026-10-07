"use client";

import { useEffect } from "react";

import { markWebsiteRevealed } from "@/lib/revealed-websites";

// Unlocks the website's card on the home page.
export function MarkDiscovered({ path }: { path: string }) {
  useEffect(() => {
    markWebsiteRevealed(path);
  }, [path]);

  return null;
}
