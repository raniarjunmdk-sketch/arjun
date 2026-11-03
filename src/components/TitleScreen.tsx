import React, { useEffect } from 'react';
import { Play, Calendar, Map, Sparkles } from 'lucide-react';
import { ThemeConfig, PlayerStats } from '../types/game';
import { getLevelMetadata } from '../utils/puzzleGenerator';

interface TitleScreenProps {
  theme: ThemeConfig;
  stats: PlayerStats;
  onStartGame: () => void;
  onOpenDaily: () => void;
  onOpenJourney: () => void;
  onOpenGarden: () => void;
  onOpenRewards: () => void;
  onOpenTasPatti?: () => void;
  onOpenPhoneStorage?: () => void;
  onOpenSettings?: () => void;
  onOpenFriends?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  theme,
  stats,
  onStartGame,
  onOpenDaily,
  onOpenJourney,
  onOpenGarden,
  onOpenRewards,
  onOpenTasPatti,
  onOpenPhoneStorage,
  onOpenSettings,
  onOpenFriends,
}) => {
  const meta = getLevelMetadata(stats.currentLevel);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-between px-4 py-8 select-none">
      {/* Top Level, Storage & Streak Status */}
      <div className="w-full max-w-sm flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-400 tracking-wide">
            LEVEL {stats.currentLevel}
          </span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="text-[11px] truncate max-w-[110px] opacity-75">{meta.rankTitle}</span>
        </div>

        {/* Phone Storage Reassurance Badge & Settings */}
        <div className="flex items-center gap-1.5">
          {onOpenFriends && (
            <button
              onClick={onOpenFriends}
              className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[10px] font-semibold text-amber-300 hover:text-white flex items-center gap-1 transition-colors active:scale-95"
              title="Friends & Multiplayer Buddies"
            >
              <span>👥</span>
              <span>Friends</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[10px] font-semibold text-emerald-300 hover:text-white flex items-center gap-1 transition-colors active:scale-95"
              title="Settings & Profile"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          )}

          {onOpenPhoneStorage && (
            <button
              onClick={onOpenPhoneStorage}
              className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[10px] font-semibold text-emerald-300 hover:text-white flex items-center gap-1 transition-colors active:scale-95"
              title="Your Level is Permanently Saved in Phone Storage"
            >
              <span>📱</span>
              <span>Storage</span>
            </button>
          )}
        </div>

        <span className="tabular-nums">
          Streak: {stats.currentStreak}d
        </span>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="relative mb-5">
          <svg
            className="w-24 h-24 sm:w-28 sm:h-28 text-emerald-400 animate-[spin_40s_linear_infinite]"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />
            <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
            <circle cx="50" cy="50" r="18" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" />
            <path d="M50 14V86" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M14 50H86" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="24" r="3.5" fill="currentColor" />
            <circle cx="76" cy="50" r="3.5" fill="currentColor" />
            <circle cx="50" cy="76" r="3.5" fill="currentColor" />
            <circle cx="24" cy="50" r="3.5" fill="currentColor" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">☼</span>
          </div>
        </div>

        <h1 className={`font-display text-4xl sm:text-5xl font-bold tracking-tight ${theme.textPrimary}`}>
          SOLIS
        </h1>
        <p className={`text-sm ${theme.textSecondary} max-w-xs mt-2 font-normal leading-relaxed`}>
          Endless solitary logic puzzles. Every solved level unlocks the next horizon.
        </p>

        {/* Primary Start CTA Button */}
        <div className="mt-7 flex flex-col items-center gap-3 w-full max-w-xs">
          <button
            onClick={onStartGame}
            className="w-full min-h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 active:scale-[0.98] transition-transform"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Play Level {stats.currentLevel}</span>
          </button>

          {/* Quick Hub Options */}
          <div className="grid grid-cols-3 gap-2 w-full mt-1">
            <button
              onClick={onOpenJourney}
              className={`min-h-[46px] rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} text-xs font-medium flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform hover:opacity-90`}
            >
              <Map className="w-3.5 h-3.5 text-sky-400" />
              <span>All Levels</span>
            </button>

            <button
              onClick={onOpenDaily}
              className={`min-h-[46px] rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} text-xs font-medium flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform hover:opacity-90`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily</span>
            </button>

            <button
              onClick={onOpenRewards}
              className={`min-h-[46px] rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} text-xs font-medium flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform hover:opacity-90`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rewards</span>
            </button>
          </div>

          {/* Featured Tas Patti & Hazari Card Club Launcher */}
          {onOpenTasPatti && (
            <button
              onClick={onOpenTasPatti}
              className="w-full min-h-[46px] mt-1 rounded-2xl bg-gradient-to-r from-amber-600/90 to-amber-700/90 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 active:scale-95 transition-transform border border-amber-400/40"
            >
              <span className="text-sm">🎴</span>
              <span>Tas Patti & Hazari Club (Invite Dost)</span>
            </button>
          )}
        </div>
      </div>

      {/* Control-hint line */}
      <div className="text-center">
        <div className="text-[11px] text-slate-500 font-mono tracking-wide">
          Touch Drag to Connect · Space / Enter Play · Z Undo · Esc Pause
        </div>
      </div>
    </div>
  );
};
