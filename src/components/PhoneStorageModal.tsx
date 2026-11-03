import React, { useState, useRef } from 'react';
import {
  Smartphone,
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  X,
  Share2,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { PlayerStats, ThemeConfig } from '../types/game';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  getPhoneStorageMetrics,
  exportPhoneBackup,
  importPhoneBackup,
} from '../utils/phoneStorage';

interface PhoneStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  theme: ThemeConfig;
  onStatsRestored: (newStats: PlayerStats) => void;
}

export const PhoneStorageModal: React.FC<PhoneStorageModalProps> = ({
  isOpen,
  onClose,
  stats,
  theme,
  onStatsRestored,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const metrics = getPhoneStorageMetrics();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importPhoneBackup(content);
      if (res.success && res.stats) {
        setImportStatus('Level and progress successfully restored from phone file!');
        onStatsRestored(res.stats);
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus(res.error || 'Failed to import backup.');
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md max-h-[90vh] rounded-3xl ${theme.boardBg} border ${theme.cellBorder} p-5 shadow-2xl flex flex-col gap-4 overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className={`font-display text-base font-bold ${theme.textPrimary}`}>
              Phone Device Storage
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${theme.cellBg} ${theme.textSecondary} hover:${theme.textPrimary}`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Card: 100% Offline & Saved in Phone Memory */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs">
            <div className="font-bold text-emerald-300">
              Saved Permanently in Phone Storage
            </div>
            <p className="text-emerald-100/80 leading-relaxed">
              Your current progress (<strong>Level {stats.currentLevel}</strong>), unlocked themes, soundscapes and Tas Patti game history are saved permanently in your phone memory. No email or login required!
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-3 rounded-xl ${theme.cellBg} border ${theme.cellBorder} text-center`}>
            <div className="text-[10px] uppercase text-slate-400 font-semibold">Active Level</div>
            <div className="text-lg font-bold font-display text-emerald-400 tabular-nums">
              Lvl {stats.currentLevel}
            </div>
          </div>

          <div className={`p-3 rounded-xl ${theme.cellBg} border ${theme.cellBorder} text-center`}>
            <div className="text-[10px] uppercase text-slate-400 font-semibold">Total Solved</div>
            <div className="text-lg font-bold font-display text-amber-400 tabular-nums">
              {stats.totalSolved}
            </div>
          </div>

          <div className={`p-3 rounded-xl ${theme.cellBg} border ${theme.cellBorder} text-center`}>
            <div className="text-[10px] uppercase text-slate-400 font-semibold">Daily Streak</div>
            <div className="text-lg font-bold font-display text-sky-400 tabular-nums">
              {stats.currentStreak}d
            </div>
          </div>
        </div>

        {/* In-App PWA Install on Phone */}
        <div className={`p-4 rounded-2xl ${theme.cellBg} border ${theme.cellBorder} flex flex-col gap-2.5`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Install App on Phone Home Screen</span>
            </span>
            {isInstalled && (
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Installed</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Install this app on your phone home screen for instant full-screen offline access without opening a browser.
          </p>

          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span>Install to Phone Home Screen</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>How to Install on iPhone / Safari</span>
            </button>
          )}

          {isInstalled && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Running as installed standalone mobile app</span>
            </div>
          )}
        </div>

        {/* Backup / Export / Import on Phone */}
        <div className={`p-4 rounded-2xl ${theme.cellBg} border ${theme.cellBorder} flex flex-col gap-2.5`}>
          <div className="font-semibold text-xs text-white flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Phone File Backup (Extra Safety)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Export a complete backup file of your level progress into your phone Downloads folder or transfer it to another phone.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={exportPhoneBackup}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save Backup File</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Restore File</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {importStatus && (
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium text-center animate-in fade-in">
              {importStatus}
            </div>
          )}
        </div>

        {/* iOS Guided Modal */}
        {showIOSGuide && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col gap-2 text-xs">
            <div className="font-bold text-amber-300">How to install on iPhone / Safari:</div>
            <ol className="list-decimal pl-4 text-amber-100/90 space-y-1">
              <li>Tap the <strong>Share</strong> button (📤) in Safari toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Launch directly from your home screen anytime with offline storage!</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-1 py-1 rounded bg-amber-500/30 text-amber-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
