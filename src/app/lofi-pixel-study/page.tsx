import fs from "fs";
import path from "path";
import LofiPixelStudyClient from "./LofiPixelStudyClient";

export const metadata = {
  title: "Lofi Pixel Study - Cozy Retro Room & Radio",
  description:
    "Relax, study, or work in a cozy pixel art room with dynamic lofi music tracks and customizable backgrounds.",
};

export default async function Page() {
  const dirPath = path.join(process.cwd(), "public", "lofi-pixel-study");
  let files: string[] = [];
  try {
    if (fs.existsSync(dirPath)) {
      files = fs
        .readdirSync(dirPath)
        .filter((file) => /\.(mp3|wav|ogg|m4a)$/i.test(file));
    }
  } catch (error) {
    console.error("Failed to read audio files from public directory:", error);
  }

  // Parse the format: "(Artist) - (Title)"
  const tracks = files.map((filename) => {
    const cleanName = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, "");
    const parts = cleanName.split(" - ");
    const artist = parts[0] || "Unknown";
    const title = parts.slice(1).join(" - ") || cleanName;
    return {
      id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: title,
      artist: artist,
      path: `/lofi-pixel-study/${filename}`,
    };
  });

  return <LofiPixelStudyClient initialTracks={tracks} />;
}
