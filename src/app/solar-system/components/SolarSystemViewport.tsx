"use client";

import type { RefObject } from "react";

import { GLOW_COLORS, TEXTURE_MAP } from "../constants";
import { ThreeSolarSystem } from "../ThreeSolarSystem";
import type { BackgroundTheme, Planet, PlanetElementRegistry } from "../types";
import { getRingGradient } from "../utils";

type Props = {
  planets: Planet[];
  paused: boolean;
  timeScale: number;
  showOrbits: boolean;
  showMoons: boolean;
  enableGlow: boolean;
  bgTheme: BackgroundTheme;
  isGeneratingPng: boolean;
  systemLoaded: boolean;
  containerScale: number;
  isMobileViewport: boolean;
  exportStageRef: RefObject<HTMLDivElement | null>;
  systemViewportRef: RefObject<HTMLDivElement | null>;
  planetElements: RefObject<PlanetElementRegistry>;
  onPlanetSelect: (id: string) => void;
  onSunSelect: () => void;
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  onLoaded: () => void;
};

export function SolarSystemViewport({
  planets: displayedPlanets,
  paused,
  timeScale,
  showOrbits,
  showMoons,
  enableGlow,
  bgTheme,
  isGeneratingPng,
  systemLoaded,
  containerScale,
  isMobileViewport,
  exportStageRef,
  systemViewportRef,
  planetElements,
  onPlanetSelect,
  onSunSelect,
  onCanvasReady,
  onLoaded,
}: Props) {
  return (
    <div
      className="order-4 relative z-10 flex w-full justify-center overflow-hidden px-1 pt-2 md:block md:w-auto md:overflow-visible md:px-0 md:pt-0"
      style={
        isMobileViewport
          ? { height: `${900 * containerScale + 56}px` }
          : undefined
      }
    >
      <div
        ref={exportStageRef}
        data-export-stage="true"
        className="relative shrink-0 overflow-hidden"
        style={{
          width: "900px",
          height: "900px",
          transform: `scale(${containerScale})`,
          transformOrigin: isMobileViewport ? "center top" : "center center",
        }}
      >
        {isGeneratingPng && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
              style={{
                backgroundImage: `url(${TEXTURE_MAP[bgTheme]})`,
              }}
            />
            <div className="absolute inset-0 bg-black/40" />
          </>
        )}
        {!systemLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 transition-opacity duration-500 pointer-events-none">
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-white/80 animate-pulse">
              Initializing Simulation...
            </span>
          </div>
        )}
        <div
          ref={systemViewportRef}
          className="relative flex h-full w-full items-center justify-center transition-transform duration-300"
        >
          <div
            className={`absolute inset-0 z-30 transition-opacity duration-1000 ${systemLoaded ? "opacity-100" : "opacity-0"}`}
          >
            <ThreeSolarSystem
              planets={displayedPlanets}
              paused={paused}
              timeScale={timeScale}
              showOrbits={showOrbits}
              showMoons={showMoons}
              enableGlow={enableGlow}
              bgTheme={bgTheme}
              onPlanetSelect={onPlanetSelect}
              onSunSelect={onSunSelect}
              onCanvasReady={onCanvasReady}
              isExporting={isGeneratingPng}
              onLoaded={onLoaded}
            />
          </div>
          <div className="hidden">
            {/* Stellar Core: The Sun */}
            <div
              data-texture-url={TEXTURE_MAP.sun}
              className="absolute w-24 h-24 rounded-full z-20 flex items-center justify-center planet-texture-spin-slow cursor-pointer"
              style={{
                backgroundImage: `url(${TEXTURE_MAP.sun})`,
                boxShadow: enableGlow
                  ? `0 0 60px rgba(253, 184, 19, 0.40), 0 0 25px rgba(253, 184, 19, 0.25)`
                  : "none",
                animationPlayState: paused ? "paused" : "running",
              }}
              onClick={onSunSelect}
            >
              {/* Subtle star atmospheric glow overlay */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.25)_0%,rgba(0,0,0,0.5)_95%)] mix-blend-overlay" />
            </div>

            {/* Dynamic Planets Render Loop */}
            {displayedPlanets.map((planet, index) => (
              <div
                key={planet.id}
                ref={(el) => {
                  if (el) {
                    planetElements.current[planet.id] = el;
                  } else {
                    delete planetElements.current[planet.id];
                  }
                }}
                className={`absolute rounded-full flex items-center justify-center pointer-events-none transition-colors duration-300 ${
                  showOrbits
                    ? "border border-white/10"
                    : "border border-transparent"
                }`}
                style={{
                  width: `${planet.orbitSize}px`,
                  height: `${planet.orbitSize}px`,
                  transform: `rotate(${(index * 45) % 360}deg)`,
                }}
              >
                {/* Planet Group Wrapper (positioned at the top edge of orbit circle) */}
                <div
                  className="absolute left-1/2 flex flex-col items-center justify-center pointer-events-auto"
                  style={{
                    transform: `translate(-50%, -50%)`,
                    top: 0,
                    width: `${planet.size * 2 + 50}px`,
                    height: `${planet.size * 2 + 50}px`,
                  }}
                >
                  {/* 1. BACK RING (renders behind the planet sphere) */}
                  {planet.hasRings && (
                    <div
                      className="absolute top-1/2 left-1/2 pointer-events-none origin-center rounded-full"
                      style={{
                        width: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                        height: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                        background: getRingGradient(planet.textureKey),
                        transform:
                          "translate(-50%, -50%) rotateX(72deg) rotateY(12deg)",
                        opacity: 0.8,
                        zIndex: 5,
                        clipPath: "inset(0 0 50% 0)",
                      }}
                    />
                  )}

                  {/* Planet sphere */}
                  <div
                    data-texture-url={TEXTURE_MAP[planet.textureKey]}
                    className={`rounded-full relative transition-transform duration-300 cursor-pointer group planet-texture-spin`}
                    style={{
                      width: `${planet.size}px`,
                      height: `${planet.size}px`,
                      backgroundImage: `url(${TEXTURE_MAP[planet.textureKey]})`,
                      boxShadow: enableGlow
                        ? `0 0 8px ${GLOW_COLORS[planet.textureKey] || "rgba(255,255,255,0.05)"}`
                        : "none",
                      animationPlayState: paused ? "paused" : "running",
                      animationDuration:
                        planet.textureKey === "jupiter"
                          ? "8s"
                          : planet.textureKey === "saturn"
                            ? "10s"
                            : planet.textureKey === "earth"
                              ? "16s"
                              : "22s",
                      zIndex: 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (planet.id !== "preview-planet") {
                        onPlanetSelect(planet.id);
                      }
                    }}
                  >
                    {/* Real-time 3D Spherical Shadow Mask Overlay */}
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0.88)_82%)] pointer-events-none" />
                  </div>

                  {/* 2. FRONT RING (renders in front of the planet sphere, clipped to bottom half) */}
                  {planet.hasRings && (
                    <div
                      className="absolute top-1/2 left-1/2 pointer-events-none origin-center rounded-full"
                      style={{
                        width: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                        height: `${planet.size * (planet.textureKey === "saturn" ? 2.8 : planet.textureKey === "uranus" ? 2.2 : 2.4)}px`,
                        background: getRingGradient(planet.textureKey),
                        transform:
                          "translate(-50%, -50%) rotateX(72deg) rotateY(12deg)",
                        opacity: 0.8,
                        zIndex: 15,
                        clipPath: "inset(50% 0 0 0)",
                      }}
                    />
                  )}

                  {/* Moon element orbiting Earth inside parent group */}
                  {planet.hasMoon && showMoons && (
                    <div
                      className="absolute rounded-full border border-white/5 pointer-events-none"
                      style={{
                        width: `${planet.size + 22}px`,
                        height: `${planet.size + 22}px`,
                      }}
                    >
                      {/* Rotating carrying div representing Moon angular position */}
                      <div className="absolute inset-0 moon-carrier">
                        {/* Moon visual sphere */}
                        <div
                          data-texture-url={TEXTURE_MAP.moon}
                          className="absolute rounded-full planet-texture-spin"
                          style={{
                            width: "5px",
                            height: "5px",
                            top: 0,
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            backgroundImage: `url(${TEXTURE_MAP.moon})`,
                            animationPlayState: paused ? "paused" : "running",
                            animationDuration: "5s",
                          }}
                        >
                          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.92)_88%)] pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
