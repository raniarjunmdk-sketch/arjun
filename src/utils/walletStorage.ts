/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const WALLET_STORAGE_KEY = 'solis_coin_wallet_v1';
const INITIAL_COINS = 1000; // Login initial welcome reward: 1000 coins
const LAST_REFILL_KEY = 'solis_last_daily_coin_refill';
const XP_STORAGE_KEY = 'solis_player_xp_v1';

export interface PlayerLevelData {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXpRequired: number;
  progressPercent: number;
  title: string;
}

export function getWalletBalance(): number {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) {
      // Initialize with 1000 initial login coins reward
      localStorage.setItem(WALLET_STORAGE_KEY, String(INITIAL_COINS));
      return INITIAL_COINS;
    }
    const val = parseInt(raw, 10);
    return isNaN(val) ? INITIAL_COINS : val;
  } catch {
    return INITIAL_COINS;
  }
}

export function saveWalletBalance(amount: number): void {
  try {
    const clamped = Math.max(0, Math.floor(amount));
    localStorage.setItem(WALLET_STORAGE_KEY, String(clamped));
    window.dispatchEvent(new CustomEvent('solis_wallet_updated', { detail: { coins: clamped } }));
  } catch (e) {
    console.warn('Wallet save failed:', e);
  }
}

export function deductCoins(amount: number): boolean {
  const current = getWalletBalance();
  if (current < amount) {
    return false;
  }
  saveWalletBalance(current - amount);
  return true;
}

export function addCoins(amount: number): number {
  const current = getWalletBalance();
  const next = current + Math.max(0, amount);
  saveWalletBalance(next);
  return next;
}

// Player Level & XP Progression System
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Challenging XP formula: Level 1->2 (500 XP), Level 2->3 (1200 XP), Level 3->4 (2100 XP), etc.
  return Math.floor(500 * Math.pow(level - 1, 1.6));
}

export function getPlayerLevelData(totalXpOverride?: number): PlayerLevelData {
  let totalXp = 0;
  if (typeof totalXpOverride === 'number') {
    totalXp = totalXpOverride;
  } else {
    try {
      totalXp = parseInt(localStorage.getItem(XP_STORAGE_KEY) || '0', 10);
      if (isNaN(totalXp)) totalXp = 0;
    } catch {
      totalXp = 0;
    }
  }

  let level = 1;
  while (totalXp >= getXpForLevel(level + 1)) {
    level++;
  }

  const currentLevelBaseXp = getXpForLevel(level);
  const nextLevelBaseXp = getXpForLevel(level + 1);
  const xpNeededForThisLevel = nextLevelBaseXp - currentLevelBaseXp;
  const currentLevelXp = totalXp - currentLevelBaseXp;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((currentLevelXp / xpNeededForThisLevel) * 100)));

  let title = 'Tas Patti Beginner';
  if (level >= 2 && level <= 3) title = 'Club Apprentice';
  else if (level >= 4 && level <= 6) title = 'Hazari Contender';
  else if (level >= 7 && level <= 9) title = 'Trick Strategist';
  else if (level >= 10 && level <= 14) title = 'Card Master';
  else if (level >= 15 && level <= 20) title = 'Hazari Grandmaster';
  else if (level >= 21) title = 'Legendary Club Royalty';

  return {
    level,
    totalXp,
    currentLevelXp,
    nextLevelXpRequired: xpNeededForThisLevel,
    progressPercent,
    title,
  };
}

export function addPlayerXP(amount: number): {
  oldLevelData: PlayerLevelData;
  newLevelData: PlayerLevelData;
  didLevelUp: boolean;
  xpAdded: number;
} {
  const oldLevelData = getPlayerLevelData();
  const nextTotalXp = oldLevelData.totalXp + Math.max(0, Math.floor(amount));

  try {
    localStorage.setItem(XP_STORAGE_KEY, String(nextTotalXp));
  } catch (e) {
    console.warn('XP save failed:', e);
  }

  const newLevelData = getPlayerLevelData(nextTotalXp);
  const didLevelUp = newLevelData.level > oldLevelData.level;

  window.dispatchEvent(
    new CustomEvent('solis_xp_updated', {
      detail: {
        totalXp: nextTotalXp,
        didLevelUp,
        oldLevel: oldLevelData.level,
        newLevel: newLevelData.level,
      },
    })
  );

  return {
    oldLevelData,
    newLevelData,
    didLevelUp,
    xpAdded: amount,
  };
}

/**
 * Claim 100 Daily Bonus Coins
 */
export function claimFreeRefill(): { success: boolean; newBalance: number; message: string } {
  const current = getWalletBalance();
  const now = Date.now();
  const lastRefill = parseInt(localStorage.getItem(LAST_REFILL_KEY) || '0', 10);
  const oneDay = 24 * 60 * 60 * 1000;

  if (now - lastRefill < oneDay) {
    const remainingHours = Math.ceil((oneDay - (now - lastRefill)) / (60 * 60 * 1000));
    return {
      success: false,
      newBalance: current,
      message: `Daily reward already claimed today! Next reward in ${remainingHours}h.`,
    };
  }

  const bonus = 100; // Mandatory 100 coins daily reward
  const newBalance = addCoins(bonus);
  localStorage.setItem(LAST_REFILL_KEY, String(now));
  return {
    success: true,
    newBalance,
    message: `+${bonus} Daily Bonus Coins added to your wallet!`,
  };
}
