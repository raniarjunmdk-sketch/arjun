import React, { useState } from 'react';
import { X, Check, Lock, Sparkles, Music, Palette, Volume2 } from 'lucide-react';
import { PlayerStats, ThemeConfig, SoundscapeConfig } from '../types/game';
import { ZEN_THEMES } from '../constants/themes';
import { ZEN_SOUNDSCAPES } from '../constants/soundscapes';
import { zenAudio } from '../audio/soundEngine';

interface RewardsModalProps {
  stats: PlayerStats;
  theme: ThemeConfig;
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (themeId: string) => void;
  onSelectSoundscape: (soundscapeId: string) => void;
  onChangeSoundscapeVolume: (volume: number) => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  stats,
  theme,
  isOpen,
  onClose,
  onSelectTheme,
  onSelectSoundscape,
  onChangeSoundscapeVolume,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'soundscapes'>('themes');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md max-h-[85vh] rounded-3xl ${theme.boardBg} border ${theme.cellBorder} shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Modal Header */}
        <div className={`p-4 border-b ${theme.cellBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className={`font-display text-base font-semibold ${theme.textPrimary}`}>
              Winning Sanctuary Rewards
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${theme.cellBg} ${theme.textSecondary} hover:${theme.textPrimary} active:scale-95 transition-transform`}
            aria-label="Close rewards"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls (Functional interactive segmented control) */}
        <div className={`p-2.5 bg-black/20 border-b ${theme.cellBorder}`}>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900/40">
            <button
              onClick={() => setActiveTab('themes')}
              className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'themes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Custom Themes ({stats.unlockedThemes.length}/{ZEN_THEMES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('soundscapes')}
              className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'soundscapes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Soundscapes ({stats.unlockedSoundscapes.length}/{ZEN_SOUNDSCAPES.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 flex-1 scrollbar-thin">
          {activeTab === 'themes' ? (
            // --- THEMES LIST ---
            ZEN_THEMES.map(t => {
              const isUnlocked = stats.unlockedThemes.includes(t.id);
              const isActive = stats.activeThemeId === t.id;

              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? `border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40`
                      : isUnlocked
                      ? `${theme.cellBg} ${theme.cellBorder} opacity-90 hover:opacity-100`
                      : 'bg-black/20 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${theme.textPrimary}`}>
                        {t.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${theme.textSecondary} truncate`}>
                      {t.subtitle}
                    </span>
                    {!isUnlocked && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 mt-0.5">
                        <Lock className="w-3 h-3" />
                        <span>{t.unlockRequirementText} ({stats.totalSolved}/{t.requiredWins})</span>
                      </div>
                    )}
                  </div>

                  {/* Visual Color Swatches preview */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: t.accent }}
                      title={`Accent: ${t.accent}`}
                    />
                    <button
                      disabled={!isUnlocked}
                      onClick={() => {
                        onSelectTheme(t.id);
                        zenAudio.playStepChime(2);
                      }}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default'
                          : isUnlocked
                          ? 'bg-slate-700/60 hover:bg-slate-600 text-white active:scale-95'
                          : 'bg-transparent text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isActive ? 'Equipped' : isUnlocked ? 'Equip' : 'Locked'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            // --- SOUNDSCAPES LIST ---
            <div className="flex flex-col gap-4">
              {/* Soundscape Volume Slider */}
              <div className={`p-3 rounded-2xl ${theme.cellBg} border ${theme.cellBorder} flex flex-col gap-2`}>
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Ambient Soundscape Mix</span>
                  </div>
                  <span className="text-slate-400 tabular-nums">
                    {Math.round(stats.soundscapeVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={stats.soundscapeVolume}
                  onChange={e => onChangeSoundscapeVolume(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  aria-label="Soundscape Volume"
                />
              </div>

              {ZEN_SOUNDSCAPES.map(snd => {
                const isUnlocked = stats.unlockedSoundscapes.includes(snd.id);
                const isActive = stats.activeSoundscapeId === snd.id;

                return (
                  <div
                    key={snd.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? `border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40`
                        : isUnlocked
                        ? `${theme.cellBg} ${theme.cellBorder} opacity-90 hover:opacity-100`
                        : 'bg-black/20 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${theme.textPrimary}`}>
                          {snd.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            Playing
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${theme.textSecondary} truncate`}>
                        {snd.subtitle}
                      </span>
                      {!isUnlocked && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 mt-0.5">
                          <Lock className="w-3 h-3" />
                          <span>{snd.unlockRequirementText} ({stats.totalSolved}/{snd.requiredWins})</span>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={!isUnlocked}
                      onClick={() => {
                        onSelectSoundscape(snd.id);
                        zenAudio.playStepChime(3);
                      }}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default'
                          : isUnlocked
                          ? 'bg-slate-700/60 hover:bg-slate-600 text-white active:scale-95'
                          : 'bg-transparent text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isActive ? 'Playing' : isUnlocked ? 'Listen' : 'Locked'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
