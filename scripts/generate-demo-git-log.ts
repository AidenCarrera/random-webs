import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputPath = path.join(
  repositoryRoot,
  "public",
  "repo-visualizer",
  "demo-git-log.txt",
);

const result = spawnSync(
  "git",
  [
    "log",
    "--reverse",
    "--date=iso-strict",
    "--pretty=medium",
    "--numstat",
    "--summary",
    "--no-color",
    "--no-decorate",
  ],
  {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  },
);

if (result.error) {
  throw new Error(`Could not run Git: ${result.error.message}`);
}

if (result.status !== 0) {
  throw new Error(result.stderr.trim() || "Git log generation failed.");
}

if (!result.stdout.trim()) {
  throw new Error(
    "Git returned an empty history; the demo log was not changed.",
  );
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, result.stdout, "utf8");

console.log(
  `Generated ${path.relative(repositoryRoot, outputPath)} from the current branch.`,
);
