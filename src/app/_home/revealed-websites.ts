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
      // Storage is unavailable; start with nothing revealed.
    }
    return [];
  }
}

export function saveRevealedWebsites(paths: string[]) {
  try {
    window.localStorage.setItem(REVEALED_WEBSITES_KEY, JSON.stringify(paths));
  } catch {
    // Navigation still works when browser storage is unavailable.
  }
}
