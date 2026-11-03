import { PlayerStats } from '../types/game';
import { ZEN_THEMES } from '../constants/themes';
import { ZEN_SOUNDSCAPES } from '../constants/soundscapes';
import { addCoins } from './walletStorage';

const STORAGE_KEY = 'solis_zen_game_stats_v2';

export const DEFAULT_STATS: PlayerStats = {
  currentLevel: 1,
  maxLevelUnlocked: 1,
  totalSolved: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastDailyDate: null,
  completedPuzzleIds: [],
  completedDailyDates: [],
  unlockedThemes: ['kyoto-slate'],
  unlockedSoundscapes: ['bowls'],
  activeThemeId: 'kyoto-slate',
  activeSoundscapeId: 'bowls',
  soundscapeVolume: 0.45,
  isMuted: false,
  isZenMode: false,
};

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      currentLevel: Math.max(1, parsed.currentLevel || 1),
      maxLevelUnlocked: Math.max(1, parsed.maxLevelUnlocked || parsed.currentLevel || 1),
      unlockedThemes: Array.from(new Set(['kyoto-slate', ...(parsed.unlockedThemes || [])])),
      unlockedSoundscapes: Array.from(new Set(['bowls', ...(parsed.unlockedSoundscapes || [])])),
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export interface WinResult {
  stats: PlayerStats;
  isFirstSolve: boolean;
  newUnlockedThemes: string[];
  newUnlockedSoundscapes: string[];
  nextLevelNumber: number;
  coinsEarned: number;
}

export function recordPuzzleWin(
  puzzleId: string,
  isDaily: boolean = false,
  dateStr?: string,
  levelNumber?: number
): WinResult {
  const current = loadPlayerStats();
  const isFirstSolve = !current.completedPuzzleIds.includes(puzzleId);

  const completedPuzzleIds = isFirstSolve
    ? [...current.completedPuzzleIds, puzzleId]
    : current.completedPuzzleIds;

  let completedDailyDates = current.completedDailyDates;
  let currentStreak = current.currentStreak;
  let bestStreak = current.bestStreak;
  let lastDailyDate = current.lastDailyDate;
  let streakCoinsEarned = 0;

  const today = dateStr || new Date().toISOString().split('T')[0];

  if (isDaily && !current.completedDailyDates.includes(today)) {
    completedDailyDates = [...completedDailyDates, today];

    if (lastDailyDate) {
      const last = new Date(lastDailyDate);
      const currDate = new Date(today);
      const diffDays = Math.round((currDate.getTime() - last.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays === 0) {
        // same day
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    lastDailyDate = today;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    // Calculate streak bonus coins: 50 base + 25 * streak
    streakCoinsEarned = 50 + currentStreak * 25;
    addCoins(streakCoinsEarned);
  } else if (!isDaily && isFirstSolve) {
    // Standard level win coin reward
    streakCoinsEarned = 25;
    addCoins(25);
  }

  const totalSolved = isFirstSolve ? current.totalSolved + 1 : current.totalSolved;

  // Level Progression
  let nextMaxLevel = current.maxLevelUnlocked;
  let nextCurrentLevel = current.currentLevel;

  if (levelNumber !== undefined && levelNumber > 0) {
    if (levelNumber >= nextMaxLevel) {
      nextMaxLevel = levelNumber + 1;
    }
    nextCurrentLevel = levelNumber + 1;
  }

  // Check newly unlocked themes
  const newUnlockedThemes: string[] = [];
  const updatedUnlockedThemes = [...current.unlockedThemes];
  ZEN_THEMES.forEach(theme => {
    if (
      !updatedUnlockedThemes.includes(theme.id) &&
      (nextMaxLevel >= theme.requiredWins || totalSolved >= theme.requiredWins)
    ) {
      updatedUnlockedThemes.push(theme.id);
      newUnlockedThemes.push(theme.name);
    }
  });

  // Check newly unlocked soundscapes
  const newUnlockedSoundscapes: string[] = [];
  const updatedUnlockedSoundscapes = [...current.unlockedSoundscapes];
  ZEN_SOUNDSCAPES.forEach(snd => {
    if (
      !updatedUnlockedSoundscapes.includes(snd.id) &&
      (nextMaxLevel >= snd.requiredWins || totalSolved >= snd.requiredWins)
    ) {
      updatedUnlockedSoundscapes.push(snd.id);
      newUnlockedSoundscapes.push(snd.name);
    }
  });

  const nextStats: PlayerStats = {
    ...current,
    currentLevel: nextCurrentLevel,
    maxLevelUnlocked: nextMaxLevel,
    totalSolved,
    currentStreak,
    bestStreak,
    lastDailyDate,
    completedPuzzleIds,
    completedDailyDates,
    unlockedThemes: updatedUnlockedThemes,
    unlockedSoundscapes: updatedUnlockedSoundscapes,
  };

  savePlayerStats(nextStats);

  return {
    stats: nextStats,
    isFirstSolve,
    newUnlockedThemes,
    newUnlockedSoundscapes,
    nextLevelNumber: nextCurrentLevel,
    coinsEarned: streakCoinsEarned,
  };
}

