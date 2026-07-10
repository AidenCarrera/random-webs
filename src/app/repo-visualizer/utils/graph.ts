import { GraphNode, GraphStats } from "../types";
import { ROOT_ID } from "../constants";
import { normalizePath, fileColor, deterministicUnit } from "./common";

export function revealBaselineDirectories(graph: Map<string, GraphNode>): void {
  const nodes = Array.from(graph.values()).sort(
    (left, right) => right.depth - left.depth,
  );

  for (const node of nodes) {
    if (node.kind !== "file" || node.alpha <= 0) continue;

    let parentId = node.parentId;
    while (parentId) {
      const parent = graph.get(parentId);
      if (!parent) break;

      parent.alpha = Math.max(parent.alpha, parent.kind === "root" ? 1 : 0.22);
      parentId = parent.parentId;
    }
  }
}

export function assignTreeLayout(
  graph: Map<string, GraphNode>,
  visibleOnly = false,
): void {
  const children = new Map<string, GraphNode[]>();

  for (const node of graph.values()) {
    if (!node.parentId) continue;
    if (visibleOnly && (node.alpha <= 0.015 || node.deleted)) continue;
    const group = children.get(node.parentId) ?? [];
    group.push(node);
    children.set(node.parentId, group);
  }

  for (const group of children.values()) {
    group.sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
  }

  const leafCounts = new Map<string, number>();

  const countLeaves = (nodeId: string): number => {
    const childNodes = children.get(nodeId) ?? [];

    if (childNodes.length === 0) {
      leafCounts.set(nodeId, 1);
      return 1;
    }

    const count = childNodes.reduce(
      (total, child) => total + countLeaves(child.id),
      0,
    );
    leafCounts.set(nodeId, count);
    return count;
  };

  countLeaves(ROOT_ID);

  const root = graph.get(ROOT_ID);
  if (root) {
    root.targetX = 0;
    root.targetY = 0;
  }

  const placeChildren = (
    parentId: string,
    startAngle: number,
    endAngle: number,
  ): void => {
    const childNodes = children.get(parentId) ?? [];
    const totalLeaves = childNodes.reduce(
      (total, child) => total + (leafCounts.get(child.id) ?? 1),
      0,
    );
    let cursor = startAngle;

    for (const child of childNodes) {
      const share = (leafCounts.get(child.id) ?? 1) / Math.max(totalLeaves, 1);
      const childEnd = cursor + (endAngle - startAngle) * share;
      const angle = (cursor + childEnd) / 2;
      const depthRadius = child.depth * 98 + Math.max(0, child.depth - 2) * 18;
      const horizontalScale = 1;
      const verticalScale = 0.78;

      child.targetX = Math.cos(angle) * depthRadius * horizontalScale;
      child.targetY = Math.sin(angle) * depthRadius * verticalScale;

      placeChildren(child.id, cursor, childEnd);
      cursor = childEnd;
    }
  };

  placeChildren(ROOT_ID, -Math.PI, Math.PI);
}

export function buildGraph(
  paths: string[],
  baselinePaths: string[],
): Map<string, GraphNode> {
  const graph = new Map<string, GraphNode>();
  const baseline = new Set(baselinePaths.map(normalizePath));

  graph.set(ROOT_ID, {
    id: ROOT_ID,
    name: "repository",
    path: "",
    parentId: null,
    kind: "root",
    depth: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 0,
    targetY: 0,
    radius: 11,
    alpha: 1,
    displayAlpha: 1,
    baselineAlpha: 1,
    color: "#f8fafc",
    pulse: 0,
    deleted: false,
  });

  for (const rawPath of paths) {
    const path = normalizePath(rawPath);
    if (!path) continue;

    const parts = path.split("/");
    let parentId = ROOT_ID;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      const existing = graph.get(currentPath);

      if (!existing) {
        const visibleAtBaseline = isFile && baseline.has(path);
        const baselineAlpha = visibleAtBaseline ? 0.32 : 0;
        const randomAngle =
          deterministicUnit(`${currentPath}:angle`) * Math.PI * 2;
        const randomDistance =
          12 + deterministicUnit(`${currentPath}:distance`) * 54;

        graph.set(currentPath, {
          id: currentPath,
          name: part,
          path: currentPath,
          parentId,
          kind: isFile ? "file" : "directory",
          depth: index + 1,
          x: Math.cos(randomAngle) * randomDistance,
          y: Math.sin(randomAngle) * randomDistance,
          vx: 0,
          vy: 0,
          targetX: 0,
          targetY: 0,
          radius: isFile ? 5.2 : 4.2,
          alpha: baselineAlpha,
          displayAlpha: 0,
          baselineAlpha,
          color: isFile ? fileColor(currentPath) : "#64748b",
          pulse: 0,
          deleted: false,
        });
      } else if (isFile && existing.kind === "directory") {
        existing.kind = "file";
        existing.radius = 5.2;
        existing.color = fileColor(currentPath);
      }

      parentId = currentPath;
    });
  }

  assignTreeLayout(graph);
  revealBaselineDirectories(graph);

  return graph;
}

export function resetGraph(graph: Map<string, GraphNode>): void {
  for (const node of graph.values()) {
    node.alpha = node.baselineAlpha;
    node.pulse = 0;
    node.deleted = false;
    node.lastStatus = undefined;
    node.vx = 0;
    node.vy = 0;
  }

  const root = graph.get(ROOT_ID);
  if (root) root.alpha = 1;

  revealBaselineDirectories(graph);
}

export function revealAncestors(
  graph: Map<string, GraphNode>,
  node: GraphNode,
): void {
  let parentId = node.parentId;

  while (parentId) {
    const parent = graph.get(parentId);
    if (!parent) break;

    parent.alpha = Math.max(parent.alpha, parent.kind === "root" ? 1 : 0.72);
    parent.deleted = false;
    parentId = parent.parentId;
  }
}

export function countGraph(graph: Map<string, GraphNode>): GraphStats {
  let files = 0;
  let directories = 0;

  for (const node of graph.values()) {
    if (node.alpha <= 0.08) continue;
    if (node.kind === "file" && !node.deleted) files += 1;
    if (node.kind === "directory" && !node.deleted) directories += 1;
  }

  return { files, directories };
}
