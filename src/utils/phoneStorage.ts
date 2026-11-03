import { PlayerStats } from '../types/game';
import { loadPlayerStats, savePlayerStats } from './storage';

export interface StorageMetrics {
  usedBytes: number;
  totalKeys: number;
  lastSavedAt: string;
}

export function getPhoneStorageMetrics(): StorageMetrics {
  let usedBytes = 0;
  let totalKeys = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('solis_') || key.startsWith('hazari_'))) {
        totalKeys++;
        const val = localStorage.getItem(key) || '';
        usedBytes += (key.length + val.length) * 2;
      }
    }
  } catch (e) {
    console.warn('Storage check error:', e);
  }

  return {
    usedBytes,
    totalKeys,
    lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Export complete game progress to a downloadable JSON file on the phone
 */
export function exportPhoneBackup(): void {
  const stats = loadPlayerStats();
  const playerName = localStorage.getItem('solis_player_name') || 'Player';
  
  const backupData = {
    app: 'Solis & Tas Patti Club',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    playerName,
    stats,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `solis_phone_save_lvl${stats.currentLevel}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restore game progress from a user-uploaded phone backup file
 */
export function importPhoneBackup(jsonString: string): { success: boolean; stats?: PlayerStats; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !data.stats) {
      return { success: false, error: 'Invalid backup file structure' };
    }

    if (data.playerName) {
      localStorage.setItem('solis_player_name', data.playerName);
    }

    savePlayerStats(data.stats);
    return { success: true, stats: data.stats };
  } catch (e) {
    return { success: false, error: 'Could not read backup file' };
  }
}
