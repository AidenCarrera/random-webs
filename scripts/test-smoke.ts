import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

type Options = {
  baseUrl?: string;
  changedOnly: boolean;
  playwrightArgs: string[];
  production: boolean;
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
    production: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--changed") {
      options.changedOnly = true;
      continue;
    }

    if (argument === "--production") {
      options.production = true;
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

  if (options.baseUrl && options.production) {
    throw new Error(
      "--production cannot be combined with --base-url because external servers are not built locally.",
    );
  }

  return options;
}

function runProductionBuild() {
  const require = createRequire(import.meta.url);
  const nextCli = require.resolve("next/dist/bin/next");
  const result = spawnSync(process.execPath, [nextCli, "build"], {
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Production build exited with status ${result.status}.`);
  }
}

function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.production) {
    runProductionBuild();
  }

  const require = createRequire(import.meta.url);
  const playwrightCli = require.resolve("@playwright/test/cli");
  const smokePort = process.env.SMOKE_PORT ?? "3100";
  const result = spawnSync(
    process.execPath,
    [playwrightCli, "test", ...options.playwrightArgs],
    {
      env: {
        ...process.env,
        SMOKE_BASE_URL: options.baseUrl ?? process.env.SMOKE_BASE_URL,
        SMOKE_CHANGED_ONLY: options.changedOnly ? "true" : "false",
        SMOKE_SERVER_COMMAND: options.production
          ? `pnpm start --hostname 127.0.0.1 --port ${smokePort}`
          : process.env.SMOKE_SERVER_COMMAND,
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
