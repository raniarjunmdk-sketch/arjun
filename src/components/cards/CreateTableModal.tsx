/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CardGameType } from '../../types/cards';
import { getWalletBalance, claimFreeRefill } from '../../utils/walletStorage';
import {
  Coins,
  Crown,
  Users,
  Sparkles,
  Shield,
  X,
  ChevronRight,
  Gift,
} from 'lucide-react';

interface CreateTableModalProps {
  gameType: CardGameType;
  playerName: string;
  onConfirmCreate: (gameType: CardGameType, bootAmount: number, isFriendOnly: boolean) => void;
  onClose: () => void;
}

const BOOT_OPTIONS = [100, 250, 500, 1000, 2500, 5000];

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  gameType,
  playerName,
  onConfirmCreate,
  onClose,
}) => {
  const [selectedBoot, setSelectedBoot] = useState<number>(500);
  const [isFriendOnly, setIsFriendOnly] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number>(() => getWalletBalance());
  const [refillMsg, setRefillMsg] = useState<string | null>(null);

  const hasEnoughCoins = walletBalance >= selectedBoot;

  const handleRefill = () => {
    const res = claimFreeRefill();
    setRefillMsg(res.message);
    setWalletBalance(res.newBalance);
  };

  const handleCreate = () => {
    if (!hasEnoughCoins) return;
    onConfirmCreate(gameType, selectedBoot, isFriendOnly);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#123122] to-[#08170f] border border-emerald-600/40 p-6 shadow-2xl relative text-slate-100 flex flex-col gap-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-emerald-950/60 hover:bg-emerald-900 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-950/60 text-slate-950 font-black">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                Host Controls
              </span>
              <span className="text-xs text-emerald-300">Set Stake Price</span>
            </div>
            <h2 className="font-display text-xl font-black text-white">
              Create New Table
            </h2>
          </div>
        </div>

        {/* Price / Boot Selection */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Select Entry Fee / Boot Stake:</span>
            </label>
            <span className="text-xs font-bold text-amber-300">
              🪙 {selectedBoot.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {BOOT_OPTIONS.map(amount => {
              const isSelected = selectedBoot === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedBoot(amount)}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-900/40 scale-102 font-black'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-800/60 text-emerald-200'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase">Boot</span>
                  <span className="text-sm font-black">🪙 {amount.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selection: Friends Only vs Bots */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Select Table Mode:</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsFriendOnly(true)}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                isFriendOnly
                  ? 'bg-emerald-900/80 border-amber-400 text-white shadow-md'
                  : 'bg-emerald-950/40 border-emerald-900/60 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">👥 Friends Only</span>
                {isFriendOnly && <span className="text-amber-400 text-xs">✓</span>}
              </div>
              <p className="text-[10px] text-emerald-200/80 leading-tight">
                Only real players. No forced AI bots.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setIsFriendOnly(false)}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                !isFriendOnly
                  ? 'bg-emerald-900/80 border-amber-400 text-white shadow-md'
                  : 'bg-emerald-950/40 border-emerald-900/60 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">🤖 Practice with AI</span>
                {!isFriendOnly && <span className="text-amber-400 text-xs">✓</span>}
              </div>
              <p className="text-[10px] text-emerald-200/80 leading-tight">
                Empty seats are filled by smart AI bots.
              </p>
            </button>
          </div>
        </div>

        {/* 1 Minute Timer Feature Banner */}
        <div className="p-3 rounded-2xl bg-black/40 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-200">
          <span className="flex items-center gap-1.5 font-semibold">
            <span>⏱️ Round Timer:</span>
            <span className="text-amber-300 font-mono font-bold">1 Minute (60 Seconds)</span>
          </span>
          <span className="text-[10px] text-emerald-400/80">Fast Competitive Play</span>
        </div>

        {/* Potential Pot Preview */}
        <div className="p-3.5 rounded-2xl bg-[#091f14] border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-200">Winner Takes Total Pot</p>
              <p className="text-[10px] text-emerald-400">
                {isFriendOnly ? 'Pot scales with joined players' : '4 players = 4x boot'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-display text-lg font-black text-amber-300">
              🪙 {(selectedBoot * (isFriendOnly ? 2 : 4)).toLocaleString()} - {(selectedBoot * 4).toLocaleString()}
            </span>
            <span className="block text-[10px] text-amber-400 font-bold">Coins Prize</span>
          </div>
        </div>

        {/* Wallet Balance Status */}
        <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-800/40 flex items-center justify-between">
          <span className="text-xs text-emerald-300">Your Wallet Balance:</span>
          <span className={`text-sm font-bold ${hasEnoughCoins ? 'text-amber-300' : 'text-rose-400'}`}>
            🪙 {walletBalance.toLocaleString()} Coins
          </span>
        </div>

        {!hasEnoughCoins && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 flex items-center justify-between gap-2">
            <span className="text-xs text-amber-200">Low on coins? Get free bonus:</span>
            <button
              onClick={handleRefill}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1"
            >
              <Gift className="w-3 h-3" />
              <span>+1,000 Refill</span>
            </button>
          </div>
        )}

        {refillMsg && (
          <p className="text-xs text-center text-amber-300 font-semibold">{refillMsg}</p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleCreate}
          disabled={!hasEnoughCoins}
          className={`w-full py-3.5 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
            hasEnoughCoins
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-950/50'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>
            {hasEnoughCoins
              ? `Create Table & Stake ${selectedBoot.toLocaleString()} Coins`
              : `Need ${selectedBoot} Coins`}
          </span>
        </button>
      </div>
    </div>
  );
};
