import { execFileSync } from "node:child_process";

import { WEBSITES } from "../../src/lib/websites.ts";

function runGit(repositoryRoot: string, args: string[]) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function getChangedFiles(repositoryRoot: string) {
  try {
    runGit(repositoryRoot, ["rev-parse", "--verify", "HEAD"]);

    const trackedChanges = runGit(repositoryRoot, [
      "diff",
      "--name-only",
      "--diff-filter=ACMRTUXB",
      "HEAD",
      "--",
    ]);
    const untrackedChanges = runGit(repositoryRoot, [
      "ls-files",
      "--others",
      "--exclude-standard",
    ]);

    return new Set(
      `${trackedChanges}\n${untrackedChanges}`
        .split(/\r?\n/)
        .map((file) => file.trim().replaceAll("\\", "/"))
        .filter(Boolean),
    );
  } catch {
    throw new Error(
      "Could not compare website changes with the latest Git commit.",
    );
  }
}

export function isWebsiteFile(routePath: string, file: string) {
  const routeDirectory = routePath.replace(/^\//, "");
  const websiteRoots = [
    `src/app/${routeDirectory}`,
    `public/${routeDirectory}`,
  ];

  return websiteRoots.some(
    (root) => file === root || file.startsWith(`${root}/`),
  );
}

export function getChangedWebsites(repositoryRoot: string) {
  const changedFiles = getChangedFiles(repositoryRoot);

  return WEBSITES.filter((website) =>
    [...changedFiles].some((file) => isWebsiteFile(website.path, file)),
  ).sort((left, right) => left.path.localeCompare(right.path, "en"));
}
