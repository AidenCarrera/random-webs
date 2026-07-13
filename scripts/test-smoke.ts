import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

type Options = {
  baseUrl?: string;
  changedOnly: boolean;
  playwrightArgs: string[];
};

function requireValue(args: string[], index: number, option: string) {
  const value = args[index + 1];

  if (!value) {
    throw new Error(`${option} requires a URL.`);
  }

  return value;
}

function parseOptions(args: string[]): Options {
  const options: Options = {
    changedOnly: false,
    playwrightArgs: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--changed") {
      options.changedOnly = true;
      continue;
    }

    if (argument === "--base-url") {
      options.baseUrl = requireValue(args, index, argument);
      index += 1;
      continue;
    }

    options.playwrightArgs.push(argument);
  }

  if (options.baseUrl) {
    const parsedBaseUrl = new URL(options.baseUrl);

    if (!new Set(["http:", "https:"]).has(parsedBaseUrl.protocol)) {
      throw new Error("--base-url must use http or https.");
    }

    options.baseUrl = parsedBaseUrl.toString();
  }

  return options;
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const require = createRequire(import.meta.url);
  const playwrightCli = require.resolve("@playwright/test/cli");
  const result = spawnSync(
    process.execPath,
    [playwrightCli, "test", ...options.playwrightArgs],
    {
      env: {
        ...process.env,
        SMOKE_BASE_URL: options.baseUrl ?? process.env.SMOKE_BASE_URL,
        SMOKE_CHANGED_ONLY: options.changedOnly ? "true" : "false",
      },
      stdio: "inherit",
      windowsHide: true,
    },
  );

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
