export type CellCoord = {
  r: number;
  c: number;
};

export type ElementColor = 
  | 'sun'       // warm gold / amber
  | 'water'     // serene cyan / azure
  | 'leaf'      // bamboo emerald / sage
  | 'lotus'     // gentle cherry / lotus pink
  | 'moon'      // ethereal lavender / violet
  | 'sakura'    // blush crimson / coral
  | 'earth'     // warm terracotta / clay
  | 'dawn';     // radiant teal / sky

export interface ElementPair {
  id: string;
  type: ElementColor;
  label: string;
  symbol: string;
  start: CellCoord;
  end: CellCoord;
  colorHex: string;
  glowHex: string;
}

export interface PuzzleDefinition {
  id: string;
  title: string;
  chapter?: string;
  gridSize: number; // 5, 6, 7, 8
  pairs: ElementPair[];
  parMoves?: number;
  difficulty: 'gentle' | 'balanced' | 'deep';
  isDaily?: boolean;
  dateStr?: string; // YYYY-MM-DD
  levelNumber?: number; // Infinite progressive level number (1, 2, 3... 100+)
}

export type PathMap = Record<string, CellCoord[]>;

export interface ThemeConfig {
  id: string;
  name: string;
  subtitle: string;
  requiredWins: number;
  unlockRequirementText: string;
  background: string;
  boardBg: string;
  cellBg: string;
  cellBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  pathGlow: boolean;
  petalType: 'cherry' | 'bamboo' | 'lotus' | 'stardust' | 'dusk';
}

export interface SoundscapeConfig {
  id: string;
  name: string;
  subtitle: string;
  requiredWins: number;
  unlockRequirementText: string;
  type: 'bowls' | 'rain' | 'drone' | 'chimes' | 'stream';
}

export interface PlayerStats {
  currentLevel: number;      // Current active level to play
  maxLevelUnlocked: number;  // Highest level unlocked
  totalSolved: number;
  currentStreak: number;
  bestStreak: number;
  lastDailyDate: string | null;
  completedPuzzleIds: string[];
  completedDailyDates: string[];
  unlockedThemes: string[];
  unlockedSoundscapes: string[];
  activeThemeId: string;
  activeSoundscapeId: string;
  soundscapeVolume: number;
  isMuted: boolean;
  isZenMode: boolean;
}
