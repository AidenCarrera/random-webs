import type { FileSystem, FileSystemNode } from "../types";

export function resolveAbsolutePath(path: string, cwd: string): string {
  if (!path) return cwd;

  let clean = path.trim();
  if (clean === "~") return "~";

  let resolvedParts: string[] = [];
  if (clean.startsWith("~") || clean.startsWith("/")) {
    clean = clean.replace(/^~?\/?/, "");
  } else {
    resolvedParts = cwd
      .replace(/^~?\/?/, "")
      .split("/")
      .filter(Boolean);
  }

  for (const segment of clean.split("/").filter(Boolean)) {
    if (segment === ".") continue;
    if (segment === "..") {
      resolvedParts.pop();
    } else {
      resolvedParts.push(segment);
    }
  }

  return resolvedParts.length === 0 ? "~" : `~/${resolvedParts.join("/")}`;
}

export function getNodeByAbsolutePath(
  absolutePath: string,
  fileSystem: FileSystem,
): FileSystemNode | null {
  if (absolutePath === "~") return fileSystem["~"];

  const parts = absolutePath.replace("~/", "").split("/").filter(Boolean);
  let current = fileSystem["~"];

  for (const part of parts) {
    if (!current.children?.[part]) return null;
    current = current.children[part];
  }

  return current;
}

export function getParentAndName(absolutePath: string): {
  parent: string;
  name: string;
} {
  if (absolutePath === "~") return { parent: "~", name: "~" };

  const parts = absolutePath.replace("~/", "").split("/").filter(Boolean);
  const name = parts.pop() || "";
  const parent = parts.length === 0 ? "~" : `~/${parts.join("/")}`;
  return { parent, name };
}

export function findGitBranch(
  cwd: string,
  fileSystem: FileSystem,
): string | null {
  let currentPath = cwd;

  while (true) {
    const node = getNodeByAbsolutePath(currentPath, fileSystem);
    if (node?.type === "dir" && node.children?.[".git"]) return "main";
    if (currentPath === "~") break;

    const parts = currentPath.split("/");
    parts.pop();
    currentPath = parts.join("/");
  }

  return null;
}
