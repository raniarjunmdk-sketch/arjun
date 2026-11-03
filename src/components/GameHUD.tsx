import React from 'react';
import { Volume2, VolumeX, Sparkles, Menu } from 'lucide-react';
import { PuzzleDefinition, ThemeConfig } from '../types/game';

interface GameHUDProps {
  puzzle: PuzzleDefinition;
  theme: ThemeConfig;
  elapsedSeconds: number;
  movesCount: number;
  connectedPairsCount: number;
  totalPairsCount: number;
  isMuted: boolean;
  isZenMode: boolean;
  onToggleMute: () => void;
  onOpenRewards: () => void;
  onOpenMenu: () => void;
  onOpenPhoneStorage?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  puzzle,
  theme,
  elapsedSeconds,
  movesCount,
  connectedPairsCount,
  totalPairsCount,
  isMuted,
  isZenMode,
  onToggleMute,
  onOpenRewards,
  onOpenMenu,
  onOpenPhoneStorage,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="w-full max-w-xl mx-auto px-4 pt-3 pb-2 flex flex-col gap-2 relative z-20">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        {/* Menu button */}
        <button
          onClick={onOpenMenu}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} active:scale-95 transition-transform hover:opacity-85`}
          title="Game Modes & Levels"
          aria-label="Game Modes & Levels"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Wordmark and Puzzle Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            {puzzle.levelNumber ? (
              <span className="font-display text-base font-bold text-emerald-400 tracking-wide tabular-nums">
                LEVEL {puzzle.levelNumber}
              </span>
            ) : (
              <span className={`font-display text-lg font-semibold tracking-wide ${theme.textPrimary}`}>
                SOLIS
              </span>
            )}
            <span className="text-xs opacity-50" aria-hidden="true">·</span>
            <span className={`text-xs font-medium uppercase tracking-wider ${theme.textSecondary}`}>
              {puzzle.chapter || (puzzle.isDaily ? 'Daily Flow' : 'Garden')}
            </span>
          </div>
          <h1 className={`text-xs ${theme.textSecondary} truncate max-w-[200px] sm:max-w-xs mt-0.5`}>
            {puzzle.title}
          </h1>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Phone Device Storage Indicator Button */}
          {onOpenPhoneStorage && (
            <button
              onClick={onOpenPhoneStorage}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} active:scale-95 transition-transform hover:opacity-85`}
              title="Phone Device Storage (Levels Saved Offline)"
              aria-label="Phone Device Storage"
            >
              <span className="text-sm">📱</span>
            </button>
          )}

          {/* Rewards / Themes Modal */}
          <button
            onClick={onOpenRewards}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} active:scale-95 transition-transform hover:opacity-85`}
            title="Rewards: Custom Themes & Soundscapes"
            aria-label="Rewards: Custom Themes & Soundscapes"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleMute}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} active:scale-95 transition-transform hover:opacity-85`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 opacity-50" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Unboxed Metadata metrics line: Zero-pill discipline */}
      <div className={`flex items-center justify-center gap-3 text-xs ${theme.textSecondary} tabular-nums mt-0.5`}>
        {puzzle.levelNumber && (
          <>
            <span>
              Lvl <strong className={`font-medium ${theme.textPrimary}`}>{puzzle.levelNumber}</strong>
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>
          Paths <strong className={`font-medium ${theme.textPrimary}`}>{connectedPairsCount}/{totalPairsCount}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Moves <strong className={`font-medium ${theme.textPrimary}`}>{movesCount}</strong>
        </span>
        {!isZenMode && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              Time <strong className={`font-medium ${theme.textPrimary}`}>{formatTime(elapsedSeconds)}</strong>
            </span>
          </>
        )}
      </div>
    </header>
  );
};
