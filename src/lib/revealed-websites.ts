export const REVEALED_WEBSITES_KEY = "random-webs-revealed-websites";

export function readRevealedWebsites() {
  try {
    const savedWebsites = window.localStorage.getItem(REVEALED_WEBSITES_KEY);
    const parsedWebsites: unknown = savedWebsites
      ? JSON.parse(savedWebsites)
      : [];

    return Array.isArray(parsedWebsites)
      ? parsedWebsites.filter(
          (savedPath): savedPath is string => typeof savedPath === "string",
        )
      : [];
  } catch {
    try {
      window.localStorage.removeItem(REVEALED_WEBSITES_KEY);
    } catch {
      // Storage unavailable.
    }
    return [];
  }
}

export function saveRevealedWebsites(paths: string[]) {
  try {
    window.localStorage.setItem(REVEALED_WEBSITES_KEY, JSON.stringify(paths));
  } catch {
    // Storage unavailable.
  }
}

export function markWebsiteRevealed(path: string) {
  const revealedWebsites = readRevealedWebsites();

  if (!revealedWebsites.includes(path)) {
    saveRevealedWebsites([...revealedWebsites, path]);
  }
}
