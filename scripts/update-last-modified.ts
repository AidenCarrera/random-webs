import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const websitesPath = path.join(repositoryRoot, "src", "lib", "websites.ts");
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function runGit(args: string[]) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLastModified(relativePath: string, currentDate: string) {
  const workingTreeChanges = runGit([
    "status",
    "--porcelain",
    "--untracked-files=all",
    "--",
    relativePath,
  ]);

  if (workingTreeChanges) {
    return getToday();
  }

  const committedDate = runGit([
    "log",
    "-1",
    "--format=%cs",
    "--",
    relativePath,
  ]);

  return committedDate && isoDatePattern.test(committedDate)
    ? committedDate
    : currentDate;
}

function main() {
  const source = fs.readFileSync(websitesPath, "utf8");
  let websiteCount = 0;

  const updatedWebsites = source.replace(
    /(path: "(\/[^"\r\n]+)",\r?\n\s+lastModified: ")([^"\r\n]+)(")/g,
    (
      match,
      prefix: string,
      websitePath: string,
      currentDate: string,
      suffix,
    ) => {
      websiteCount += 1;
      const routePath = `src/app${websitePath}`;
      const lastModified = getLastModified(routePath, currentDate);

      return `${prefix}${lastModified}${suffix}`;
    },
  );

  const updatedSource = updatedWebsites.replace(
    /(export const SITE_LAST_MODIFIED = ")([^"\r\n]+)(";)/,
    (match, prefix: string, currentDate: string, suffix: string) => {
      const lastModified = getLastModified("src/app/page.tsx", currentDate);

      return `${prefix}${lastModified}${suffix}`;
    },
  );

  if (websiteCount === 0) {
    throw new Error("No website lastModified fields were found to update.");
  }

  if (updatedSource === source) {
    console.log(`All ${websiteCount} lastModified dates are already current.`);
    return;
  }

  fs.writeFileSync(websitesPath, updatedSource, "utf8");
  console.log(`Updated lastModified dates for ${websiteCount} websites.`);
}

main();
