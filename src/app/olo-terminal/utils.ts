export const FILESYSTEM = {
  "~": {
    type: "dir",
    permissions: "drwxr-xr-x",
    owner: "user",
    group: "user",
    size: 4096,
    modifiedDate: "Jul  4 10:22",
    children: {
      projects: {
        type: "dir",
        permissions: "drwxr-xr-x",
        owner: "user",
        group: "user",
        size: 4096,
        modifiedDate: "Jul  4 11:05",
        children: {
          "secret_project.txt": {
            type: "file",
            permissions: "-rw-r----",
            owner: "user",
            group: "user",
            size: 69,
            modifiedDate: "Jul  4 11:45",
            content:
              "Project: CHAOS\nStatus: [REDACTED]\nNext Step: Run 'matrix' command.",
          },
          "notes.txt": {
            type: "file",
            permissions: "-rw-r----",
            owner: "user",
            group: "user",
            size: 47,
            modifiedDate: "Jul  4 11:12",
            content: "To-do:\n1. Become employed\n2. Get a cat\n3. Learn Rust",
          },
        },
      },
      "readme.txt": {
        type: "file",
        permissions: "-rw-r--r--",
        owner: "user",
        group: "user",
        size: 58,
        modifiedDate: "Jul  4 10:22",
        content: "Welcome to OloOS v2.0\nUse 'help' to see available commands.",
      },
      config: {
        type: "dir",
        permissions: "drwxr-xr-x",
        owner: "user",
        group: "user",
        size: 4096,
        modifiedDate: "Jul  4 10:25",
        children: {
          "settings.json": {
            type: "file",
            permissions: "-rw-r----",
            owner: "user",
            group: "user",
            size: 48,
            modifiedDate: "Jul  4 10:30",
            content: '{ "theme": "olo_green", "matrix_mode": true }',
          },
        },
      },
    },
  },
};

export type TerminalTheme = {
  id: string;
  name: string;
  bg: string;
  panel: string;
  border: string;
  text: string;
  shadow: string;
};

export const TERMINAL_THEMES: TerminalTheme[] = [
  {
    id: "tokyo",
    name: "Tokyo",
    bg: "#1a1b26",
    panel: "#1a1b26",
    border: "#414868",
    text: "#a9b1d6",
    shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
  },
  {
    id: "amber",
    name: "Amber",
    bg: "#17130f",
    panel: "#1c1711",
    border: "#7c5f28",
    text: "#f0c674",
    shadow: "0 0 24px rgba(240, 198, 116, 0.12)",
  },
  {
    id: "ice",
    name: "Ice",
    bg: "#101820",
    panel: "#111c24",
    border: "#2f6477",
    text: "#9fd9e8",
    shadow: "0 0 24px rgba(159, 217, 232, 0.12)",
  },
  {
    id: "forest",
    name: "Forest",
    bg: "#111713",
    panel: "#162019",
    border: "#4f7a5a",
    text: "#b8d8b0",
    shadow: "0 0 24px rgba(79, 122, 90, 0.14)",
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#1b1410",
    panel: "#241a14",
    border: "#c9764a",
    text: "#f2c7a1",
    shadow: "0 0 24px rgba(201, 118, 74, 0.14)",
  },
  {
    id: "rose",
    name: "Rose",
    bg: "#181214",
    panel: "#20171a",
    border: "#b86a7f",
    text: "#f1c7d2",
    shadow: "0 0 24px rgba(184, 106, 127, 0.14)",
  },
];

export const MATRIX_THEME: TerminalTheme = {
  id: "matrix",
  name: "Matrix",
  bg: "#000000",
  panel: "#000000",
  border: "#008f11",
  text: "#00ff41",
  shadow: "0 0 20px rgba(0,143,17,0.25)",
};

export const getVirtualCPU = (): string => {
  if (typeof navigator !== "undefined") {
    const cores = navigator.hardwareConcurrency || 8;
    return `OloCore Virtual CPU (${cores} threads)`;
  }
  return "OloCore Virtual CPU (8 threads)";
};

export const ASCII_ART = {
  cow: `
   ^__^
   (oo)\\_______
   (__)\\       )\\/\\
       ||----w |
       ||     ||
  `,
  ghost: `
   .-.
  (o o) (scary)
  | O \\
   \\   \\
    \`~~~'
  `,
};

export const SYSTEM_INFO = {
  os: "OloOS v1.0.4 x86_64",
  host: "Browser Simulation",
  kernel: "5.15.0-olo-generic",
  uptime: "Forever.",
  packages: "idk (npm)",
  shell: "Olo-Shell v1.0",
  resolution: "8192x10267 (Tall-Format GigaResolution)",
  terminal: "OloTerm",
  cpu: "OloCore Virtual CPU",
  gpu: "CSS-4D Accelerated Ray Tracing Quantum-Entangled Display",
  ascii: `
       /\\
      /  \\
     / /\\ \\
    / /  \\ \\
   / /    \\ \\
  / /      \\ \\
 / /        \\ \\
/_/          \\_\\
  `,
};

export const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
  "I would tell you a UDP joke, but you might not get it.",
  "There are 10 types of people in the world: those who understand binary, and those who don't.",
  "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
  "Why do Java programmers wear glasses? Because they don't C#.",
  "In order to understand recursion, you must first understand recursion.",
  "Why did the developer go broke? Because he used up all his cache.",
  "There are two hard things in computer science: cache invalidation, naming things, and off-by-one errors.",
  "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
];

export const FORTUNES = [
  "You will soon build a startup that lobbies Congress.",
  "You will spend two hours fixing a one-line typo.",
  "You will ask AI for a simple function and receive an full stack application.",
  "There is a 100% chance of rain. Matrix code rain, that is.",
  "Your next side project will actually get finished.",
  "A late-night idea will become your favorite creation.",
  "A stubborn bug will disappear the moment you explain it.",
  "Your next commit will fix three bugs and create four.",
  "Your small project will lead to a big opportunity.",
  "Your terminal history holds the answer you seek.",
  "Your code will compile on the first try. Probably.",
  "A coffee will get you unstuck.",
  "The next random idea you write down will be worth revisiting.",
  "A forgotten TODO will become your next great feature.",
];

export const ADVICE = [
  "Do not seek to follow in the footsteps of the wise. Seek what they sought.",
  "The obstacle is often the path.",
  "What you practice daily becomes who you are.",
  "Patience is not waiting. It is working without rushing.",
  "The quality of your questions shapes the quality of your answers.",
  "Curiosity will take you farther than certainty.",
  "Master the ordinary before chasing the extraordinary.",
  "The answer you seek may require a better question.",
  "Measure your progress against yesterday, not someone else.",
  "An open mind is more useful than a full one.",
  "A clean desk is a sign of a cluttered desk drawer.",
  "Computers are good at following instructions, but not at reading your mind.",
  "Your bugs are just unexpected features.",
  "Go deep on the basics. Everything else builds on them.",
  "Every line of code is a liability. Keep only what you need.",
  "Read more code than you write.",
  "Try solving the problem before asking for help.",
  "Find what you enjoy building, then build more of it.",
  "Write code that your future self will thank you for.",
  "Normalize deleting code. The best code is no code at all, because it has no bugs and requires no maintenance.",
  "The first 90% of the code accounts for the first 90% of the development time. The remaining 10% of the code accounts for the other 90% of the development time.",
];
