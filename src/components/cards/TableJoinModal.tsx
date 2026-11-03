/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TablePreviewInfo } from '../../types/cards';
import { getWalletBalance, claimFreeRefill } from '../../utils/walletStorage';
import {
  Users,
  Coins,
  Crown,
  Sparkles,
  X,
  AlertCircle,
  Check,
  Share2,
  Gift,
} from 'lucide-react';

interface TableJoinModalProps {
  tableCode: string;
  tableInfo: TablePreviewInfo | null;
  isLoading: boolean;
  errorMessage: string | null;
  playerName: string;
  onConfirmJoin: (tableCode: string) => void;
  onClose: () => void;
}

export const TableJoinModal: React.FC<TableJoinModalProps> = ({
  tableCode,
  tableInfo,
  isLoading,
  errorMessage,
  playerName,
  onConfirmJoin,
  onClose,
}) => {
  const [walletBalance, setWalletBalance] = useState<number>(() => getWalletBalance());
  const [refillMsg, setRefillMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => setWalletBalance(getWalletBalance());
    window.addEventListener('solis_wallet_updated', handleUpdate);
    return () => window.removeEventListener('solis_wallet_updated', handleUpdate);
  }, []);

  const bootAmount = tableInfo?.bootAmount || 500;
  const hasEnoughCoins = walletBalance >= bootAmount;
  const isFull = (tableInfo?.playersCount || 0) >= 4;
  const isPlaying = tableInfo?.status && tableInfo.status !== 'LOBBY';

  const handleRefill = () => {
    const res = claimFreeRefill();
    setRefillMsg(res.message);
    setWalletBalance(res.newBalance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#132d20] to-[#091710] border border-emerald-600/40 p-6 shadow-2xl relative text-slate-100 flex flex-col gap-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-emerald-950/60 hover:bg-emerald-900 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
            🎴
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                Direct Table Join
              </span>
            </div>
            <h2 className="font-display text-xl font-black text-white">
              Join Friend's Table
            </h2>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-emerald-300">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-xs font-semibold">Verifying Table #{tableCode}...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-700/50 flex items-start gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-rose-300 mb-1">Cannot Join Table</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Table Details */}
        {!isLoading && !errorMessage && (
          <>
            {/* Table ID Badge */}
            <div className="p-4 rounded-2xl bg-[#081810] border border-emerald-800/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-emerald-400 font-medium">TABLE ID</p>
                <p className="font-mono text-2xl font-black text-amber-300 tracking-wider">
                  #{tableCode}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-emerald-400 font-medium">HOST</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-sm font-bold text-white">{tableInfo?.hostName || 'Host'}</p>
                </div>
              </div>
            </div>

            {/* Stake & Pot Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0b2116] border border-emerald-700/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Entry Fee / Boot</span>
                </div>
                <p className="text-lg font-black text-amber-300">
                  🪙 {bootAmount.toLocaleString()} Coins
                </p>
                <span className="text-[10px] text-emerald-400/80">Set by table host</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-[#0b2116] border border-amber-600/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Total Pot Prize</span>
                </div>
                <p className="text-lg font-black text-amber-400">
                  🪙 {(tableInfo?.totalPot || bootAmount * 2).toLocaleString()} Coins
                </p>
                <span className="text-[10px] text-amber-300/80">Winner takes all coins!</span>
              </div>
            </div>

            {/* Players at Table */}
            <div className="p-3.5 rounded-2xl bg-[#07150e] border border-emerald-900/60 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Joined Players</span>
                </div>
                <span className="font-bold text-white">
                  {tableInfo?.playersCount || 1} / 4 Players
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {tableInfo?.players && tableInfo.players.length > 0 ? (
                  tableInfo.players.map(p => (
                    <div
                      key={p.id}
                      className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/40 text-xs flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-white">{p.name}</span>
                      {p.isHost && (
                        <span className="text-[10px] text-amber-400 font-bold">(Host)</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-emerald-400/70">
                    Waiting for host to start...
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Status */}
            <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-800/40 flex items-center justify-between">
              <span className="text-xs text-emerald-300">Your Wallet Balance:</span>
              <span className={`text-sm font-bold ${hasEnoughCoins ? 'text-amber-300' : 'text-rose-400'}`}>
                🪙 {walletBalance.toLocaleString()} Coins
              </span>
            </div>

            {/* Insufficient coins warning */}
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

            {/* Join CTA */}
            <button
              onClick={() => onConfirmJoin(tableCode)}
              disabled={!hasEnoughCoins || isFull || Boolean(isPlaying)}
              className={`w-full py-3.5 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
                !hasEnoughCoins || isFull || isPlaying
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-950/50'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>
                {isPlaying
                  ? 'Match Already In Progress'
                  : isFull
                  ? 'Table Is Full (Max 4)'
                  : !hasEnoughCoins
                  ? `Need ${bootAmount} Coins To Join`
                  : `Join Table (${bootAmount} Coins To Pot)`}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
