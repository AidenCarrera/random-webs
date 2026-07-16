import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AuthorAgent,
  Camera,
  CommitEvent,
  Dataset,
  FileChange,
  GraphNode,
  GraphStats,
  Particle,
} from "../types";
import {
  assignTreeLayout,
  buildGraph,
  countGraph,
  resetGraph,
  revealAncestors,
} from "../utils/graph";
import { deterministicUnit, normalizePath } from "../utils/common";
import {
  getCommitPlaybackDuration,
  scheduleFileChanges,
  type ScheduledFileChange,
} from "../utils/playback";
import { ROOT_ID, STATUS_COLORS } from "../constants";

type ActiveCommitPlayback = {
  eventId: string;
  authorKey: string;
  durationMs: number;
  elapsedMs: number;
  progress: number;
  lastFrameAt: number;
  changes: ScheduledFileChange[];
  nextChangeIndex: number;
  completed: boolean;
};

function getAuthorApproachPosition(
  authorKey: string,
  node: GraphNode,
  zoom: number,
) {
  const angle =
    deterministicUnit(`${authorKey}:${node.id}:approach-angle`) * Math.PI * 2;
  const distance =
    node.radius +
    (24 + deterministicUnit(`${authorKey}:${node.id}:approach-distance`) * 10) /
      Math.max(0.28, zoom);

  return {
    x: node.x + Math.cos(angle) * distance,
    y: node.y + Math.sin(angle) * distance,
  };
}

export function useGraphEngine(dataset: Dataset) {
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [graphStats, setGraphStats] = useState<GraphStats>({
    files: 0,
    directories: 0,
  });

  const graphRef = useRef<Map<string, GraphNode>>(new Map());
  const authorsRef = useRef<Map<string, AuthorAgent>>(new Map());
  const particlesRef = useRef<Particle[]>([]);
  const activeNodeIdsRef = useRef<Set<string>>(new Set());
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 0.85 });
  const avatarCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const activePlaybackRef = useRef<ActiveCommitPlayback | null>(null);
  const previousCursorRef = useRef(0);

  const currentEvent = cursor > 0 ? dataset.events[cursor - 1] : null;

  const timelineStats = useMemo(() => {
    const applied = dataset.events.slice(0, cursor);
    return {
      authors: new Set(applied.map((event) => event.author.key)).size,
      additions: applied.reduce((total, event) => total + event.additions, 0),
      deletions: applied.reduce((total, event) => total + event.deletions, 0),
    };
  }, [cursor, dataset.events]);

  const loadAvatar = useCallback((url?: string) => {
    if (!url || avatarCacheRef.current.has(url)) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.src = url;
    avatarCacheRef.current.set(url, image);
  }, []);

  const spawnParticles = useCallback(
    (node: GraphNode, status: FileChange["status"], timestamp: number) => {
      const count = status === "modified" ? 12 : 20;
      const color = STATUS_COLORS[status];

      for (let index = 0; index < count; index += 1) {
        const angle =
          deterministicUnit(`${node.id}:${status}:${timestamp}:${index}`) *
          Math.PI *
          2;
        const velocity =
          0.7 + deterministicUnit(`${node.id}:${index}:speed`) * 2.4;
        const maxLife = 40 + deterministicUnit(`${node.id}:${index}:life`) * 38;

        particlesRef.current.push({
          x: node.x,
          y: node.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: maxLife,
          maxLife,
          color,
        });
      }

      if (particlesRef.current.length > 520) {
        particlesRef.current.splice(0, particlesRef.current.length - 520);
      }
    },
    [],
  );

  const applyGraphChange = useCallback(
    (change: Pick<FileChange, "path" | "status">, animate: boolean) => {
      const graph = graphRef.current;
      const node = graph.get(normalizePath(change.path));
      if (!node) return null;

      const wasHidden = node.alpha <= 0.02;
      activeNodeIdsRef.current.add(node.id);
      node.lastStatus = change.status;

      if (change.status === "added") {
        node.alpha = 1;
        node.deleted = false;
      } else if (change.status === "modified") {
        node.alpha = Math.max(node.alpha, 0.95);
        node.deleted = false;
      } else {
        node.alpha = 1;
        node.deleted = true;
      }

      if (wasHidden && change.status !== "removed") {
        const parent = node.parentId ? graph.get(node.parentId) : undefined;
        if (parent) {
          const emergenceAngle =
            deterministicUnit(`${node.id}:emergence`) * Math.PI * 2;
          node.x = parent.x + Math.cos(emergenceAngle) * 8;
          node.y = parent.y + Math.sin(emergenceAngle) * 8;
          node.vx = 0;
          node.vy = 0;
        }
      }

      revealAncestors(graph, node);
      if (!animate) node.pulse = 0.35;
      return node;
    },
    [],
  );

  const placeAuthor = useCallback(
    (event: CommitEvent, target: GraphNode, animate: boolean) => {
      const existingAuthor = authorsRef.current.get(event.author.key);
      const approach = getAuthorApproachPosition(
        event.author.key,
        target,
        cameraRef.current.zoom,
      );

      if (existingAuthor) {
        existingAuthor.targetX = approach.x;
        existingAuthor.targetY = approach.y;
        existingAuthor.activity = 1;
        existingAuthor.name = event.author.name;
        existingAuthor.avatarUrl = event.author.avatarUrl;
        existingAuthor.login = event.author.login;
        existingAuthor.anchorPath = target.path;
        existingAuthor.targetPath = target.path;
        existingAuthor.isAnimating = animate;
        if (!animate) {
          existingAuthor.x = approach.x;
          existingAuthor.y = approach.y;
          existingAuthor.vx = 0;
          existingAuthor.vy = 0;
        }
      } else {
        const seedAngle =
          deterministicUnit(`${event.author.key}:author-angle`) * Math.PI * 2;
        const initialX = Math.cos(seedAngle) * 80;
        const initialY = Math.sin(seedAngle) * 60;
        authorsRef.current.set(event.author.key, {
          ...event.author,
          x: animate ? initialX : approach.x,
          y: animate ? initialY : approach.y,
          targetX: approach.x,
          targetY: approach.y,
          activity: 1,
          anchorPath: target.path,
          targetPath: target.path,
          isAnimating: animate,
          vx: 0,
          vy: 0,
        });
      }

      loadAvatar(event.author.avatarUrl);
    },
    [loadAvatar],
  );

  const applyEventInstantly = useCallback(
    (event: CommitEvent) => {
      activeNodeIdsRef.current = new Set<string>();
      const targets = event.changes
        .map((change) => applyGraphChange(change, false))
        .filter((node): node is GraphNode => node !== null);
      if (targets[0]) placeAuthor(event, targets[0], false);
    },
    [applyGraphChange, placeAuthor],
  );

  const finalizeActivePlayback = useCallback(() => {
    const playback = activePlaybackRef.current;
    if (!playback || playback.completed) return;

    let lastTarget: GraphNode | null = null;
    for (
      let index = playback.nextChangeIndex;
      index < playback.changes.length;
      index += 1
    ) {
      lastTarget =
        applyGraphChange(playback.changes[index], false) ?? lastTarget;
    }
    playback.nextChangeIndex = playback.changes.length;

    const lastChange = playback.changes.at(-1);
    if (!lastTarget && lastChange) {
      lastTarget = graphRef.current.get(lastChange.path) ?? null;
    }

    const author = authorsRef.current.get(playback.authorKey);
    if (author) {
      if (lastTarget) {
        const approach = getAuthorApproachPosition(
          author.key,
          lastTarget,
          cameraRef.current.zoom,
        );
        author.targetX = approach.x;
        author.targetY = approach.y;
        author.anchorPath = lastTarget.path;
        author.targetPath = lastTarget.path;
      }
      author.isAnimating = false;
    }

    playback.elapsedMs = playback.durationMs;
    playback.progress = 1;
    playback.completed = true;
    setGraphStats(countGraph(graphRef.current));
  }, [applyGraphChange]);

  const startEventPlayback = useCallback(
    (event: CommitEvent) => {
      finalizeActivePlayback();
      activeNodeIdsRef.current = new Set<string>();

      const changes = scheduleFileChanges(event.changes);
      const firstTarget = changes
        .map((change) => graphRef.current.get(change.path))
        .find((node): node is GraphNode => Boolean(node));
      if (firstTarget) placeAuthor(event, firstTarget, true);

      activePlaybackRef.current = {
        eventId: event.id,
        authorKey: event.author.key,
        durationMs: getCommitPlaybackDuration(event),
        elapsedMs: 0,
        progress: 0,
        lastFrameAt: performance.now(),
        changes,
        nextChangeIndex: 0,
        completed: false,
      };
    },
    [finalizeActivePlayback, placeAuthor],
  );

  const advancePlayback = useCallback(
    (timestamp: number, playbackSpeed: number) => {
      const playback = activePlaybackRef.current;
      if (!playback || playback.completed) return;

      if (playbackSpeed <= 0) {
        playback.lastFrameAt = timestamp;
        return;
      }

      const frameDelta = Math.min(
        80,
        Math.max(0, timestamp - playback.lastFrameAt),
      );
      playback.lastFrameAt = timestamp;
      playback.elapsedMs = Math.min(
        playback.durationMs,
        playback.elapsedMs + frameDelta * playbackSpeed,
      );
      playback.progress = playback.elapsedMs / playback.durationMs;

      const author = authorsRef.current.get(playback.authorKey);
      if (author && playback.changes.length > 0) {
        const nextIndex = playback.changes.findIndex(
          (change, index, changes) => {
            const nextChange = changes[index + 1];
            const departureAt = nextChange
              ? (change.at + nextChange.at) / 2
              : 1;
            return playback.progress <= departureAt;
          },
        );
        const segmentIndex =
          nextIndex === -1 ? playback.changes.length - 1 : nextIndex;
        const targetChange = playback.changes[segmentIndex];
        const target = graphRef.current.get(targetChange.path);

        if (target) {
          const approach = getAuthorApproachPosition(
            author.key,
            target,
            cameraRef.current.zoom,
          );

          author.targetX = approach.x;
          author.targetY = approach.y;
          author.targetPath = target.path;
        }
      }

      let graphChanged = false;
      while (playback.nextChangeIndex < playback.changes.length) {
        const change = playback.changes[playback.nextChangeIndex];
        if (playback.progress < change.at) break;

        playback.nextChangeIndex += 1;
        const node = applyGraphChange(change, true);
        graphChanged = true;
        if (node) {
          node.pulse = 1;
          spawnParticles(node, change.status, timestamp);
          if (author) {
            author.anchorPath = node.path;
            author.activity = 1;
          }
        }
      }

      if (graphChanged) setGraphStats(countGraph(graphRef.current));
      if (playback.progress >= 1) finalizeActivePlayback();
    },
    [applyGraphChange, finalizeActivePlayback, spawnParticles],
  );

  const settleGraphImmediately = useCallback(() => {
    const graph = graphRef.current;
    const nodesByDepth = Array.from(graph.values()).sort(
      (left, right) => right.depth - left.depth,
    );

    for (const node of nodesByDepth) {
      if (node.kind !== "directory" || node.id === ROOT_ID) continue;
      const hasVisibleChild = Array.from(graph.values()).some(
        (candidate) =>
          candidate.parentId === node.id &&
          candidate.alpha > 0.015 &&
          !candidate.deleted,
      );
      if (!hasVisibleChild) {
        node.alpha = 0;
        node.deleted = true;
      }
    }

    assignTreeLayout(graph, true);
    for (const node of graph.values()) {
      if (node.deleted) node.alpha = 0;
      node.displayAlpha = node.alpha;
      node.x = node.targetX;
      node.y = node.targetY;
      node.vx = 0;
      node.vy = 0;
    }
  }, []);

  const replayToCursor = useCallback(
    (nextCursor: number) => {
      activePlaybackRef.current = null;
      resetGraph(graphRef.current);
      authorsRef.current.clear();
      particlesRef.current = [];
      activeNodeIdsRef.current.clear();

      dataset.events
        .slice(0, nextCursor)
        .forEach((event) => applyEventInstantly(event));
      settleGraphImmediately();
      setGraphStats(countGraph(graphRef.current));
    },
    [applyEventInstantly, dataset.events, settleGraphImmediately],
  );

  const fitGraph = useCallback(
    (containerWidth: number, containerHeight: number) => {
      const graph = graphRef.current;
      if (graph.size === 0) return;

      const nodes = Array.from(graph.values());
      const minX = Math.min(...nodes.map((node) => node.targetX));
      const maxX = Math.max(...nodes.map((node) => node.targetX));
      const minY = Math.min(...nodes.map((node) => node.targetY));
      const maxY = Math.max(...nodes.map((node) => node.targetY));
      const width = Math.max(420, maxX - minX + 220);
      const height = Math.max(360, maxY - minY + 220);
      const availableWidth = Math.max(320, containerWidth - 80);
      const availableHeight = Math.max(320, containerHeight - 150);
      const baseZoom = Math.min(
        1.15,
        Math.max(
          0.18,
          Math.min(availableWidth / width, availableHeight / height),
        ),
      );
      const isPortraitPhone =
        containerWidth < 768 && containerHeight > containerWidth;

      cameraRef.current = {
        x: -(minX + maxX) / 2,
        y: -(minY + maxY) / 2,
        zoom: Math.min(1.5, baseZoom * (isPortraitPhone ? 1.28 : 1)),
      };
    },
    [],
  );

  useEffect(() => {
    graphRef.current = buildGraph(dataset.allPaths, dataset.baselinePaths);
    for (const node of graphRef.current.values()) {
      node.displayAlpha = node.alpha;
      node.x = node.targetX;
      node.y = node.targetY;
    }
    authorsRef.current.clear();
    particlesRef.current = [];
    activeNodeIdsRef.current.clear();
    activePlaybackRef.current = null;
    previousCursorRef.current = 0;
    const frame = requestAnimationFrame(() => {
      setIsPlaying(false);
      setCursor(0);
      setGraphStats(countGraph(graphRef.current));
    });

    return () => cancelAnimationFrame(frame);
  }, [dataset]);

  useEffect(() => {
    const previousCursor = previousCursorRef.current;
    const movedForwardOne = cursor === previousCursor + 1;

    if (cursor !== previousCursor) {
      if (movedForwardOne && isPlaying) {
        const event = dataset.events[cursor - 1];
        if (event) startEventPlayback(event);
      } else {
        replayToCursor(cursor);
      }
    }

    previousCursorRef.current = cursor;
  }, [cursor, dataset.events, isPlaying, replayToCursor, startEventPlayback]);

  useEffect(() => {
    if (!isPlaying || dataset.events.length === 0) return;

    if (cursor === 0) {
      const frame = window.requestAnimationFrame(() => setCursor(1));
      return () => window.cancelAnimationFrame(frame);
    }

    const event = dataset.events[cursor - 1];
    if (!event) return;
    const playback = activePlaybackRef.current;
    const remainingProgress =
      playback?.eventId === event.id ? 1 - playback.progress : 1;
    const timeout = window.setTimeout(
      () => {
        finalizeActivePlayback();
        if (cursor >= dataset.events.length) {
          settleGraphImmediately();
          setIsPlaying(false);
        } else {
          setCursor(cursor + 1);
        }
      },
      Math.max(
        16,
        (getCommitPlaybackDuration(event) * remainingProgress) / speed,
      ),
    );

    return () => window.clearTimeout(timeout);
  }, [
    cursor,
    dataset.events,
    finalizeActivePlayback,
    isPlaying,
    settleGraphImmediately,
    speed,
  ]);

  const changeZoom = useCallback((factor: number) => {
    cameraRef.current.zoom = Math.min(
      2.6,
      Math.max(0.16, cameraRef.current.zoom * factor),
    );
  }, []);

  return {
    cursor,
    setCursor,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    graphStats,
    currentEvent,
    timelineStats,
    graphRef,
    authorsRef,
    particlesRef,
    activeNodeIdsRef,
    cameraRef,
    avatarCacheRef,
    fitGraph,
    changeZoom,
    advancePlayback,
  };
}
