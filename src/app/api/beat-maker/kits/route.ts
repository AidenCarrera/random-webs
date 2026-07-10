import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const TRACK_FILES: Record<string, string> = {
  kick: "kick.wav",
  snare: "snare.wav",
  hihat: "hi-hat.wav",
  clap: "clap.wav",
  openhat: "open-hat.wav",
  ride: "ride.wav",
  cowbell: "cowbell.wav",
  perc: "perc.wav",
  bass: "808.wav",
};

export async function GET() {
  const root = path.join(process.cwd(), "public", "beat-maker");

  try {
    const entries = await readdir(root, { withFileTypes: true });
    const kits = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const files = await readdir(path.join(root, entry.name));
          const available = new Map(
            files.map((file) => [file.toLowerCase(), file]),
          );
          const samples = Object.fromEntries(
            Object.entries(TRACK_FILES).flatMap(([track, expected]) => {
              const file = available.get(expected.toLowerCase());
              return file ? [[track, file]] : [];
            }),
          );

          return {
            id: entry.name.toLowerCase(),
            name: `${entry.name} Kit`,
            folder: entry.name,
            samples,
          };
        }),
    );

    return NextResponse.json(kits);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
