// Life-like rules packed into 18 bits: bit n means "a dead cell with n live
// neighbors is born", and bit 9 + n means "a live cell with n survives".

export type Rule = number;

export const NEIGHBOR_COUNTS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export const birthBit = (n: number) => 1 << n;
export const survivalBit = (n: number) => 1 << (9 + n);

const ALL_RULE_BITS = (1 << 18) - 1;

const digits = (mask: number) =>
  NEIGHBOR_COUNTS.filter((n) => mask & (1 << n)).join("");

/** Golly notation, such as "B3/S23". An empty half stays as a bare letter. */
export const ruleString = (rule: Rule) =>
  `B${digits(rule & 0x1ff)}/S${digits(rule >>> 9)}`;

/** Reads "B3/S23", "b3s23" or "B3S23". Returns null for anything else. */
export function parseRule(text: string): Rule | null {
  const match = /^B([0-8]*)\/?S([0-8]*)$/i.exec(text.trim());
  if (!match) return null;
  let rule = 0;
  for (const digit of match[1]) rule |= birthBit(Number(digit));
  for (const digit of match[2]) rule |= survivalBit(Number(digit));
  return rule;
}

/**
 * Rules with B0 but not S8 flip every empty cell on, then off again, every
 * generation. Like Golly, we show odd generations inverted so the board
 * doesn't strobe, which takes a second rule for odd generations.
 * Returns the rules for [even, odd] generations.
 */
export function phaseRules(rule: Rule): [Rule, Rule] {
  if (!(rule & birthBit(0)) || rule & survivalBit(8)) return [rule, rule];

  let odd = 0;
  for (const n of NEIGHBOR_COUNTS) {
    if (rule & survivalBit(8 - n)) odd |= birthBit(n);
    if (rule & birthBit(8 - n)) odd |= survivalBit(n);
  }
  return [~rule & ALL_RULE_BITS, odd];
}

// ───────── The multiverse map ─────────
//
// Only "connected" rules are on the map: rules whose birth counts and survival
// counts each form one unbroken range (or are empty). That leaves 46 options
// per half, so 46 × 46 = 2,116 universes. Rows group into families by where
// the birth range starts (0+, 1+, … 8+, none), and columns by where the
// survival range starts. Inside a family, survival ranges grow rightward and
// birth ranges grow upward, so B3/S2 sits in the bottom-left of its family.

export const GRID = 46;
export const UNIVERSES = GRID * GRID;
export const FAMILIES = 10;

const rangeMask = (start: number, end: number) =>
  ((1 << (end + 1)) - 1) & ~((1 << start) - 1);

type Axis = { masks: number[]; family: number[]; familyStart: number[] };

function buildAxis(rangesGrowUp: boolean): Axis {
  const masks: number[] = [];
  const family: number[] = [];
  const familyStart: number[] = [];

  for (let start = 0; start <= 9; start += 1) {
    familyStart.push(masks.length);
    // Family 9 holds only the empty range.
    const ends =
      start === 9 ? [-1] : NEIGHBOR_COUNTS.filter((end) => end >= start);
    if (rangesGrowUp) ends.reverse();
    for (const end of ends) {
      masks.push(end < 0 ? 0 : rangeMask(start, end));
      family.push(start);
    }
  }
  familyStart.push(masks.length);
  return { masks, family, familyStart };
}

/** Columns: survival ranges. */
export const COLUMNS = buildAxis(false);
/** Rows, top to bottom: birth ranges. */
export const ROWS = buildAxis(true);

export const ruleAt = (col: number, row: number): Rule =>
  ROWS.masks[row] | (COLUMNS.masks[col] << 9);

export const universeIndex = (col: number, row: number) => row * GRID + col;

/** Where a rule sits on the map, or null when it isn't connected. */
export function locate(rule: Rule): { col: number; row: number } | null {
  const col = COLUMNS.masks.indexOf(rule >>> 9);
  const row = ROWS.masks.indexOf(rule & 0x1ff);
  return col < 0 || row < 0 ? null : { col, row };
}

/** "3+" for a family that starts at three neighbors, "∅" for the empty one. */
export const familyLabel = (family: number) =>
  family === 9 ? "∅" : `${family}+`;

// ───────── Landmarks ─────────

export type Landmark = { name: string; rule: Rule; note: string };

const landmark = (name: string, rule: string, note: string): Landmark => ({
  name,
  rule: parseRule(rule)!,
  note,
});

export const LANDMARKS: Landmark[] = [
  landmark(
    "Conway's Life",
    "B3/S23",
    "The original. Blocks, blinkers and gliders, balanced between order and chaos.",
  ),
  landmark(
    "Ant Colony",
    "B3/S234",
    "Survival at four lets dead ends hold, so a busy growth front leaves tunnels behind it.",
  ),
  landmark(
    "World on Fire",
    "B34/S23",
    "Birth at four means crowded interiors keep igniting. Nothing ever settles.",
  ),
  landmark(
    "Blinkers",
    "B345/S2",
    "Noise sizzles for a while, then dwindles to a few lonely blinkers.",
  ),
  landmark(
    "Life Light",
    "B3/S2",
    "Even the block can't survive here, so almost everything fizzles out.",
  ),
  landmark(
    "Maze",
    "B3/S12345",
    "Grows clean, branching mazes with short straightaways.",
  ),
  landmark(
    "Mazectric",
    "B3/S1234",
    "Mazes with long corridors. Add birth at 7 to release the mice.",
  ),
  landmark(
    "Life without Death",
    "B3/S012345678",
    "Once born, a cell never dies. Swiss cheese, and ladders that climb at c/3.",
  ),
  landmark(
    "Coral",
    "B3/S45678",
    "A slow, breathing border that eventually conquers the board.",
  ),
  landmark(
    "Lifeguard 2",
    "B3/S4567",
    "Coral without survival at eight. It slowly shrivels away.",
  ),
  landmark(
    "Assimilation",
    "B345/S4567",
    "Diamonds with a crackling, alternating border.",
  ),
  landmark("Bacteria", "B34/S456", "Squirms everywhere."),
  landmark(
    "Seeds",
    "B2/S",
    "Every cell dies after one generation, yet most patterns explode.",
  ),
  landmark(
    "34 Life",
    "B34/S34",
    "Once hoped to be a calmer Life, until big patterns turned out to explode.",
  ),
  landmark(
    "Gnarl",
    "B1/S1",
    "Birth at one neighbor makes every pattern explode.",
  ),
];

export const landmarkFor = (rule: Rule) =>
  LANDMARKS.find((entry) => entry.rule === rule);

// ───────── Colors ─────────

// Cells are colored by age along a rainbow, one hue per doubling: newborns
// are white, then pink, red, yellow, green, cyan, blue, and indigo, ending in
// violet for cells that have lasted a couple hundred generations.
const AGE_STOPS: [age: number, rgb: [number, number, number]][] = [
  [1, [255, 255, 255]],
  [2, [255, 107, 190]],
  [4, [255, 82, 94]],
  [8, [255, 214, 64]],
  [16, [94, 224, 108]],
  [32, [48, 214, 212]],
  [64, [64, 150, 255]],
  [128, [116, 104, 255]],
  [255, [176, 98, 246]],
];

/** RGB for ages 0–255. Age 0 (dead) is unused. */
export const AGE_RGB: [number, number, number][] = Array.from(
  { length: 256 },
  (_, age) => {
    const at = Math.log2(Math.max(1, age));
    const upper = AGE_STOPS.findIndex(([stop]) => Math.log2(stop) >= at);
    if (upper <= 0) return AGE_STOPS[0][1];
    const [fromAge, from] = AGE_STOPS[upper - 1];
    const [toAge, to] = AGE_STOPS[upper];
    const t =
      (at - Math.log2(fromAge)) / (Math.log2(toAge) - Math.log2(fromAge));
    return from.map((value, i) => Math.round(value + (to[i] - value) * t)) as [
      number,
      number,
      number,
    ];
  },
);
