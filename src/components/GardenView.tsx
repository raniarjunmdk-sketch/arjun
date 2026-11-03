import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Shuffle } from 'lucide-react';
import { generateProceduralPuzzle } from '../utils/puzzleGenerator';
import { PuzzleDefinition, ThemeConfig } from '../types/game';

interface GardenViewProps {
  theme: ThemeConfig;
  onGenerate: (puzzle: PuzzleDefinition) => void;
  onBack: () => void;
}

export const GardenView: React.FC<GardenViewProps> = ({
  theme,
  onGenerate,
  onBack,
}) => {
  const [gridSize, setGridSize] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<'gentle' | 'balanced' | 'deep'>('balanced');

  const handleGenerate = () => {
    const puzzle = generateProceduralPuzzle({
      gridSize,
      difficulty,
      title: `${gridSize}×${gridSize} Garden Harmony`,
    });
    onGenerate(puzzle);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-6 z-20">
      {/* Header */}
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
            Infinite Zen Garden
          </span>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Endless procedural puzzles</span>
            <span aria-hidden="true">·</span>
            <span>Unwind without limits</span>
          </div>
        </div>

        <div className="w-11" />
      </div>

      {/* Grid Size Selector */}
      <div className={`p-4 rounded-2xl ${theme.boardBg} border ${theme.cellBorder} flex flex-col gap-3 shadow-md`}>
        <div className={`text-xs font-medium uppercase tracking-wider ${theme.textSecondary}`}>
          Grid Dimensions
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[5, 6, 7, 8].map(size => {
            const isSelected = gridSize === size;
            return (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center border font-semibold text-sm transition-all ${
                  isSelected
                    ? `border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30 scale-105`
                    : `${theme.cellBg} ${theme.cellBorder} ${theme.textPrimary} opacity-80 hover:opacity-100`
                }`}
              >
                <span>{size}×{size}</span>
                <span className="text-[10px] font-normal opacity-70">
                  {size === 5 ? 'Swift' : size === 6 ? 'Serene' : size === 7 ? 'Deep' : 'Master'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div className={`p-4 rounded-2xl ${theme.boardBg} border ${theme.cellBorder} flex flex-col gap-3 shadow-md`}>
        <div className={`text-xs font-medium uppercase tracking-wider ${theme.textSecondary}`}>
          Atmosphere & Complexity
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['gentle', 'balanced', 'deep'] as const).map(diff => {
            const isSelected = difficulty === diff;
            const labels = {
              gentle: 'Gentle Breeze',
              balanced: 'Quiet Stream',
              deep: 'Deep Solitude',
            };
            return (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`min-h-[44px] rounded-xl flex items-center justify-center border font-medium text-xs capitalize transition-all ${
                  isSelected
                    ? `border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30 scale-105`
                    : `${theme.cellBg} ${theme.cellBorder} ${theme.textPrimary} opacity-80 hover:opacity-100`
                }`}
              >
                {labels[diff]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate CTA */}
      <button
        onClick={handleGenerate}
        className="w-full min-h-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-emerald-900/30"
      >
        <Sparkles className="w-4 h-4 fill-current" />
        <span>Generate New Zen Garden</span>
      </button>
    </div>
  );
};
