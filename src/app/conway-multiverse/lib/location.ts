// The open universe lives in the URL hash (#B3/S23), so a universe can be
// linked to and the back button returns to the map.

import { parseRule, ruleString, type Rule } from "./rules";

const listeners = new Set<() => void>();
let current: string | null = null;

const notify = () => listeners.forEach((listener) => listener());

const onPopState = () => {
  current = window.location.hash;
  notify();
};

export const hashStore = {
  subscribe(listener: () => void) {
    // The page may have been visited before with another hash.
    current = window.location.hash;
    if (listeners.size === 0) window.addEventListener("popstate", onPopState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        window.removeEventListener("popstate", onPopState);
      }
    };
  },
  get: () => (current ??= window.location.hash),
  getServer: () => "",
};

/** The rule a hash points at, or null for the map. */
export const ruleFromHash = (hash: string) =>
  hash.length > 1 ? parseRule(decodeURIComponent(hash.slice(1))) : null;

/** Opens a universe (or the map, for null), pushing a history entry or not. */
export function navigate(rule: Rule | null, mode: "push" | "replace") {
  current = rule === null ? "" : `#${ruleString(rule)}`;
  try {
    const url =
      current || `${window.location.pathname}${window.location.search}`;
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  } catch {
    // Browsers throttle rapid history updates; the view changes regardless.
  }
  notify();
}
