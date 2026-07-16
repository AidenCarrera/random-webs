export enum Material {
  EMPTY = 0,
  SAND = 1,
  WATER = 2,
  FIRE = 3,
  LAVA = 4,
  PLANT = 5,
  ACID = 6,
  STONE = 7,
  WOOD = 8,
  OIL = 9,
  SALT = 10,
  GUNPOWDER = 11,
  ICE = 12,
  SMOKE = 13,
  STEAM = 14,
  DIRT = 15,
  MUD = 16,
  COAL = 17,
  METAL = 18,
  GLASS = 19,
  SNOW = 20,
  METHANE = 21,
  TNT = 22,
  NITRO = 23,
  C4 = 24,
  FUSE = 25,
  SEED = 26,
  FLOWER = 27,
  SPROUT = 28,
}

export const MATERIAL_COUNT = Material.SPROUT + 1;

export type MaterialDefinition = {
  id: Material;
  name: string;
  color: string;
  description: string;
  shortcut: string;
};

export const DRAWABLE_MATERIALS: MaterialDefinition[] = [
  {
    id: Material.SAND,
    name: "Sand",
    color: "#e6b85a",
    description: "Piles, slides, and sinks through liquids.",
    shortcut: "1",
  },
  {
    id: Material.WATER,
    name: "Water",
    color: "#4c9bd8",
    description: "Flows, cools lava, and helps plants grow.",
    shortcut: "2",
  },
  {
    id: Material.FIRE,
    name: "Fire",
    color: "#ef7a35",
    description: "Rises, spreads, and burns out over time.",
    shortcut: "3",
  },
  {
    id: Material.LAVA,
    name: "Lava",
    color: "#e84e2c",
    description: "Heavy molten rock that ignites coals.",
    shortcut: "4",
  },
  {
    id: Material.PLANT,
    name: "Plant",
    color: "#67a84f",
    description: "Grows near water and catches fire.",
    shortcut: "5",
  },
  {
    id: Material.ACID,
    name: "Acid",
    color: "#a6c744",
    description: "Corrodes most materials as it flows.",
    shortcut: "6",
  },
  {
    id: Material.STONE,
    name: "Stone",
    color: "#77736f",
    description: "A solid barrier shaped by lava and water.",
    shortcut: "7",
  },
  {
    id: Material.WOOD,
    name: "Wood",
    color: "#9c6743",
    description: "Build structures, then put them to the flame.",
    shortcut: "8",
  },
  {
    id: Material.OIL,
    name: "Oil",
    color: "#6d5643",
    description: "Floats on water and burns quickly.",
    shortcut: "9",
  },
  {
    id: Material.SALT,
    name: "Salt",
    color: "#d7d7cf",
    description: "Falls like powder and dissolves in water.",
    shortcut: "0",
  },
  {
    id: Material.ICE,
    name: "Ice",
    color: "#9fd7e5",
    description: "Melts around heat and freezes nearby water.",
    shortcut: "I",
  },
  {
    id: Material.STEAM,
    name: "Steam",
    color: "#aac3ca",
    description: "Slowly drips at ceilings, or forms snow against ice.",
    shortcut: "S",
  },
  {
    id: Material.DIRT,
    name: "Dirt",
    color: "#8f6945",
    description: "Absorbs water into mud and supports plant growth.",
    shortcut: "D",
  },
  {
    id: Material.MUD,
    name: "Mud",
    color: "#69533d",
    description:
      "A wet and dense material that rapidly grows seeds without water.",
    shortcut: "M",
  },
  {
    id: Material.SEED,
    name: "Seed",
    color: "#9b66d1",
    description: "A purple seed that grows flowers or extends existing plants.",
    shortcut: "B",
  },
  {
    id: Material.SNOW,
    name: "Snow",
    color: "#e7f3f2",
    description: "Drifts like powder, freezes water, and melts near heat.",
    shortcut: "N",
  },
  {
    id: Material.COAL,
    name: "Coal",
    color: "#343332",
    description: "Heavy fuel that falls in clumps and burns hot.",
    shortcut: "C",
  },
  {
    id: Material.METAL,
    name: "Metal",
    color: "#9da4a6",
    description: "A highly blast-resistant wall that conducts nearby heat.",
    shortcut: "H",
  },
  {
    id: Material.GLASS,
    name: "Glass",
    color: "#8fc6c5",
    description: "Clear, acid-proof walls made when lava heats sand.",
    shortcut: "V",
  },
  {
    id: Material.METHANE,
    name: "Methane",
    color: "#8a91b8",
    description: "A rising flammable gas that flashes through chambers.",
    shortcut: "A",
  },
  {
    id: Material.GUNPOWDER,
    name: "Powder",
    color: "#494641",
    description: "A spark starts a compact blast.",
    shortcut: "G",
  },
  {
    id: Material.FUSE,
    name: "Fuse",
    color: "#b57e46",
    description: "A stationary glowing cord that carries ignition to charges.",
    shortcut: "F",
  },
  {
    id: Material.TNT,
    name: "TNT",
    color: "#cf3f32",
    description: "A solid charge with a powerful medium-sized blast.",
    shortcut: "T",
  },
  {
    id: Material.NITRO,
    name: "Nitro",
    color: "#e2aa38",
    description: "A volatile liquid explosive triggered by heat.",
    shortcut: "R",
  },
  {
    id: Material.C4,
    name: "C4",
    color: "#d8d3b8",
    description: "A devastating planted charge that tears through barriers.",
    shortcut: "X",
  },
  {
    id: Material.EMPTY,
    name: "Eraser",
    color: "#e56f9b",
    description: "Remove cells without clearing the world.",
    shortcut: "E",
  },
];

export type SandWorldStats = {
  cells: number;
  active: number;
  fps: number;
  materialCounts: number[];
};

type SerializedWorld = {
  version: 1;
  width: number;
  height: number;
  cells: string;
  life: string;
  shade: string;
};

const PALETTES: ReadonlyArray<
  ReadonlyArray<readonly [number, number, number]>
> = [
  [[18, 18, 16]],
  [
    [230, 184, 90],
    [213, 160, 66],
    [242, 203, 117],
    [197, 144, 58],
  ],
  [
    [76, 155, 216],
    [55, 128, 191],
    [93, 171, 225],
  ],
  [
    [239, 122, 53],
    [249, 174, 55],
    [229, 70, 37],
    [255, 211, 93],
  ],
  [
    [232, 78, 44],
    [244, 111, 40],
    [197, 43, 31],
    [250, 153, 52],
  ],
  [
    [103, 168, 79],
    [77, 139, 62],
    [128, 188, 91],
  ],
  [
    [166, 199, 68],
    [130, 175, 48],
    [193, 216, 78],
  ],
  [
    [119, 115, 111],
    [93, 91, 89],
    [143, 137, 130],
    [108, 105, 102],
  ],
  [
    [156, 103, 67],
    [126, 78, 51],
    [174, 119, 76],
  ],
  [
    [109, 86, 67],
    [79, 66, 56],
    [130, 104, 78],
  ],
  [
    [215, 215, 207],
    [240, 238, 225],
    [190, 192, 187],
  ],
  [
    [73, 70, 65],
    [55, 53, 49],
    [93, 87, 77],
  ],
  [
    [159, 215, 229],
    [125, 190, 211],
    [190, 232, 239],
  ],
  [
    [91, 88, 82],
    [116, 111, 102],
    [72, 71, 68],
  ],
  [
    [170, 195, 202],
    [197, 216, 218],
    [137, 170, 180],
  ],
  [
    [143, 105, 69],
    [119, 85, 57],
    [166, 125, 82],
  ],
  [
    [105, 83, 61],
    [82, 65, 49],
    [124, 98, 70],
  ],
  [
    [52, 51, 50],
    [35, 35, 34],
    [69, 66, 62],
  ],
  [
    [157, 164, 166],
    [127, 135, 139],
    [186, 192, 192],
  ],
  [
    [143, 198, 197],
    [113, 170, 174],
    [181, 220, 216],
  ],
  [
    [231, 243, 242],
    [207, 227, 232],
    [248, 251, 247],
  ],
  [
    [138, 145, 184],
    [108, 116, 158],
    [164, 167, 199],
  ],
  [
    [207, 63, 50],
    [165, 43, 37],
    [232, 83, 60],
  ],
  [
    [226, 170, 56],
    [191, 132, 36],
    [242, 201, 91],
  ],
  [
    [216, 211, 184],
    [183, 184, 157],
    [235, 228, 202],
  ],
  [
    [181, 126, 70],
    [145, 91, 48],
    [204, 153, 82],
    [245, 143, 43],
  ],
  [
    [155, 102, 209],
    [124, 77, 180],
    [184, 133, 225],
  ],
  [
    [236, 103, 140],
    [181, 105, 214],
    [241, 185, 70],
    [106, 181, 229],
    [238, 126, 79],
  ],
  [
    [116, 188, 91],
    [83, 155, 68],
    [145, 207, 105],
  ],
];

const LIQUID_DENSITY: Partial<Record<Material, number>> = {
  [Material.OIL]: 1,
  [Material.WATER]: 2,
  [Material.ACID]: 3,
  [Material.NITRO]: 3.5,
  [Material.LAVA]: 4,
  [Material.MUD]: 5,
};

const isLiquid = (material: Material) => material in LIQUID_DENSITY;

const isGas = (material: Material) =>
  material === Material.FIRE ||
  material === Material.SMOKE ||
  material === Material.STEAM ||
  material === Material.METHANE;

const isHeat = (material: Material) =>
  material === Material.FIRE || material === Material.LAVA;

const GROWTH_COOLDOWN = 12;
const GROWTH_SHIFT = 4;
const SEED_EMBER_FLAG = 1 << 15;
const SEED_EMBER_RELEASE_LIFE = 42;
const WOOD_FIRE_FLAG = 1 << 14;
const FIRE_STATE_FLAGS = SEED_EMBER_FLAG | WOOD_FIRE_FLAG;

const explosionRadius = (material: Material) => {
  switch (material) {
    case Material.GUNPOWDER:
      return 5;
    case Material.METHANE:
      return 9;
    case Material.NITRO:
      return 11;
    case Material.TNT:
      return 14;
    case Material.C4:
      return 32;
    default:
      return 0;
  }
};

const randomInt = (maximum: number) => Math.floor(Math.random() * maximum);

function encodeBytes(bytes: Uint8Array): string {
  let encoded = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    encoded += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(encoded);
}

function decodeBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export class FallingSandEngine {
  width: number;
  height: number;
  cells: Uint8Array;
  life: Uint16Array;
  shade: Uint8Array;

  private updated: Uint32Array;
  private frame = 1;
  private imageData: ImageData | null = null;

  constructor(width: number, height: number) {
    this.width = Math.max(48, Math.round(width));
    this.height = Math.max(48, Math.round(height));
    const length = this.width * this.height;
    this.cells = new Uint8Array(length);
    this.life = new Uint16Array(length);
    this.shade = new Uint8Array(length);
    this.updated = new Uint32Array(length);
  }

  private index(x: number, y: number) {
    return y * this.width + x;
  }

  private inBounds(x: number, y: number) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private assign(index: number, material: Material, life = 0) {
    this.cells[index] = material;
    this.life[index] = life;
    this.shade[index] = randomInt(PALETTES[material].length);
  }

  private erase(index: number) {
    this.cells[index] = Material.EMPTY;
    this.life[index] = 0;
    this.shade[index] = 0;
  }

  private swap(first: number, second: number) {
    const firstCell = this.cells[first];
    const firstLife = this.life[first];
    const firstShade = this.shade[first];
    this.cells[first] = this.cells[second];
    this.life[first] = this.life[second];
    this.shade[first] = this.shade[second];
    this.cells[second] = firstCell;
    this.life[second] = firstLife;
    this.shade[second] = firstShade;
    this.updated[first] = this.frame;
    this.updated[second] = this.frame;
  }

  private move(first: number, second: number) {
    this.cells[second] = this.cells[first];
    this.life[second] = this.life[first];
    this.shade[second] = this.shade[first];
    this.erase(first);
    this.updated[first] = this.frame;
    this.updated[second] = this.frame;
  }

  private canPowderDisplace(target: Material) {
    return target === Material.EMPTY || isGas(target) || isLiquid(target);
  }

  private tryPowderMove(x: number, y: number) {
    const from = this.index(x, y);
    const direction = Math.random() < 0.5 ? -1 : 1;
    const targets = [
      [x, y + 1],
      [x + direction, y + 1],
      [x - direction, y + 1],
    ] as const;

    for (const [targetX, targetY] of targets) {
      if (!this.inBounds(targetX, targetY)) continue;
      const to = this.index(targetX, targetY);
      const target = this.cells[to] as Material;
      if (!this.canPowderDisplace(target)) continue;

      if (target === Material.EMPTY || isGas(target)) {
        this.move(from, to);
      } else {
        this.swap(from, to);
      }
      return true;
    }
    return false;
  }

  private tryLiquidMove(x: number, y: number, material: Material) {
    const from = this.index(x, y);
    const density = LIQUID_DENSITY[material] ?? 0;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const below = y + 1;

    for (const targetX of [x, x + direction, x - direction]) {
      if (!this.inBounds(targetX, below)) continue;
      const to = this.index(targetX, below);
      const target = this.cells[to] as Material;
      const targetDensity = LIQUID_DENSITY[target] ?? Number.POSITIVE_INFINITY;
      if (target === Material.EMPTY || isGas(target)) {
        this.move(from, to);
        return true;
      }
      if (isLiquid(target) && density > targetDensity) {
        this.swap(from, to);
        return true;
      }
    }

    const spread =
      material === Material.OIL
        ? 8
        : material === Material.LAVA
          ? 3
          : material === Material.MUD
            ? 2
            : 6;
    for (let distance = spread; distance >= 1; distance -= 1) {
      for (const sign of [direction, -direction]) {
        const targetX = x + sign * distance;
        if (!this.inBounds(targetX, y)) continue;
        let clearPath = true;
        for (let step = 1; step <= distance; step += 1) {
          const pathMaterial = this.cells[
            this.index(x + sign * step, y)
          ] as Material;
          if (pathMaterial !== Material.EMPTY && !isGas(pathMaterial)) {
            clearPath = false;
            break;
          }
        }
        if (!clearPath) continue;
        this.move(from, this.index(targetX, y));
        return true;
      }
    }
    return false;
  }

  private tryGasMove(x: number, y: number) {
    const from = this.index(x, y);
    const direction = Math.random() < 0.5 ? -1 : 1;
    const targets = [
      [x, y - 1],
      [x + direction, y - 1],
      [x - direction, y - 1],
      [x + direction, y],
      [x - direction, y],
    ] as const;

    for (const [targetX, targetY] of targets) {
      if (!this.inBounds(targetX, targetY)) continue;
      const to = this.index(targetX, targetY);
      if (this.cells[to] === Material.EMPTY) {
        this.move(from, to);
        return true;
      }
    }
    return false;
  }

  private neighbors(x: number, y: number) {
    const result: number[] = [];
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) continue;
        const targetX = x + offsetX;
        const targetY = y + offsetY;
        if (this.inBounds(targetX, targetY)) {
          result.push(this.index(targetX, targetY));
        }
      }
    }
    return result;
  }

  private findNearby(
    centerX: number,
    centerY: number,
    radius: number,
    material: Material,
  ) {
    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        if (!this.inBounds(x, y)) continue;
        const index = this.index(x, y);
        if (this.cells[index] === material) return index;
      }
    }
    return undefined;
  }

  private removeNearbySeeds(
    centerX: number,
    centerY: number,
    radius: number,
    except?: number,
  ) {
    const radiusSquared = radius * radius;
    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        if (!this.inBounds(x, y)) continue;
        const dx = x - centerX;
        const dy = y - centerY;
        if (dx * dx + dy * dy > radiusSquared) continue;
        const target = this.index(x, y);
        if (target === except || this.cells[target] !== Material.SEED) continue;
        this.erase(target);
        this.updated[target] = this.frame;
      }
    }
  }

  private ignite(index: number) {
    const material = this.cells[index] as Material;
    if (material === Material.FUSE) {
      if (this.life[index] === 0) this.life[index] = 4;
      this.updated[index] = this.frame;
      return;
    }
    const radius = explosionRadius(material);
    if (radius > 0) {
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      this.explode(x, y, radius);
      return;
    }
    if (material === Material.SEED) {
      this.assign(index, Material.FIRE, SEED_EMBER_FLAG | (58 + randomInt(20)));
      this.updated[index] = this.frame;
      return;
    }
    if (material === Material.WOOD) {
      this.assign(index, Material.FIRE, WOOD_FIRE_FLAG | (105 + randomInt(45)));
      this.updated[index] = this.frame;
      return;
    }
    if (
      material === Material.PLANT ||
      material === Material.FLOWER ||
      material === Material.SPROUT ||
      material === Material.OIL ||
      material === Material.COAL
    ) {
      this.assign(index, Material.FIRE, 42 + randomInt(55));
      this.updated[index] = this.frame;
    }
  }

  private explode(centerX: number, centerY: number, radius: number) {
    const blasts = [{ x: centerX, y: centerY, radius }];
    const queued = new Set([this.index(centerX, centerY)]);

    for (let blastIndex = 0; blastIndex < blasts.length; blastIndex += 1) {
      const blast = blasts[blastIndex];
      const radiusSquared = blast.radius * blast.radius;
      for (
        let y = blast.y - blast.radius;
        y <= blast.y + blast.radius;
        y += 1
      ) {
        for (
          let x = blast.x - blast.radius;
          x <= blast.x + blast.radius;
          x += 1
        ) {
          if (!this.inBounds(x, y)) continue;
          const dx = x - blast.x;
          const dy = y - blast.y;
          if (dx * dx + dy * dy > radiusSquared) continue;
          const index = this.index(x, y);
          const material = this.cells[index] as Material;
          const chainedRadius = explosionRadius(material);
          if (chainedRadius > 0 && !queued.has(index) && blasts.length < 48) {
            queued.add(index);
            blasts.push({ x, y, radius: chainedRadius });
          }

          const isC4Blast = blast.radius >= 32;
          if (
            material === Material.METAL &&
            Math.random() > (isC4Blast ? 0.22 : 0.03)
          ) {
            continue;
          }
          if (
            material === Material.STONE &&
            Math.random() >
              (isC4Blast ? 0.82 : blast.radius >= 18 ? 0.55 : 0.18)
          ) {
            continue;
          }
          if (
            material === Material.ICE ||
            material === Material.WATER ||
            material === Material.SNOW ||
            material === Material.MUD
          ) {
            this.assign(index, Material.STEAM, 80 + randomInt(70));
          } else {
            const outputRoll = Math.random();
            if (blast.radius <= 5) {
              if (outputRoll < 0.38) {
                this.assign(index, Material.FIRE, 10 + randomInt(21));
              } else if (outputRoll < 0.58) {
                this.assign(index, Material.SMOKE, 18 + randomInt(26));
              } else {
                this.erase(index);
              }
            } else if (outputRoll < 0.68) {
              this.assign(index, Material.FIRE, 24 + randomInt(80));
            } else {
              this.assign(index, Material.SMOKE, 70 + randomInt(100));
            }
          }
          this.updated[index] = this.frame;
        }
      }
    }
  }

  private updateFire(x: number, y: number, index: number) {
    const around = this.neighbors(x, y);
    for (const neighbor of around) {
      const material = this.cells[neighbor] as Material;
      if (
        material === Material.WATER ||
        material === Material.ICE ||
        material === Material.SNOW
      ) {
        this.assign(neighbor, Material.STEAM, 90 + randomInt(80));
        this.assign(index, Material.SMOKE, 35 + randomInt(40));
        this.updated[neighbor] = this.frame;
        return;
      }
      if (
        ((material === Material.PLANT ||
          material === Material.SEED ||
          material === Material.FLOWER ||
          material === Material.SPROUT) &&
          Math.random() < 0.21) ||
        (material === Material.WOOD && Math.random() < 0.05) ||
        (material === Material.OIL && Math.random() < 0.38) ||
        (material === Material.COAL && Math.random() < 0.07) ||
        material === Material.FUSE ||
        explosionRadius(material) > 0
      ) {
        this.ignite(neighbor);
      }
    }

    let seedEmber = (this.life[index] & SEED_EMBER_FLAG) !== 0;
    const woodFire = (this.life[index] & WOOD_FIRE_FLAG) !== 0;
    let fireLife = this.life[index] & ~FIRE_STATE_FLAGS;
    if (fireLife === 0) fireLife = 35 + randomInt(65);
    fireLife -= 1;
    if (seedEmber && fireLife <= SEED_EMBER_RELEASE_LIFE) seedEmber = false;
    this.life[index] =
      fireLife |
      (seedEmber ? SEED_EMBER_FLAG : 0) |
      (woodFire ? WOOD_FIRE_FLAG : 0);
    if (fireLife === 0 || Math.random() < (woodFire ? 0.003 : 0.012)) {
      if (Math.random() < 0.72) {
        this.assign(index, Material.SMOKE, 45 + randomInt(90));
      } else {
        this.erase(index);
      }
      return;
    }
    if (!seedEmber && !woodFire) this.tryGasMove(x, y);
  }

  private updateLava(x: number, y: number, index: number) {
    let cooled = false;
    for (const neighbor of this.neighbors(x, y)) {
      const material = this.cells[neighbor] as Material;
      if (
        material === Material.WATER ||
        material === Material.ICE ||
        material === Material.SNOW
      ) {
        this.assign(neighbor, Material.STEAM, 100 + randomInt(80));
        this.assign(index, Material.STONE);
        this.updated[neighbor] = this.frame;
        cooled = true;
        break;
      }
      if (
        material === Material.WOOD ||
        material === Material.PLANT ||
        material === Material.SEED ||
        material === Material.FLOWER ||
        material === Material.SPROUT ||
        material === Material.OIL ||
        material === Material.COAL ||
        material === Material.FUSE ||
        explosionRadius(material) > 0
      ) {
        this.ignite(neighbor);
      }
      if (material === Material.SAND && Math.random() < 0.04) {
        this.assign(neighbor, Material.GLASS);
        this.updated[neighbor] = this.frame;
      }
    }
    if (!cooled && this.frame % 3 === 0)
      this.tryLiquidMove(x, y, Material.LAVA);
  }

  private updateAcid(x: number, y: number, index: number) {
    const around = this.neighbors(x, y);
    const target = around[randomInt(around.length)];
    if (target !== undefined) {
      const material = this.cells[target] as Material;
      const resistant =
        material === Material.EMPTY ||
        material === Material.ACID ||
        material === Material.GLASS ||
        material === Material.FIRE ||
        material === Material.SMOKE ||
        material === Material.STEAM;
      const stoneResists = material === Material.STONE && Math.random() > 0.08;
      if (!resistant && !stoneResists && Math.random() < 0.13) {
        this.erase(target);
        this.updated[target] = this.frame;
        if (Math.random() < 0.16) {
          this.assign(index, Material.SMOKE, 35 + randomInt(40));
          return;
        }
      }
    }
    this.tryLiquidMove(x, y, Material.ACID);
  }

  private updatePlant(x: number, y: number, index: number) {
    const around = this.neighbors(x, y);
    const hasWater = around.some(
      (neighbor) => this.cells[neighbor] === Material.WATER,
    );
    const hasDirt = around.some(
      (neighbor) => this.cells[neighbor] === Material.DIRT,
    );
    if (!hasWater || Math.random() > (hasDirt ? 0.038 : 0.022)) return;

    const candidates = [
      [x, y - 1],
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
    ] as const;
    const [targetX, targetY] = candidates[randomInt(candidates.length)];
    if (!this.inBounds(targetX, targetY)) return;
    const target = this.index(targetX, targetY);
    if (
      this.cells[target] === Material.EMPTY ||
      this.cells[target] === Material.DIRT
    ) {
      this.assign(target, Material.PLANT);
      this.updated[target] = this.frame;
    }
    if (Math.random() < 0.08) {
      const water = around.find(
        (neighbor) => this.cells[neighbor] === Material.WATER,
      );
      if (water !== undefined) this.erase(water);
    }
    this.updated[index] = this.frame;
  }

  private updateSeed(x: number, y: number, index: number) {
    const soilY = y + 1;
    const soil = this.inBounds(x, soilY)
      ? (this.cells[this.index(x, soilY)] as Material)
      : Material.EMPTY;
    const water = this.findNearby(x, y, 1, Material.WATER);
    const touchingPlant = this.neighbors(x, y).some((neighbor) => {
      const material = this.cells[neighbor] as Material;
      return (
        material === Material.PLANT ||
        material === Material.FLOWER ||
        material === Material.SPROUT
      );
    });
    const germinationTicks = touchingPlant
      ? 28
      : soil === Material.MUD
        ? 28
        : soil === Material.DIRT
          ? 55
          : water !== undefined
            ? 110
            : 0;

    if (germinationTicks === 0) {
      this.life[index] = 0;
      this.tryPowderMove(x, y);
      return;
    }

    this.life[index] += 1;
    if (this.life[index] < germinationTicks) {
      if (!touchingPlant && soil !== Material.MUD && soil !== Material.DIRT) {
        this.tryPowderMove(x, y);
      }
      return;
    }

    if (touchingPlant) {
      const extraHeight = 10 + randomInt(9);
      this.removeNearbySeeds(x, y, 1, index);
      this.assign(
        index,
        Material.SPROUT,
        (extraHeight << GROWTH_SHIFT) | GROWTH_COOLDOWN,
      );
      this.updated[index] = this.frame;
      return;
    }

    const firstStemY = y - 1;
    if (!this.inBounds(x, firstStemY)) return;
    if (this.cells[this.index(x, firstStemY)] !== Material.EMPTY) return;

    const targetHeight = 10 + randomInt(9);
    const tip = this.index(x, firstStemY);
    this.removeNearbySeeds(x, y, 2, index);
    this.assign(index, Material.PLANT);
    this.assign(
      tip,
      Material.SPROUT,
      ((targetHeight - 1) << GROWTH_SHIFT) | GROWTH_COOLDOWN,
    );
    this.updated[index] = this.frame;
    this.updated[tip] = this.frame;
    if (water !== undefined && Math.random() < 0.22) this.erase(water);
  }

  private updateSprout(x: number, y: number, index: number) {
    const remaining = this.life[index] >> GROWTH_SHIFT;
    const cooldown = this.life[index] & 0x0f;
    if (cooldown > 0) {
      this.life[index] -= 1;
      return;
    }

    if (remaining === 0) {
      this.assign(index, Material.FLOWER);
      return;
    }

    const targetY = y - 1;
    if (!this.inBounds(x, targetY)) {
      this.assign(index, Material.FLOWER);
      return;
    }

    let nextX = x;
    if (remaining % 3 === 0) {
      const drift = Math.random() < 0.5 ? -1 : 1;
      const driftX = x + drift;
      if (
        this.inBounds(driftX, targetY) &&
        this.cells[this.index(driftX, targetY)] === Material.EMPTY
      ) {
        nextX = driftX;
      }
    }

    let target = this.index(nextX, targetY);
    if (this.cells[target] === Material.SEED) this.erase(target);
    if (this.cells[target] !== Material.EMPTY && nextX !== x) {
      nextX = x;
      target = this.index(nextX, targetY);
      if (this.cells[target] === Material.SEED) this.erase(target);
    }
    if (this.cells[target] !== Material.EMPTY) {
      this.assign(index, Material.FLOWER);
      return;
    }

    this.assign(index, Material.PLANT);
    this.assign(
      target,
      Material.SPROUT,
      ((remaining - 1) << GROWTH_SHIFT) | GROWTH_COOLDOWN,
    );
    this.updated[index] = this.frame;
    this.updated[target] = this.frame;
    this.removeNearbySeeds(nextX, targetY, 1);

    if (remaining > 2 && remaining % 3 === 0) {
      const branchDirection = remaining % 2 === 0 ? -1 : 1;
      const branchLength = 2 + randomInt(3);
      let branchTip: number | undefined;
      for (let branchStep = 1; branchStep <= branchLength; branchStep += 1) {
        const branchX = nextX + branchDirection * branchStep;
        const branchY = targetY + Math.floor(branchStep / 2);
        if (!this.inBounds(branchX, branchY)) break;
        const branch = this.index(branchX, branchY);
        if (this.cells[branch] !== Material.EMPTY) break;
        this.assign(branch, Material.PLANT);
        this.updated[branch] = this.frame;
        branchTip = branch;
      }
      if (branchTip !== undefined) {
        this.assign(branchTip, Material.FLOWER);
        this.updated[branchTip] = this.frame;
      }
    }
  }

  private updateIce(x: number, y: number, index: number) {
    const around = this.neighbors(x, y);
    if (around.some((neighbor) => isHeat(this.cells[neighbor] as Material))) {
      this.assign(index, Material.WATER);
      return;
    }
    if (Math.random() < 0.005) {
      const water = around.find(
        (neighbor) => this.cells[neighbor] === Material.WATER,
      );
      if (water !== undefined) {
        this.assign(water, Material.ICE);
        this.updated[water] = this.frame;
      }
    }
  }

  private updateSalt(x: number, y: number, index: number) {
    const water = this.neighbors(x, y).find(
      (neighbor) => this.cells[neighbor] === Material.WATER,
    );
    if (water !== undefined && Math.random() < 0.12) {
      this.erase(index);
      this.shade[water] = randomInt(PALETTES[Material.WATER].length);
      return;
    }
    this.tryPowderMove(x, y);
  }

  private updateDirt(x: number, y: number, index: number) {
    const water = this.neighbors(x, y).find(
      (neighbor) => this.cells[neighbor] === Material.WATER,
    );
    if (water !== undefined && Math.random() < 0.075) {
      this.assign(index, Material.MUD);
      if (Math.random() < 0.28) this.erase(water);
      return;
    }
    this.tryPowderMove(x, y);
  }

  private updateMud(x: number, y: number, index: number) {
    if (
      this.neighbors(x, y).some((neighbor) =>
        isHeat(this.cells[neighbor] as Material),
      )
    ) {
      if (Math.random() < 0.08) this.assign(index, Material.DIRT);
      return;
    }
    if (this.frame % 4 === 0) this.tryLiquidMove(x, y, Material.MUD);
  }

  private updateCoal(x: number, y: number, index: number) {
    if (
      this.neighbors(x, y).some((neighbor) =>
        isHeat(this.cells[neighbor] as Material),
      ) &&
      Math.random() < 0.1
    ) {
      this.ignite(index);
      return;
    }
    this.tryPowderMove(x, y);
  }

  private updateSnow(x: number, y: number, index: number) {
    const around = this.neighbors(x, y);
    if (around.some((neighbor) => isHeat(this.cells[neighbor] as Material))) {
      this.assign(index, Material.WATER);
      return;
    }
    if (Math.random() < 0.014) {
      const water = around.find(
        (neighbor) => this.cells[neighbor] === Material.WATER,
      );
      if (water !== undefined) {
        this.assign(water, Material.ICE);
        this.updated[water] = this.frame;
      }
    }
    this.tryPowderMove(x, y);
  }

  private updateMetal(x: number, y: number, index: number) {
    const around = this.neighbors(x, y);
    const touchingHeat = around.some((neighbor) =>
      isHeat(this.cells[neighbor] as Material),
    );
    const touchingHotMetal = around.some(
      (neighbor) =>
        this.cells[neighbor] === Material.METAL && this.life[neighbor] > 18,
    );
    if (touchingHeat) this.life[index] = 70;
    else if (touchingHotMetal && this.life[index] < 42) this.life[index] = 42;
    else if (this.life[index] > 0) this.life[index] -= 1;

    if (this.life[index] > 24) {
      const fuel = around.find((neighbor) => {
        const material = this.cells[neighbor] as Material;
        return (
          material === Material.PLANT ||
          material === Material.SEED ||
          material === Material.FLOWER ||
          material === Material.SPROUT ||
          material === Material.OIL ||
          material === Material.COAL ||
          material === Material.FUSE ||
          explosionRadius(material) > 0
        );
      });
      if (fuel !== undefined && Math.random() < 0.1) this.ignite(fuel);
    }
  }

  private updateMethane(x: number, y: number, index: number) {
    if (
      this.neighbors(x, y).some((neighbor) =>
        isHeat(this.cells[neighbor] as Material),
      )
    ) {
      this.ignite(index);
      return;
    }
    this.tryGasMove(x, y);
  }

  private updateNitro(x: number, y: number, index: number) {
    if (
      this.neighbors(x, y).some((neighbor) =>
        isHeat(this.cells[neighbor] as Material),
      )
    ) {
      this.ignite(index);
      return;
    }
    this.tryLiquidMove(x, y, Material.NITRO);
  }

  private updateFuse(x: number, y: number, index: number) {
    const around = this.neighbors(x, y);
    if (this.life[index] > 0) {
      const charge = around.find(
        (neighbor) => explosionRadius(this.cells[neighbor] as Material) > 0,
      );
      if (charge !== undefined) {
        this.ignite(charge);
        return;
      }

      for (const neighbor of around) {
        if (
          this.cells[neighbor] === Material.FUSE &&
          this.life[neighbor] === 0
        ) {
          this.life[neighbor] = 4;
          this.updated[neighbor] = this.frame;
        }
      }

      this.life[index] -= 1;
      if (this.life[index] === 0) this.erase(index);
      return;
    }

    if (around.some((neighbor) => isHeat(this.cells[neighbor] as Material))) {
      this.ignite(index);
      return;
    }
  }

  private updateGas(x: number, y: number, index: number) {
    if (this.cells[index] === Material.STEAM) {
      if (this.life[index] === 0) this.life[index] = 80 + randomInt(100);
      const materialAbove =
        y > 0 ? (this.cells[this.index(x, y - 1)] as Material) : Material.EMPTY;
      const hitCeiling =
        y === 0 || (materialAbove !== Material.EMPTY && !isGas(materialAbove));
      const touchingIce = this.neighbors(x, y).some(
        (neighbor) => this.cells[neighbor] === Material.ICE,
      );
      if ((hitCeiling || touchingIce) && Math.random() < 0.006) {
        this.assign(index, touchingIce ? Material.SNOW : Material.WATER);
        return;
      }
      if (this.frame % 2 === 0) {
        this.life[index] -= 1;
        if (this.life[index] === 0) {
          this.erase(index);
          return;
        }
      }
      this.tryGasMove(x, y);
      return;
    }

    if (this.life[index] === 0) this.life[index] = 80 + randomInt(100);
    this.life[index] -= 1;
    if (this.life[index] === 0) {
      this.erase(index);
      return;
    }
    this.tryGasMove(x, y);
  }

  step(iterations = 1) {
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      this.frame += 1;
      if (this.frame === 0xffffffff) {
        this.updated.fill(0);
        this.frame = 1;
      }

      const leftToRight = this.frame % 2 === 0;
      for (let y = this.height - 1; y >= 0; y -= 1) {
        for (let offset = 0; offset < this.width; offset += 1) {
          const x = leftToRight ? offset : this.width - 1 - offset;
          const index = this.index(x, y);
          if (this.updated[index] === this.frame) continue;
          const material = this.cells[index] as Material;
          if (material === Material.EMPTY) continue;

          this.updated[index] = this.frame;
          switch (material) {
            case Material.SAND:
            case Material.GUNPOWDER:
              this.tryPowderMove(x, y);
              break;
            case Material.DIRT:
              this.updateDirt(x, y, index);
              break;
            case Material.COAL:
              this.updateCoal(x, y, index);
              break;
            case Material.SNOW:
              this.updateSnow(x, y, index);
              break;
            case Material.SEED:
              this.updateSeed(x, y, index);
              break;
            case Material.SPROUT:
              this.updateSprout(x, y, index);
              break;
            case Material.FUSE:
              this.updateFuse(x, y, index);
              break;
            case Material.SALT:
              this.updateSalt(x, y, index);
              break;
            case Material.WATER:
            case Material.OIL:
              this.tryLiquidMove(x, y, material);
              break;
            case Material.MUD:
              this.updateMud(x, y, index);
              break;
            case Material.NITRO:
              this.updateNitro(x, y, index);
              break;
            case Material.FIRE:
              this.updateFire(x, y, index);
              break;
            case Material.LAVA:
              this.updateLava(x, y, index);
              break;
            case Material.ACID:
              this.updateAcid(x, y, index);
              break;
            case Material.PLANT:
              this.updatePlant(x, y, index);
              break;
            case Material.ICE:
              this.updateIce(x, y, index);
              break;
            case Material.METAL:
              this.updateMetal(x, y, index);
              break;
            case Material.METHANE:
              this.updateMethane(x, y, index);
              break;
            case Material.SMOKE:
            case Material.STEAM:
              this.updateGas(x, y, index);
              break;
            default:
              break;
          }
        }
      }
    }
  }

  paint(centerX: number, centerY: number, radius: number, material: Material) {
    const brushRadius = Math.max(1, Math.round(radius));
    const radiusSquared = brushRadius * brushRadius;
    for (let y = centerY - brushRadius; y <= centerY + brushRadius; y += 1) {
      for (let x = centerX - brushRadius; x <= centerX + brushRadius; x += 1) {
        if (!this.inBounds(x, y)) continue;
        const dx = x - centerX;
        const dy = y - centerY;
        if (dx * dx + dy * dy > radiusSquared) continue;
        if (material !== Material.EMPTY && Math.random() < 0.08) continue;
        const index = this.index(x, y);
        if (
          material === Material.FIRE &&
          this.cells[index] !== Material.EMPTY
        ) {
          continue;
        }
        const life =
          material === Material.FIRE
            ? 40 + randomInt(65)
            : material === Material.SMOKE || material === Material.STEAM
              ? 80 + randomInt(90)
              : 0;
        this.assign(index, material, life);
      }
    }
  }

  paintLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    radius: number,
    material: Material,
  ) {
    const distance = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
    const steps = Math.max(1, distance);
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      this.paint(
        Math.round(startX + (endX - startX) * progress),
        Math.round(startY + (endY - startY) * progress),
        radius,
        material,
      );
    }
  }

  clear() {
    this.cells.fill(Material.EMPTY);
    this.life.fill(0);
    this.shade.fill(0);
  }

  seedDemo() {
    this.clear();
    const floorY = Math.floor(this.height * 0.9);
    const ledgeY = Math.floor(this.height * 0.62);

    for (let x = 0; x < this.width; x += 1) {
      for (let y = floorY; y < this.height; y += 1) {
        this.assign(this.index(x, y), Material.STONE);
      }
    }

    for (let x = Math.floor(this.width * 0.08); x < this.width * 0.42; x += 1) {
      this.assign(this.index(x, ledgeY), Material.WOOD);
    }
    for (let y = ledgeY; y < floorY; y += 1) {
      this.assign(this.index(Math.floor(this.width * 0.08), y), Material.WOOD);
      this.assign(this.index(Math.floor(this.width * 0.42), y), Material.WOOD);
    }

    const waterTop = Math.floor(this.height * 0.7);
    for (let y = waterTop; y < floorY; y += 1) {
      for (let x = Math.floor(this.width * 0.1); x < this.width * 0.4; x += 1) {
        if (Math.random() < 0.9) {
          this.assign(this.index(x, y), Material.WATER);
        }
      }
    }

    for (let x = Math.floor(this.width * 0.56); x < this.width * 0.9; x += 1) {
      const mound = Math.abs(x - this.width * 0.73) * 0.34;
      const top = Math.floor(this.height * 0.72 + mound);
      for (let y = top; y < floorY; y += 1) {
        this.assign(this.index(x, y), Material.SAND);
      }
    }
  }

  resize(width: number, height: number) {
    const nextWidth = Math.max(48, Math.round(width));
    const nextHeight = Math.max(48, Math.round(height));
    if (nextWidth === this.width && nextHeight === this.height) return;

    const nextCells = new Uint8Array(nextWidth * nextHeight);
    const nextLife = new Uint16Array(nextWidth * nextHeight);
    const nextShade = new Uint8Array(nextWidth * nextHeight);
    for (let y = 0; y < nextHeight; y += 1) {
      const sourceY = Math.min(
        this.height - 1,
        Math.floor((y / nextHeight) * this.height),
      );
      for (let x = 0; x < nextWidth; x += 1) {
        const sourceX = Math.min(
          this.width - 1,
          Math.floor((x / nextWidth) * this.width),
        );
        const source = this.index(sourceX, sourceY);
        const target = y * nextWidth + x;
        nextCells[target] = this.cells[source];
        nextLife[target] = this.life[source];
        nextShade[target] = this.shade[source];
      }
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.cells = nextCells;
    this.life = nextLife;
    this.shade = nextShade;
    this.updated = new Uint32Array(nextWidth * nextHeight);
    this.imageData = null;
  }

  render(context: CanvasRenderingContext2D) {
    if (
      !this.imageData ||
      this.imageData.width !== this.width ||
      this.imageData.height !== this.height
    ) {
      this.imageData = context.createImageData(this.width, this.height);
    }
    const pixels = this.imageData.data;
    for (let index = 0; index < this.cells.length; index += 1) {
      const material = this.cells[index] as Material;
      const palette = PALETTES[material];
      let shade = this.shade[index] % palette.length;
      if (material === Material.FUSE && this.life[index] > 0) {
        shade = (this.frame + index) % 4 === 0 ? 2 : 3;
      } else if (
        (material === Material.FIRE ||
          material === Material.LAVA ||
          (material === Material.METAL && this.life[index] > 0)) &&
        (this.frame + index) % 7 === 0
      ) {
        shade = (shade + 1) % palette.length;
      }
      const [red, green, blue] = palette[shade];
      const pixel = index * 4;
      pixels[pixel] = red;
      pixels[pixel + 1] = green;
      pixels[pixel + 2] = blue;
      pixels[pixel + 3] = 255;
    }
    context.putImageData(this.imageData, 0, 0);
  }

  getMaterialCounts() {
    const counts = Array<number>(MATERIAL_COUNT).fill(0);
    for (const material of this.cells) counts[material] += 1;
    return counts;
  }

  serialize() {
    const payload: SerializedWorld = {
      version: 1,
      width: this.width,
      height: this.height,
      cells: encodeBytes(this.cells),
      life: encodeBytes(new Uint8Array(this.life.buffer)),
      shade: encodeBytes(this.shade),
    };
    return JSON.stringify(payload);
  }

  load(serialized: string) {
    const parsed = JSON.parse(serialized) as Partial<SerializedWorld>;
    if (
      parsed.version !== 1 ||
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number" ||
      typeof parsed.cells !== "string" ||
      typeof parsed.life !== "string" ||
      typeof parsed.shade !== "string"
    ) {
      throw new Error("This save file is not a supported Falling Sand world.");
    }

    const width = Math.round(parsed.width);
    const height = Math.round(parsed.height);
    if (width < 48 || height < 48 || width * height > 120_000) {
      throw new Error("This save file has an invalid world size.");
    }

    const cells = decodeBytes(parsed.cells);
    const lifeBytes = decodeBytes(parsed.life);
    const shade = decodeBytes(parsed.shade);
    const length = width * height;
    if (
      cells.length !== length ||
      lifeBytes.length !== length * 2 ||
      shade.length !== length
    ) {
      throw new Error("This save file is incomplete.");
    }
    for (const material of cells) {
      if (material >= MATERIAL_COUNT) {
        throw new Error("This save file contains an unknown material.");
      }
    }

    this.width = width;
    this.height = height;
    this.cells = cells;
    this.life = new Uint16Array(lifeBytes.buffer);
    this.shade = shade;
    this.updated = new Uint32Array(length);
    this.imageData = null;
  }
}
