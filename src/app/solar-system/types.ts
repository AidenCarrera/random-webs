export type SolarTextureKey =
  | "mercury"
  | "venus_surface"
  | "earth"
  | "moon"
  | "mars"
  | "ceres"
  | "eris"
  | "haumea"
  | "makemake"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "sun"
  | "stars"
  | "stars_milky_way"
  | "saturn_ring";

export type BackgroundTheme = "stars" | "stars_milky_way";

export interface Planet {
  id: string;
  name: string;
  textureKey: SolarTextureKey;
  size: number;
  orbitSize: number;
  duration: number;
  type: string;
  temp: string;
  desc: string;
  hasRings?: boolean;
  hasMoon?: boolean;
}

export type PlanetDraft = Omit<Planet, "id">;

export type PresetKey = "full" | "inner" | "outer" | "empty";

export type PlanetElementRegistry = Record<string, HTMLDivElement | null>;
