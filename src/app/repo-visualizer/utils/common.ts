import { Dataset, CommitEvent, ChangeStatus } from "../types";
import { DEMO_EVENTS, FILE_COLORS, MAX_TREE_FILES } from "../constants";

export function createDemoDataset(): Dataset {
  const allPaths = Array.from(
    new Set(
      DEMO_EVENTS.flatMap((event) =>
        event.changes.flatMap(
          (change) =>
            [change.path, change.previousPath].filter(Boolean) as string[],
        ),
      ),
    ),
  );

  return {
    id: "demo-random-webs",
    name: "random-webs / demo history",
    source: "demo",
    events: DEMO_EVENTS,
    baselinePaths: [],
    allPaths,
  };
}

export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
}

export function extensionOf(path: string): string {
  const fileName = path.split("/").at(-1) ?? path;
  if (!fileName.includes(".")) return "";
  return fileName.split(".").at(-1)?.toLowerCase() ?? "";
}

export function fileColor(path: string): string {
  const extension = extensionOf(path);

  if (["ts", "tsx"].includes(extension)) return FILE_COLORS.typescript;
  if (["js", "jsx", "mjs", "cjs"].includes(extension))
    return FILE_COLORS.javascript;
  if (["css", "scss", "sass", "less", "styl"].includes(extension))
    return FILE_COLORS.styles;
  if (["json", "yaml", "yml", "toml", "xml", "csv"].includes(extension))
    return FILE_COLORS.data;
  if (["md", "mdx", "txt", "rst"].includes(extension)) return FILE_COLORS.docs;
  if (
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "avif"].includes(
      extension,
    )
  )
    return FILE_COLORS.image;
  if (["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(extension))
    return FILE_COLORS.audio;
  if (["mp4", "mov", "webm", "mkv"].includes(extension))
    return FILE_COLORS.video;
  if (
    ["lock", "gitignore", "npmrc", "prettierrc", "eslintrc"].includes(
      extension,
    ) ||
    /(^|\/)(package|tsconfig|next\.config|eslint\.config|postcss\.config|tailwind\.config)/i.test(
      path,
    )
  ) {
    return FILE_COLORS.config;
  }

  return FILE_COLORS.other;
}

export function hashNumber(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

export function deterministicUnit(value: string): number {
  const hash = hashNumber(value);
  let mixed = hash;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x85ebca6b);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, 0xc2b2ae35);
  mixed ^= mixed >>> 16;
  return ((mixed >>> 0) % 10000) / 10000;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function selectTreePaths(
  paths: string[],
  requiredPaths: string[],
): string[] {
  const required = new Set(requiredPaths.map(normalizePath));
  const unique = Array.from(new Set(paths.map(normalizePath).filter(Boolean)));

  unique.sort((left, right) => {
    const requiredDifference =
      Number(required.has(right)) - Number(required.has(left));
    if (requiredDifference !== 0) return requiredDifference;

    const depthDifference = left.split("/").length - right.split("/").length;
    if (depthDifference !== 0) return depthDifference;

    return left.localeCompare(right);
  });

  const selected = unique.slice(0, MAX_TREE_FILES);
  for (const path of required) {
    if (!selected.includes(path)) selected.push(path);
  }

  return selected;
}

export function parseRenamePath(
  renamePath: string,
): { oldPath: string; newPath: string } | null {
  if (!renamePath.includes("{") && renamePath.includes(" => ")) {
    const parts = renamePath.split(" => ");
    return { oldPath: parts[0].trim(), newPath: parts[1].trim() };
  }

  const braceMatch = renamePath.match(/(.*?)\{(.*?)\s*=>\s*(.*?)\}(.*)/);
  if (braceMatch) {
    const prefix = braceMatch[1];
    const oldSegment = braceMatch[2].trim();
    const newSegment = braceMatch[3].trim();
    const suffix = braceMatch[4];

    const oldPath = `${prefix}${oldSegment}${suffix}`
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "");
    const newPath = `${prefix}${newSegment}${suffix}`
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "");
    return { oldPath, newPath };
  }

  return null;
}

export function parseGitLog(text: string): {
  events: CommitEvent[];
  allPaths: string[];
} {
  const lines = text.split(/\r?\n/);
  const events: CommitEvent[] = [];

  let currentEvent: CommitEvent | null = null;
  let inMessage = false;
  let rawChanges: Array<{
    path: string;
    additions: number;
    deletions: number;
  }> = [];
  const createdFiles = new Set<string>();
  const deletedFiles = new Set<string>();

  const finalizeCurrentEvent = () => {
    if (!currentEvent) return;

    const changes: Array<{
      path: string;
      status: ChangeStatus;
      additions: number;
      deletions: number;
    }> = [];

    for (const change of rawChanges) {
      let status: ChangeStatus = "modified";

      if (change.path.includes(" => ") || change.path.includes("=>")) {
        const parsedRename = parseRenamePath(change.path);
        if (parsedRename) {
          changes.push({
            path: parsedRename.oldPath,
            status: "removed",
            additions: 0,
            deletions: change.deletions,
          });
          changes.push({
            path: parsedRename.newPath,
            status: "added",
            additions: change.additions,
            deletions: 0,
          });
          continue;
        }
      }

      if (createdFiles.has(change.path)) {
        status = "added";
      } else if (deletedFiles.has(change.path)) {
        status = "removed";
      }

      changes.push({
        path: change.path,
        status,
        additions: change.additions,
        deletions: change.deletions,
      });
    }

    currentEvent.changes = changes;
    currentEvent.additions = changes.reduce(
      (sum, c) =>
        sum +
        (c.status === "added"
          ? c.additions
          : c.status === "modified"
            ? c.additions
            : 0),
      0,
    );
    currentEvent.deletions = changes.reduce(
      (sum, c) =>
        sum +
        (c.status === "removed"
          ? c.deletions
          : c.status === "modified"
            ? c.deletions
            : 0),
      0,
    );

    events.push(currentEvent);
    currentEvent = null;
    rawChanges = [];
    createdFiles.clear();
    deletedFiles.clear();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("commit ")) {
      finalizeCurrentEvent();
      currentEvent = {
        id: `local-${events.length}`,
        hash: line.substring(7, 14),
        date: "",
        message: "",
        author: { key: "", name: "" },
        additions: 0,
        deletions: 0,
        changes: [],
      };
      inMessage = false;
      continue;
    }

    if (!currentEvent) continue;

    if (line.startsWith("Author: ")) {
      const match = line.match(/^Author:\s+([^<]+)(?:<([^>]+)>)?/);
      if (match) {
        const name = match[1].trim();
        const email = match[2]
          ? match[2].trim()
          : name.toLowerCase().replace(/\s+/g, "-");
        currentEvent.author = {
          key: email,
          name,
          login: email.split("@")[0],
        };
      }
      continue;
    }

    if (line.startsWith("Date: ")) {
      const dateStr = line.substring(6).trim();
      try {
        currentEvent.date = new Date(dateStr).toISOString();
      } catch {
        currentEvent.date = new Date().toISOString();
      }
      inMessage = true;
      continue;
    }

    if (inMessage && line.startsWith("    ")) {
      const msg = line.trim();
      if (msg) {
        currentEvent.message = currentEvent.message
          ? `${currentEvent.message} ${msg}`
          : msg;
      }
      continue;
    }

    if (inMessage && line === "") {
      const nextLine = lines[i + 1];
      if (nextLine && /^[0-9-]+\s+[0-9-]+\s+/.test(nextLine.trim())) {
        inMessage = false;
      }
      continue;
    }

    const trimmed = line.trim();
    const numstatMatch = trimmed.match(/^([0-9-]+)\s+([0-9-]+)\s+(.+)$/);
    if (numstatMatch) {
      inMessage = false;
      const addVal =
        numstatMatch[1] === "-" ? 0 : parseInt(numstatMatch[1], 10);
      const delVal =
        numstatMatch[2] === "-" ? 0 : parseInt(numstatMatch[2], 10);
      const filePath = numstatMatch[3].trim();
      rawChanges.push({
        path: filePath,
        additions: addVal,
        deletions: delVal,
      });
      continue;
    }

    if (trimmed.startsWith("create mode ")) {
      const filePath = trimmed.substring(19).trim();
      createdFiles.add(filePath);
      continue;
    }

    if (trimmed.startsWith("delete mode ")) {
      const filePath = trimmed.substring(19).trim();
      deletedFiles.add(filePath);
      continue;
    }
  }

  finalizeCurrentEvent();

  events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const allPathsSet = new Set<string>();
  for (const event of events) {
    for (const change of event.changes) {
      if (change.status !== "removed") {
        allPathsSet.add(change.path);
      }
    }
  }

  return {
    events,
    allPaths: Array.from(allPathsSet),
  };
}
