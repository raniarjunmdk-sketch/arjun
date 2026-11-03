import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Lock, Sparkles, Award } from 'lucide-react';
import { getLevelMetadata } from '../utils/puzzleGenerator';
import { PlayerStats, ThemeConfig } from '../types/game';

interface JourneyViewProps {
  stats: PlayerStats;
  theme: ThemeConfig;
  currentLevelNumber: number;
  onSelectLevel: (levelNum: number) => void;
  onBack: () => void;
}

export const JourneyView: React.FC<JourneyViewProps> = ({
  stats,
  theme,
  currentLevelNumber,
  onSelectLevel,
  onBack,
}) => {
  const LEVELS_PER_PAGE = 25;
  // Determine current page based on highest unlocked level
  const initialPage = Math.floor((stats.maxLevelUnlocked - 1) / LEVELS_PER_PAGE);
  const [page, setPage] = useState<number>(initialPage);

  const startLevel = page * LEVELS_PER_PAGE + 1;
  const endLevel = (page + 1) * LEVELS_PER_PAGE;
  const levelNumbers = Array.from({ length: LEVELS_PER_PAGE }, (_, i) => startLevel + i);

  const meta = getLevelMetadata(stats.maxLevelUnlocked);

  // Key reward milestones to highlight
  const milestones: Record<number, string> = {
    5: 'Theme: Washi & Sumi',
    8: 'Soundscape: Rain on Bamboo',
    12: 'Theme: Nordic Fjord',
    15: 'Soundscape: 432Hz Drone',
    20: 'Theme: Dusk Terracotta',
    25: 'Soundscape: Temple Chimes',
    32: 'Theme: Matcha Sanctuary',
    40: 'Soundscape: Forest Stream',
    50: 'Theme: Celestial Cosmos',
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-5 z-20 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} active:scale-95 transition-transform`}
          title="Back to game"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className={`font-display text-lg font-semibold tracking-wide ${theme.textPrimary}`}>
            Endless Zen Levels
          </span>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <span className="text-emerald-400 font-medium">{meta.rankTitle}</span>
            <span aria-hidden="true">·</span>
            <span>{meta.realm}</span>
          </div>
        </div>

        <div className="w-11" />
      </div>

      {/* Current Level Hero Card */}
      <div className={`p-4 rounded-2xl ${theme.boardBg} border ${theme.cellBorder} flex items-center justify-between shadow-md`}>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
            Highest Reached
          </div>
          <div className={`text-2xl font-bold font-display ${theme.textPrimary} mt-0.5 tabular-nums`}>
            Level {stats.maxLevelUnlocked}
          </div>
          <div className={`text-xs ${theme.textSecondary} mt-0.5`}>
            Total Solved: <strong className={theme.textPrimary}>{stats.totalSolved}</strong>
          </div>
        </div>

        <button
          onClick={() => onSelectLevel(stats.maxLevelUnlocked)}
          className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-transform"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Play Level {stats.maxLevelUnlocked}</span>
        </button>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-1">
        <button
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
          className={`min-h-[38px] px-3 rounded-lg border flex items-center gap-1 text-xs font-medium transition-all ${
            page === 0
              ? 'opacity-30 border-transparent cursor-not-allowed'
              : `${theme.cellBg} ${theme.textPrimary} ${theme.cellBorder} hover:opacity-90 active:scale-95`
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev 25</span>
        </button>

        <span className={`text-xs font-semibold tabular-nums ${theme.textSecondary}`}>
          Levels {startLevel} – {endLevel}
        </span>

        <button
          // Always allow paging forward to see future infinite levels!
          onClick={() => setPage(p => p + 1)}
          className={`min-h-[38px] px-3 rounded-lg border flex items-center gap-1 text-xs font-medium ${theme.cellBg} ${theme.textPrimary} ${theme.cellBorder} hover:opacity-90 active:scale-95 transition-all`}
        >
          <span>Next 25</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5x5 Level Grid */}
      <div className={`p-4 rounded-3xl ${theme.boardBg} border ${theme.cellBorder} shadow-lg`}>
        <div className="grid grid-cols-5 gap-2.5">
          {levelNumbers.map(lvl => {
            const isUnlocked = lvl <= stats.maxLevelUnlocked;
            const isSolved = lvl < stats.maxLevelUnlocked;
            const isCurrent = lvl === currentLevelNumber;
            const milestoneText = milestones[lvl];

            return (
              <button
                key={lvl}
                disabled={!isUnlocked}
                onClick={() => onSelectLevel(lvl)}
                className={`min-h-[54px] rounded-2xl flex flex-col items-center justify-center relative border transition-all text-xs font-semibold ${
                  isCurrent
                    ? `border-emerald-500 ring-2 ring-emerald-500/50 ${theme.cellBg} scale-105 shadow-md`
                    : isSolved
                    ? 'bg-emerald-950/25 text-emerald-300 border-emerald-500/30 hover:opacity-100'
                    : isUnlocked
                    ? `${theme.cellBg} ${theme.textPrimary} ${theme.cellBorder} hover:opacity-100 opacity-90`
                    : 'bg-black/20 text-slate-500 border-transparent cursor-not-allowed'
                }`}
                title={milestoneText ? `Level ${lvl}: ${milestoneText}` : `Level ${lvl}`}
              >
                {!isUnlocked ? (
                  <Lock className="w-3.5 h-3.5 opacity-40" />
                ) : (
                  <>
                    <span className="tabular-nums text-sm">{lvl}</span>
                    {isSolved ? (
                      <Check className="w-3 h-3 text-emerald-400 mt-0.5" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 animate-pulse" />
                    )}
                  </>
                )}

                {/* Milestone gift indicator */}
                {milestoneText && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-sm"
                    title={milestoneText}
                  >
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Milestones Footer */}
      <div className={`p-3.5 rounded-2xl ${theme.cellBg} border ${theme.cellBorder} flex items-center gap-3 text-xs`}>
        <Award className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="text-slate-300">
          <strong className="text-amber-300">Infinite Progression:</strong> Complete each puzzle to immediately unlock the next level. Custom themes and soundscapes unlock as you climb!
        </div>
      </div>
    </div>
  );
};
