import React from 'react';
import { RotateCcw, Lightbulb, RefreshCw, Feather } from 'lucide-react';
import { ThemeConfig } from '../types/game';

interface BottomControlsProps {
  theme: ThemeConfig;
  isZenMode: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onHint: () => void;
  onReset: () => void;
  onToggleZenMode: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  theme,
  isZenMode,
  canUndo,
  onUndo,
  onHint,
  onReset,
  onToggleZenMode,
}) => {
  return (
    <footer className="w-full max-w-sm mx-auto px-4 py-3 flex items-center justify-between gap-3 relative z-20">
      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium border ${
          canUndo
            ? `${theme.cellBg} ${theme.textPrimary} ${theme.cellBorder} active:scale-95 hover:opacity-90`
            : 'opacity-40 border-transparent bg-slate-500/10 cursor-not-allowed text-slate-400'
        } transition-all`}
        title="Undo last path step"
      >
        <RotateCcw className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">Undo</span>
      </button>

      {/* Hint */}
      <button
        onClick={onHint}
        className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium border ${theme.cellBg} ${theme.textPrimary} ${theme.cellBorder} active:scale-95 transition-all hover:opacity-90`}
        title="Show gentle hint"
      >
        <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
        <span className="whitespace-nowrap">Hint</span>
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium border ${theme.cellBg} ${theme.textPrimary} ${theme.cellBorder} active:scale-95 transition-all hover:opacity-90`}
        title="Reset current puzzle"
      >
        <RefreshCw className="w-4 h-4 shrink-0 opacity-75" />
        <span className="whitespace-nowrap">Reset</span>
      </button>

      {/* Zen Untimed Toggle */}
      <button
        onClick={onToggleZenMode}
        className={`min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl flex items-center justify-center text-xs font-medium border transition-all ${
          isZenMode
            ? `bg-emerald-600/20 text-emerald-300 border-emerald-500/40`
            : `${theme.cellBg} ${theme.textSecondary} ${theme.cellBorder} hover:opacity-90`
        } active:scale-95`}
        title={isZenMode ? 'Zen Mode active (Untimed)' : 'Standard Mode (Timer enabled)'}
      >
        <Feather className={`w-4 h-4 ${isZenMode ? 'text-emerald-400' : 'opacity-70'}`} />
      </button>
    </footer>
  );
};
