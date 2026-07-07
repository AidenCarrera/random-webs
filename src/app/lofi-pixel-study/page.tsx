import fs from "fs";
import path from "path";
import LofiPixelStudyClient from "./LofiPixelStudyClient";

export const metadata = {
  title: "Lofi Pixel Study - Cozy Retro Room & Radio",
  description:
    "Relax, study, or work in a cozy pixel art room with dynamic lofi music tracks and customizable backgrounds.",
};

const ALLOWED_ALARMS = new Set(["Bedside Clock", "Beep Alarm"]);

export default async function Page() {
  const musicDir = "normalized";
  const alarmDir = "alarms";
  const musicPath = path.join(
    process.cwd(),
    "public",
    "lofi-pixel-study",
    musicDir,
  );
  const alarmPath = path.join(
    process.cwd(),
    "public",
    "lofi-pixel-study",
    alarmDir,
  );
  let musicFiles: string[] = [];
  let alarmFiles: string[] = [];
  try {
    if (fs.existsSync(musicPath)) {
      musicFiles = fs
        .readdirSync(musicPath)
        .filter((file) => /\.(mp3|wav|ogg|m4a)$/i.test(file));
    }
    if (fs.existsSync(alarmPath)) {
      alarmFiles = fs
        .readdirSync(alarmPath)
        .filter((file) => /\.(mp3|wav|ogg|m4a)$/i.test(file));
    }
  } catch (error) {
    console.error("Failed to read audio files from public directory:", error);
  }

  // Parse the format: "(Artist) - (Title)"
  const tracks = musicFiles.map((filename) => {
    const cleanName = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, "");
    const parts = cleanName.split(" - ");
    const artist = parts[0] || "Unknown";
    const title = parts.slice(1).join(" - ") || cleanName;
    return {
      id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: title,
      artist: artist,
      path: `/lofi-pixel-study/${musicDir}/${filename}`,
    };
  });

  const alarms = alarmFiles.map((filename) => {
    const cleanName = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, "");
    return {
      id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: cleanName,
      path: `/lofi-pixel-study/${alarmDir}/${filename}`,
    };
  }).filter((alarm) => ALLOWED_ALARMS.has(alarm.name));

  return <LofiPixelStudyClient initialTracks={tracks} initialAlarms={alarms} />;
}
