import {
  useRef,
  useEffect,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  MutableRefObject,
} from "react";
import { GraphNode, AuthorAgent, Particle, Camera, Dataset } from "../types";
import { deterministicUnit, initials } from "../utils/common";
import { assignTreeLayout } from "../utils/graph";
import { STATUS_COLORS, ROOT_ID } from "../constants";

const MIN_LABEL_ZOOM = 0.8;

type GraphCanvasProps = {
  dataset: Dataset;
  graphRef: MutableRefObject<Map<string, GraphNode>>;
  authorsRef: MutableRefObject<Map<string, AuthorAgent>>;
  particlesRef: MutableRefObject<Particle[]>;
  activeNodeIdsRef: MutableRefObject<Set<string>>;
  cameraRef: MutableRefObject<Camera>;
  avatarCacheRef: MutableRefObject<Map<string, HTMLImageElement>>;
  fitGraph: (width: number, height: number) => void;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  speed: number;
  advancePlayback: (timestamp: number, speed: number) => void;
};

export function GraphCanvas({
  dataset,
  graphRef,
  authorsRef,
  particlesRef,
  activeNodeIdsRef,
  cameraRef,
  avatarCacheRef,
  fitGraph,
  containerRef,
  isPlaying,
  speed,
  advancePlayback,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackStateRef = useRef({ isPlaying, speed });
  const pointerRef = useRef({
    isDown: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    moved: false,
  });
  const touchPointsRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    playbackStateRef.current = { isPlaying, speed };
  }, [isPlaying, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let resizeTimer: number | null = null;
    let animationTime = 0;
    let authorMotionTime = 0;
    let lastLayoutUpdate = -Infinity;
    let lastFrameAt = performance.now();
    let frameNumber = 0;
    const visibleAvatarUrls = new Set<string>();

    const resizeCanvas = () => {
      const bounds = container.getBoundingClientRect();
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      // The sidebar animates its width. Waiting until that animation settles
      // avoids repeatedly clearing and resizing the canvas mid-transition.
      resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        fitGraph(width, height);
      }, 120);
    });
    resizeObserver.observe(container);

    const drawRoundedRect = (
      x: number,
      y: number,
      rectWidth: number,
      rectHeight: number,
      radius: number,
    ) => {
      const safeRadius = Math.min(radius, rectWidth / 2, rectHeight / 2);
      context.beginPath();
      context.moveTo(x + safeRadius, y);
      context.arcTo(
        x + rectWidth,
        y,
        x + rectWidth,
        y + rectHeight,
        safeRadius,
      );
      context.arcTo(
        x + rectWidth,
        y + rectHeight,
        x,
        y + rectHeight,
        safeRadius,
      );
      context.arcTo(x, y + rectHeight, x, y, safeRadius);
      context.arcTo(x, y, x + rectWidth, y, safeRadius);
      context.closePath();
    };

    const toScreen = (x: number, y: number) => {
      const camera = cameraRef.current;
      return {
        x: width / 2 + (x + camera.x) * camera.zoom,
        y: height / 2 + (y + camera.y) * camera.zoom,
      };
    };

    // Keep the layout itself stable for interaction, then add a tiny,
    // deterministic offset at render time so each branch gently sways.
    const livingPosition = (node: GraphNode) => {
      if (node.kind === "root") return { x: node.x, y: node.y };

      const phase = deterministicUnit(`${node.id}:sway`) * Math.PI * 2;
      const depth = Math.min(node.depth, 5);
      const amplitude = (node.kind === "directory" ? 2.2 : 1.45) + depth * 0.28;
      const primaryWave = animationTime * (0.34 + depth * 0.018) + phase;
      const secondaryWave = animationTime * 0.22 + phase * 1.7;

      return {
        x:
          node.x +
          Math.sin(primaryWave) * amplitude +
          Math.sin(secondaryWave) * 0.7,
        y:
          node.y +
          Math.cos(primaryWave * 0.84) * amplitude * 0.62 +
          Math.sin(secondaryWave * 1.2) * 0.45,
      };
    };

    const drawBackground = () => {
      const gradient = context.createRadialGradient(
        width * 0.5,
        height * 0.44,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7,
      );
      gradient.addColorStop(0, "#10172a");
      gradient.addColorStop(0.42, "#090d18");
      gradient.addColorStop(1, "#04060b");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };

    const drawEdges = () => {
      const graph = graphRef.current;
      const camera = cameraRef.current;
      context.lineCap = "round";

      for (const node of graph.values()) {
        if (!node.parentId || node.displayAlpha <= 0.02) continue;
        const parent = graph.get(node.parentId);
        if (!parent || parent.displayAlpha <= 0.02) continue;

        const parentPosition = livingPosition(parent);
        const nodePosition = livingPosition(node);
        const from = toScreen(parentPosition.x, parentPosition.y);
        const to = toScreen(nodePosition.x, nodePosition.y);
        const edgeAlpha =
          Math.min(parent.displayAlpha, node.displayAlpha) *
          (node.kind === "file" ? 0.28 : 0.42);
        if (edgeAlpha <= 0.015) continue;

        context.strokeStyle = `rgba(113, 134, 170, ${edgeAlpha})`;
        context.lineWidth = Math.max(
          0.6,
          (node.kind === "directory" ? 1.45 : 0.85) * camera.zoom,
        );
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
    };

    const drawNodes = () => {
      const graph = graphRef.current;
      const camera = cameraRef.current;
      const activeIds = activeNodeIdsRef.current;
      const nodes = Array.from(graph.values()).sort(
        (left, right) => left.depth - right.depth,
      );

      for (const node of nodes) {
        if (node.displayAlpha <= 0.015) continue;

        const worldPosition = livingPosition(node);
        const position = toScreen(worldPosition.x, worldPosition.y);
        const radius = Math.max(1.8, node.radius * camera.zoom);
        const active = activeIds.has(node.id);
        const statusColor = node.lastStatus
          ? STATUS_COLORS[node.lastStatus]
          : node.color;

        context.save();
        context.globalAlpha = Math.min(1, node.displayAlpha);

        if (node.pulse > 0.01) {
          const pulseRadius =
            radius + (1 - node.pulse) * 34 * camera.zoom + 8 * camera.zoom;
          context.strokeStyle = statusColor;
          context.globalAlpha = node.pulse * 0.66;
          context.lineWidth = Math.max(1, 2.4 * camera.zoom);
          context.beginPath();
          context.arc(position.x, position.y, pulseRadius, 0, Math.PI * 2);
          context.stroke();
          context.globalAlpha = Math.min(1, node.displayAlpha);
        }

        if (node.kind === "root") {
          const rootGradient = context.createRadialGradient(
            position.x - radius * 0.3,
            position.y - radius * 0.3,
            1,
            position.x,
            position.y,
            radius * 1.4,
          );
          rootGradient.addColorStop(0, "#ffffff");
          rootGradient.addColorStop(0.35, "#b9ccff");
          rootGradient.addColorStop(1, "#5976d4");
          context.fillStyle = rootGradient;
          context.shadowColor = "rgba(124, 156, 255, 0.4)";
          context.shadowBlur = 6 * camera.zoom;
          context.beginPath();
          context.arc(position.x, position.y, radius, 0, Math.PI * 2);
          context.fill();
        } else if (node.kind === "directory") {
          context.strokeStyle = active ? statusColor : "#8394b5";
          context.fillStyle = active ? statusColor : "#1d2940";
          context.lineWidth = Math.max(1, 1.5 * camera.zoom);
          context.shadowColor = active ? statusColor : "transparent";
          context.shadowBlur = active ? 4 * camera.zoom : 0;
          context.beginPath();
          context.arc(position.x, position.y, radius, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        } else {
          context.fillStyle = node.deleted ? "#27141d" : node.color;
          context.strokeStyle = node.deleted
            ? STATUS_COLORS.removed
            : active
              ? statusColor
              : "rgba(255,255,255,0.34)";
          context.lineWidth = Math.max(0.7, (active ? 2.2 : 0.8) * camera.zoom);
          context.shadowColor = active ? statusColor : "transparent";
          context.shadowBlur = active ? 6 * camera.zoom : 0;
          context.beginPath();
          context.arc(position.x, position.y, radius, 0, Math.PI * 2);
          context.fill();
          context.stroke();

          if (node.deleted) {
            context.strokeStyle = STATUS_COLORS.removed;
            context.lineWidth = Math.max(1, 1.4 * camera.zoom);
            context.beginPath();
            context.moveTo(
              position.x - radius * 0.58,
              position.y - radius * 0.58,
            );
            context.lineTo(
              position.x + radius * 0.58,
              position.y + radius * 0.58,
            );
            context.moveTo(
              position.x + radius * 0.58,
              position.y - radius * 0.58,
            );
            context.lineTo(
              position.x - radius * 0.58,
              position.y + radius * 0.58,
            );
            context.stroke();
          }
        }

        if (camera.zoom >= MIN_LABEL_ZOOM) {
          const fontSize = node.kind === "root" ? 12 : active ? 11 : 10;
          const isFile = node.kind === "file";
          const labelDirection = worldPosition.x >= 0 ? 1 : -1;
          context.font = `${node.kind === "root" || active ? 600 : 500} ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
          context.textAlign = isFile
            ? labelDirection > 0
              ? "left"
              : "right"
            : "center";
          context.textBaseline = isFile ? "middle" : "top";
          context.shadowColor = "rgba(0,0,0,0.85)";
          context.shadowBlur = 6;
          context.fillStyle = node.deleted
            ? "#fda4af"
            : active
              ? "#f8fafc"
              : "#aab7cf";
          context.globalAlpha = active
            ? Math.min(1, node.displayAlpha)
            : Math.min(0.9, node.displayAlpha);
          context.fillText(
            node.kind === "root" ? dataset.name.split(" / ")[0] : node.name,
            isFile ? position.x + labelDirection * (radius + 5) : position.x,
            isFile ? position.y : position.y + radius + 7,
          );
        }

        context.restore();
      }
    };

    const drawParticles = () => {
      for (const particle of particlesRef.current) {
        const position = toScreen(particle.x, particle.y);
        const lifeRatio = particle.life / particle.maxLife;

        context.globalAlpha = Math.max(0, lifeRatio);
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(
          position.x,
          position.y,
          1.2 + lifeRatio * 1.9,
          0,
          Math.PI * 2,
        );
        context.fill();
      }

      context.globalAlpha = 1;
    };

    const drawAuthors = () => {
      const camera = cameraRef.current;
      const graph = graphRef.current;

      for (const author of authorsRef.current.values()) {
        const position = toScreen(author.x, author.y);
        const targetNode = author.targetPath
          ? graph.get(author.targetPath)
          : undefined;
        let targetWorld = {
          x: author.targetX,
          y: author.targetY,
        };

        if (targetNode) {
          targetWorld = livingPosition(targetNode);
        }

        const target = toScreen(targetWorld.x, targetWorld.y);
        const isRecent = author.activity > 0.12;
        const avatarRadius = Math.max(
          13,
          17 * Math.min(1.15, camera.zoom + 0.35),
        );
        const bobY = Math.sin(author.bobTime || 0) * 0.4;
        const tiltAngle = Math.cos(author.bobTime || 0) * 0.002;

        const linkAlpha = Number.isFinite(author.linkAlpha)
          ? author.linkAlpha
          : author.isAnimating
            ? 1
            : 0;

        if (
          targetNode &&
          targetNode.displayAlpha > 0.015 &&
          linkAlpha > 0.015
        ) {
          const avatarCenter = { x: position.x, y: position.y + bobY };
          const deltaX = target.x - avatarCenter.x;
          const deltaY = target.y - avatarCenter.y;
          const distance = Math.hypot(deltaX, deltaY);
          const targetRadius = Math.max(1.8, targetNode.radius * camera.zoom);
          const startPadding = avatarRadius + 4;
          const endPadding = targetRadius + 2;

          if (distance > startPadding + endPadding) {
            const directionX = deltaX / distance;
            const directionY = deltaY / distance;
            context.save();
            context.strokeStyle = isRecent
              ? `rgba(143, 174, 255, ${0.72 * linkAlpha})`
              : `rgba(116, 138, 178, ${0.28 * linkAlpha})`;
            context.lineWidth = Math.max(0.8, 1.3 * camera.zoom);
            context.setLineDash([4, 7]);
            context.beginPath();
            context.moveTo(
              avatarCenter.x + directionX * startPadding,
              avatarCenter.y + directionY * startPadding,
            );
            context.lineTo(
              target.x - directionX * endPadding,
              target.y - directionY * endPadding,
            );
            context.stroke();
            context.restore();
          }
        }

        context.save();
        context.translate(position.x, position.y + bobY);
        context.rotate(tiltAngle);

        context.shadowColor = isRecent
          ? "rgba(142, 168, 255, 0.28)"
          : "rgba(0,0,0,0.3)";
        context.shadowBlur = isRecent ? 6 : 3;
        context.fillStyle = "#111827";
        context.beginPath();
        context.arc(0, 0, avatarRadius + 3, 0, Math.PI * 2);
        context.fill();

        const avatar = author.avatarUrl
          ? avatarCacheRef.current.get(author.avatarUrl)
          : undefined;
        const canRevealAvatar =
          playbackStateRef.current.isPlaying ||
          (author.avatarUrl ? visibleAvatarUrls.has(author.avatarUrl) : false);

        if (canRevealAvatar && avatar?.complete && avatar.naturalWidth > 0) {
          if (author.avatarUrl) visibleAvatarUrls.add(author.avatarUrl);
          context.save();
          context.beginPath();
          context.arc(0, 0, avatarRadius, 0, Math.PI * 2);
          context.clip();
          context.drawImage(
            avatar,
            -avatarRadius,
            -avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2,
          );
          context.restore();
        } else {
          context.fillStyle = "#33446c";
          context.beginPath();
          context.arc(0, 0, avatarRadius, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = "#eef2ff";
          context.font = "700 10px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(initials(author.name), 0, 0.5);
        }

        context.strokeStyle = isRecent ? "#dbe7ff" : "#64748b";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(0, 0, avatarRadius + 1, 0, Math.PI * 2);
        context.stroke();

        if (camera.zoom >= MIN_LABEL_ZOOM) {
          context.font = "600 10px ui-sans-serif, system-ui, sans-serif";
          const label = author.login ? `@${author.login}` : author.name;
          const textWidth = context.measureText(label).width;
          const labelWidth = textWidth + 16;
          const labelHeight = 22;
          const labelX = -labelWidth / 2;
          const labelY = avatarRadius + 8;

          drawRoundedRect(labelX, labelY, labelWidth, labelHeight, 8);
          context.fillStyle = "rgba(6, 10, 20, 0.86)";
          context.fill();
          context.strokeStyle = "rgba(148, 163, 184, 0.22)";
          context.stroke();
          context.fillStyle = "#dbe4f5";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(label, 0, labelY + labelHeight / 2 + 0.5);
        }

        context.restore();
      }
    };

    const updateSimulation = (frameScale: number) => {
      const graph = graphRef.current;

      // Recompute the radial tree from only the currently visible nodes. The
      // springs below interpolate toward these positions, so new files make
      // neighboring branches yield instead of appearing in a fixed slot.
      if (animationTime - lastLayoutUpdate > 0.16) {
        assignTreeLayout(graph, true);
        lastLayoutUpdate = animationTime;
      }

      // 1. Mark empty directories as deleted (excluding root)
      for (const [id, node] of graph.entries()) {
        if (node.kind === "directory" && id !== ROOT_ID && !node.deleted) {
          let hasActiveChildren = false;
          for (const other of graph.values()) {
            if (
              other.parentId === id &&
              other.alpha > 0.015 &&
              !other.deleted
            ) {
              hasActiveChildren = true;
              break;
            }
          }
          if (!hasActiveChildren) {
            node.deleted = true;
          }
        }
      }

      // Settle object motion on frame delta, independently from commit timing.
      const decayAmount = 0.018 * frameScale;
      for (const node of graph.values()) {
        const opacityBase = node.alpha > node.displayAlpha ? 0.045 : 0.075;
        const opacityEase = 1 - (1 - opacityBase) ** frameScale;
        node.displayAlpha += (node.alpha - node.displayAlpha) * opacityEase;
        if (Math.abs(node.alpha - node.displayAlpha) < 0.001) {
          node.displayAlpha = node.alpha;
        }

        const springStrength =
          (node.kind === "file" ? 0.012 : 0.017) * frameScale;
        const damping = 0.9 ** frameScale;
        node.vx += (node.targetX - node.x) * springStrength;
        node.vy += (node.targetY - node.y) * springStrength;
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx * frameScale;
        node.y += node.vy * frameScale;
        node.pulse *= 0.955 ** frameScale;

        if (node.deleted) {
          node.alpha = Math.max(0, node.alpha - decayAmount);
        }
      }

      // A soft collision pass keeps dense sibling groups rounded and legible.
      // It nudges velocity rather than position, preserving fluid motion.
      frameNumber += 1;
      if (frameNumber % 2 === 0) {
        const visibleNodes = Array.from(graph.values()).filter(
          (node) => node.displayAlpha > 0.08 && !node.deleted,
        );

        for (
          let leftIndex = 0;
          leftIndex < visibleNodes.length;
          leftIndex += 1
        ) {
          const left = visibleNodes[leftIndex];
          for (
            let rightIndex = leftIndex + 1;
            rightIndex < visibleNodes.length;
            rightIndex += 1
          ) {
            const right = visibleNodes[rightIndex];
            const dx = right.x - left.x;
            const dy = right.y - left.y;
            const minimumDistance = left.radius + right.radius + 7;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared >= minimumDistance * minimumDistance) continue;

            const distance = Math.max(0.01, Math.sqrt(distanceSquared));
            const overlap = minimumDistance - distance;
            const force = Math.min(0.22, overlap * 0.012) * frameScale;
            const directionX = dx / distance;
            const directionY = dy / distance;
            left.vx -= directionX * force;
            left.vy -= directionY * force;
            right.vx += directionX * force;
            right.vy += directionY * force;
          }
        }
      }

      for (const author of authorsRef.current.values()) {
        author.activity *= 0.98 ** frameScale;
        author.linkAlpha = author.isAnimating
          ? Math.min(1, (author.linkAlpha ?? 0) + 0.12 * frameScale)
          : Math.max(0, (author.linkAlpha ?? 0) * 0.94 ** frameScale);
        const anchor = author.anchorPath
          ? graph.get(author.anchorPath)
          : undefined;
        let destinationX = author.targetX;
        let destinationY = author.targetY;

        if (!author.isAnimating && !author.isFinishing) {
          if (anchor) {
            author.targetX = anchor.x;
            author.targetY = anchor.y;
          }

          const phase =
            deterministicUnit(`${author.key}:idle-orbit`) * Math.PI * 2;
          const orbitRadius = anchor
            ? anchor.radius +
              (24 + deterministicUnit(`${author.key}:idle-radius`) * 10) /
                Math.max(0.28, cameraRef.current.zoom)
            : 18;
          const orbitAngle = authorMotionTime * 0.48 + phase;
          destinationX = author.targetX + Math.cos(orbitAngle) * orbitRadius;
          destinationY =
            author.targetY + Math.sin(orbitAngle) * orbitRadius * 0.62;
        }

        const playbackRate = playbackStateRef.current.speed;
        const motionSeconds = Math.min(0.4, (frameScale / 60) * playbackRate);
        const stepCount = Math.max(1, Math.ceil(motionSeconds / (1 / 120)));
        const stepSeconds = motionSeconds / stepCount;
        const stiffness = author.isAnimating
          ? 36
          : author.isFinishing
            ? 16
            : 12;
        const damping = author.isAnimating
          ? 10.5
          : author.isFinishing
            ? 8.5
            : 6.5;
        const maxSpeed =
          (author.isAnimating ? 260 : author.isFinishing ? 105 : 70) /
          Math.max(0.45, cameraRef.current.zoom);

        author.vx = Number.isFinite(author.vx) ? author.vx : 0;
        author.vy = Number.isFinite(author.vy) ? author.vy : 0;

        for (let step = 0; step < stepCount; step += 1) {
          const dx = destinationX - author.x;
          const dy = destinationY - author.y;
          author.vx += dx * stiffness * stepSeconds;
          author.vy += dy * stiffness * stepSeconds;

          const dampingFactor = Math.exp(-damping * stepSeconds);
          author.vx *= dampingFactor;
          author.vy *= dampingFactor;

          const velocity = Math.hypot(author.vx, author.vy);
          if (velocity > maxSpeed) {
            const speedScale = maxSpeed / velocity;
            author.vx *= speedScale;
            author.vy *= speedScale;
          }

          author.x += author.vx * stepSeconds;
          author.y += author.vy * stepSeconds;
        }

        if (Math.hypot(author.vx, author.vy) > 0.01) {
          author.angle = Math.atan2(author.vy, author.vx);
        }
        author.bobTime =
          (author.bobTime ?? 0) +
          (author.isAnimating ? 0.085 : 0.05) * frameScale;
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx * frameScale;
        particle.y += particle.vy * frameScale;
        particle.vx *= 0.975 ** frameScale;
        particle.vy *= 0.975 ** frameScale;
        particle.life -= frameScale;
        return particle.life > 0;
      });
    };

    const render = (timestamp: number) => {
      const frameDelta = Math.min(50, Math.max(0, timestamp - lastFrameAt));
      const frameScale = frameDelta / (1000 / 60);
      lastFrameAt = timestamp;
      const playbackState = playbackStateRef.current;
      advancePlayback(
        timestamp,
        playbackState.isPlaying ? playbackState.speed : 0,
      );
      if (playbackState.isPlaying) {
        animationTime += frameDelta * 0.001;
        authorMotionTime += frameDelta * 0.001 * playbackState.speed;
        updateSimulation(frameScale);
      }
      drawBackground();
      drawEdges();
      drawParticles();
      drawNodes();
      drawAuthors();
      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    animationFrameRef.current = window.requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    dataset.name,
    activeNodeIdsRef,
    authorsRef,
    avatarCacheRef,
    cameraRef,
    fitGraph,
    graphRef,
    particlesRef,
    containerRef,
    advancePlayback,
  ]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    touchPointsRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (touchPointsRef.current.size === 2) {
      const points = Array.from(touchPointsRef.current.values());
      pinchDistanceRef.current = Math.hypot(
        points[1].x - points[0].x,
        points[1].y - points[0].y,
      );
      pointerRef.current.isDown = false;
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = {
      isDown: true,
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const previousPoint = touchPointsRef.current.get(event.pointerId);
    if (previousPoint) {
      touchPointsRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (touchPointsRef.current.size >= 2) {
      const points = Array.from(touchPointsRef.current.values());
      const nextDistance = Math.hypot(
        points[1].x - points[0].x,
        points[1].y - points[0].y,
      );
      const previousDistance = pinchDistanceRef.current ?? nextDistance;
      if (previousDistance > 0) {
        const canvas = canvasRef.current;
        if (canvas) {
          const bounds = canvas.getBoundingClientRect();
          const midpointX = (points[0].x + points[1].x) / 2 - bounds.left;
          const midpointY = (points[0].y + points[1].y) / 2 - bounds.top;
          const camera = cameraRef.current;
          const worldX =
            (midpointX - bounds.width / 2) / camera.zoom - camera.x;
          const worldY =
            (midpointY - bounds.height / 2) / camera.zoom - camera.y;
          const nextZoom = Math.min(
            2.6,
            Math.max(0.16, camera.zoom * (nextDistance / previousDistance)),
          );
          camera.zoom = nextZoom;
          camera.x = (midpointX - bounds.width / 2) / nextZoom - worldX;
          camera.y = (midpointY - bounds.height / 2) / nextZoom - worldY;
        }
      }
      pinchDistanceRef.current = nextDistance;
      return;
    }

    const pointer = pointerRef.current;
    if (!pointer.isDown || pointer.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - pointer.lastX;
    const deltaY = event.clientY - pointer.lastY;
    const camera = cameraRef.current;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 1) pointer.moved = true;

    camera.x += deltaX / camera.zoom;
    camera.y += deltaY / camera.zoom;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    touchPointsRef.current.delete(event.pointerId);
    if (touchPointsRef.current.size < 2) pinchDistanceRef.current = null;
    if (pointerRef.current.pointerId === event.pointerId) {
      pointerRef.current.isDown = false;
      pointerRef.current.pointerId = -1;
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = canvas.getBoundingClientRect();
    const mouseX = event.clientX - bounds.left;
    const mouseY = event.clientY - bounds.top;
    const camera = cameraRef.current;
    const worldX = (mouseX - bounds.width / 2) / camera.zoom - camera.x;
    const worldY = (mouseY - bounds.height / 2) / camera.zoom - camera.y;
    const zoomFactor = Math.exp(-event.deltaY * 0.0012);
    const nextZoom = Math.min(2.6, Math.max(0.16, camera.zoom * zoomFactor));

    camera.zoom = nextZoom;
    camera.x = (mouseX - bounds.width / 2) / nextZoom - worldX;
    camera.y = (mouseY - bounds.height / 2) / nextZoom - worldY;
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      aria-label="Animated repository file tree"
    />
  );
}
