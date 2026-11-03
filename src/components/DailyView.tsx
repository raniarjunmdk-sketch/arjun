import React from 'react';
import { Calendar, CheckCircle2, Flame, Play, ChevronLeft } from 'lucide-react';
import { PlayerStats, ThemeConfig } from '../types/game';

interface DailyViewProps {
  stats: PlayerStats;
  theme: ThemeConfig;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onStartDaily: (dateStr: string) => void;
  onBack: () => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  stats,
  theme,
  selectedDate,
  onSelectDate,
  onStartDaily,
  onBack,
}) => {
  // Generate list of the past 14 days
  const now = new Date();
  const pastDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isSolved = stats.completedDailyDates.includes(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    return { dateStr, dayName, dayNum, monthName, isToday, isSolved };
  });

  const isCurrentSelectedSolved = stats.completedDailyDates.includes(selectedDate);
  const formattedSelected = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-5 z-20">
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
            Daily Logic Sanctuary
          </span>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>One new puzzle every sunrise</span>
            <span aria-hidden="true">·</span>
            <span>Worldwide sync</span>
          </div>
        </div>

        <div className="w-11" />
      </div>

      {/* Streak and Stats Summary */}
      <div className={`p-4 rounded-2xl ${theme.cellBg} border ${theme.cellBorder} flex items-center justify-around`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 font-semibold text-xl tabular-nums">
            <Flame className="w-5 h-5 fill-amber-400" />
            <span>{stats.currentStreak}</span>
          </div>
          <div className={`text-xs ${theme.textSecondary} mt-0.5`}>Current Streak</div>
        </div>

        <div className="h-8 w-[1px] bg-slate-500/20" />

        <div className="text-center">
          <div className={`text-xl font-semibold tabular-nums ${theme.textPrimary}`}>
            {stats.bestStreak}
          </div>
          <div className={`text-xs ${theme.textSecondary} mt-0.5`}>Best Streak</div>
        </div>

        <div className="h-8 w-[1px] bg-slate-500/20" />

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold text-xl tabular-nums">
            <CheckCircle2 className="w-5 h-5" />
            <span>{stats.completedDailyDates.length}</span>
          </div>
          <div className={`text-xs ${theme.textSecondary} mt-0.5`}>Daily Solved</div>
        </div>
      </div>

      {/* Horizontal Date Picker Carousel */}
      <div className="flex flex-col gap-2">
        <div className={`text-xs font-medium uppercase tracking-wider ${theme.textSecondary}`}>
          Select Date Archive
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {pastDays.map(d => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                onClick={() => onSelectDate(d.dateStr)}
                className={`min-w-[58px] min-h-[64px] rounded-xl flex flex-col items-center justify-center py-2 px-1 border transition-all shrink-0 relative ${
                  isSelected
                    ? `border-emerald-500 ${theme.cellBg} ring-2 ring-emerald-500/30 scale-105`
                    : `${theme.cellBg} ${theme.cellBorder} opacity-85 hover:opacity-100`
                }`}
              >
                {d.isSolved && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                )}
                <span className={`text-[10px] uppercase font-medium ${theme.textSecondary}`}>
                  {d.dayName}
                </span>
                <span className={`text-base font-bold tabular-nums ${theme.textPrimary}`}>
                  {d.dayNum}
                </span>
                <span className={`text-[9px] ${theme.textSecondary}`}>
                  {d.isToday ? 'Today' : d.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Feature Card */}
      <div className={`p-5 rounded-2xl ${theme.boardBg} border ${theme.cellBorder} flex flex-col gap-4 shadow-lg`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Calendar className="w-4 h-4" />
              <span>{formattedSelected}</span>
            </div>
            <h2 className={`font-display text-lg font-semibold ${theme.textPrimary} mt-1`}>
              The Flow of Serenity
            </h2>
            <p className={`text-xs ${theme.textSecondary} mt-1 leading-relaxed`}>
              A 6×6 garden of interconnected elements crafted for solitary contemplation.
            </p>
          </div>

          {isCurrentSelectedSolved && (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Solved</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onStartDaily(selectedDate)}
          className={`w-full min-h-[48px] rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md ${
            isCurrentSelectedSolved
              ? `${theme.cellBg} ${theme.textPrimary} border ${theme.cellBorder} hover:opacity-90`
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isCurrentSelectedSolved ? 'Replay Daily Puzzle' : 'Play Daily Puzzle'}</span>
        </button>
      </div>
    </div>
  );
};
