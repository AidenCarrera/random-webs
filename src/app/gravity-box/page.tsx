"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Matter from "matter-js";

import styles from "./styles.module.css";

const MIN_BOX_WIDTH = 220;
const MIN_BOX_HEIGHT = 220;
const MOBILE_BREAKPOINT = 768;

function getBoxCenter(
  viewportWidth: number,
  viewportHeight: number,
  toolbarHeight: number,
) {
  const availableHeight = Math.max(
    viewportHeight - toolbarHeight,
    MIN_BOX_HEIGHT,
  );

  return {
    x: viewportWidth / 2,
    y: toolbarHeight + availableHeight / 2,
  };
}

function getBoxLimits(
  viewportWidth: number,
  viewportHeight: number,
  toolbarHeight: number,
) {
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const isLandscape = viewportWidth > viewportHeight;
  const horizontalPadding = isMobile ? 24 : 80;
  const bottomPadding = isMobile ? 20 : 48;
  const availableWidth = Math.max(
    viewportWidth - horizontalPadding,
    MIN_BOX_WIDTH,
  );
  const availableHeight = Math.max(
    viewportHeight - toolbarHeight - bottomPadding,
    MIN_BOX_HEIGHT,
  );

  const defaultWidth = isMobile
    ? Math.min(
        availableWidth,
        isLandscape ? viewportWidth * 0.72 : viewportWidth - 32,
      )
    : Math.min(800, availableWidth);
  const defaultHeight = isMobile
    ? Math.min(
        availableHeight,
        isLandscape ? viewportHeight * 0.5 : viewportHeight * 0.42,
      )
    : Math.min(600, availableHeight);

  return {
    maxWidth: availableWidth,
    maxHeight: availableHeight,
    defaultWidth: Math.max(MIN_BOX_WIDTH, Math.floor(defaultWidth)),
    defaultHeight: Math.max(MIN_BOX_HEIGHT, Math.floor(defaultHeight)),
  };
}

export default function GravityBox() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const leftWallRef = useRef<Matter.Body | null>(null);
  const rightWallRef = useRef<Matter.Body | null>(null);
  const topWallRef = useRef<Matter.Body | null>(null);
  const bottomWallRef = useRef<Matter.Body | null>(null);

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [toolbarHeight, setToolbarHeight] = useState(104);
  const [boxWidth, setBoxWidth] = useState(800);
  const [boxHeight, setBoxHeight] = useState(600);
  const [isViewportReady, setIsViewportReady] = useState(false);

  const boxWidthRef = useRef(boxWidth);
  const boxHeightRef = useRef(boxHeight);
  const windowSizeRef = useRef(windowSize);
  const toolbarHeightRef = useRef(toolbarHeight);
  const hasSyncedViewportRef = useRef(false);

  useEffect(() => {
    boxWidthRef.current = boxWidth;
  }, [boxWidth]);

  useEffect(() => {
    boxHeightRef.current = boxHeight;
  }, [boxHeight]);

  useEffect(() => {
    windowSizeRef.current = windowSize;
  }, [windowSize]);

  useEffect(() => {
    toolbarHeightRef.current = toolbarHeight;
  }, [toolbarHeight]);

  // Window sizing & resize canvas sync
  useLayoutEffect(() => {
    const syncViewport = () => {
      const nextWindowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const nextToolbarHeight =
        toolbarRef.current?.offsetHeight ?? toolbarHeightRef.current;
      const limits = getBoxLimits(
        nextWindowSize.width,
        nextWindowSize.height,
        nextToolbarHeight,
      );
      const shouldApplyDefaults = !hasSyncedViewportRef.current;
      setWindowSize((current) =>
        current.width === nextWindowSize.width &&
        current.height === nextWindowSize.height
          ? current
          : nextWindowSize,
      );
      setToolbarHeight((current) =>
        current === nextToolbarHeight ? current : nextToolbarHeight,
      );
      setBoxWidth((current) => {
        const preferredWidth = shouldApplyDefaults
          ? limits.defaultWidth
          : current || limits.defaultWidth;
        const nextWidth = Math.min(
          limits.maxWidth,
          Math.max(MIN_BOX_WIDTH, preferredWidth),
        );
        return current === nextWidth ? current : nextWidth;
      });
      setBoxHeight((current) => {
        const preferredHeight = shouldApplyDefaults
          ? limits.defaultHeight
          : current || limits.defaultHeight;
        const nextHeight = Math.min(
          limits.maxHeight,
          Math.max(MIN_BOX_HEIGHT, preferredHeight),
        );
        return current === nextHeight ? current : nextHeight;
      });
      hasSyncedViewportRef.current = true;
      setIsViewportReady(true);

      if (renderRef.current) {
        renderRef.current.options.width = nextWindowSize.width;
        renderRef.current.options.height = nextWindowSize.height;
        if (renderRef.current.canvas) {
          renderRef.current.canvas.width = nextWindowSize.width;
          renderRef.current.canvas.height = nextWindowSize.height;
        }
      }
    };

    syncViewport();

    const handleResize = () => syncViewport();
    const shouldObserveToolbar = window.innerWidth < MOBILE_BREAKPOINT;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" &&
      toolbarRef.current &&
      shouldObserveToolbar
        ? new ResizeObserver(() => syncViewport())
        : null;

    if (toolbarRef.current && resizeObserver) {
      resizeObserver.observe(toolbarRef.current);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      resizeObserver?.disconnect();
    };
  }, []);

  // Initialize Matter.js Physics simulation
  useEffect(() => {
    if (!isViewportReady || !sceneRef.current) return;

    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Events = Matter.Events,
      Body = Matter.Body;

    const engine = Engine.create({
      positionIterations: 12,
      velocityIterations: 12,
    });
    engineRef.current = engine;
    const world = engine.world;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "#0f172a",
      },
    });
    renderRef.current = render;

    // Reset shapes if they leak outside the containment box
    Events.on(engine, "beforeUpdate", () => {
      const allBodies = Composite.allBodies(engine.world);
      const { x: cx, y: cy } = getBoxCenter(
        windowSizeRef.current.width,
        windowSizeRef.current.height,
        toolbarHeightRef.current,
      );
      const w = boxWidthRef.current;
      const h = boxHeightRef.current;

      allBodies.forEach((body) => {
        if (body.isStatic) return;

        const pad = 30; // reset immediately if they begin to penetrate the walls
        if (
          body.position.x < cx - w / 2 - pad ||
          body.position.x > cx + w / 2 + pad ||
          body.position.y < cy - h / 2 - pad ||
          body.position.y > cy + h / 2 + pad
        ) {
          Body.setPosition(body, { x: cx, y: cy });
          Body.setVelocity(body, { x: 0, y: 0 });
        }
      });
    });

    // Populate initial shapes centered inside the default box area
    const initialToolbarHeight =
      toolbarRef.current?.offsetHeight ?? toolbarHeightRef.current;
    const limits = getBoxLimits(
      window.innerWidth,
      window.innerHeight,
      initialToolbarHeight,
    );
    const cx = window.innerWidth / 2;
    const cy = getBoxCenter(
      window.innerWidth,
      window.innerHeight,
      initialToolbarHeight,
    ).y;
    setToolbarHeight(initialToolbarHeight);
    setBoxWidth(limits.defaultWidth);
    setBoxHeight(limits.defaultHeight);

    for (let i = 0; i < 40; i++) {
      const x = cx + (Math.random() - 0.5) * (limits.defaultWidth * 0.7);
      const y = cy + (Math.random() - 0.5) * (limits.defaultHeight * 0.7);
      const size = Math.random() * 40 + 20;
      const color = ["#ff006e", "#8338ec", "#3a86ff", "#fb5607", "#ffbe0b"][
        Math.floor(Math.random() * 5)
      ];

      let body;
      if (Math.random() > 0.5) {
        body = Bodies.rectangle(x, y, size, size, {
          render: { fillStyle: color },
          restitution: 0.9,
        });
      } else {
        body = Bodies.circle(x, y, size / 2, {
          render: { fillStyle: color },
          restitution: 0.9,
        });
      }
      Composite.add(world, body);
    }

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    Composite.add(world, mouseConstraint);
    render.mouse = mouse;

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
    };
  }, [isViewportReady]);

  // Dyn walls reconstruction matching sliders
  useEffect(() => {
    if (!isViewportReady) return;

    const engine = engineRef.current;
    if (!engine) return;

    if (leftWallRef.current)
      Matter.Composite.remove(engine.world, leftWallRef.current);
    if (rightWallRef.current)
      Matter.Composite.remove(engine.world, rightWallRef.current);
    if (topWallRef.current)
      Matter.Composite.remove(engine.world, topWallRef.current);
    if (bottomWallRef.current)
      Matter.Composite.remove(engine.world, bottomWallRef.current);

    const { x: cx, y: cy } = getBoxCenter(
      windowSize.width,
      windowSize.height,
      toolbarHeight,
    );
    const thickness = 100; // Deep 100px thickness prevents tunneling completely
    const wallOptions = { isStatic: true, render: { fillStyle: "#475569" } };

    // Taller left/right walls overlay the corners seamlessly and eliminate any 1px gaps
    const leftWall = Matter.Bodies.rectangle(
      cx - boxWidth / 2 - thickness / 2,
      cy,
      thickness,
      boxHeight + 2 * thickness,
      wallOptions,
    );
    const rightWall = Matter.Bodies.rectangle(
      cx + boxWidth / 2 + thickness / 2,
      cy,
      thickness,
      boxHeight + 2 * thickness,
      wallOptions,
    );
    const topWall = Matter.Bodies.rectangle(
      cx,
      cy - boxHeight / 2 - thickness / 2,
      boxWidth + 2 * thickness,
      thickness,
      wallOptions,
    );
    const bottomWall = Matter.Bodies.rectangle(
      cx,
      cy + boxHeight / 2 + thickness / 2,
      boxWidth + 2 * thickness,
      thickness,
      wallOptions,
    );

    leftWallRef.current = leftWall;
    rightWallRef.current = rightWall;
    topWallRef.current = topWall;
    bottomWallRef.current = bottomWall;

    Matter.Composite.add(engine.world, [
      leftWall,
      rightWall,
      topWall,
      bottomWall,
    ]);
  }, [boxWidth, boxHeight, windowSize, toolbarHeight, isViewportReady]);

  const addShape = () => {
    if (!engineRef.current) return;
    const { x: cx, y: cy } = getBoxCenter(
      windowSize.width,
      windowSize.height,
      toolbarHeight,
    );
    const x = cx + (Math.random() - 0.5) * (boxWidth * 0.6);
    const y = cy - boxHeight / 2 + 30; // Spawn near the top of the box
    const size = Math.random() * 40 + 20;
    const color = ["#ff006e", "#8338ec", "#3a86ff", "#fb5607", "#ffbe0b"][
      Math.floor(Math.random() * 5)
    ];

    let body;
    if (Math.random() > 0.5) {
      body = Matter.Bodies.rectangle(x, y, size, size, {
        render: { fillStyle: color },
        restitution: 0.9,
      });
    } else {
      body = Matter.Bodies.circle(x, y, size / 2, {
        render: { fillStyle: color },
        restitution: 0.9,
      });
    }
    Matter.Composite.add(engineRef.current.world, body);
  };

  const removeShape = () => {
    if (!engineRef.current) return;
    const allBodies = Matter.Composite.allBodies(engineRef.current.world);
    const dynamicBodies = allBodies.filter((b) => !b.isStatic);
    if (dynamicBodies.length > 0) {
      const lastBody = dynamicBodies[dynamicBodies.length - 1];
      Matter.Composite.remove(engineRef.current.world, lastBody);
    }
  };

  const throwShapes = () => {
    if (!engineRef.current) return;
    const allBodies = Matter.Composite.allBodies(engineRef.current.world);
    allBodies.forEach((body) => {
      if (body.isStatic) return;
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50,
      });
    });
  };

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAction = (action: () => void) => {
    if (intervalRef.current) return;
    action(); // Run immediately on press
    intervalRef.current = setInterval(action, 80); // Repeat every 80ms
  };

  const stopAction = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const boxLimits = getBoxLimits(
    windowSize.width,
    windowSize.height,
    toolbarHeight,
  );
  return (
    <main
      ref={sceneRef}
      className={`${styles.root} fixed inset-0 overflow-hidden bg-[#0f172a] text-white`}
      style={{ backgroundColor: "#0f172a" }}
    >
      <div className="absolute bottom-8 left-8 pointer-events-none select-none opacity-20 hover:opacity-90 transition-opacity duration-300">
        <h1 className="font-black text-4xl md:text-5xl tracking-tighter text-slate-500/80 uppercase">
          GRAVITY BOX
        </h1>
      </div>

      {/* Floating Top Toolbar */}
      <div
        ref={toolbarRef}
        className="fixed top-0 inset-x-0 z-50 flex flex-wrap items-center justify-center gap-3.5 border-b border-white/10 bg-slate-950/70 px-3.5 pb-3.5 pt-[max(0.85rem,env(safe-area-inset-top))] shadow-2xl backdrop-blur-xl select-none md:left-1/2 md:right-auto md:top-4 md:w-auto md:-translate-x-1/2 md:flex-nowrap md:justify-start md:rounded-full md:border md:px-7 md:py-3.5"
      >
        <button
          onClick={(e) => e.preventDefault()}
          onMouseDown={() => startAction(addShape)}
          onMouseUp={stopAction}
          onMouseLeave={stopAction}
          onTouchStart={(e) => {
            e.preventDefault();
            startAction(addShape);
          }}
          onTouchEnd={stopAction}
          className="group relative flex h-13 w-13 flex-col items-center justify-center overflow-hidden rounded-full bg-white/5 p-3.5 transition-all duration-200 active:scale-90 hover:bg-white/10 select-none touch-manipulation md:h-16 md:w-16 md:hover:w-40 md:hover:rounded-2xl"
          title="Add Shape (Hold)"
        >
          <span className="absolute md:group-hover:opacity-0 transition-opacity duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </span>
          <span className="hidden md:flex opacity-0 group-hover:opacity-100 absolute text-sm font-bold whitespace-nowrap">
            Add (Hold)
          </span>
        </button>

        <button
          onClick={(e) => e.preventDefault()}
          onMouseDown={() => startAction(removeShape)}
          onMouseUp={stopAction}
          onMouseLeave={stopAction}
          onTouchStart={(e) => {
            e.preventDefault();
            startAction(removeShape);
          }}
          onTouchEnd={stopAction}
          className="group relative flex h-13 w-13 flex-col items-center justify-center overflow-hidden rounded-full bg-white/5 p-3.5 transition-all duration-200 active:scale-90 hover:bg-rose-500/20 hover:text-rose-400 select-none touch-manipulation md:h-16 md:w-16 md:hover:w-40 md:hover:rounded-2xl"
          title="Remove Shape (Hold)"
        >
          <span className="absolute md:group-hover:opacity-0 transition-opacity duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </span>
          <span className="hidden md:flex opacity-0 group-hover:opacity-100 absolute text-sm font-bold whitespace-nowrap">
            Remove (Hold)
          </span>
        </button>

        <div className="hidden h-9 w-px bg-white/10 md:block"></div>

        <button
          onClick={throwShapes}
          className="group relative flex h-13 w-13 flex-col items-center justify-center overflow-hidden rounded-full bg-blue-500/20 p-3.5 text-blue-400 transition-all duration-200 active:scale-95 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] select-none touch-manipulation md:h-16 md:w-16 md:hover:w-36 md:hover:rounded-2xl"
          title="Chaos Mode"
        >
          <span className="absolute md:group-hover:opacity-0 transition-opacity duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </span>
          <span className="hidden md:flex opacity-0 group-hover:opacity-100 absolute text-sm font-bold whitespace-nowrap">
            CHAOS
          </span>
        </button>

        <div className="hidden h-9 w-px bg-white/10 md:block"></div>

        {/* Dynamic Box Width Slider */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left md:w-32 md:flex-none">
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
            Width
          </span>
          <input
            type="range"
            min={MIN_BOX_WIDTH}
            max={boxLimits.maxWidth}
            value={boxWidth}
            onChange={(e) => setBoxWidth(parseInt(e.target.value))}
            className="sandbox-slider"
          />
        </div>

        {/* Dynamic Box Height Slider */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left md:w-32 md:flex-none">
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
            Height
          </span>
          <input
            type="range"
            min={MIN_BOX_HEIGHT}
            max={boxLimits.maxHeight}
            value={boxHeight}
            onChange={(e) => setBoxHeight(parseInt(e.target.value))}
            className="sandbox-slider"
          />
        </div>
      </div>
    </main>
  );
}
