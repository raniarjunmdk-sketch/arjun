/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  User,
  Volume2,
  VolumeX,
  Smartphone,
  Users,
  X,
  Check,
  Shield,
  Coins,
} from 'lucide-react';
import { PlayerStats } from '../types/game';
import { getWalletBalance } from '../utils/walletStorage';

interface SettingsModalProps {
  isOpen: boolean;
  playerName: string;
  stats: PlayerStats;
  onClose: () => void;
  onOpenEditUsername: () => void;
  onOpenFriends: () => void;
  onOpenPhoneStorage: () => void;
  onToggleMute: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  playerName,
  stats,
  onClose,
  onOpenEditUsername,
  onOpenFriends,
  onOpenPhoneStorage,
  onToggleMute,
}) => {
  const walletBalance = getWalletBalance();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-[#0d261a] via-[#091d13] to-[#06140d] border border-emerald-600/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-white">
                App & Game Settings
              </h2>
              <p className="text-xs text-emerald-300/80">
                Customize profile, sound, friends, and storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info Card */}
        <div className="p-4 rounded-2xl bg-black/50 border border-emerald-700/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Display Name
              </div>
              <div className="text-sm font-black text-white">{playerName}</div>
              <div className="text-[11px] text-emerald-300 flex items-center gap-1 mt-0.5">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>Wallet: 🪙 {walletBalance.toLocaleString()} Coins</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenEditUsername();
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95 shrink-0"
          >
            Change Name
          </button>
        </div>

        {/* Quick Settings Options */}
        <div className="flex flex-col gap-2.5">
          {/* Friends Management */}
          <button
            onClick={() => {
              onClose();
              onOpenFriends();
            }}
            className="p-3.5 rounded-2xl bg-[#091f14] border border-emerald-800/60 hover:border-emerald-600 text-left flex items-center justify-between gap-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Friends & Buddy List</div>
                <div className="text-[11px] text-emerald-300/80">Add friends, view status, or invite to tables</div>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-bold">Open →</span>
          </button>

          {/* Sound & Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-3.5 rounded-2xl bg-[#091f14] border border-emerald-800/60 hover:border-emerald-600 text-left flex items-center justify-between gap-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-amber-400">
                {stats.isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Sound Effects & Soundscapes</div>
                <div className="text-[11px] text-emerald-300/80">
                  {stats.isMuted ? 'Audio is currently Muted' : 'Audio is Enabled'}
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                stats.isMuted ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
              }`}
            >
              {stats.isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Phone Storage & App Installation */}
          <button
            onClick={() => {
              onClose();
              onOpenPhoneStorage();
            }}
            className="p-3.5 rounded-2xl bg-[#091f14] border border-emerald-800/60 hover:border-emerald-600 text-left flex items-center justify-between gap-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-amber-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Save on Phone / Install PWA</div>
                <div className="text-[11px] text-emerald-300/80">Backup game data or install app on home screen</div>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-bold">Manage →</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[10px] text-emerald-400/60 border-t border-emerald-900/60">
          Solis Zen Puzzles & Hazari Tas Patti Club v2.5 · All data stored locally on device
        </div>
      </div>
    </div>
  );
};
