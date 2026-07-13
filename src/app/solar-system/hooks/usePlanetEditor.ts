"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_PLANETS, PRESETS, SUN } from "../constants";
import type { Planet, PresetKey, SolarTextureKey } from "../types";
import { getNextOrbitSize, getSuggestedPlanetType } from "../utils";

export function usePlanetEditor() {
  const [planets, setPlanets] = useState<Planet[]>(DEFAULT_PLANETS);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [newPlanetName, setNewPlanetName] = useState("");
  const [newPlanetTexture, setNewPlanetTexture] =
    useState<SolarTextureKey>("ceres");
  const [newPlanetSize, setNewPlanetSize] = useState(16);
  const [newPlanetOrbit, setNewPlanetOrbit] = useState(400);
  const [newPlanetDuration, setNewPlanetDuration] = useState(25);
  const [newPlanetType, setNewPlanetType] = useState(
    getSuggestedPlanetType("ceres"),
  );
  const [newPlanetTemp, setNewPlanetTemp] = useState("250 K");
  const [newPlanetDesc, setNewPlanetDesc] = useState(
    "A mysterious newly discovered celestial world.",
  );
  const [newPlanetHasMoon, setNewPlanetHasMoon] = useState(false);
  const [newPlanetHasRings, setNewPlanetHasRings] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const planetsRef = useRef(planets);

  useEffect(() => {
    planetsRef.current = planets;
  }, [planets]);

  const previewPlanet = useMemo<Planet | null>(() => {
    if (!isAdding) return null;

    return {
      id: "preview-planet",
      name: newPlanetName.trim() || "New Planet",
      textureKey: newPlanetTexture,
      size: newPlanetSize,
      orbitSize: newPlanetOrbit,
      duration: newPlanetDuration,
      type: newPlanetType,
      temp: newPlanetTemp,
      desc: newPlanetDesc,
      hasMoon: newPlanetHasMoon,
      hasRings: newPlanetHasRings,
    };
  }, [
    isAdding,
    newPlanetDesc,
    newPlanetDuration,
    newPlanetHasMoon,
    newPlanetHasRings,
    newPlanetName,
    newPlanetOrbit,
    newPlanetSize,
    newPlanetTemp,
    newPlanetTexture,
    newPlanetType,
  ]);

  const displayedPlanets = useMemo(
    () => (previewPlanet ? [...planets, previewPlanet] : planets),
    [planets, previewPlanet],
  );

  const handleLoadPreset = (key: PresetKey) => {
    setPlanets(PRESETS[key]);
    setSelectedPlanet(null);
  };

  const handleAddPlanet = (event: React.FormEvent) => {
    event.preventDefault();
    const name =
      newPlanetName.trim() ||
      `Planet ${planets.filter((planet) => planet.id !== "preview-planet").length + 1}`;
    const planet: Planet = {
      id: `planet_${Date.now()}`,
      name,
      textureKey: newPlanetTexture,
      size: newPlanetSize,
      orbitSize: newPlanetOrbit,
      duration: newPlanetDuration,
      type: newPlanetType,
      temp: newPlanetTemp,
      desc: newPlanetDesc,
      hasMoon: newPlanetHasMoon,
      hasRings: newPlanetHasRings,
    };

    setPlanets((current) => [
      ...current.filter((item) => item.id !== "preview-planet"),
      planet,
    ]);
    setIsAdding(false);
    setNewPlanetName("");
    setNewPlanetSize(16);
    setNewPlanetHasMoon(false);
    setNewPlanetHasRings(false);
  };

  const handleDeletePlanet = (id: string) => {
    setPlanets((current) => current.filter((planet) => planet.id !== id));
    setSelectedPlanet((current) => (current?.id === id ? null : current));
  };

  const handleUpdatePlanet = (id: string, fields: Partial<Planet>) => {
    setPlanets((current) =>
      current.map((planet) =>
        planet.id === id ? { ...planet, ...fields } : planet,
      ),
    );
    setSelectedPlanet((current) =>
      current?.id === id ? { ...current, ...fields } : current,
    );
  };

  const handleThreePlanetSelect = useCallback((id: string) => {
    const planet = planetsRef.current.find((item) => item.id === id);
    if (planet && planet.id !== "preview-planet") setSelectedPlanet(planet);
  }, []);

  const handleThreeSunSelect = useCallback(() => setSelectedPlanet(SUN), []);

  const beginAdding = () => {
    setIsAdding(true);
    setNewPlanetName(`Planet ${planets.length + 1}`);
    setNewPlanetOrbit(getNextOrbitSize(planets));
  };

  return {
    planets,
    selectedPlanet,
    setSelectedPlanet,
    displayedPlanets,
    handleLoadPreset,
    handleAddPlanet,
    handleDeletePlanet,
    handleUpdatePlanet,
    handleThreePlanetSelect,
    handleThreeSunSelect,
    beginAdding,
    newPlanetName,
    setNewPlanetName,
    newPlanetTexture,
    setNewPlanetTexture,
    newPlanetSize,
    setNewPlanetSize,
    newPlanetOrbit,
    setNewPlanetOrbit,
    newPlanetDuration,
    setNewPlanetDuration,
    newPlanetType,
    setNewPlanetType,
    newPlanetTemp,
    setNewPlanetTemp,
    newPlanetDesc,
    setNewPlanetDesc,
    newPlanetHasMoon,
    setNewPlanetHasMoon,
    newPlanetHasRings,
    setNewPlanetHasRings,
    isAdding,
    setIsAdding,
  };
}

export type PlanetEditorController = ReturnType<typeof usePlanetEditor>;
