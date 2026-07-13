import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WEBSITES } from "../src/lib/websites.ts";
import { getChangedWebsites } from "./lib/changed-websites.ts";

type Options = {
  baseUrl: string;
  changedOnly: boolean;
  dryRun: boolean;
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

function printHelp() {
  console.log(`Usage: pnpm open:websites [options]

Open registered Random Webs routes in alphabetical order.

Options:
  --changed          Open only websites changed since the latest commit
  --dry-run          Print URLs without opening a browser
  --base-url <url>   Override the default http://localhost:3000 URL
  -h, --help         Show this help message`);
}

function parseOptions(args: string[]): Options | null {
  const options: Options = {
    baseUrl: process.env.WEBSITES_BASE_URL ?? "http://localhost:3000",
    changedOnly: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    switch (argument) {
      case "--changed":
        options.changedOnly = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--base-url": {
        const baseUrl = args[index + 1];

        if (!baseUrl) {
          throw new Error("--base-url requires a URL.");
        }

        options.baseUrl = baseUrl;
        index += 1;
        break;
      }
      case "-h":
      case "--help":
        printHelp();
        return null;
      default:
        throw new Error(`Unknown option: ${argument}`);
    }
  }

  const parsedBaseUrl = new URL(options.baseUrl);

  if (!new Set(["http:", "https:"]).has(parsedBaseUrl.protocol)) {
    throw new Error("--base-url must use http or https.");
  }

  options.baseUrl = parsedBaseUrl.toString();
  return options;
}

function getWebsites(changedOnly: boolean) {
  return changedOnly
    ? getChangedWebsites(repositoryRoot)
    : [...WEBSITES].sort((left, right) =>
        left.path.localeCompare(right.path, "en"),
      );
}

function openUrl(url: string) {
  let command: string;
  let args: string[];

  switch (process.platform) {
    case "win32":
      command = "cmd.exe";
      args = ["/d", "/s", "/c", "start", "", url];
      break;
    case "darwin":
      command = "open";
      args = [url];
      break;
    default:
      command = "xdg-open";
      args = [url];
      break;
  }

  const result = spawnSync(command, args, {
    stdio: "ignore",
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}.`);
  }
}

function main() {
  const options = parseOptions(process.argv.slice(2));

  if (!options) {
    return;
  }

  const websites = getWebsites(options.changedOnly);

  if (websites.length === 0) {
    console.log(
      options.changedOnly
        ? "No modified websites found since the latest commit."
        : "No registered websites found.",
    );
    return;
  }

  const qualifier = options.changedOnly ? " modified" : "";
  console.log(`Found ${websites.length}${qualifier} website(s):`);

  for (const website of websites) {
    const url = new URL(website.path, options.baseUrl).toString();

    if (options.dryRun) {
      console.log(`Would open ${url}`);
      continue;
    }

    console.log(`Opening ${url}`);
    openUrl(url);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
