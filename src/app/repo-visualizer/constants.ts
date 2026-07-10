import { CommitEvent, ChangeStatus } from "./types";

export const ROOT_ID = "__repository_root__";
export const MAX_TREE_FILES = 700;
export const MAX_COMMITS = 16;
export const BASE_EVENT_DELAY = 1350;

export const FILE_COLORS = {
  typescript: "#59a8ff",
  javascript: "#f8d35f",
  styles: "#d68bff",
  data: "#ffad5c",
  docs: "#60d394",
  image: "#ff7b9c",
  audio: "#d58cff",
  video: "#ff665f",
  config: "#9ba8bd",
  other: "#57d6d1",
} as const;

export const STATUS_COLORS: Record<ChangeStatus, string> = {
  added: "#4ade80",
  modified: "#facc15",
  removed: "#fb7185",
};

export const LEGEND_ITEMS = [
  ["TypeScript", FILE_COLORS.typescript],
  ["JavaScript", FILE_COLORS.javascript],
  ["Styles", FILE_COLORS.styles],
  ["Data", FILE_COLORS.data],
  ["Docs", FILE_COLORS.docs],
  ["Images", FILE_COLORS.image],
  ["Other", FILE_COLORS.other],
] as const;

export const DEMO_EVENTS: CommitEvent[] = [
  {
    id: "demo-01",
    hash: "b9d7a21",
    date: "2026-06-01T14:08:00.000Z",
    message: "Initialize Random Webs",
    author: { key: "aiden", name: "Aiden Carrera" },
    additions: 412,
    deletions: 0,
    changes: [
      { path: "package.json", status: "added", additions: 42, deletions: 0 },
      {
        path: "src/app/layout.tsx",
        status: "added",
        additions: 58,
        deletions: 0,
      },
      {
        path: "src/app/page.tsx",
        status: "added",
        additions: 112,
        deletions: 0,
      },
      {
        path: "src/app/globals.css",
        status: "added",
        additions: 200,
        deletions: 0,
      },
    ],
  },
  {
    id: "demo-02",
    hash: "c12af44",
    date: "2026-06-03T19:32:00.000Z",
    message: "Add shared navigation and site metadata",
    author: { key: "aiden", name: "Aiden Carrera" },
    additions: 191,
    deletions: 24,
    changes: [
      {
        path: "src/components/site-header.tsx",
        status: "added",
        additions: 121,
        deletions: 0,
      },
      {
        path: "src/lib/websites.ts",
        status: "added",
        additions: 70,
        deletions: 0,
      },
      {
        path: "src/app/layout.tsx",
        status: "modified",
        additions: 0,
        deletions: 24,
      },
    ],
  },
  {
    id: "demo-03",
    hash: "93e1cc8",
    date: "2026-06-07T10:15:00.000Z",
    message: "Create particle collider experiment",
    author: { key: "mara", name: "Mara Chen" },
    additions: 356,
    deletions: 0,
    changes: [
      {
        path: "src/app/particle-collider/page.tsx",
        status: "added",
        additions: 312,
        deletions: 0,
      },
      {
        path: "public/sounds/collision-soft.mp3",
        status: "added",
        additions: 44,
        deletions: 0,
      },
    ],
  },
  {
    id: "demo-04",
    hash: "e87b101",
    date: "2026-06-12T21:44:00.000Z",
    message: "Add reusable canvas resize hook",
    author: { key: "jonah", name: "Jonah Reed" },
    additions: 88,
    deletions: 36,
    changes: [
      {
        path: "src/hooks/use-canvas-size.ts",
        status: "added",
        additions: 88,
        deletions: 0,
      },
      {
        path: "src/app/particle-collider/page.tsx",
        status: "modified",
        additions: 0,
        deletions: 36,
      },
    ],
  },
  {
    id: "demo-05",
    hash: "132cae0",
    date: "2026-06-18T08:29:00.000Z",
    message: "Build the solar system creator",
    author: { key: "aiden", name: "Aiden Carrera" },
    additions: 923,
    deletions: 0,
    changes: [
      {
        path: "src/app/solar-system/page.tsx",
        status: "added",
        additions: 281,
        deletions: 0,
      },
      {
        path: "src/components/solar/three-solar-system.tsx",
        status: "added",
        additions: 512,
        deletions: 0,
      },
      {
        path: "src/components/solar/planet-controls.tsx",
        status: "added",
        additions: 130,
        deletions: 0,
      },
      {
        path: "public/solar-system/earth.jpg",
        status: "added",
        additions: 0,
        deletions: 0,
      },
      {
        path: "public/solar-system/mars.jpg",
        status: "added",
        additions: 0,
        deletions: 0,
      },
      {
        path: "public/solar-system/sun.jpg",
        status: "added",
        additions: 0,
        deletions: 0,
      },
    ],
  },
  {
    id: "demo-06",
    hash: "fa72d90",
    date: "2026-06-20T16:02:00.000Z",
    message: "Refine mobile solar system controls",
    author: { key: "mara", name: "Mara Chen" },
    additions: 109,
    deletions: 77,
    changes: [
      {
        path: "src/components/solar/planet-controls.tsx",
        status: "modified",
        additions: 63,
        deletions: 54,
      },
      {
        path: "src/components/solar/three-solar-system.tsx",
        status: "modified",
        additions: 46,
        deletions: 23,
      },
    ],
  },
  {
    id: "demo-07",
    hash: "33d4c81",
    date: "2026-06-24T12:48:00.000Z",
    message: "Add focus timer presets and keyboard controls",
    author: { key: "aiden", name: "Aiden Carrera" },
    additions: 246,
    deletions: 14,
    changes: [
      {
        path: "src/app/focus-timer/page.tsx",
        status: "added",
        additions: 246,
        deletions: 0,
      },
      {
        path: "src/lib/websites.ts",
        status: "modified",
        additions: 0,
        deletions: 14,
      },
    ],
  },
  {
    id: "demo-08",
    hash: "db4819a",
    date: "2026-06-26T23:11:00.000Z",
    message: "Replace legacy timer implementation",
    author: { key: "jonah", name: "Jonah Reed" },
    additions: 118,
    deletions: 203,
    changes: [
      {
        path: "src/app/focus-timer/page.tsx",
        status: "modified",
        additions: 118,
        deletions: 79,
      },
      {
        path: "src/components/legacy-timer.tsx",
        status: "removed",
        additions: 0,
        deletions: 124,
      },
    ],
  },
  {
    id: "demo-09",
    hash: "6bc2fd4",
    date: "2026-07-01T18:56:00.000Z",
    message: "Create matrix terminal experience",
    author: { key: "aiden", name: "Aiden Carrera" },
    additions: 478,
    deletions: 0,
    changes: [
      {
        path: "src/app/matrix-rain/page.tsx",
        status: "added",
        additions: 432,
        deletions: 0,
      },
      {
        path: "src/data/terminal-lines.json",
        status: "added",
        additions: 46,
        deletions: 0,
      },
    ],
  },
  {
    id: "demo-10",
    hash: "8470a3b",
    date: "2026-07-03T09:37:00.000Z",
    message: "Improve global sharing controls",
    author: { key: "mara", name: "Mara Chen" },
    additions: 184,
    deletions: 38,
    changes: [
      {
        path: "src/components/share-menu.tsx",
        status: "added",
        additions: 184,
        deletions: 0,
      },
      {
        path: "src/components/site-header.tsx",
        status: "modified",
        additions: 0,
        deletions: 38,
      },
    ],
  },
  {
    id: "demo-11",
    hash: "1af387d",
    date: "2026-07-06T17:20:00.000Z",
    message: "Remove unused collision audio",
    author: { key: "jonah", name: "Jonah Reed" },
    additions: 0,
    deletions: 44,
    changes: [
      {
        path: "public/sounds/collision-soft.mp3",
        status: "removed",
        additions: 0,
        deletions: 44,
      },
    ],
  },
  {
    id: "demo-12",
    hash: "a76df12",
    date: "2026-07-08T22:05:00.000Z",
    message: "Add project history visualizer",
    author: { key: "aiden", name: "Aiden Carrera" },
    additions: 684,
    deletions: 22,
    changes: [
      {
        path: "src/app/github-history/page.tsx",
        status: "added",
        additions: 684,
        deletions: 0,
      },
      {
        path: "src/lib/websites.ts",
        status: "modified",
        additions: 0,
        deletions: 22,
      },
    ],
  },
];
