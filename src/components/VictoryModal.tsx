import React from 'react';
import { Sparkles, ArrowRight, RotateCcw, Award, CheckCircle } from 'lucide-react';
import { ThemeConfig } from '../types/game';

interface VictoryModalProps {
  isOpen: boolean;
  theme: ThemeConfig;
  title: string;
  isDaily: boolean;
  levelNumber?: number;
  nextLevelNumber?: number;
  moves: number;
  timeSeconds: number;
  isZenMode: boolean;
  newUnlockedThemes: string[];
  newUnlockedSoundscapes: string[];
  onNext: () => void;
  onReplay: () => void;
  onOpenRewards: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  theme,
  title,
  isDaily,
  levelNumber,
  nextLevelNumber,
  moves,
  timeSeconds,
  isZenMode,
  newUnlockedThemes,
  newUnlockedSoundscapes,
  onNext,
  onReplay,
  onOpenRewards,
}) => {
  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasNewRewards = newUnlockedThemes.length > 0 || newUnlockedSoundscapes.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-sm rounded-3xl ${theme.boardBg} border ${theme.cellBorder} p-6 shadow-2xl flex flex-col items-center text-center gap-5`}
      >
        {/* Serene victory icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>

        {/* Title & Level Header */}
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            {isDaily
              ? 'Daily Logic Restored'
              : levelNumber
              ? `Level ${levelNumber} Complete!`
              : 'Harmony Complete'}
          </div>
          <h2 className={`font-display text-2xl font-bold mt-1 ${theme.textPrimary}`}>
            {isDaily ? title : levelNumber ? `Level Up → Level ${nextLevelNumber}` : title}
          </h2>
        </div>

        {/* Unboxed Performance Metrics */}
        <div className={`flex items-center justify-center gap-3 text-xs ${theme.textSecondary} tabular-nums`}>
          <span>
            Moves <strong className={`font-medium ${theme.textPrimary}`}>{moves}</strong>
          </span>
          {!isZenMode && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Time <strong className={`font-medium ${theme.textPrimary}`}>{formatTime(timeSeconds)}</strong>
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 font-medium">100% Flow</span>
        </div>

        {/* Reward Unlocked Alert if any! */}
        {hasNewRewards && (
          <div
            onClick={onOpenRewards}
            className="w-full p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3 text-left cursor-pointer active:scale-98 transition-transform"
          >
            <Award className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                New Reward Unlocked!
              </div>
              <div className="text-xs text-amber-100/90 truncate">
                {newUnlockedThemes.length > 0 && `Theme: ${newUnlockedThemes.join(', ')}`}
                {newUnlockedThemes.length > 0 && newUnlockedSoundscapes.length > 0 && ' · '}
                {newUnlockedSoundscapes.length > 0 && `Soundscape: ${newUnlockedSoundscapes.join(', ')}`}
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
        )}

        {/* Action Buttons: Seamless Next Level CTA! */}
        <div className="w-full flex flex-col gap-2.5 mt-1">
          <button
            onClick={onNext}
            className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md shadow-emerald-900/30"
          >
            <span>{isDaily ? 'Back to Daily Sanctuary' : `Play Level ${nextLevelNumber}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReplay}
            className={`w-full min-h-[44px] rounded-xl ${theme.cellBg} ${theme.textSecondary} hover:${theme.textPrimary} border ${theme.cellBorder} text-xs font-medium flex items-center justify-center gap-1.5 transition-colors`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay This Level</span>
          </button>
        </div>
      </div>
    </div>
  );
};
