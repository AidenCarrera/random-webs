import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Options = {
  dryRun: boolean;
  extensions: Set<string>;
  inputDirectory: string;
  loudnessRange: number;
  outputDirectory?: string;
  overwrite: boolean;
  targetLufs: number;
  truePeak: number;
};

type LoudnormStats = {
  input_i: string;
  input_lra: string;
  input_thresh: string;
  input_tp: string;
  target_offset: string;
};

const DEFAULT_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a"];

function printHelp() {
  console.log(`Usage: pnpm normalize:lofi [options]

Normalize top-level audio files with FFmpeg's two-pass loudnorm filter.

Options:
  --input-dir <path>    Input directory (default: public/lofi-pixel-study)
  --output-dir <path>   Output directory (default: <input-dir>/normalized)
  --target-lufs <value> Integrated loudness target (default: -14)
  --true-peak <value>   True-peak target in dBTP (default: -1)
  --lra <value>         Loudness range target (default: 11)
  --extensions <list>   Comma-separated extensions (default: .mp3,.wav,.ogg,.m4a)
  --overwrite           Safely replace each source file after normalization
  --dry-run             Show planned files without invoking FFmpeg
  -h, --help            Show this help message`);
}

function requireValue(args: string[], index: number, option: string) {
  const value = args[index + 1];

  if (!value) {
    throw new Error(`${option} requires a value.`);
  }

  return value;
}

function parseNumber(value: string, option: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${option} must be a finite number.`);
  }

  return parsed;
}

function parseExtensions(value: string) {
  const extensions = value
    .split(",")
    .map((extension) => extension.trim().toLowerCase())
    .filter(Boolean)
    .map((extension) =>
      extension.startsWith(".") ? extension : `.${extension}`,
    );

  if (extensions.length === 0) {
    throw new Error("--extensions must contain at least one extension.");
  }

  return new Set(extensions);
}

function parseOptions(args: string[]): Options | null {
  const options: Options = {
    dryRun: false,
    extensions: new Set(DEFAULT_EXTENSIONS),
    inputDirectory: "public/lofi-pixel-study",
    loudnessRange: 11,
    overwrite: false,
    targetLufs: -14,
    truePeak: -1,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    switch (argument) {
      case "--input-dir":
        options.inputDirectory = requireValue(args, index, argument);
        index += 1;
        break;
      case "--output-dir":
        options.outputDirectory = requireValue(args, index, argument);
        index += 1;
        break;
      case "--target-lufs":
        options.targetLufs = parseNumber(
          requireValue(args, index, argument),
          argument,
        );
        index += 1;
        break;
      case "--true-peak":
        options.truePeak = parseNumber(
          requireValue(args, index, argument),
          argument,
        );
        index += 1;
        break;
      case "--lra":
        options.loudnessRange = parseNumber(
          requireValue(args, index, argument),
          argument,
        );
        index += 1;
        break;
      case "--extensions":
        options.extensions = parseExtensions(
          requireValue(args, index, argument),
        );
        index += 1;
        break;
      case "--overwrite":
        options.overwrite = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        return null;
      default:
        throw new Error(`Unknown option: ${argument}`);
    }
  }

  options.inputDirectory = path.resolve(options.inputDirectory);

  if (!existsSync(options.inputDirectory)) {
    throw new Error(`Input directory does not exist: ${options.inputDirectory}`);
  }

  if (!options.overwrite) {
    options.outputDirectory = path.resolve(
      options.outputDirectory ??
        path.join(options.inputDirectory, "normalized"),
    );
  }

  return options;
}

function assertFfmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], {
    stdio: "ignore",
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      "ffmpeg was not found on PATH. Install ffmpeg or add it to PATH, then rerun this script.",
    );
  }
}

function getLoudnormStats(filePath: string, options: Options) {
  const filter = [
    `loudnorm=I=${options.targetLufs}`,
    `TP=${options.truePeak}`,
    `LRA=${options.loudnessRange}`,
    "print_format=json",
  ].join(":");
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-nostats",
      "-i",
      filePath,
      "-af",
      filter,
      "-f",
      "null",
      "-",
    ],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
    },
  );

  if (result.error || result.status !== 0) {
    throw new Error(`ffmpeg analysis failed for '${filePath}'.`);
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const jsonStart = output.indexOf("{");
  const jsonEnd = output.lastIndexOf("}");

  if (jsonStart < 0 || jsonEnd < jsonStart) {
    throw new Error(`Could not parse loudnorm JSON for '${filePath}'.`);
  }

  try {
    return JSON.parse(output.slice(jsonStart, jsonEnd + 1)) as LoudnormStats;
  } catch {
    throw new Error(`Could not parse loudnorm JSON for '${filePath}'.`);
  }
}

function getCodecArgs(extension: string) {
  switch (extension) {
    case ".mp3":
      return ["-codec:a", "libmp3lame", "-b:a", "192k"];
    case ".wav":
      return ["-codec:a", "pcm_s16le"];
    case ".ogg":
      return ["-codec:a", "libvorbis", "-q:a", "5"];
    case ".m4a":
      return ["-codec:a", "aac", "-b:a", "192k"];
    default:
      return ["-codec:a", "copy"];
  }
}

function normalizeFile(
  sourcePath: string,
  destinationPath: string,
  options: Options,
) {
  const fileName = path.basename(sourcePath);
  const extension = path.extname(sourcePath).toLowerCase();

  console.log(`\nAnalyzing: ${fileName}`);
  const stats = getLoudnormStats(sourcePath, options);
  console.log(
    `  Input:  ${stats.input_i} LUFS, ${stats.input_tp} dBTP, LRA ${stats.input_lra} LU`,
  );

  const filter = [
    `loudnorm=I=${options.targetLufs}`,
    `TP=${options.truePeak}`,
    `LRA=${options.loudnessRange}`,
    `measured_I=${stats.input_i}`,
    `measured_TP=${stats.input_tp}`,
    `measured_LRA=${stats.input_lra}`,
    `measured_thresh=${stats.input_thresh}`,
    `offset=${stats.target_offset}`,
    "linear=true",
    "print_format=summary",
  ].join(":");

  mkdirSync(path.dirname(destinationPath), { recursive: true });
  console.log(`Writing:   ${destinationPath}`);

  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-y",
      "-i",
      sourcePath,
      "-af",
      filter,
      ...getCodecArgs(extension),
      destinationPath,
    ],
    {
      stdio: "inherit",
      windowsHide: true,
    },
  );

  if (result.error || result.status !== 0) {
    throw new Error(`ffmpeg normalization failed for '${sourcePath}'.`);
  }
}

function main() {
  const options = parseOptions(process.argv.slice(2));

  if (!options) {
    return;
  }

  const files = readdirSync(options.inputDirectory, { withFileTypes: true })
    .filter((entry) => {
      const extension = path.extname(entry.name).toLowerCase();
      return entry.isFile() && options.extensions.has(extension);
    })
    .map((entry) => ({
      extension: path.extname(entry.name).toLowerCase(),
      name: entry.name,
      path: path.join(options.inputDirectory, entry.name),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));

  if (files.length === 0) {
    console.log(`No matching audio files found in ${options.inputDirectory}`);
    return;
  }

  console.log(`Normalizing ${files.length} file(s)`);
  console.log(
    `Target: ${options.targetLufs} LUFS, true peak: ${options.truePeak} dBTP, LRA: ${options.loudnessRange} LU`,
  );

  if (!options.dryRun) {
    assertFfmpegAvailable();
  }

  for (const file of files) {
    if (options.overwrite) {
      if (options.dryRun) {
        console.log(`Would overwrite: ${file.path}`);
        continue;
      }

      const parsedPath = path.parse(file.path);
      const temporaryPath = path.join(
        parsedPath.dir,
        `.${parsedPath.name}.normalized${file.extension}`,
      );

      try {
        normalizeFile(file.path, temporaryPath, options);
        renameSync(temporaryPath, file.path);
      } finally {
        if (existsSync(temporaryPath)) {
          rmSync(temporaryPath, { force: true });
        }
      }

      continue;
    }

    const destinationPath = path.join(options.outputDirectory!, file.name);

    if (existsSync(destinationPath)) {
      console.log(
        `\nSkipping:  ${file.name} (already exists in output directory)`,
      );
      continue;
    }

    if (options.dryRun) {
      console.log(`Would write: ${destinationPath}`);
      continue;
    }

    normalizeFile(file.path, destinationPath, options);
  }

  console.log("\nDone.");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
