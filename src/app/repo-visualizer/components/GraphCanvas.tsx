import {
  useRef,
  useEffect,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  MutableRefObject,
} from "react";
import {
  GraphNode,
  AuthorAgent,
  Particle,
  Camera,
  Dataset,
  ChangeStatus,
} from "../types";
import { deterministicUnit, initials } from "../utils/common";
import { assignTreeLayout } from "../utils/graph";
import { STATUS_COLORS, ROOT_ID } from "../constants";

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
  speed: number;
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
  speed,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pointerRef = useRef({
    isDown: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    moved: false,
  });

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
    let lastLayoutUpdate = -Infinity;
    let frameNumber = 0;

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
        x: node.x + Math.sin(primaryWave) * amplitude + Math.sin(secondaryWave) * 0.7,
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

        const shouldLabel =
          node.kind === "root" ||
          active ||
          (camera.zoom > 0.72 &&
            node.kind === "directory" &&
            node.depth <= 2) ||
          (camera.zoom > 1.08 && node.kind === "file" && node.depth <= 3);

        if (shouldLabel) {
          const fontSize = node.kind === "root" ? 12 : active ? 11 : 10;
          context.font = `${node.kind === "root" || active ? 600 : 500} ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
          context.textAlign = "center";
          context.textBaseline = "top";
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
            position.x,
            position.y + radius + 7,
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
      const now = performance.now();

      for (const author of authorsRef.current.values()) {
        const position = toScreen(author.x, author.y);
        const target = toScreen(author.targetX, author.targetY);
        const isRecent = now - author.lastActiveAt < 1800;
        const avatarRadius = Math.max(
          13,
          17 * Math.min(1.15, camera.zoom + 0.35),
        );

        // Draw connection line first (stable)
        context.save();
        context.strokeStyle = isRecent
          ? "rgba(143, 174, 255, 0.72)"
          : "rgba(116, 138, 178, 0.28)";
        context.lineWidth = Math.max(0.8, 1.3 * camera.zoom);
        context.setLineDash([4, 7]);
        context.beginPath();
        context.moveTo(position.x, position.y);
        context.lineTo(target.x, target.y);
        context.stroke();
        context.setLineDash([]);
        context.restore();

        // Apply translation and rotation for running animation (extremely sub-pixel values)
        const bobY = Math.sin(author.bobTime || 0) * 0.4;
        const tiltAngle = Math.cos(author.bobTime || 0) * 0.002;

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

        if (avatar?.complete && avatar.naturalWidth > 0) {
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

        context.restore();
      }
    };

    const updateSimulation = () => {
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
            if (other.parentId === id && other.alpha > 0.015 && !other.deleted) {
              hasActiveChildren = true;
              break;
            }
          }
          if (!hasActiveChildren) {
            node.deleted = true;
          }
        }
      }

      // 2. Settle physics & decay deleted alphas based on playback speed
      const decayAmount = Math.min(0.08, 0.018 * Math.max(0.6, speed));
      for (const node of graph.values()) {
        const opacityEase = node.alpha > node.displayAlpha ? 0.045 : 0.075;
        node.displayAlpha += (node.alpha - node.displayAlpha) * opacityEase;
        if (Math.abs(node.alpha - node.displayAlpha) < 0.001) {
          node.displayAlpha = node.alpha;
        }

        const springStrength = node.kind === "file" ? 0.012 : 0.017;
        const damping = 0.9;
        node.vx += (node.targetX - node.x) * springStrength;
        node.vy += (node.targetY - node.y) * springStrength;
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
        node.pulse *= 0.955;

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

        for (let leftIndex = 0; leftIndex < visibleNodes.length; leftIndex += 1) {
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
            const force = Math.min(0.22, overlap * 0.012);
            const directionX = dx / distance;
            const directionY = dy / distance;
            left.vx -= directionX * force;
            left.vy -= directionY * force;
            right.vx += directionX * force;
            right.vy += directionY * force;
          }
        }
      }

      // Local helper to spawn file-edit visual particles upon author arrival
      const spawnParticlesLocal = (node: GraphNode, status: ChangeStatus) => {
        const count = status === "modified" ? 12 : 20;
        const color = STATUS_COLORS[status];

        for (let index = 0; index < count; index += 1) {
          const angle =
            deterministicUnit(
              `${node.id}:${status}:${performance.now()}:${index}`,
            ) *
            Math.PI *
            2;
          const speedValue =
            0.7 + deterministicUnit(`${node.id}:${index}:speed`) * 2.4;
          const maxLife =
            40 + deterministicUnit(`${node.id}:${index}:life`) * 38;

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
      };

      for (const author of authorsRef.current.values()) {
        if (author.targetQueue && author.targetQueue.length > 0) {
          const targetChange = author.targetQueue[0];
          const node = graph.get(targetChange.path);

          if (node) {
            author.targetX = node.x;
            author.targetY = node.y;
            author.anchorPath = node.path;

            const dx = author.targetX - author.x;
            const dy = author.targetY - author.y;
            const distance = Math.hypot(dx, dy);

            const maxTravel = 6.4 * Math.max(0.6, speed);

            if (distance > 2.2) {
              const travel = Math.min(
                distance,
                Math.max(0.45, Math.min(maxTravel, distance * 0.085 + 0.35)),
              );
              author.x += (dx / distance) * travel;
              author.y += (dy / distance) * travel;
              author.angle = Math.atan2(dy, dx);
            } else {
              // Arrive at file node, pulse it and shoot particles
              author.x = author.targetX;
              author.y = author.targetY;
              node.pulse = 1.0;
              node.lastStatus = targetChange.status;
              spawnParticlesLocal(node, targetChange.status);

              author.targetQueue.shift();
              author.lastActiveAt = performance.now();
            }
            author.bobTime = (author.bobTime || 0) + 0.1 * Math.max(0.6, speed);
          } else {
            // Node was deleted or not found, skip
            author.targetQueue.shift();
          }
        } else {
          const anchor = author.anchorPath
            ? graph.get(author.anchorPath)
            : undefined;
          if (anchor) {
            author.targetX = anchor.x;
            author.targetY = anchor.y;
          }

          // Continue in a small orbit while waiting for the next commit, so
          // contributors never freeze on top of a node.
          const phase =
            deterministicUnit(`${author.key}:idle-orbit`) * Math.PI * 2;
          const orbitRadius =
            9 + deterministicUnit(`${author.key}:idle-radius`) * 5;
          const orbitAngle = animationTime * 0.48 + phase;
          const idleX = author.targetX + Math.cos(orbitAngle) * orbitRadius;
          const idleY =
            author.targetY + Math.sin(orbitAngle) * orbitRadius * 0.62;
          const dx = idleX - author.x;
          const dy = idleY - author.y;
          const driftFactor = 0.04 * Math.max(0.7, Math.min(speed, 2));
          author.x += dx * driftFactor;
          author.y += dy * driftFactor;
          author.angle = Math.atan2(dy, dx);
          author.bobTime = (author.bobTime || 0) + 0.05 * Math.max(0.6, speed);
        }
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.975;
        particle.vy *= 0.975;
        particle.life -= 1;
        return particle.life > 0;
      });
    };

    const render = () => {
      animationTime = performance.now() * 0.001;
      updateSimulation();
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
    speed,
  ]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
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
