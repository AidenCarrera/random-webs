import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Dataset, GraphNode, AuthorAgent, Particle, Camera, GraphStats, CommitEvent, ChangeStatus } from "../types";
import { buildGraph, resetGraph, revealAncestors, countGraph } from "../utils/graph";
import { deterministicUnit } from "../utils/common";
import { STATUS_COLORS, BASE_EVENT_DELAY } from "../constants";

export function useGraphEngine(dataset: Dataset) {
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [graphStats, setGraphStats] = useState<GraphStats>({ files: 0, directories: 0 });

  const graphRef = useRef<Map<string, GraphNode>>(new Map());
  const authorsRef = useRef<Map<string, AuthorAgent>>(new Map());
  const particlesRef = useRef<Particle[]>([]);
  const activeNodeIdsRef = useRef<Set<string>>(new Set());
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 0.85 });
  const avatarCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
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

  const spawnParticles = useCallback((node: GraphNode, status: ChangeStatus) => {
    const count = status === "modified" ? 12 : 20;
    const color = STATUS_COLORS[status];

    for (let index = 0; index < count; index += 1) {
      const angle = deterministicUnit(`${node.id}:${status}:${performance.now()}:${index}`) * Math.PI * 2;
      const speedValue = 0.7 + deterministicUnit(`${node.id}:${index}:speed`) * 2.4;
      const maxLife = 40 + deterministicUnit(`${node.id}:${index}:life`) * 38;

      particlesRef.current.push({
        x: node.x,
        y: node.y,
        vx: Math.cos(angle) * speedValue,
        vy: Math.sin(angle) * speedValue,
        life: maxLife,
        maxLife,
        color,
      });
    }

    if (particlesRef.current.length > 520) {
      particlesRef.current.splice(0, particlesRef.current.length - 520);
    }
  }, []);

  const applyEventToGraph = useCallback((event: CommitEvent, animate: boolean) => {
    const graph = graphRef.current;
    const activeNodeIds = new Set<string>();
    const targets: GraphNode[] = [];

    for (const change of event.changes) {
      const path = change.path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
      const node = graph.get(path);
      if (!node) continue;

      const wasHidden = node.alpha <= 0.02;

      activeNodeIds.add(node.id);
      targets.push(node);
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

      // If scrubbing (not playing/animating), trigger static pulse.
      // If playing, the running author agent triggers pulse and particles on arrival.
      if (!animate) {
        node.pulse = 0.35;
      }
    }

    activeNodeIdsRef.current = activeNodeIds;

    if (targets.length > 0) {
      const firstTarget = targets[0];
      const targetX = firstTarget.x;
      const targetY = firstTarget.y;
      
      const existingAuthor = authorsRef.current.get(event.author.key);

      const targetQueue = animate 
        ? event.changes.map(c => ({
            path: c.path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/"),
            status: c.status
          }))
        : [];

      if (existingAuthor) {
        existingAuthor.targetX = targetX;
        existingAuthor.targetY = targetY;
        existingAuthor.lastActiveAt = performance.now();
        existingAuthor.name = event.author.name;
        existingAuthor.avatarUrl = event.author.avatarUrl;
        existingAuthor.login = event.author.login;
        existingAuthor.anchorPath = firstTarget.path;
        if (animate) {
          existingAuthor.targetQueue = targetQueue;
        } else {
          existingAuthor.targetQueue = undefined;
          existingAuthor.x = targetX;
          existingAuthor.y = targetY;
        }
      } else {
        const seedAngle = deterministicUnit(`${event.author.key}:author-angle`) * Math.PI * 2;
        const initialX = Math.cos(seedAngle) * 80;
        const initialY = Math.sin(seedAngle) * 60;
        authorsRef.current.set(event.author.key, {
          ...event.author,
          x: animate ? initialX : targetX,
          y: animate ? initialY : targetY,
          targetX,
          targetY,
          lastActiveAt: performance.now(),
          anchorPath: firstTarget.path,
          targetQueue: animate ? targetQueue : undefined,
        });
      }

      loadAvatar(event.author.avatarUrl);
    }
  }, [loadAvatar]);

  const replayToCursor = useCallback((nextCursor: number, animateLastEvent: boolean) => {
    const graph = graphRef.current;
    resetGraph(graph);
    authorsRef.current.clear();
    particlesRef.current = [];
    activeNodeIdsRef.current.clear();

    dataset.events.slice(0, nextCursor).forEach((event, index) => {
      const isLast = index === nextCursor - 1;
      applyEventToGraph(event, animateLastEvent && isLast);
    });

    setGraphStats(countGraph(graph));
  }, [applyEventToGraph, dataset.events]);

  const fitGraph = useCallback((containerWidth: number, containerHeight: number) => {
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
      Math.max(0.18, Math.min(availableWidth / width, availableHeight / height))
    );
    const isPortraitPhone = containerWidth < 768 && containerHeight > containerWidth;
    const zoom = Math.min(1.5, baseZoom * (isPortraitPhone ? 1.28 : 1));

    cameraRef.current = {
      x: -(minX + maxX) / 2,
      y: -(minY + maxY) / 2,
      zoom,
    };
  }, []);

  useEffect(() => {
    graphRef.current = buildGraph(dataset.allPaths, dataset.baselinePaths);
    authorsRef.current.clear();
    particlesRef.current = [];
    activeNodeIdsRef.current.clear();
    previousCursorRef.current = 0;
    setCursor(0);
    setGraphStats(countGraph(graphRef.current));
  }, [dataset]);

  useEffect(() => {
    const previousCursor = previousCursorRef.current;
    const movedForwardOne = cursor === previousCursor + 1;

    if (cursor !== previousCursor) {
      if (movedForwardOne) {
        const event = dataset.events[cursor - 1];
        if (event) applyEventToGraph(event, true);
        setGraphStats(countGraph(graphRef.current));
      } else {
        replayToCursor(cursor, cursor > 0);
      }
    }

    previousCursorRef.current = cursor;
  }, [applyEventToGraph, cursor, dataset.events, replayToCursor]);

  useEffect(() => {
    if (!isPlaying || cursor >= dataset.events.length) return;

    const timeout = window.setTimeout(
      () => {
        setCursor((value) => Math.min(dataset.events.length, value + 1));
      },
      Math.max(180, BASE_EVENT_DELAY / speed),
    );

    return () => window.clearTimeout(timeout);
  }, [cursor, dataset.events.length, isPlaying, speed]);

  useEffect(() => {
    if (cursor >= dataset.events.length && dataset.events.length > 0) {
      setIsPlaying(false);
    }
  }, [cursor, dataset.events.length]);

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
  };
}
