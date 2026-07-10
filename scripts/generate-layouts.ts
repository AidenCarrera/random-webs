import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WEBSITES } from "../src/lib/websites";

// Handle __dirname in ES Modules (though we compile with tsx)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We exclude pages that already handle metadata properly
const EXCLUDED_PATHS = new Set(["/lofi-pixel-study", "/dev"]);

// High-quality titles and meta descriptions tailored for search queries
const RICH_METADATA: Record<string, { title: string; description: string }> = {
  "/arcana-tarot": {
    title: "Arcana Tarot - Interactive Tarot Card Reading Simulator",
    description: "Draw the cards and uncover your destiny. An interactive virtual tarot reading experience featuring beautiful animations, card details, and spreads.",
  },
  "/ascii-vision": {
    title: "ASCII Vision - Live Video-to-ASCII Text Converter",
    description: "Transform your camera feed or video into real-time ASCII text art. Adjust characters, colors, and density with this unique creative coding tool.",
  },
  "/beat-maker": {
    title: "Beat Maker - Interactive Web Rhythm Sequencer & Drum Machine",
    description: "Create, customize, and loop your own beats in your browser. An intuitive web-based audio sequencer and drum pad for aspiring beatmakers.",
  },
  "/click-speed-test": {
    title: "Click Speed Test - Measure Your CPS (Clicks Per Second)",
    description: "How fast can you click? Test your CPS (clicks per second) with different time limits, track your scores, and improve your clicking speed.",
  },
  "/dont-click-me": {
    title: "Don't Click Me - The Ultimate Interactive Button Challenge",
    description: "A hilarious and interactive game where you are told not to click the button. Can you resist the temptation? See what happens if you click!",
  },
  "/emoji-rain": {
    title: "Emoji Rain - Fun Falling Emoji Particles & Visualizer",
    description: "Create a beautiful downpour of customized emoji particles. Adjust gravity, speed, size, and emoji types in this interactive canvas toy.",
  },
  "/focus-timer": {
    title: "Focus Timer - Clean Pomodoro Countdown for Deep Work",
    description: "Boost your productivity with a clean, customizable Pomodoro focus timer. Designed to help you stay on task and manage your study/work sessions.",
  },
  "/fractal-explorer": {
    title: "Fractal Explorer - Interactive Infinite Mandelbrot Patterns",
    description: "Explore the infinite beauty of fractals in real-time. Zoom into the Mandelbrot set, customize color schemes, and export gorgeous geometric patterns.",
  },
  "/gravity-box": {
    title: "Gravity Box - 2D Physics Sandbox & Particle Simulator",
    description: "Play with gravity, collision physics, and customizable objects in this interactive 2D physics sandbox. Adjust mass, friction, and bounce.",
  },
  "/hypno-spiral": {
    title: "Hypno Spiral - Interactive Optical Illusion Generator",
    description: "Hypnotize yourself with stunning, customizable rotating optical illusion spirals. Adjust speed, patterns, color schemes, and styles.",
  },
  "/lava-lamp": {
    title: "Lava Lamp - Simulated Interactive Physics & Glow",
    description: "Relax with a gorgeous, interactive virtual lava lamp. Customize fluid density, heat, color presets, and particle physics for a cozy vibe.",
  },
  "/magic-8-ball": {
    title: "Magic 8 Ball - Virtual Fortune Teller & Decision Maker",
    description: "Ask a question and let the Magic 8 Ball decide. A fun, retro decision-making tool with customized answers and classic fluid motion.",
  },
  "/mandala-maker": {
    title: "Mandala Maker - Symmetrical Drawing & Generative Art Tool",
    description: "Create beautiful, intricate symmetrical drawings. Customize mirror points, line thickness, brush colors, and export your digital mandala art.",
  },
  "/matrix-rain": {
    title: "Matrix Rain - Classic Digital Code Rain Terminal Simulator",
    description: "Transform your screen into the iconic digital green rain from The Matrix. Adjust rain speed, font sizes, colors, and characters.",
  },
  "/mindful-breathe": {
    title: "Mindful Breathe - Interactive Breathing Guide & Meditation Tool",
    description: "Find your calm with a guided breathing visualizer. Practice box breathing, deep breaths, and customized patterns to reduce anxiety and stress.",
  },
  "/morse-code": {
    title: "Morse Code - Translate, Encode & Listen to Morse Messages",
    description: "Translate text to Morse code and vice versa in real time. Listen to the audio telegraph tones, flash the screen, and practice typing Morse code.",
  },
  "/olo-terminal": {
    title: "Olo Terminal - Interactive Command Line Interface",
    description: "A vintage retro-styled command line terminal in your browser. Run commands, discover hidden easter eggs, and play retro terminal games.",
  },
  "/pad-synth": {
    title: "Pad Synth - Atmospheric Ambient Synthesizer & Soundboard",
    description: "Play and layer rich, atmospheric synthesizer pad chords. A creative web audio tool for designing ambient soundscapes and relaxation music.",
  },
  "/particle-collider": {
    title: "Particle Collider - 2D Physics Particle Collision Simulator",
    description: "Simulate and visualize atomic collisions. Control velocity, particle size, charge, and collision types in an interactive physics dashboard.",
  },
  "/party-mode": {
    title: "Party Mode - Flashing Lights, Beats & Color Visualizer",
    description: "Turn your browser into a dynamic club party. Features flashing neon lights, color loops, interactive beats, and audio visualizer aesthetics.",
  },
  "/pixel-art": {
    title: "Pixel Art - Easy Online Drawing Canvas & Sprite Editor",
    description: "Draw beautiful retro pixel art on a grid canvas. Choose custom palettes, resize grids, export sprites, and animate your pixel creations.",
  },
  "/polyrhythm-visualizer": {
    title: "Polyrhythm Visualizer - Overlapping Time Signatures & Melodies",
    description: "Visualize and hear the complex math of polyrhythms. Customize beats, instruments, tempo, and watch the satisfying mechanical rhythms collide.",
  },
  "/repo-visualizer": {
    title: "Repo Visualizer - Interactive GitHub Repository Structure Maps",
    description: "Generate interactive visual representations of code repository structures. Explore directories, file hierarchies, and branch histories.",
  },
  "/solar-system": {
    title: "Solar System - Interactive Orbit & Gravitation Simulator",
    description: "Explore orbital mechanics and gravity. Build your own solar system, adjust planet masses, speeds, orbits, and watch gravity in action.",
  },
  "/algo-race": {
    title: "Algo Race - Visualizing Sorting Algorithms in Real-Time",
    description: "Watch bubble, quick, merge, and selection sort race to complete! An educational, interactive tool to visualize algorithm efficiency.",
  },
  "/sticky-notes": {
    title: "Sticky Notes - Interactive Virtual Pinboard & Note Organizer",
    description: "Organize your ideas, reminders, and tasks on a virtual corkboard. Drag, color-code, resize, and store notes directly in your browser.",
  },
  "/style-pet": {
    title: "Style Pet - Cute Digital Pet Dress Up & Customizer",
    description: "Adopt and dress up a virtual digital pet! Choose from various outfits, accessories, and backgrounds to make your pet look fabulous.",
  },
  "/submit-to-void": {
    title: "Submit to Void - Release Your Thoughts to the Digital Void",
    description: "Need to vent? Write your thoughts, secrets, or frustrations and watch them dissolve into the beautiful, dark, infinite digital void.",
  },
  "/text-decrypt": {
    title: "Text Decrypt - Decode Cyphers & Reveal Hidden Messages",
    description: "Crack codes and decrypt ciphered messages. An interactive puzzle tool supporting Caesar ciphers, Vigenere, base64, and custom algorithms.",
  },
  "/text-encrypt": {
    title: "Text Encrypt - Secure Your Messages with Simple Encryptors",
    description: "Encode your private texts using various secure algorithms. Generate base64, custom ciphers, and share encrypted secret links with friends.",
  },
  "/typing-racer": {
    title: "Typing Racer - Test and Improve Your WPM Typing Speed",
    description: "Race against the clock to test your typing speed! Track your WPM (Words Per Minute), accuracy, and compare stats to level up your typing skills.",
  },
  "/zen-garden": {
    title: "Zen Garden - Grow Flowers & Practice Digital Mindfulness",
    description: "Nurture a relaxing virtual garden. Rake sand, plant flowers, play calming ambient sounds, and escape into a peaceful, mindful space.",
  },
};

function main() {
  console.log("Generating layout.tsx files for subpages...");

  for (const site of WEBSITES) {
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
      title: site.title,
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
