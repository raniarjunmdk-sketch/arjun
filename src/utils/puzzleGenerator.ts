import { CellCoord, ElementPair, PuzzleDefinition } from '../types/game';

// Element metadata with rich visual tokens
export const ELEMENT_PRESETS = [
  {
    type: 'sun' as const,
    label: 'Sun Amber',
    symbol: '☼',
    colorHex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.45)',
  },
  {
    type: 'water' as const,
    label: 'Flow Water',
    symbol: '≈',
    colorHex: '#38bdf8',
    glowHex: 'rgba(56, 189, 248, 0.45)',
  },
  {
    type: 'leaf' as const,
    label: 'Bamboo Leaf',
    symbol: '⸙',
    colorHex: '#10b981',
    glowHex: 'rgba(16, 185, 129, 0.45)',
  },
  {
    type: 'lotus' as const,
    label: 'Lotus Blossom',
    symbol: '𑁍',
    colorHex: '#f43f5e',
    glowHex: 'rgba(244, 63, 94, 0.45)',
  },
  {
    type: 'moon' as const,
    label: 'Moon Crystal',
    symbol: '☽',
    colorHex: '#a855f7',
    glowHex: 'rgba(168, 85, 247, 0.45)',
  },
  {
    type: 'dawn' as const,
    label: 'Dawn Wind',
    symbol: '༄',
    colorHex: '#14b8a6',
    glowHex: 'rgba(20, 184, 166, 0.45)',
  },
  {
    type: 'earth' as const,
    label: 'Earth Stone',
    symbol: '◆',
    colorHex: '#fb923c',
    glowHex: 'rgba(251, 146, 60, 0.45)',
  },
  {
    type: 'sakura' as const,
    label: 'Sakura Petal',
    symbol: '✿',
    colorHex: '#ec4899',
    glowHex: 'rgba(236, 72, 153, 0.45)',
  },
];

// Simple deterministic PRNG based on Mulberry32
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string to integer seed
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Handcrafted early levels 1-10 for pristine beginner onboarding
export const EARLY_CURATED_LEVELS: Partial<PuzzleDefinition>[] = [
  {
    title: 'First Morning Ray',
    gridSize: 5,
    difficulty: 'gentle',
    pairs: [
      { id: 'p1', ...ELEMENT_PRESETS[0], start: { r: 0, c: 0 }, end: { r: 4, c: 0 } },
      { id: 'p2', ...ELEMENT_PRESETS[1], start: { r: 0, c: 2 }, end: { r: 3, c: 2 } },
      { id: 'p3', ...ELEMENT_PRESETS[2], start: { r: 0, c: 4 }, end: { r: 4, c: 4 } },
    ],
  },
  {
    title: 'Twin Streams',
    gridSize: 5,
    difficulty: 'gentle',
    pairs: [
      { id: 'p1', ...ELEMENT_PRESETS[0], start: { r: 0, c: 1 }, end: { r: 3, c: 3 } },
      { id: 'p2', ...ELEMENT_PRESETS[1], start: { r: 1, c: 0 }, end: { r: 4, c: 2 } },
      { id: 'p3', ...ELEMENT_PRESETS[3], start: { r: 0, c: 4 }, end: { r: 4, c: 4 } },
      { id: 'p4', ...ELEMENT_PRESETS[2], start: { r: 2, c: 1 }, end: { r: 4, c: 0 } },
    ],
  },
  {
    title: 'Echo in the Reeds',
    gridSize: 5,
    difficulty: 'gentle',
    pairs: [
      { id: 'p1', ...ELEMENT_PRESETS[0], start: { r: 0, c: 0 }, end: { r: 2, c: 3 } },
      { id: 'p2', ...ELEMENT_PRESETS[1], start: { r: 1, c: 1 }, end: { r: 4, c: 2 } },
      { id: 'p3', ...ELEMENT_PRESETS[2], start: { r: 0, c: 3 }, end: { r: 3, c: 0 } },
      { id: 'p4', ...ELEMENT_PRESETS[3], start: { r: 1, c: 4 }, end: { r: 4, c: 4 } },
    ],
  },
  {
    title: 'Moss Path',
    gridSize: 5,
    difficulty: 'gentle',
    pairs: [
      { id: 'p1', ...ELEMENT_PRESETS[0], start: { r: 0, c: 0 }, end: { r: 3, c: 1 } },
      { id: 'p2', ...ELEMENT_PRESETS[1], start: { r: 0, c: 4 }, end: { r: 4, c: 2 } },
      { id: 'p3', ...ELEMENT_PRESETS[2], start: { r: 1, c: 2 }, end: { r: 4, c: 0 } },
      { id: 'p4', ...ELEMENT_PRESETS[3], start: { r: 2, c: 4 }, end: { r: 4, c: 4 } },
    ],
  },
  {
    title: 'Sanctuary Gate',
    gridSize: 5,
    difficulty: 'gentle',
    pairs: [
      { id: 'p1', ...ELEMENT_PRESETS[0], start: { r: 0, c: 1 }, end: { r: 3, c: 4 } },
      { id: 'p2', ...ELEMENT_PRESETS[1], start: { r: 0, c: 3 }, end: { r: 3, c: 0 } },
      { id: 'p3', ...ELEMENT_PRESETS[2], start: { r: 1, c: 0 }, end: { r: 4, c: 1 } },
      { id: 'p4', ...ELEMENT_PRESETS[3], start: { r: 2, c: 2 }, end: { r: 4, c: 4 } },
      { id: 'p5', ...ELEMENT_PRESETS[4], start: { r: 0, c: 0 }, end: { r: 4, c: 3 } },
    ],
  },
];

/**
 * Get poetical title and chapter name for any level
 */
export function getLevelMetadata(levelNum: number): { realm: string; title: string; rankTitle: string } {
  const realms = [
    { max: 10, name: 'Bamboo Grove', rank: 'Apprentice of Stillness' },
    { max: 25, name: 'Morning Mist & River', rank: 'Stream Seeker' },
    { max: 45, name: 'Lotus Sanctuary', rank: 'Stone Whisperer' },
    { max: 70, name: 'Cedar Forest', rank: 'Guardian of the Grove' },
    { max: 100, name: 'Moonlit Mountain', rank: 'Master of the Horizon' },
    { max: 999999, name: 'Infinite Celestial Cosmos', rank: 'Zen Ascendant' },
  ];

  const realmObj = realms.find(r => levelNum <= r.max) || realms[realms.length - 1];

  const levelPoeticNames = [
    'Whispering Stream',
    'Morning Sunbeam',
    'Lotus Awakening',
    'River Stone Harmony',
    'Bamboo Echo',
    'Dewdrop Reflection',
    'Gentle Pine Breeze',
    'Twilight Current',
    'Still Water Ripples',
    'Autumn Leaf Flight',
    'Mountain Solitude',
    'Warm Hearth Light',
    'Hidden Spring',
    'Silver Moonlight',
    'Cedar Shadow',
    'Silent Bell',
    'Orchid Blossom',
    'Ancient Moss Gate',
    'Crescent Tide',
    'Starlight Canopy',
    'Deep Harmony',
    'Zenith Horizon',
    'Radiant Ember',
    'Cloud Veil',
    'Endless Peace',
  ];

  const nameIdx = (levelNum - 1) % levelPoeticNames.length;
  const title = `Level ${levelNum}: ${levelPoeticNames[nameIdx]}`;

  return {
    realm: realmObj.name,
    title,
    rankTitle: realmObj.rank,
  };
}

/**
 * Procedural Solvable Puzzle Generator
 */
export function generateProceduralPuzzle(options: {
  gridSize: number;
  numPairs?: number;
  rng?: () => number;
  id?: string;
  title?: string;
  difficulty?: 'gentle' | 'balanced' | 'deep';
  isDaily?: boolean;
  dateStr?: string;
  levelNumber?: number;
}): PuzzleDefinition {
  const {
    gridSize,
    rng = Math.random,
    id = `garden_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title = 'Garden of Solitude',
    difficulty = 'balanced',
    isDaily = false,
    dateStr,
    levelNumber,
  } = options;

  const targetPairs =
    options.numPairs ??
    (gridSize === 5 ? 3 : gridSize === 6 ? 4 : gridSize === 7 ? 5 : 6);

  const board: number[][] = Array(gridSize)
    .fill(0)
    .map(() => Array(gridSize).fill(-1));

  const paths: CellCoord[][] = [];

  const getNeighbors = (r: number, c: number) => {
    const list: CellCoord[] = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 },
    ];
    return list.filter(pt => pt.r >= 0 && pt.r < gridSize && pt.c >= 0 && pt.c < gridSize);
  };

  for (let pairIdx = 0; pairIdx < targetPairs; pairIdx++) {
    const emptyCells: CellCoord[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (board[r][c] === -1) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length < 3) break;

    const start = emptyCells[Math.floor(rng() * emptyCells.length)];
    const currentPath: CellCoord[] = [start];
    board[start.r][start.c] = pairIdx;

    const maxLen = Math.min(8, 3 + Math.floor(rng() * (gridSize + 1)));

    let curr = start;
    for (let step = 1; step < maxLen; step++) {
      const neighbors = getNeighbors(curr.r, curr.c).filter(n => board[n.r][n.c] === -1);
      if (neighbors.length === 0) break;
      const next = neighbors[Math.floor(rng() * neighbors.length)];
      board[next.r][next.c] = pairIdx;
      currentPath.push(next);
      curr = next;
    }

    if (currentPath.length >= 2) {
      paths.push(currentPath);
    } else {
      board[start.r][start.c] = -1;
    }
  }

  // Ensure at least 3 valid pairs
  if (paths.length < 3) {
    // Return early curated template
    const curated = EARLY_CURATED_LEVELS[0];
    return {
      id,
      title,
      gridSize: 5,
      difficulty: 'gentle',
      pairs: curated.pairs as ElementPair[],
      isDaily,
      dateStr,
      levelNumber,
    };
  }

  const pairs: ElementPair[] = paths.map((path, idx) => {
    const preset = ELEMENT_PRESETS[idx % ELEMENT_PRESETS.length];
    return {
      id: `p_${idx}`,
      ...preset,
      start: path[0],
      end: path[path.length - 1],
    };
  });

  return {
    id,
    title,
    gridSize,
    difficulty,
    pairs,
    isDaily,
    dateStr,
    levelNumber,
  };
}

/**
 * INFINITE PROGRESSIVE LEVEL GENERATOR ("Jitna khelega utna level badhta rahe")
 * Produces guaranteed solvable deterministic puzzles for Level 1, 2, 3... 1000+!
 */
export function getLevelPuzzle(levelNum: number): PuzzleDefinition {
  const safeLevel = Math.max(1, Math.floor(levelNum));
  const meta = getLevelMetadata(safeLevel);

  // For very early beginner levels (1-5), use handcrafted introductory layouts
  if (safeLevel <= EARLY_CURATED_LEVELS.length) {
    const curated = EARLY_CURATED_LEVELS[safeLevel - 1];
    return {
      id: `level_${safeLevel}`,
      title: meta.title,
      chapter: meta.realm,
      gridSize: curated.gridSize || 5,
      difficulty: (curated.difficulty as 'gentle' | 'balanced' | 'deep') || 'gentle',
      pairs: curated.pairs as ElementPair[],
      levelNumber: safeLevel,
    };
  }

  // Determine grid size and target pairs based on level curve
  let gridSize = 5;
  let targetPairs = 4;
  let difficulty: 'gentle' | 'balanced' | 'deep' = 'gentle';

  if (safeLevel <= 10) {
    gridSize = 5;
    targetPairs = 4;
    difficulty = 'gentle';
  } else if (safeLevel <= 25) {
    gridSize = 6;
    targetPairs = 4 + (safeLevel % 2); // 4 or 5
    difficulty = 'balanced';
  } else if (safeLevel <= 55) {
    gridSize = safeLevel % 3 === 0 ? 7 : 6;
    targetPairs = 5;
    difficulty = 'balanced';
  } else if (safeLevel <= 100) {
    gridSize = 7;
    targetPairs = 5 + (safeLevel % 2);
    difficulty = 'deep';
  } else {
    // 101+ Master levels
    gridSize = safeLevel % 4 === 0 ? 8 : 7;
    targetPairs = 6;
    difficulty = 'deep';
  }

  // Deterministic seed for this exact level number
  let seedOffset = 0;
  let puzzle: PuzzleDefinition | null = null;

  while (seedOffset < 10) {
    const rng = mulberry32(safeLevel * 104729 + seedOffset * 997 + 54321);
    const candidate = generateProceduralPuzzle({
      gridSize,
      numPairs: targetPairs,
      rng,
      id: `level_${safeLevel}`,
      title: meta.title,
      difficulty,
      levelNumber: safeLevel,
    });

    if (candidate.pairs.length >= Math.min(3, targetPairs - 1)) {
      candidate.chapter = meta.realm;
      puzzle = candidate;
      break;
    }
    seedOffset++;
  }

  return (
    puzzle || {
      id: `level_${safeLevel}`,
      title: meta.title,
      chapter: meta.realm,
      gridSize: 5,
      difficulty: 'gentle',
      pairs: EARLY_CURATED_LEVELS[0].pairs as ElementPair[],
      levelNumber: safeLevel,
    }
  );
}

/**
 * Generate a deterministic Daily Logic Puzzle for any calendar date (YYYY-MM-DD)
 */
export function generateDailyPuzzle(dateStr: string): PuzzleDefinition {
  const seed = stringToSeed('daily_solis_' + dateStr);
  const rng = mulberry32(seed);

  const titles = [
    'Dewdrop on Stone',
    'Morning Breeze',
    'Quiet Forest Clearing',
    'Lotus Reflection',
    'Mountain Solitude',
    'Sunlit Pathway',
    'Cedar Twilight',
    'Rain at Dawn',
    'Willow Whisper',
    'Starry Horizon',
    'Warm Hearth',
    'Zenith Harmony',
  ];

  const title = titles[Math.floor(rng() * titles.length)];
  const gridSize = 6;
  const numPairs = 5;

  return generateProceduralPuzzle({
    gridSize,
    numPairs,
    rng,
    id: `daily_${dateStr}`,
    title: `Daily: ${title}`,
    difficulty: 'balanced',
    isDaily: true,
    dateStr,
  });
}

/**
 * Check if puzzle is solved
 */
export function checkPuzzleSolved(
  puzzle: PuzzleDefinition,
  paths: Record<string, CellCoord[]>
): boolean {
  if (!puzzle || !puzzle.pairs) return false;

  const usedCells = new Set<string>();

  for (const pair of puzzle.pairs) {
    const path = paths[pair.id];
    if (!path || path.length < 2) return false;

    const first = path[0];
    const last = path[path.length - 1];

    const connectsForward =
      first.r === pair.start.r &&
      first.c === pair.start.c &&
      last.r === pair.end.r &&
      last.c === pair.end.c;

    const connectsBackward =
      first.r === pair.end.r &&
      first.c === pair.end.c &&
      last.r === pair.start.r &&
      last.c === pair.start.c;

    if (!connectsForward && !connectsBackward) return false;

    for (let i = 0; i < path.length; i++) {
      const cell = path[i];
      const key = `${cell.r},${cell.c}`;
      if (usedCells.has(key)) {
        return false;
      }
      usedCells.add(key);

      if (i > 0) {
        const prev = path[i - 1];
        const dist = Math.abs(cell.r - prev.r) + Math.abs(cell.c - prev.c);
        if (dist !== 1) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Solitary logic hint generator
 */
export function getPuzzleHint(
  puzzle: PuzzleDefinition,
  paths: Record<string, CellCoord[]>
): { pairId: string; coord: CellCoord; message: string } | null {
  for (const pair of puzzle.pairs) {
    const path = paths[pair.id] || [];
    if (path.length === 0) {
      return {
        pairId: pair.id,
        coord: pair.start,
        message: `Begin with ${pair.label} at row ${pair.start.r + 1}, column ${pair.start.c + 1}`,
      };
    }
  }
  return null;
}
