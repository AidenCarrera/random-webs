import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WEBSITES } from "../src/lib/websites";

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We exclude pages that already handle metadata properly
const EXCLUDED_PATHS = new Set(["/lofi-pixel-study", "/dev"]);

// Titles and meta descriptions tailored for search queries
const RICH_METADATA: Record<string, { title: string; description: string }> = {
  "/algo-race": {
    title: "Algo Race - Sorting Algorithm Visualizer",
    description:
      "Watch sorting algorithms compete side by side while comparing speed and overall efficiency.",
  },
  "/arcana-tarot": {
    title: "Arcana Tarot - Virtual Tarot Readings",
    description:
      "Shuffle the deck, draw tarot cards, and explore detailed meanings with a modern interactive tarot experience.",
  },
  "/ascii-vision": {
    title: "ASCII Vision - Image to ASCII Art",
    description:
      "Upload any image and instantly transform it into detailed ASCII art. Adjust characters, colors, contrast, and resolution to create your own text-based artwork.",
  },
  "/beat-maker": {
    title: "Beat Maker - Browser Beat Sequencer",
    description:
      "Build beats with an intuitive step sequencer, swappable drum sounds, an 808 bass editor, and mixer controls. No download required.",
  },
  "/click-speed-test": {
    title: "Click Speed Test - Measure CPS",
    description:
      "How fast can you click? Test your CPS (clicks per second) with different time limits, track your scores, and improve your clicking speed.",
  },
  "/dont-click-me": {
    title: "Don't Click Me - Interactive Button Game",
    description:
      "An interactive game where you are told not to click the button. Can you resist the temptation? See what happens if you click!",
  },
  "/emoji-rain": {
    title: "Emoji Rain - Falling Emoji Animation",
    description:
      "Fill your screen with falling emojis. Mix categories, adjust the look and behavior, and create colorful animated emoji showers.",
  },
  "/encoded-message": {
    title: "Encoded Message - Decrypt the Story",
    description:
      "Hover over the encrypted transmission to decrypt the message and unveil the secret story.",
  },
  "/focus-timer": {
    title: "Focus Timer - Pomodoro Timer",
    description:
      "Boost your productivity with a clean, customizable Pomodoro focus timer. Designed to help you stay on task and manage your study/work sessions.",
  },
  "/fractal-explorer": {
    title: "Fractal Explorer - Mandelbrot Viewer",
    description:
      "Explore the Mandelbrot set with smooth zooming, customizable colors, and an optional audio-reactive mode that brings fractals to life.",
  },
  "/gravity-box": {
    title: "Gravity Box - Physics Sandbox",
    description:
      "Experiment with gravity, collisions, and object physics in a playful sandbox where every setting changes the simulation.",
  },
  "/hypno-spiral": {
    title: "Hypno Spiral - Interactive Hypnotic Spiral",
    description:
      "Move your mouse to shape a mesmerizing hypnotic spiral as it shifts and evolves in real time, creating endlessly unique visual patterns.",
  },
  "/lava-lamp": {
    title: "Lava Lamp - Interactive Lava Simulation",
    description:
      "Relax with a virtual lava lamp. Customize the colors of the bubbles and liquid to create your own calming combinations.",
  },
  "/magic-8-ball": {
    title: "Magic 8 Ball - Decision Maker",
    description:
      "Ask a question, shake the Magic 8 Ball, and reveal a random answer. A simple browser version of the fortune-telling toy.",
  },
  "/mandala-maker": {
    title: "Mandala Maker - Symmetrical Drawing Tool",
    description:
      "Draw beautiful radial artwork with brushes and colors, then export your finished mandalas as images.",
  },
  "/matrix-rain": {
    title: "Matrix Rain - Hacker Terminal",
    description:
      "Type like you're in a hacker movie as code appears across the screen with a Matrix-inspired digital rain effect in the background.",
  },
  "/mindful-breathe": {
    title: "Mindful Breathe - Breathing Visualizer",
    description:
      "Follow a calming breathing cycle with a gently pulsing orb, relaxing ambient music, and customizable timing to help you slow down and unwind.",
  },
  "/morse-code": {
    title: "Morse Code - Translate and Encode",
    description:
      "Translate text to Morse code or tap your own messages with an interactive key. Practice, listen to the tones, and learn with a built-in Morse code cheat sheet.",
  },
  "/olo-terminal": {
    title: "Olo Terminal - Web Command Line",
    description:
      "Explore a Linux-inspired browser terminal filled with playful interactions, hidden surprises, and entertaining utilities waiting to be discovered.",
  },
  "/pad-synth": {
    title: "Pad Synth - Browser Synth",
    description:
      "Play notes across major, minor, pentatonic, and blues scales with selectable waveforms, volume, reverb, and echo controls in a soft tactile interface.",
  },
  "/particle-collider": {
    title: "Particle Collider - Attract & Repel Particles",
    description:
      "Shape a glowing particle field with your mouse. Switch between attraction and repulsion, then tune force strength and particle count in real time.",
  },
  "/party-mode": {
    title: "Party Mode - Celebration Button",
    description:
      "Trigger a colorful confetti celebration with, floating party emojis, a dancing headline, and a colorful animated backdrop.",
  },
  "/pixel-art": {
    title: "Pixel Art - Simple Sprite Maker",
    description:
      "Draw pixel art on a resizable grid with a 32-color palette, pencil, eraser, fill, and eyedropper tools, undo/redo, and PNG export.",
  },
  "/polyrhythm-visualizer": {
    title: "Polyrhythm Visualizer - Layered Rhythms",
    description:
      "Hear layered rhythms at adjustable tempo while switching between circle, timeline, bloom, and 3D visualizations with playback controls.",
  },
  "/repo-visualizer": {
    title: "Repo Visualizer - GitHub History Visualizer",
    description:
      "Load a GitHub repository, local git log, or demo history and watch commits animate through a file-tree graph with authors, change statuses, stats, and playback controls.",
  },
  "/solar-system": {
    title: "Solar System - Custom Planet Sandbox",
    description:
      "Build a custom solar system with textured planets and adjustable sizes, orbits, speeds, moons, rings, and starfield themes, then export a PNG snapshot.",
  },
  "/sticky-notes": {
    title: "Sticky Notes - Draggable Note Board",
    description:
      "Create and arrange colorful sticky notes on a paper-like board with double-click or quick add, autosave, delete/reset controls, and Markdown export.",
  },
  "/style-pet": {
    title: "Style Pet - Virtual Pet Simulator",
    description:
      "Care for a handheld-style virtual pet by feeding, petting, cleaning, and managing sleep, then customize its skin, hats, and accessories as it grows.",
  },
  "/submit-to-void": {
    title: "Submit to Void - Black Hole Message Shredder",
    description:
      "Type a short message and watch every character shred into a black hole, surrounded by stars, and optional GIF export.",
  },
  "/text-encrypt": {
    title: "Text Encrypt - Convert Text to Secret Codes",
    description:
      "Transform text into binary, hexadecimal, Caesar-shifted, Base64, Atbash, and ROT13 or ROT47 output with adjustable settings and one-click copying.",
  },
  "/typing-racer": {
    title: "Typing Racer - Typing WPM Race",
    description:
      "Race CPU opponents through neon typing passages in Rookie, Pro, or Cyber mode while tracking live WPM, accuracy, time, rank, and your high score.",
  },
  "/zen-garden": {
    title: "Zen Garden - Landscape Sandbox",
    description:
      "Design a calming digital sandscape with plants and decorations, water, multiple sand themes, and image or layout export.",
  },
};

function main() {
  console.log("Generating layout.tsx files for subpages...");

  const websites = [...WEBSITES].sort((a, b) => a.path.localeCompare(b.path));

  for (const site of websites) {
    if (EXCLUDED_PATHS.has(site.path)) {
      console.log(`Skipping excluded path: ${site.path}`);
      continue;
    }

    const dirName = site.path.replace(/^\//, "");
    const dirPath = path.join(__dirname, "..", "src", "app", dirName);

    if (!fs.existsSync(dirPath)) {
      console.warn(`Warning: Directory does not exist: ${dirPath}`);
      continue;
    }

    const meta = {
      title: RICH_METADATA[site.path]?.title || site.title,
      description: RICH_METADATA[site.path]?.description || site.blurb,
    };

    const layoutContent = `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "${meta.title.replace(/"/g, '\\"')}",
  },
  description: "${meta.description.replace(/"/g, '\\"')}",
  openGraph: {
    title: "${meta.title.replace(/"/g, '\\"')}",
    description: "${meta.description.replace(/"/g, '\\"')}",
    url: "${site.path}",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "${meta.title.replace(/"/g, '\\"')} Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "${meta.title.replace(/"/g, '\\"')}",
    description: "${meta.description.replace(/"/g, '\\"')}",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "${site.path}",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;

    const layoutFilePath = path.join(dirPath, "layout.tsx");
    fs.writeFileSync(layoutFilePath, layoutContent, "utf8");
    console.log(`Successfully wrote layout.tsx for ${site.path}`);
  }

  console.log("Generation complete!");
}

main();
