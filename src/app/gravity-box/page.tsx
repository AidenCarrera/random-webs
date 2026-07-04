"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

export default function GravityBox() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const leftWallRef = useRef<Matter.Body | null>(null);
  const rightWallRef = useRef<Matter.Body | null>(null);
  const topWallRef = useRef<Matter.Body | null>(null);
  const bottomWallRef = useRef<Matter.Body | null>(null);

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [boxWidth, setBoxWidth] = useState(800);
  const [boxHeight, setBoxHeight] = useState(600);

  const boxWidthRef = useRef(boxWidth);
  const boxHeightRef = useRef(boxHeight);

  useEffect(() => {
    boxWidthRef.current = boxWidth;
  }, [boxWidth]);

  useEffect(() => {
    boxHeightRef.current = boxHeight;
  }, [boxHeight]);

  // Window sizing & resize canvas sync
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    setBoxWidth(Math.min(800, window.innerWidth - 80));
    setBoxHeight(Math.min(600, window.innerHeight - 200));

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      if (renderRef.current) {
        renderRef.current.options.width = window.innerWidth;
        renderRef.current.options.height = window.innerHeight;
        if (renderRef.current.canvas) {
          renderRef.current.canvas.width = window.innerWidth;
          renderRef.current.canvas.height = window.innerHeight;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Initialize Matter.js Physics simulation
  useEffect(() => {
    if (!sceneRef.current) return;

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
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
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
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 40; i++) {
      const x = cx + (Math.random() - 0.5) * (boxWidthRef.current * 0.7);
      const y = cy + (Math.random() - 0.5) * (boxHeightRef.current * 0.7);
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
  }, []);

  // Dyn walls reconstruction matching sliders
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (leftWallRef.current) Matter.Composite.remove(engine.world, leftWallRef.current);
    if (rightWallRef.current) Matter.Composite.remove(engine.world, rightWallRef.current);
    if (topWallRef.current) Matter.Composite.remove(engine.world, topWallRef.current);
    if (bottomWallRef.current) Matter.Composite.remove(engine.world, bottomWallRef.current);

    const cx = windowSize.width / 2;
    const cy = windowSize.height / 2;
    const thickness = 100; // Deep 100px thickness prevents tunneling completely
    const wallOptions = { isStatic: true, render: { fillStyle: "#475569" } };

    // Taller left/right walls overlay the corners seamlessly and eliminate any 1px gaps
    const leftWall = Matter.Bodies.rectangle(cx - boxWidth / 2 - thickness / 2, cy, thickness, boxHeight + 2 * thickness, wallOptions);
    const rightWall = Matter.Bodies.rectangle(cx + boxWidth / 2 + thickness / 2, cy, thickness, boxHeight + 2 * thickness, wallOptions);
    const topWall = Matter.Bodies.rectangle(cx, cy - boxHeight / 2 - thickness / 2, boxWidth + 2 * thickness, thickness, wallOptions);
    const bottomWall = Matter.Bodies.rectangle(cx, cy + boxHeight / 2 + thickness / 2, boxWidth + 2 * thickness, thickness, wallOptions);

    leftWallRef.current = leftWall;
    rightWallRef.current = rightWall;
    topWallRef.current = topWall;
    bottomWallRef.current = bottomWall;

    Matter.Composite.add(engine.world, [leftWall, rightWall, topWall, bottomWall]);
  }, [boxWidth, boxHeight, windowSize]);

  const addShape = () => {
    if (!engineRef.current) return;
    const cx = windowSize.width / 2;
    const cy = windowSize.height / 2;
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div ref={sceneRef} className="fixed inset-0 overflow-hidden text-white">
      <div className="absolute bottom-8 left-8 pointer-events-none select-none opacity-20 hover:opacity-90 transition-opacity duration-300">
        <h1 className="font-black text-4xl md:text-5xl tracking-tighter text-slate-500/80 uppercase">
          GRAVITY BOX
        </h1>
      </div>

      {/* Floating Top Toolbar */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-50 transition-transform duration-300 hover:scale-102">
        <button
          onClick={(e) => e.preventDefault()}
          onMouseDown={() => startAction(addShape)}
          onMouseUp={stopAction}
          onMouseLeave={stopAction}
          onTouchStart={(e) => { e.preventDefault(); startAction(addShape); }}
          onTouchEnd={stopAction}
          className="group flex flex-col items-center justify-center p-3 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition-all duration-200 w-12 h-12 md:w-14 md:h-14 md:hover:w-36 md:hover:rounded-2xl overflow-hidden relative"
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
          <span className="hidden md:flex opacity-0 group-hover:opacity-100 absolute text-xs font-bold whitespace-nowrap">
            Add (Hold)
          </span>
        </button>

        <button
          onClick={(e) => e.preventDefault()}
          onMouseDown={() => startAction(removeShape)}
          onMouseUp={stopAction}
          onMouseLeave={stopAction}
          onTouchStart={(e) => { e.preventDefault(); startAction(removeShape); }}
          onTouchEnd={stopAction}
          className="group flex flex-col items-center justify-center p-3 rounded-full bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 active:scale-90 transition-all duration-200 w-12 h-12 md:w-14 md:h-14 md:hover:w-36 md:hover:rounded-2xl overflow-hidden relative"
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
          <span className="hidden md:flex opacity-0 group-hover:opacity-100 absolute text-xs font-bold whitespace-nowrap">
            Remove (Hold)
          </span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1"></div>

        <button
          onClick={throwShapes}
          className="group flex flex-col items-center justify-center p-3 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95 transition-all duration-200 w-12 h-12 md:w-14 md:h-14 md:hover:w-32 md:hover:rounded-2xl overflow-hidden relative"
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
          <span className="hidden md:flex opacity-0 group-hover:opacity-100 absolute text-xs font-bold whitespace-nowrap">
            CHAOS
          </span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1"></div>

        {/* Dynamic Box Width Slider */}
        <div className="flex flex-col gap-1 w-20 sm:w-28 text-left">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Width</span>
          <input
            type="range"
            min="250"
            max={Math.max(windowSize.width - 60, 400)}
            value={boxWidth}
            onChange={(e) => setBoxWidth(parseInt(e.target.value))}
            className="sandbox-slider"
          />
        </div>

        {/* Dynamic Box Height Slider */}
        <div className="flex flex-col gap-1 w-20 sm:w-28 text-left">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Height</span>
          <input
            type="range"
            min="250"
            max={Math.max(windowSize.height - 180, 400)}
            value={boxHeight}
            onChange={(e) => setBoxHeight(parseInt(e.target.value))}
            className="sandbox-slider"
          />
        </div>
      </div>
    </div>
  );
}
