"use client";

import { useEffect, useRef } from "react";

import type { Planet, PlanetElementRegistry } from "../types";

export function useDomOrbitAnimation(
  planets: Planet[],
  paused: boolean,
  timeScale: number,
) {
  const planetRotations = useRef<Record<string, number>>({});
  const planetElements = useRef<PlanetElementRegistry>({});
  const planetsRef = useRef(planets);
  const pausedRef = useRef(paused);
  const timeScaleRef = useRef(timeScale);

  useEffect(() => {
    planetsRef.current = planets;
  }, [planets]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    planetsRef.current.forEach((planet, index) => {
      if (planetRotations.current[planet.id] === undefined) {
        planetRotations.current[planet.id] = (index * 45) % 360;
      }
    });

    let frame = 0;
    let lastTime = 0;

    const animate = (time: number) => {
      if (lastTime !== 0 && !pausedRef.current) {
        const deltaTime = (time - lastTime) / 1000;

        planetsRef.current.forEach((planet) => {
          const element = planetElements.current[planet.id];
          if (!element) return;

          if (planetRotations.current[planet.id] === undefined) {
            planetRotations.current[planet.id] = Math.random() * 360;
          }

          planetRotations.current[planet.id] +=
            (360 / planet.duration) * timeScaleRef.current * deltaTime;
          element.style.transform = `rotate(${planetRotations.current[planet.id]}deg)`;

          const moonCarrier =
            element.querySelector<HTMLDivElement>(".moon-carrier");
          if (moonCarrier) {
            moonCarrier.style.transform = `rotate(${(planetRotations.current[planet.id] * 4.5) % 360}deg)`;
          }
        });
      }

      lastTime = time;
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return { planetElements, planetRotations, planetsRef };
}
